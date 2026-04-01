# 🔐 Security Review — maiat-dojo

---

## Scope

|                                  |                                                            |
| -------------------------------- | ---------------------------------------------------------- |
| **Mode**                         | ALL (default)                                              |
| **Files reviewed**               | `src/SkillNFT.sol` · `src/SkillRoyaltySplitter.sol`       |
| **Methodology**                  | Trail of Bits + Pashov (8-agent) + Cyfrin SolSkill         |
| **Confidence threshold**         | 75                                                         |
| **Static analysis**              | Slither (1H, 9M confirmed — all in OZ deps or reentrancy-events) |
| **Tests**                        | 33/33 passing                                              |

---

## Findings

---

[80] **1. USDC Blacklisting Can Permanently DoS All Service Payments for a Skill**

`SkillRoyaltySplitter.pay` · Confidence: 80 · Severity: **Medium**

**Description**  
`pay()` executes three independent `safeTransferFrom` calls — to `operator`, `creator`, and `platformWallet` — in sequence from `msg.sender`. If any recipient address is blacklisted by Circle's USDC contract (a real, exercised power on Base), that transfer reverts and the entire `pay()` call fails. Because the creator address is stored immutably in `SkillNFT` (no update function), a blacklisted creator permanently bricks `pay()` for all skills linked to that creator, with no recovery path.

**Attack Path**
1. Owner calls `createSkill(...)` with `creator = alice`
2. Circle blacklists `alice` (e.g., OFAC enforcement)
3. Every call to `pay(skillId, operator, amount)` reverts at `safeTransferFrom(msg.sender, alice, creatorAmt)`
4. Agent Services for all of alice's skills are bricked permanently

**Fix**

```diff
- usdc.safeTransferFrom(msg.sender, operator, operatorAmt);
- usdc.safeTransferFrom(msg.sender, creator, creatorAmt);
- usdc.safeTransferFrom(msg.sender, platformWallet, platformAmt);
+ // Pull full amount to this contract first, then push to each recipient
+ usdc.safeTransferFrom(msg.sender, address(this), amount);
+ usdc.safeTransfer(operator, operatorAmt);
+ usdc.safeTransfer(creator, creatorAmt);
+ usdc.safeTransfer(platformWallet, platformAmt);
```

Also consider adding a `pendingWithdrawal` mapping as fallback so a blacklisted recipient's share can be re-routed by owner instead of reverting.

---

[78] **2. Non-Atomic Fee Update Allows Creator Share to Collapse to 0.01%**

`SkillNFT.setPlatformFeeBps` / `SkillNFT.setReputationPoolBps` · Confidence: 78 · Severity: **Medium** · [agents: 2]

**Description**  
The two fee setters each validate their own change in isolation but read the *other* variable from storage at that moment. Two valid sequential owner transactions can result in a combined fee that leaves the creator share at 1/10000 of price (0.01%):

```
tx1: setPlatformFeeBps(9499)   → check: 9499 + 500 = 9999 < 10000 ✓
tx2: setReputationPoolBps(499) → check: 9499 + 499 = 9998 < 10000 ✓
→ creatorShare = price - (price * 9499/10000) - (price * 499/10000) = price * 2/10000
```

A griefing owner (or compromised key) can drain creator revenue in two txs that each pass validation.

**Fix**

```diff
+ function setFees(uint16 _platformBps, uint16 _reputationBps) external onlyOwner {
+     if (uint256(_platformBps) + _reputationBps >= 10000) revert InvalidBps();
+     platformFeeBps = _platformBps;
+     reputationPoolBps = _reputationBps;
+     emit PlatformFeeUpdated(_platformBps);
+     emit ReputationPoolFeeUpdated(_reputationBps);
+ }
```

Replace the two individual setters with a single atomic setter that validates the combined value.

---

[75] **3. Missing `nonReentrant` on `buySkill` — CEI Violation**

`SkillNFT.buySkill` · Confidence: 75 · Severity: **Low**

**Description**  
`buySkill` has no `nonReentrant` modifier. The execution order violates Checks-Effects-Interactions: `skill.totalSold++` and the `SkillPurchased` event are emitted *after* the `_mint` call, which triggers `onERC1155Received` on the recipient (an external call). A malicious recipient contract could reenter `buySkill` during `onERC1155Received`, causing events to be emitted in wrong order and potentially exploiting any future invariant that reads `totalSold` mid-flight.

```diff
- function buySkill(uint256 skillId, address recipient) external {
+ function buySkill(uint256 skillId, address recipient) external nonReentrant {
     ...
+    skill.totalSold++;               // ← move before external calls
     usdc.safeTransferFrom(...);
     usdc.safeTransfer(skill.creator, creatorShare);
     usdc.safeTransfer(platformWallet, platformShare);
     usdc.safeTransfer(reputationPool, reputationShare);
-    skill.totalSold++;
     _mint(recipient, skillId, 1, "");
     emit SkillPurchased(...);
```

---

## Leads

_High-signal trails requiring manual verification. Not scored._

- **Missing interface inheritance** — `SkillNFT` (contract) — Code smells: `SkillNFT` implements `getCreator(uint256)` but does not declare `ISkillNFT`; `SkillRoyaltySplitter` calls it via the interface. If a future upgrade renames or reorders `getCreator` without updating the interface, SkillRoyaltySplitter silently uses wrong ABI — verify the interface is locked or add `is ISkillNFT` to SkillNFT.

- **`pay()` tiny-amount zero-rounding** — `SkillRoyaltySplitter.pay` — Code smells: for `amount < 2`, `operatorAmt = 0` and `creatorAmt = 0` — platform captures 100% of the payment; no `MIN_AMOUNT` guard exists unlike `SkillNFT.MIN_PRICE`. Relevant for x402 micro-payment flows.

- **Per-skill `royaltyBps` never consumed by SkillRoyaltySplitter** — `SkillRoyaltySplitter.pay` — Code smells: `Skill.royaltyBps` is documented as "for SkillRoyaltySplitter" but `pay()` uses the flat contract-level `creatorBps` (15%) for every skill, ignoring the per-skill value entirely. This creates a silent mismatch: creator sets royaltyBps expecting differentiated Agent Service splits, but all get the same 15%. Verify if this is intentional or if `pay()` should read `skillNft.getSkill(skillId).royaltyBps`.

- **No operator authenticity validation in `pay()`** — `SkillRoyaltySplitter.pay` — Code smells: `operator` is caller-specified with no check that they hold the relevant skill NFT or are registered anywhere. In x402/MPP flows where a facilitator routes payments, a misconfigured or compromised facilitator can route 80% of every payment to an arbitrary address. Consider requiring `operator` to hold `balanceOf(operator, skillId) > 0` via SkillNFT.

---

## Cyfrin SolSkill Notes

| Issue | File | Severity |
|-------|------|----------|
| Custom errors lack `ContractName__` prefix (e.g. should be `SkillNFT__InvalidAddress`) | `SkillNFT.sol` | Info |
| Custom errors lack `ContractName__` prefix | `SkillRoyaltySplitter.sol` | Info |
| No `@custom:security-contact` in NatSpec | Both | Info |

---

## Summary Table

| # | Confidence | Title | Severity |
|---|-----------|-------|----------|
| 1 | [80] | USDC Blacklist DoS in `pay()` | Medium |
| 2 | [78] | Non-Atomic Fee Update → Creator share collapses to 0.01% | Medium |
| 3 | [75] | Missing `nonReentrant` + CEI violation in `buySkill` | Low |

---

> ⚠️ This review was performed by an AI assistant (Patrick / BountyHunter 🛡️) using Pashov 8-agent methodology + Trail of Bits skills + Cyfrin SolSkill standards. AI analysis can never verify the complete absence of vulnerabilities and no guarantee of security is given. Team security reviews, bug bounty programs, and on-chain monitoring are strongly recommended.
