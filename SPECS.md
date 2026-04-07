# Maiat Dojo — Spec Index

> Auto-read this file FIRST when entering the repo to avoid re-discovering existing work.
> Last updated: 2026-04-05

---

## 🟢 Active (Phase 1 — in progress)

### Trust + Identity (KYA ladder)
| Spec | What | Status |
|---|---|---|
| `2026-04-05-trust-verification-loop.md` | **Spec A.** Signal→Attestation→TrustScore→Discovery closed loop. Context doc. | draft |
| `2026-04-05-kya-onboarding.md` | KYA 0-2 ladder parent spec (high-level) | locked 2026-04-05 |
| `2026-04-05-kya-pr-a-identity-mint.md` | **Spec B (PR A).** KYA-0 eager ERC-8004 mint via Dojo relayer | draft |

### Gateway + Sessions (active skill runtime)
| Spec | What | Status |
|---|---|---|
| `2026-04-05-gateway-architecture.md` | Gateway forwarding architecture (creator endpoint registration, HMAC) | locked 2026-04-05 |
| `2026-04-05-agent-gateway-auth.md` | EIP-712 auth envelope for agent → gateway calls | locked 2026-04-05 |
| `2026-04-05-session-as-job-migration.md` | Session = ERC-8183 job model; prepaid escrow + per-call decrement | locked 2026-04-05 |

---

## 📋 Reference (Phase 1 foundation, don't modify without ADR)

| Spec | What |
|---|---|
| `2026-04-04-dojo-business-model.md` | Business model — skill marketplace, Dojo 5% take rate |
| `2026-04-04-dojo-card-ui.md` | Newspaper aesthetic card UI |
| `2026-04-04-dojo-phase1-pipeline.md` | Phase 1 shipping pipeline (may be superseded — check) |

---

## 🔮 Planned (not yet written)

### KYA (continuation of Spec B chain)
- **PR B** — KYA-1 OAuth social handle binding (Twitter + GitHub)
- **PR C** — KYA-2 veteran wallet verify (signed msg + on-chain activity check across ETH/Base/Arb/BNB/xLayer)
- **PR D** — KYA discovery ranking in catalog

### Attestation wiring (implements Spec A gaps)
- **Spec C** — Wire `SessionEvaluation` EAS attestation to `/api/sessions/[id]/close`
- **Spec D** — `POST /api/sessions/[id]/review` (BuyerReview + SellerReview schemas)
- **Spec E** — Move EAS schemas from Base Sepolia to Base Mainnet; drop placeholder UIDs

### Phase 2 (Q2-Q3)
- KYA-3 slashable stake
- Trust-gated post-pay (TrustScore ≥ 80 → unlock weekly batch settle)
- CCIP cross-chain identity mirror (Base canonical → xLayer + BNB)
- Creator stake / slashing on confirmed dispute

---

## 📚 Related brain decisions (locked)

- `~/brain/wiki/decisions/2026-04-eas-on-chain-reviews.md` — EAS on Base = on-chain reviews
- `~/brain/wiki/decisions/2026-04-maiat-default-evaluator.md` — Maiat = default evaluator Phase 1
- `~/brain/wiki/decisions/2026-04-dojo-micro-evaluator-adapter.md` — session-as-job model
- `~/brain/wiki/decisions/2026-04-dojo-no-nft.md` — no skill NFT buy-once model
- `~/brain/wiki/decisions/2026-04-kya-creator-onboarding.md` — KYA 0-2 Phase 1 ladder
- `~/brain/wiki/projects/maiat/micro-evaluator-spec.md` — MicroEvaluator contract spec

## 🔗 Related PRs (erc-8183/hook-contracts)

- PR #10 — `AttestationHook` (EAS receipts for ACP job outcomes) — OPEN
- PR #14 — `MutualAttestationHook` (bilateral buyer↔seller reviews) — OPEN
- PR #6 — trust-based evaluator + trust gate hook + evaluator registry — OPEN

---

## Maintenance

When adding a spec: append under correct section + 1-line description + status.
When superseding: move entry to a `Superseded` section, link the replacement.
When Phase 1 ships: create v2 index, archive v1 section-by-section.
