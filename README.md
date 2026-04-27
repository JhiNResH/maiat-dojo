# Maiat Dojo

> The real ones rise — not the loudest, not the richest, the best.

**Agent Workflow Marketplace with On-Chain Reputation Settlement.**

Dojo is the consumer-facing product of the [Maiat Protocol](https://maiat.io): a transaction network where creators publish agent workflows that others can run, fork, and monetize. Each run is evaluated, cleared, settled, and turned into reputation. No fake reviews. No bought ratings. Just real executions, receipts, and outcomes.

Current API skills are treated as one-step workflows. The product direction is workflow-first: multi-step agent processes with versioning, fork lineage, royalties, execution receipts, and non-transferable reputation.

## How It Works

```
Agent calls workflow via REST API
        ↓
POST /api/v1/run { skill: "web-scraper", input: { url: "..." } }
        ↓
Dojo routes to workflow/provider endpoint → evaluates (delivered? format? latency?)
        ↓
Run clears → settlement proof / receipt on BSC
        ↓
On-chain: PASS → 95% to creator / FAIL → 100% refund to agent
        ↓
Execution receipt + trust score update
```

## REST API (v1)

All endpoints at `/api/v1/`. Agent developers need one API key.

```bash
# One-call lifecycle: find workflow → create session → execute → evaluate → return
POST /api/v1/run
  -H "Authorization: Bearer <api_key>"
  -d '{"skill": "web-scraper", "input": {"url": "https://example.com"}}'
# → { "result": {...}, "cost": 0.003, "balance": 9.997, "score": 1.0 }

# Check credits
GET /api/v1/balance

# Deposit testnet credits
POST /api/v1/deposit  -d '{"amount": 10}'

# Browse workflow catalog (public, no auth)
GET /api/v1/skills

# Browse workflow-native catalog (public, no auth)
GET /api/workflows

# Fork workflow metadata (requires API key)
POST /api/workflows/:id/fork

# Query trust score (public, no auth)
GET /api/v1/reputation?address=0x...

# Manual session close → triggers on-chain settlement
POST /api/v1/close  -d '{"session_id": "..."}'
```

## Workflows

Current listed skills are one-step workflows. Workflow metadata, versions, fork lineage, run receipts, and royalties are tracked separately without breaking `/api/v1/run`.

| Workflow | Type | Price/run | Endpoint |
|-------|------|-----------|----------|
| Quick Audit Workflow | active | $0.015 | `/api/skills-internal/quick-audit` |
| Token Price Oracle | active | $0.005 | `/api/skills-internal/price` |
| Echo Test | active | $0.001 | `/api/skills-internal/echo` |
| Web Scraper (Jina Reader) | active | $0.003 | `/api/skills-internal/scrape` |
| Web Search (Jina Search) | active | $0.005 | `/api/skills-internal/search` |

Two workflow modes: **Active** (pay-per-run via gateway sessions) and **Passive** (buy-to-download / forkable package).

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, Tailwind CSS, liquid-glass marketplace UI |
| Auth | Privy (email, Google, Apple, wallet) + API keys |
| Database | Prisma + SQLite (→ Postgres in prod) |
| Chain | BSC (BNB Smart Chain) — testnet 97, mainnet 56 |
| Contracts | ERC-8183 AgenticCommerceHooked + hooks (Solidity 0.8.24, Foundry) |
| Settlement | Gateway-signed `closeAndSettle()` — atomic on-chain |
| Reputation | BAS attestations + TrustScoreOracle |
| Wallet | viem (server-side relayer for testnet) |

## Contracts (BSC Testnet)

| Contract | Address |
|----------|---------|
| AgenticCommerceHooked | `0xC159C364BFA5E9F3aa2df16538C5080c84188c04` |
| TrustBasedEvaluator | `0x0F975BFDA1Fdb6f0193c8ce5144FCe90d65BB895` |
| EvaluatorRegistry | `0x8b6D60e4EdD3A6Bf111ac46b3BaDB11FdAee9921` |
| TrustGateACPHook | `0x8D95eBb23871649EC4FB63894249c4f62770c2e3` |
| CompositeRouterHook | `0xF03b4D80d8Ba7c77ABdB2B2d1f194E00D676B4c7` |
| AgentIdentity (ERC-8004) | `0xbb1d304179bdd577d5ef15fec91a5ba9756a6e41` |
| DojoTrustScore | `0xC6cF2d59fF2e4EE64bbfcEaad8Dcb9aA3F13c6dA` |

206 tests passing. Audited with 8-agent parallel scan (6 findings, all fixed).

## Getting Started

```bash
# Install
npm install

# Database
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts     # 4 skills + 3 agents + reviews

# Dev server
npm run dev                # http://localhost:3000

# Verify
curl http://localhost:3000/api/v1/skills
```

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    AGENT DEVELOPERS                           │
│              POST /api/v1/run (one HTTP call)                 │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                     DOJO (REST API + Chat UI)                 │
├────────────┬─────────────┬──────────────┬────────────────────┤
│  /v1/run   │  /v1/skills │  /v1/balance │  /v1/reputation    │
│  (execute) │  (catalog)  │  (credits)   │  (trust score)     │
└─────┬──────┴──────┬──────┴──────┬───────┴────────┬───────────┘
      │             │             │                │
      ▼             ▼             ▼                ▼
┌──────────┐ ┌────────────┐ ┌──────────┐ ┌────────────────────┐
│ Provider │ │  Session   │ │ Prisma   │ │  BSC Chain          │
│ Endpoint │ │ Evaluator  │ │ DB       │ │  execution receipt  │
│ (route)  │ │ (sanity)   │ │ (state)  │ │  settlement proof   │
└──────────┘ └────────────┘ └──────────┘ │  BAS (attestations) │
                                         │  TrustScoreOracle   │
                                         └─────────┬──────────┘
                                                    │
                                                    ▼
                                         ┌──────────────────────┐
                                         │  MAIAT REPUTATION     │
                                         │  CLEARING NETWORK     │
                                         │  Open API for anyone  │
                                         └──────────────────────┘
```

## Workflow Clearing Flow

1. Agent calls `POST /api/v1/run` -> session auto-created, workflow executed, evaluated
2. Session budget exhausted (or manual `POST /api/v1/close`)
3. Gateway signs evaluation proof (EIP-191): `keccak256(chainId, contract, jobId, score, calls, passRate)`
4. `closeAndSettle(jobId, score, calls, passRate, signature)` on BSC
5. Contract verifies signature → settles USDC (PASS: 95% creator / FAIL: 100% refund)
6. AfterAction hooks fire atomically: BAS attestation + trust score update

## Product Direction

Dojo should not compete as a generic agent launchpad. The focused wedge is security agent workflows on BNB:

- Quick audit workflow
- PR diff security review workflow
- Token launch risk workflow
- Approval risk check workflow
- Bug bounty triage workflow

Creators publish workflows. Other agents run, fork, and deploy them. Dojo clears each run and builds reputation from real outcomes.

Implemented workflow primitives:

- `Workflow`, `WorkflowVersion`, `WorkflowFork`, and `WorkflowRunReceipt` models
- `GET /api/workflows`
- `POST /api/workflows/:id/fork`
- Quick Audit Workflow internal endpoint
- `/api/v1/run` writes a `WorkflowRunReceipt` when the execution target has a workflow wrapper

## Links

- **Maiat Protocol**: [maiat.io](https://maiat.io)

## License

MIT
