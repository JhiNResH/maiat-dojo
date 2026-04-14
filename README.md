# Maiat Dojo

> The real ones rise — not the loudest, not the richest, the best.

**Agent Skill Marketplace with On-Chain Reputation Settlement.**

Dojo is the consumer-facing product of the [Maiat Protocol](https://maiat.io) — a Reputation Clearing Network for the Agent Economy. Agent developers call skills via REST API, every call is evaluated, and settlement happens on-chain via ERC-8183. No fake reviews. No bought ratings. Just real transactions, real results.

## How It Works

```
Agent calls skill via REST API
        ↓
POST /api/v1/run { skill: "web-scraper", input: { url: "..." } }
        ↓
Dojo proxies to creator endpoint → evaluates (delivered? format? latency?)
        ↓
Session closes → gateway-signed closeAndSettle() on BSC
        ↓
On-chain: PASS → 95% to creator / FAIL → 100% refund to agent
        ↓
BAS attestation + trust score update (atomic, same tx)
```

## REST API (v1)

All endpoints at `/api/v1/`. Agent developers need one API key.

```bash
# One-call lifecycle: find skill → create session → call → evaluate → return
POST /api/v1/run
  -H "Authorization: Bearer <api_key>"
  -d '{"skill": "web-scraper", "input": {"url": "https://example.com"}}'
# → { "result": {...}, "cost": 0.003, "balance": 9.997, "score": 1.0 }

# Check credits
GET /api/v1/balance

# Deposit testnet credits
POST /api/v1/deposit  -d '{"amount": 10}'

# Browse skill catalog (public, no auth)
GET /api/v1/skills

# Query trust score (public, no auth)
GET /api/v1/reputation?address=0x...

# Manual session close → triggers on-chain settlement
POST /api/v1/close  -d '{"session_id": "..."}'
```

## Skills

| Skill | Type | Price/call | Endpoint |
|-------|------|-----------|----------|
| Token Price Oracle | active | $0.005 | `/api/skills-internal/price` |
| Echo Test | active | $0.001 | `/api/skills-internal/echo` |
| Web Scraper (Jina Reader) | active | $0.003 | `/api/skills-internal/scrape` |
| Web Search (Jina Search) | active | $0.005 | `/api/skills-internal/search` |

Two skill types: **Active** (pay-per-use via gateway sessions) and **Passive** (buy-to-download).

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, Tailwind CSS, newspaper aesthetic |
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
│  (lifecycle│  (catalog)  │  (credits)   │  (trust score)     │
└─────┬──────┴──────┬──────┴──────┬───────┴────────┬───────────┘
      │             │             │                │
      ▼             ▼             ▼                ▼
┌──────────┐ ┌────────────┐ ┌──────────┐ ┌────────────────────┐
│ Creator  │ │  Session   │ │ Prisma   │ │  BSC Chain          │
│ Endpoint │ │ Evaluator  │ │ DB       │ │  AgenticCommerce    │
│ (proxy)  │ │ (sanity)   │ │ (state)  │ │  closeAndSettle()   │
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

## Settlement Flow

1. Agent calls `POST /api/v1/run` → session auto-created, skill called, evaluated
2. Session budget exhausted (or manual `POST /api/v1/close`)
3. Gateway signs evaluation proof (EIP-191): `keccak256(chainId, contract, jobId, score, calls, passRate)`
4. `closeAndSettle(jobId, score, calls, passRate, signature)` on BSC
5. Contract verifies signature → settles USDC (PASS: 95% creator / FAIL: 100% refund)
6. AfterAction hooks fire atomically: BAS attestation + trust score update

## Links

- **Maiat Protocol**: [maiat.io](https://maiat.io)

## License

MIT
