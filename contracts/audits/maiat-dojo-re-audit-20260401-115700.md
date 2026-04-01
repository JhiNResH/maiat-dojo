# 🔐 Re-Audit / Fix Verification — maiat-dojo

**Commit reviewed:** `69c7a69` — "fix: resolve all Patrick audit findings (5F + 6L)"
**Tests:** 43/43 ✅
**Slither reentrancy/arbitrary-send:** 0 findings in scope ✅
**Original report:** `maiat-dojo-pashov-ai-audit-report-20260401-111500.md`

---

## Fix Verification

| # | Severity | Finding | Fix | Status |
|---|----------|---------|-----|--------|
| M-1 | Medium | Owner front-run drains creator share | `setFees(platform, rep)` atomic; old individual setters removed | ✅ FIXED |
| M-2 | Medium | USDC Blacklist DoS in `pay()` | Pull-then-push + `rescueTokens()` in Splitter | ✅ FIXED |
| M-3 | Medium | Unconstrained `operator` in `pay()` | `require skillNftERC1155.balanceOf(operator, skillId) > 0` | ✅ FIXED |
| L-4 | Low | `pay()` bypasses skill active-status | `skillNft.getSkillActive(skillId)` check before any transfer | ✅ FIXED |
| L-5 | Low | Missing `nonReentrant` + CEI in `buySkill` | `nonReentrant` added; `totalSold++` before `_mint` | ✅ FIXED |
| Lead | — | `SkillNFT` didn't inherit `ISkillNFT` | Separate `ISkillNFT.sol`; `SkillNFT is ... ISkillNFT` | ✅ FIXED |
| Lead | — | `MIN_AMOUNT` missing in Splitter | `MIN_AMOUNT = 10000` constant; `AmountTooLow` guard in `pay()` | ✅ FIXED |
| Lead | — | Non-indexed address events | `PlatformWalletUpdated(address indexed)`, `ReputationPoolUpdated(address indexed)` | ✅ FIXED |
| Lead | — | `rescueTokens` missing from Splitter | Added `rescueTokens()` with `onlyOwner` + `TokensRescued` event | ✅ FIXED |

---

## Residual Notes (Not Findings)

1. **`royaltyBps` still unused in `pay()`** — `ISkillNFT` now exposes `getSkillRoyaltyBps()` and Splitter imports it, but `pay()` still uses the flat global `creatorBps` rather than per-skill royalty. This appears intentional (global split policy, per-skill royalty for ERC-2981 only). Document explicitly in NatSpec if so.

2. **Dead `creator == address(0)` guard** — Still present in `pay()` but now structurally unreachable. Low priority; can be removed for cleanliness.

3. **`buySkill` balance preflight** — Redundant `usdc.balanceOf` check still present. Not a security issue; remove to simplify.

4. **CEI still technically violated** — `totalSold++` now precedes `_mint` ✅, but USDC `safeTransfer` calls to creator/platform/reputationPool still occur before `totalSold++`. With `nonReentrant` in place this is safe. No action required.

---

## Summary

**All 5 original findings resolved. All 9 leads addressed.**
**No new findings introduced by the fix commit.**

Contracts are ready for mainnet deployment pending a final human review and on-chain monitoring setup.

---

> ⚠️ AI re-audit by Patrick / BountyHunterLamb 🛡️. Verify with a human auditor before mainnet deploy.
