# 🥋 Maiat Dojo

> *We believe the real ones rise — not the loudest, not the richest, the best.*

**The Agent Skill Marketplace — proof over promise.**

Dojo is the consumer-facing product of the [Maiat Protocol](https://maiat.io), a Reputation Clearing Network for the Agent Economy. Creators publish executable skills, buyers equip them to agents, and every transaction generates verifiable on-chain reputation. No fake reviews. No bought ratings. Just real transactions, real results.

## How It Works

```
Creator publishes skill → Buyer pays USDC → ERC-1155 NFT minted → Agent equipped
                                  ↓
                    85% Creator / 10% Platform / 5% Reputation Pool
                                  ↓
                    EAS Attestation → Trust Score updated
```

## Features

### Live ✅
| Feature | Description |
|---------|-------------|
| **Skill Marketplace** | Browse, search, filter by category |
| **Creator Upload** | Publish skills via `/create` — name, description, category, price, tags |
| **Buy Flow** | Two-step USDC approval + purchase via SkillNFT contract |
| **Leaderboard** | Skills ranked by sales, Creators ranked by revenue — no paid rankings |
| **Creator Profiles** | Numbers only, no bio — proof over promise |
| **Trust Badges** | Agent trust scores (red/yellow/green) based on performance data |
| **Micro Evaluator** | Automated skill quality checks (description, tags, price, category) |
| **Trust Score API** | Open API: `GET /api/trust/[address]` — any third party can query |
| **EAS Attestation** | Every purchase generates attestation data for on-chain reputation |
| **Auto User Sync** | Privy login → automatic User record creation |
| **Seed Data** | 8 real skills pre-loaded for cold start |

### Coming Next 🔜
| Feature | Description |
|---------|-------------|
| **ERC-6551 TBA** | Agent token-bound accounts (wallets that hold skill NFTs) |
| **EAS Schema Registration** | On-chain attestation schema for skill purchases |
| **Base Mainnet Deploy** | Move from Sepolia testnet to production |
| **dojo.maiat.io** | Public launch |

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, Tailwind CSS, newspaper aesthetic UI |
| Auth | Privy (email, Google, Apple, wallet) |
| Database | Prisma + SQLite (→ Postgres in prod) |
| Wallet | wagmi + viem (Base chain) |
| Contracts | Solidity 0.8.24, Foundry, OpenZeppelin |
| Reputation | EAS attestations + TrustScoreOracle |
| Chain | Base (Coinbase L2) |

## Contracts

Deployed on **Base Sepolia** (testnet):

| Contract | Address | Purpose |
|----------|---------|---------|
| SkillNFT | [`0x5263...B74`](https://sepolia.basescan.org/address/0x52635F45b087c1059B3a997fb089bae5Db095B74) | ERC-1155 skill tokens + USDC auto-split (85/10/5) |
| SkillRoyaltySplitter | [`0x98D3...bD8`](https://sepolia.basescan.org/address/0x98D34100F6030DFDc1370fB45dFa1Ad7980D4bD8) | Agent Services payment split (80/15/5) |

56 tests passing (43 unit + 13 fuzz). Audited with Trail of Bits skills + Pashov 8-agent parallel scan.

## Getting Started

```bash
# Install
npm install

# Database
npx prisma generate
npx prisma db push
npm run seed          # Load 8 starter skills

# Dev server
npm run dev           # http://localhost:3000

# Contracts
cd contracts
forge build           # Compile
forge test            # 56 tests
make full-testnet     # Deploy + interact on Sepolia
```

## Project Structure

```
maiat-dojo/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Homepage — newspaper-style marketplace
│   │   ├── create/page.tsx       # Creator upload form
│   │   ├── leaderboard/page.tsx  # Rankings (by sales + revenue)
│   │   ├── skill/[id]/page.tsx   # Skill detail
│   │   ├── agent/[id]/page.tsx   # Agent detail + trust badge
│   │   ├── creator/[id]/page.tsx # Creator profile (data only)
│   │   └── api/
│   │       ├── skills/           # CRUD + buy + create + evaluate
│   │       ├── agents/           # CRUD + create + equip
│   │       ├── trust/[address]/  # Open Trust Score API
│   │       ├── creators/[id]/    # Creator aggregate stats
│   │       ├── leaderboard/      # Rankings data
│   │       └── users/sync/       # Privy auto-sync
│   ├── components/
│   │   ├── BuySkillButton.tsx    # Two-step USDC buy flow
│   │   ├── TrustBadge.tsx        # Trust score circular badge
│   │   ├── PrivyProvider.tsx     # Auth + wagmi wrapper
│   │   └── ReviewForm.tsx        # Skill/agent reviews
│   ├── hooks/
│   │   └── useAutoCreateUser.ts  # Auto user creation on Privy login
│   └── lib/
│       ├── contracts.ts          # SkillNFT + USDC ABIs
│       ├── eas.ts                # EAS attestation helpers
│       ├── erc6551.ts            # TBA Registry utilities
│       ├── evaluator.ts          # Micro Evaluator (quality checks)
│       ├── prisma.ts             # Database client
│       └── wagmi.ts              # Chain config
├── contracts/
│   ├── src/                      # SkillNFT.sol, SkillRoyaltySplitter.sol
│   ├── test/                     # Unit + fuzz tests (56 total)
│   ├── script/                   # Deploy.s.sol, Interact.s.sol
│   └── audits/                   # Security audit reports
├── prisma/
│   ├── schema.prisma             # User, Skill, Agent, Job, Review, Purchase
│   └── seed.ts                   # 8 starter skills
└── Makefile                      # make test, make deploy-testnet, make audit
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        DOJO (Consumer)                       │
├─────────────┬──────────────┬─────────────────┬──────────────┤
│  Marketplace│  Leaderboard │  Creator Upload  │  Trust Badge │
│  (browse)   │  (rankings)  │  (publish)       │  (verify)    │
└──────┬──────┴──────┬───────┴────────┬────────┴──────┬───────┘
       │             │                │               │
       ▼             ▼                ▼               ▼
┌──────────────────────────────────────────────────────────────┐
│                     API Layer (Next.js)                        │
│  /api/skills  /api/trust  /api/creators  /api/leaderboard    │
└──────┬──────────────┬────────────────────────┬───────────────┘
       │              │                        │
       ▼              ▼                        ▼
┌────────────┐ ┌──────────────┐ ┌──────────────────────────────┐
│  Prisma DB │ │  Micro       │ │  Base Chain                   │
│  (state)   │ │  Evaluator   │ │  SkillNFT (ERC-1155)         │
│            │ │  (quality)   │ │  Splitter (royalties)        │
└────────────┘ └──────────────┘ │  EAS (attestations)          │
                                │  ERC-6551 TBA (agent wallets)│
                                └──────────────────────────────┘
                                           │
                                           ▼
                                ┌──────────────────────┐
                                │  MAIAT REPUTATION     │
                                │  CLEARING NETWORK     │
                                │  (Trust Score Oracle)  │
                                │  Open API for anyone   │
                                └──────────────────────┘
```

## API Reference

### Public APIs (no auth required)

```bash
# Get trust score for any agent
GET /api/trust/0xAgentAddress

# Browse skills
GET /api/skills?q=defi&category=Trading&sort=popular&limit=20

# Leaderboard
GET /api/leaderboard

# Creator profile
GET /api/creators/{userId}
```

## Links

- **Maiat Protocol**: [maiat.io](https://maiat.io)
- **Agent Dashboard**: [app.maiat.io](https://app.maiat.io)
- **Passport**: [passport.maiat.io](https://passport.maiat.io)
- **ERC-8183 Hooks**: [github.com/anthropics/hook-contracts](https://github.com/anthropics/hook-contracts) (we're the #1 contributor)

## License

MIT
