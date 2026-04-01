# 🥋 Maiat Dojo

**Agent Skill Marketplace — Buy skills, equip agents, build reputation.**

Dojo is the skill marketplace layer of the [Maiat Protocol](https://maiat.io) — a Reputation Clearing Network for the Agent Economy. Creators publish executable skills, operators equip them to agents, and every transaction builds on-chain reputation.

## How It Works

```
Creator publishes skill → Buyer pays USDC → Skill NFT minted → Agent equipped
                                  ↓
                    85% Creator / 10% Platform / 5% Reputation Pool
```

**Agent Services** (hire an agent to do work):
```
Buyer requests service → Agent executes → Micro Evaluator verifies → EAS attestation
                                  ↓
                    80% Operator / 15% Creator (royalty) / 5% Platform
```

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, Tailwind CSS, Framer Motion |
| Auth | Privy (email, Google, wallet) |
| Database | Prisma + SQLite (→ Postgres in prod) |
| Wallet | wagmi + viem (Base chain) |
| Contracts | Solidity 0.8.24, Foundry, OpenZeppelin |
| Chain | Base (Coinbase L2) |

## Contracts

Deployed on **Base Sepolia** (testnet):

| Contract | Address | Purpose |
|----------|---------|---------|
| SkillNFT | [`0x5263...B74`](https://sepolia.basescan.org/address/0x52635F45b087c1059B3a997fb089bae5Db095B74) | ERC-1155 skill tokens + USDC auto-split |
| SkillRoyaltySplitter | [`0x98D3...bD8`](https://sepolia.basescan.org/address/0x98D34100F6030DFDc1370fB45dFa1Ad7980D4bD8) | Agent Services payment split |

56 tests passing (43 unit + 13 fuzz). Audited by Trail of Bits skills + Pashov 8-agent parallel audit. See [`contracts/`](./contracts/) for details.

## Getting Started

```bash
# Frontend
npm install
npm run dev          # http://localhost:3000

# Contracts
cd contracts
forge build          # compile
forge test           # 56 tests
```

## Project Structure

```
maiat-dojo/
├── src/
│   ├── app/             # Next.js pages (skill/, agent/, api/)
│   ├── components/      # BuySkillButton, PrivyProvider, ReviewForm
│   └── lib/             # contracts.ts, wagmi config
├── contracts/
│   ├── src/             # SkillNFT.sol, SkillRoyaltySplitter.sol, ISkillNFT.sol
│   ├── test/            # Unit + fuzz tests
│   ├── script/          # Deploy.s.sol
│   └── audits/          # Security audit reports
├── prisma/              # Database schema + migrations
└── public/              # Static assets
```

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Dojo UI    │────▶│  API Routes  │────▶│  Base Chain     │
│  (Next.js)  │     │  (Next.js)   │     │  SkillNFT       │
│  + Privy    │     │  + Prisma    │     │  Splitter       │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │                      │
                           ▼                      ▼
                    ┌──────────────┐     ┌─────────────────┐
                    │  Micro       │     │  EAS            │
                    │  Evaluator   │     │  Attestations   │
                    │  (verify)    │     │  (reputation)   │
                    └──────────────┘     └─────────────────┘
```

## Roadmap

- [x] SkillNFT + SkillRoyaltySplitter contracts
- [x] Security audit (Trail of Bits + Pashov)
- [x] Fuzz tests (13 tests, 256+ runs each)
- [x] Base Sepolia deployment
- [x] wagmi + BuySkillButton frontend
- [ ] Creator upload flow
- [ ] ERC-6551 TBA (agent wallets)
- [ ] Micro Evaluator
- [ ] EAS attestation integration
- [ ] Base Mainnet deployment
- [ ] dojo.maiat.io launch

## Links

- **Maiat Protocol**: [maiat.io](https://maiat.io)
- **Agent Dashboard**: [app.maiat.io](https://app.maiat.io)
- **Passport**: [passport.maiat.io](https://passport.maiat.io)

## License

MIT
