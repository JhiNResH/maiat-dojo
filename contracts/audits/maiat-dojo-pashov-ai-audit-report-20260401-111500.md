# 🔐 Security Review — maiat-dojo

---

## Scope

|                                  |                                                            |
| -------------------------------- | ---------------------------------------------------------- |
| **Mode**                         | ALL (default)                                              |
| **Files reviewed**               | `src/SkillNFT.sol` · `src/SkillRoyaltySplitter.sol`       |
| **Methodology**                  | Pashov 8-agent + Trail of Bits + Cyfrin SolSkill           |
| **Confidence threshold**         | 75                                                         |
| **Agents completed**             | 7/8 (Agent 1 bundle too large; manual analysis substituted) |
| **Static analysis**              | Slither ✅                                                 |
| **Tests**                        | 33/33 ✅                                                   |

---

## Findings

---

[82] **1. Owner Can Front-Run `buySkill` to Drain Creator Share to Dust**

`SkillNFT.setPlatformFeeBps` · Confidence: 82 · Severity: **Medium** · [agents: 2]

**Description**  
`buySkill` reads `platformFeeBps` and `reputationPoolBps` at execution time with no slippage guard. An owner (or compromised owner key) can observe a pending `buySkill` tx in the mempool and front-run it by calling `setPlatformFeeBps(9499)`, which passes validation (`9499 + 500 = 9999 < 10000`). The subsequent `buySkill` executes with near-100% platform fees, reducing the creator's share to 1/10000 (0.01%) with no on-chain recourse for creator or buyer. The same window exists for two sequential legitimate fee-update transactions that each pass individual validation but produce an extreme combined state.

**Attack Path**
1. Creator expects 85% revenue share at current fees (10% platform + 5% rep pool)
2. Owner calls `setPlatformFeeBps(9499)` — passes: `9499 + 500 = 9999 < 10000`
3. Buyer's pending `buySkill(1, buyer)` executes:
   - `platformShare = (1_000_000 × 9499) / 10000 = 949,900`
   - `reputationShare = (1_000_000 × 500) / 10000 = 50,000`
   - `creatorShare = 1_000_000 - 949,900 - 50,000 = 100` ← **0.0001 USDC instead of 0.85 USDC**

**Fix**

```diff
// Option A: atomic setter (remove the two individual setters)
+ function setFees(uint16 _platformBps, uint16 _reputationBps) external onlyOwner {
+     if (uint256(_platformBps) + _reputationBps >= 10000) revert InvalidBps();
+     platformFeeBps = _platformBps;
+     reputationPoolBps = _reputationBps;
+     emit PlatformFeeUpdated(_platformBps);
+     emit ReputationPoolFeeUpdated(_reputationBps);
+ }

// Option B: add a minimum creator share floor
+ uint16 public constant MIN_CREATOR_BPS = 5000; // 50% floor
  function setPlatformFeeBps(uint16 newBps) external onlyOwner {
+     if (newBps + reputationPoolBps + MIN_CREATOR_BPS > 10000) revert InvalidBps();
      ...
  }

// Option C: slippage parameter in buySkill
- function buySkill(uint256 skillId, address recipient) external {
+ function buySkill(uint256 skillId, address recipient, uint256 minCreatorShare) external {
+     ...
+     if (creatorShare < minCreatorShare) revert SlippageExceeded();
```

---

[80] **2. USDC Blacklisting Permanently DoS's `pay()` for Affected Skills**

`SkillRoyaltySplitter.pay` · Confidence: 80 · Severity: **Medium** · [agents: 3]

**Description**  
`pay()` executes three independent `safeTransferFrom` calls from `msg.sender` — to `operator`, `creator`, and `platformWallet` — sequentially. The creator address is set at skill creation and is immutable in `SkillNFT` (no update path). If Circle blacklists the creator's address (real, exercised power on Base for OFAC compliance), the second transfer reverts and all Agent Services payments for that skill ID are permanently bricked.

**Fix**

```diff
- usdc.safeTransferFrom(msg.sender, operator, operatorAmt);
- usdc.safeTransferFrom(msg.sender, creator, creatorAmt);
- usdc.safeTransferFrom(msg.sender, platformWallet, platformAmt);
+ // Pull full amount to contract, then push to each recipient
+ usdc.safeTransferFrom(msg.sender, address(this), amount);
+ usdc.safeTransfer(operator, operatorAmt);
+ usdc.safeTransfer(creator, creatorAmt);
+ usdc.safeTransfer(platformWallet, platformAmt);
```

Also add a `pendingWithdrawals` fallback: if `safeTransfer` to `creator` fails, accumulate in a mapping and let owner redirect it via governance.

---

[78] **3. Unconstrained `operator` in `pay()` Enables Self-Routing of 80% of Fees**

`SkillRoyaltySplitter.pay` · Confidence: 78 · Severity: **Medium** · [agents: 2]

**Description**  
The `operator` parameter in `pay()` is fully caller-controlled with zero on-chain validation. Any caller can pass their own address as `operator` and receive 80% of the payment amount back. With default splits (8000 bps), a caller who routes to themselves pays 100 USDC and receives 80 USDC back — effectively paying only 20 USDC (creator 15% + platform 5%) for Agent Services. In x402/MPP automated payment flows where the payer does not choose the operator, a malicious middleware can redirect 80% of all service revenue to an attacker-controlled address.

**Fix**

```diff
+ // Require operator holds the skill NFT as proof of service authorization
  function pay(uint256 skillId, address operator, uint256 amount) external nonReentrant {
      if (operator == address(0)) revert InvalidAddress();
+     if (skillNft.balanceOf(operator, skillId) == 0) revert UnauthorizedOperator(skillId, operator);
      ...
  }
```

---

[75] **4. `pay()` Does Not Respect Skill Active Status**

`SkillRoyaltySplitter.pay` · Confidence: 75 · Severity: **Low** · [agents: 3]

**Description**  
`SkillNFT.setSkillActive(skillId, false)` is the owner's intended kill-switch for a skill (e.g., malicious creator, legal issue, vulnerability found). However, `SkillRoyaltySplitter.pay()` calls `getCreator(skillId)` which only validates existence — not the `active` flag. Deactivated skills continue generating royalty payments to their creators indefinitely through the splitter, circumventing the owner's shutdown action.

**Fix**

```diff
+ interface ISkillNFT {
+     function getCreator(uint256 skillId) external view returns (address);
+     function isSkillActive(uint256 skillId) external view returns (bool);  // add to SkillNFT
+ }

  function pay(uint256 skillId, address operator, uint256 amount) external nonReentrant {
+     if (!skillNft.isSkillActive(skillId)) revert SkillInactive(skillId);
      ...
  }
```

---

[75] **5. Missing `nonReentrant` + CEI Violation in `buySkill`**

`SkillNFT.buySkill` · Confidence: 75 · Severity: **Low** · [agents: 4]

**Description**  
`buySkill` has no `nonReentrant` modifier. The `_mint` call at the end triggers `onERC1155Received` on any contract `recipient`, granting attacker-controlled execution after all USDC transfers have settled. `SkillRoyaltySplitter.pay` correctly uses `nonReentrant`; the inconsistency across the system is a code smell. Currently requires the attacker to pay full price per re-entry (no free mint), but any future addition of supply caps, purchase limits, or per-address cooldowns would be bypassable via this reentry vector.

**Fix**

```diff
- function buySkill(uint256 skillId, address recipient) external {
+ function buySkill(uint256 skillId, address recipient) external nonReentrant {
      ...
+     skill.totalSold++;   // ← move before external calls
      usdc.safeTransferFrom(msg.sender, address(this), price);
      usdc.safeTransfer(skill.creator, creatorShare);
      usdc.safeTransfer(platformWallet, platformShare);
      usdc.safeTransfer(reputationPool, reputationShare);
-     skill.totalSold++;
      _mint(recipient, skillId, 1, "");
```

---

## Leads

_High-signal trails for manual review. Not scored._

- **`royaltyBps` silently ignored by `pay()`** — `SkillNFT.createSkill` / `SkillRoyaltySplitter.pay` — [agents: 3] — `Skill.royaltyBps` is documented as "for SkillRoyaltySplitter" but `pay()` applies a flat global `creatorBps` (15%) ignoring per-skill values entirely. A creator who negotiated 25% receives 15% with no revert or warning. Verify whether per-skill splits are intended or the field is purely for ERC-2981 secondary market use.

- **Dead `creator == address(0)` guard in `pay()`** — `SkillRoyaltySplitter.pay` — [agents: 3] — `getCreator()` either reverts (`InvalidSkillId`) or returns a validated non-zero address; the `InvalidSkill` error branch is unreachable dead code. If `ISkillNFT` is ever pointed at a different contract that returns `address(0)`, the guard silently fails to catch it.

- **`SkillNFT` does not inherit `ISkillNFT`** — `SkillNFT` — [agents: 2] — `SkillRoyaltySplitter` calls `SkillNFT` via the `ISkillNFT` interface but `SkillNFT` never declares `is ISkillNFT`. A future rename or signature change breaks the integration silently at deploy time rather than compile time. Add `contract SkillNFT is ERC1155, IERC2981, ISkillNFT, Ownable`.

- **Fee-update deadlock** — `SkillNFT.setPlatformFeeBps / setReputationPoolBps` — [agents: 1] — Some valid target fee configurations are unreachable via independent setters. Example: transitioning from (1000, 500) to (8000, 1500) requires a specific ordering; an operator mistake could lock fees in an unintended state. The atomic `setFees()` fix for Finding 1 resolves this.

- **`pay()` tiny-amount zero-rounding** — `SkillRoyaltySplitter.pay` — Code smell: for `amount < 2`, `operatorAmt` and `creatorAmt` round to 0 and platform captures 100%. No `MIN_AMOUNT` guard exists unlike `SkillNFT.MIN_PRICE`. Relevant for x402 micro-payment flows.

- **Misleading balance-only preflight in `buySkill`** — `SkillNFT.buySkill` — [agents: 3] — `usdc.balanceOf(msg.sender) < price` check omits allowance; user with sufficient balance but zero allowance passes the guard and gets an opaque USDC revert rather than `InsufficientBalance`. The check is fully redundant since `safeTransferFrom` enforces both. Remove it or replace with an allowance check.

---

## Cyfrin SolSkill Notes

| Issue | File | Severity |
|-------|------|----------|
| Custom errors lack `ContractName__` prefix (`SkillNFT__InvalidAddress` etc.) | Both | Info |
| No `@custom:security-contact` in NatSpec | Both | Info |
| `SkillNFT` should inherit `ISkillNFT` for compile-time ABI safety | `SkillNFT.sol` | Info |

---

## Summary Table

| # | Confidence | Title | Severity |
|---|-----------|-------|----------|
| 1 | [82] | Owner front-run drains creator share to dust | Medium |
| 2 | [80] | USDC Blacklist DoS in `pay()` | Medium |
| 3 | [78] | Unconstrained `operator` in `pay()` — self-routing 80% | Medium |
| 4 | [75] | `pay()` bypasses skill active-status | Low |
| 5 | [75] | Missing `nonReentrant` + CEI in `buySkill` | Low |

---

> ⚠️ This review was performed by an AI assistant (Patrick / BountyHunter 🛡️) using Pashov 8-agent methodology + Trail of Bits skills + Cyfrin SolSkill standards + Slither static analysis. AI analysis can never verify the complete absence of vulnerabilities and no guarantee of security is given. Team security reviews, bug bounty programs, and on-chain monitoring are strongly recommended.
