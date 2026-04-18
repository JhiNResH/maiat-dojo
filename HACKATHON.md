# Maiat Dojo — BNB Hackathon Submission

> **Tokenized Agent Commerce + Reputation-Gated Allocation on BNB Chain.**
> Chain: BSC Testnet (chain 97), Mainnet ready.
> Target: Long-term Resource-Based Economy (RBE) for AI agents.

---

## One-liner

**Agents buy skills like ERC-20 tokens, gated by reputation not just money.**
Every `swap()` checks reputation before transferring USDC. Day-1 floors are 0,
but the gate exists so reputation can gradually replace money as the primary
resource allocation mechanism — the RBE seed.

---

## What's on-chain (BSC Testnet — chain 97)

| Contract | Address |
|---|---|
| SkillRegistry | [`0x104579420Ab86579631E8452EE553A75Fc257690`](https://testnet.bscscan.com/address/0x104579420Ab86579631E8452EE553A75Fc257690) |
| SwapRouter | [`0x2844515814b44Ab23d5001571e2E1C726295536a`](https://testnet.bscscan.com/address/0x2844515814b44Ab23d5001571e2E1C726295536a) |
| ReputationHub | [`0x6c6b8b4a72A291d95eC461FEc29cd764bbfcC159`](https://testnet.bscscan.com/address/0x6c6b8b4a72A291d95eC461FEc29cd764bbfcC159) |
| USDC (test) | [`0x2F808cc071D7B54d23a7647d79d7EF6E2C830d31`](https://testnet.bscscan.com/address/0x2F808cc071D7B54d23a7647d79d7EF6E2C830d31) |

### Demo skills registered

| Slug | skillId | RUN_TOKEN |
|---|---|---|
| echo-test | `0x8ba5917d62055f9100acf59259c285ec2d0825d3fb72d3dc7dc0ac9a564b6f91` | `0x05E472c503E3e0651723E9A1638BD54E9873a426` |
| web-scraper | `0x155a797494737fd1f2521b7378a906951020479d96261ff2a1b89c996936d255` | `0x689b4183b76aA2518E39f0C2ce9BF849F5f6E4c2` |
| price-oracle | `0xe84a466f61fd3ef7b48426e340721de4a6859b63f9d22100f241f38815209150` | `0x3BB93aADA4e149FeCa5c1e2390Fe256582E5C8C2` |

### E2E on-chain proof (2026-04-18)

- swap tx: [`0xa7fab38797227a122c3f837458dfd6ed70b0ecf51798d6d01cde7d8de3d09d29`](https://testnet.bscscan.com/tx/0xa7fab38797227a122c3f837458dfd6ed70b0ecf51798d6d01cde7d8de3d09d29)
- settle tx: [`0xa754b56944d7473dd992dacc3d5645ad98b7fb7fc6b2395ebe8a3ddffc287913`](https://testnet.bscscan.com/tx/0xa754b56944d7473dd992dacc3d5645ad98b7fb7fc6b2395ebe8a3ddffc287913)

---

## Architecture

```
Agent ─HTTP─► /api/v1/run ─► creator endpoint ─► evaluator
                   │
                   └─── fire-and-forget ───► SwapRouter.swap()
                                                │
                                                ├─► SkillRegistry (supply-gated setters,
                                                │   treasury pool, CREATE2-deployed
                                                │   ERC-20 per skill)
                                                │
                                                ├─► ReputationHub.scoreOf(agent) ≥ minRep
                                                │
                                                └─► settle() → creator/platform/reputationPool
                                                              (USDC split; BAS attestation hook)
```

### Two orthogonal primitives

| Layer | Purpose | Phase 2 status |
|---|---|---|
| **ERC-20 per capability** (SKILL_RUN_TOKEN) | Interface uniformity. Every skill / item / service = ERC-20. Agents operate on token portfolios. Not for speculation — for composability. | ✅ live |
| **Reputation-gated allocation** | `swap()` checks reputation before USDC. Day-1 floor = 0. Creators raise threshold as data accumulates → reputation gains real weight → RBE. | ✅ live, floor = 0 |

---

## Security — audit done + fixes applied

Ran 8-agent solidity-auditor on the Phase 2 suite. 8 HIGH-severity findings surfaced. All 8 fixed + regression tests added.

| # | Finding | Fix |
|---|---|---|
| 1 | Provider price manipulation drains agent treasury | `setPrice` reverts while RUN_TOKEN totalSupply > 0 |
| 2 | Permissionless slug squatting | Owner `transferProvider(skillId, newProvider)` |
| 3 | Sandwich attack via `setPrice` front-run | `maxPriceUSDC` slippage param on buy/swap |
| 4 | USDC blacklist permanently freezes funds | Pull-payment fallback + `claimPending` + `rescueTokens` |
| 5 | Router upgrade bricks existing skill tokens | `SkillRunToken.router()` resolves live from registry |
| 6 | `setActive` strands prepaid USDC | `redeemRunToken` escape hatch ignores active flag |
| 7 | `setMinReputation` bricks prepaid tokens | Supply-gated (same as #1) |
| 8 | No redeem path | `redeemRunToken(skillId, amount)` added |

**Tests: 155/155 forge test green** (including 18 audit regression tests + fuzz tests).

---

## Key specs / ADRs

- `specs/2026-04-16-agent-commerce-protocol.md` — full Phase 2 spec
- `brain/wiki/decisions/2026-04-16-tokens-as-interface-reputation-as-allocation.md` — locked ADR
- 8-week roadmap to mainnet + external audit post-hackathon

---

## Links

- Repo: https://github.com/JhiNResH/maiat-dojo
- PR for this work: https://github.com/JhiNResH/maiat-dojo/pull/41
- Live API: https://dojo.maiat.io (REST spec in repo)

---

## Team

JhiNResH (solo builder). Smart-contract audit background, targeting
Smart Contract Security Engineer role at BNB ecosystem exchanges.

## Why this matters

Current agent economies re-use Web2 payment rails (OpenAI credits, SaaS subs).
That means reputation lives off-chain, gets captured by platforms, and stays
irrelevant to resource allocation. Maiat plants the opposite seed: every
agent-to-skill interaction generates clean on-chain reputation data. Over time
that reputation graph becomes the allocation mechanism — agents get access not
because they paid, but because of who they are and what they've delivered.

Skills are the entry point because they're high-frequency and have clean
outcomes (delivered / not-delivered). Items and services follow in Phase 4
using the same `swap()` interface.
