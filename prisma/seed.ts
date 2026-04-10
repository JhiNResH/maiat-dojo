import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean (order matters: FK constraints)
  await prisma.skillCall.deleteMany();
  await prisma.session.deleteMany();
  await prisma.job.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.review.deleteMany();
  await prisma.agentSkill.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.user.deleteMany();

  // --- Platform creator (seeds are official Dojo curated skills) ---
  const platform = await prisma.user.create({
    data: {
      privyId: "did:privy:seed-platform-001",
      displayName: "Maiat Dojo",
      email: "system@maiat.io",
      walletAddress: "0x000000000000000000000000446f6a6f446f6a6f", // "DojoDojoDojoD" — valid 20-byte hex placeholder
    },
  });

  // --- Community creator (for variety) ---
  const community1 = await prisma.user.create({
    data: {
      privyId: "did:privy:seed-sentinel-002",
      displayName: "0xSentinel",
      email: "sentinel@dojo.maiat.io",
      walletAddress: "0x0000000000000000000053656e74696e656c3031", // "Sentinel01" — valid 20-byte hex placeholder
    },
  });

  // --- Buyer (for reviews / E2E testing) ---
  const buyer1 = await prisma.user.create({
    data: {
      privyId: "did:privy:seed-buyer-003",
      displayName: "Agent_Smith",
      email: "smith@dojo.maiat.io",
    },
  });

  // ---------------------------------------------------------------------------
  // Skills — SKILL.md format: fileContent = inline SKILL.md, endpointUrl = optional
  // ---------------------------------------------------------------------------

  const skills = await Promise.all([
    // 1. DeFi Yield Optimizer (passive, $2.00)
    prisma.skill.create({
      data: {
        name: "DeFi Yield Optimizer",
        description:
          "Scans 12+ DeFi protocols across Ethereum, Base, and Arbitrum to find the highest risk-adjusted APY.",
        category: "Trading",
        icon: "⚡",
        skillType: "passive",
        gatewaySlug: "defi-yield-optimizer",
        price: 2.0,
        rating: 4.9,
        installs: 4821,
        tags: "yield,farming,apy,defi,optimization",
        fileType: "markdown",
        fileContent: `# DeFi Yield Optimizer

## Overview
You are a DeFi yield optimization agent. Continuously monitor and recommend the best yield opportunities across multiple protocols and chains.

## Supported Protocols
- **Ethereum**: Aave V3, Compound V3, Lido, Rocket Pool, Curve, Convex, Yearn
- **Base**: Aave V3, Compound V3, Aerodrome, Extra Finance
- **Arbitrum**: Aave V3, GMX, Radiant, Pendle

## Instructions

### Yield Scanning
When asked to find yield opportunities:
1. Query each protocol's current APY for the specified asset
2. Factor in base APY, reward token APY (convert to USD), and protocol risk score
3. Calculate risk-adjusted yield: \`APY * (risk_score / 100)\`
4. Return top 5 opportunities sorted by risk-adjusted yield

### Risk Scoring
\`\`\`
Risk Score = audit_score (0-40) + tvl_score (0-30) + time_score (0-30)

audit_score:  Multiple top-firm audits = 40, Single = 30, Community = 15, None = 0
tvl_score:    >$1B = 30, >$100M = 20, >$10M = 10, <$10M = 5
time_score:   >2yr = 30, >1yr = 20, >6mo = 10, <6mo = 5
\`\`\`

### Rebalance Recommendations
Monitor positions and recommend rebalancing when:
- Yield differential >2% APY
- Risk score changes significantly
- Better opportunity in same risk tier

### Output Format
\`\`\`json
{
  "opportunities": [
    {
      "protocol": "Aave V3",
      "chain": "Base",
      "asset": "USDC",
      "apy": 5.2,
      "risk_score": 95,
      "risk_adjusted_apy": 4.94,
      "recommendation": "STRONG BUY"
    }
  ]
}
\`\`\`

## API Keys Required
- ALCHEMY_API_KEY or INFURA_API_KEY for RPC
- DEFILLAMA_API (free, no key needed)
`,
        isGated: true,
        creatorId: platform.id,
      },
    }),

    // 2. Smart Contract Auditor (passive, $5.00)
    prisma.skill.create({
      data: {
        name: "Smart Contract Auditor",
        description:
          "Performs automated security analysis on Solidity contracts — reentrancy, access control, oracle manipulation, and more.",
        category: "Security",
        icon: "🛡️",
        skillType: "passive",
        gatewaySlug: "smart-contract-auditor",
        price: 5.0,
        rating: 4.9,
        installs: 980,
        tags: "audit,security,solidity,vulnerabilities,smart-contracts",
        fileType: "markdown",
        fileContent: `# Smart Contract Auditor

## Overview
You are a smart contract security auditor agent. Identify vulnerabilities in Solidity contracts and provide detailed remediation guidance.

## Vulnerability Detection

### Critical
1. **Reentrancy** — External calls before state updates. Fix: CEI pattern + ReentrancyGuard.
2. **Access Control** — Missing modifiers on sensitive functions. Fix: OpenZeppelin AccessControl.
3. **Oracle Manipulation** — Single-block price reads. Fix: Chainlink / TWAP 30+ min.

### High
4. **Flash Loan Attacks** — Price-dependent logic without guards. Fix: block-based delays.
5. **Unchecked Return Values** — ERC20 transfer without bool check. Fix: SafeERC20.
6. **Integer Overflow** — Pre-0.8.0 unchecked math. Fix: Upgrade to 0.8.x.

### Medium
7. **Front-running** — TX ordering dependence. Fix: commit-reveal.
8. **Centralization** — Single admin key, no timelock. Fix: Multisig + governance.

## Audit Process
\`\`\`
1. SCOPE — Identify entry points, token flows, external deps
2. SCAN — Run Slither + Mythril
3. MANUAL — Apply vulnerability patterns, check business logic
4. REPORT — Severity (C/H/M/L/Info) + File:Line + Description + Fix + PoC
\`\`\`

## Output Format
\`\`\`markdown
## [CRITICAL] Reentrancy in withdraw()

**File:** Vault.sol:142
**Description:** Transfers ETH before updating balance.
**Fix:** Apply CEI pattern + nonReentrant modifier.
**Severity Justification:** Direct fund loss possible.
\`\`\`
`,
        isGated: true,
        creatorId: platform.id,
      },
    }),

    // 3. Twitter Alpha Scanner (passive, $1.50)
    prisma.skill.create({
      data: {
        name: "Twitter Alpha Scanner",
        description:
          "Monitors crypto Twitter in real-time, extracting actionable alpha from KOLs, developers, and on-chain sleuths.",
        skillType: "passive",
        gatewaySlug: "twitter-alpha-scanner",
        category: "Content",
        icon: "🐦",
        price: 1.5,
        rating: 4.7,
        installs: 3890,
        tags: "twitter,alpha,social,sentiment,kol,news",
        fileType: "markdown",
        fileContent: `# Twitter Alpha Scanner

## Overview
You are a crypto Twitter intelligence agent. Monitor, filter, and extract actionable trading signals from social media.

## Account Tiers
- **Tier 1 (100% reliability):** Core protocol devs, @samczsun, @transmissions11
- **Tier 2 (70% reliability):** Respected analysts, @lookonchain, verified fund managers
- **Tier 3 (50% reliability):** CT influencers 100k+. Requires cross-reference.

## Signal Detection

### Developer Activity
- TRIGGER: Core dev tweets protocol update
- SIGNAL: Price movement 24-48h
- ACTION: Monitor GitHub commits, check testnet
- CONFIDENCE: HIGH

### Whale Wallet Mentions
- TRIGGER: @lookonchain posts wallet movements
- SIGNAL: Large position change
- ACTION: Cross-reference on-chain data
- CONFIDENCE: MEDIUM-HIGH

### Coordinated Shill Detection
- WARNING: Multiple accounts posting same token <1hr, new accounts, identical hashtags
- ACTION: Flag as potential pump, do NOT follow

## Sentiment Scoring
\`\`\`
score = (positive * weight * recency - negative * weight * recency) / total
weight: Tier 1 = 3x, Tier 2 = 2x, Tier 3 = 1x
recency: <1h = 1.0, <6h = 0.7, <24h = 0.4, >24h = 0.1
\`\`\`

## API Requirements
- TWITTER_BEARER_TOKEN (Twitter API v2)
`,
        isGated: true,
        creatorId: community1.id,
      },
    }),

    // 4. On-Chain Forensics (passive, $3.00)
    prisma.skill.create({
      data: {
        name: "On-Chain Forensics",
        description:
          "Traces fund flows, identifies wallet clusters, and detects suspicious patterns across EVM chains.",
        category: "Security",
        icon: "🔍",
        skillType: "passive",
        gatewaySlug: "onchain-forensics",
        price: 3.0,
        rating: 4.8,
        installs: 2310,
        tags: "forensics,investigation,tracing,wallets,compliance",
        fileType: "markdown",
        fileContent: `# On-Chain Forensics

## Overview
You are a blockchain forensics agent. Trace fund flows, identify wallet clusters, and detect suspicious on-chain activity.

## Core Capabilities

### Transaction Tracing
1. Fetch all outgoing transactions from source
2. Recursively trace each recipient
3. Mark known entities (exchanges, contracts, mixers)
4. Build transaction graph

### Wallet Clustering
Signals: same funding source, consistent timing, same contract interactions, dust consolidation, ENS/social links.
- DEFINITE: Same funding + identical patterns
- LIKELY: 3+ matching signals
- POSSIBLE: 1-2 signals

### Entity Identification
Known databases: Binance/Coinbase/Kraken wallets, protocol treasuries, bridge contracts, Tornado Cash/Railgun, OFAC list.

### Suspicious Patterns
1. Rapid fund splitting (>10 addresses <1hr)
2. Mixer interaction within 24h of large inflow
3. Bridge hopping (>2 chains <6hr)
4. Dormant wallet activation after hack

## Investigation Workflow
\`\`\`
1. Initial Assessment — balance, tx count, first/last activity, labels
2. Transaction Analysis — categorize transfers/swaps/calls, find counterparties
3. Cluster Expansion — apply clustering, expand related addresses
4. Timeline — chronological activity, correlate external events
5. Report — executive summary, cluster map, flow diagram, risk score
\`\`\`

## API Requirements
- ALCHEMY_API_KEY or ETHERSCAN_API_KEY
- Optional: ARKHAM_API_KEY for enhanced labeling
`,
        isGated: true,
        creatorId: platform.id,
      },
    }),

    // 5. Gas Fee Predictor (active, $0.002/call)
    prisma.skill.create({
      data: {
        name: "Gas Fee Predictor",
        description:
          "Predicts optimal gas prices using mempool analysis. Reduces transaction costs by up to 40%.",
        category: "Infra",
        icon: "⛽",
        price: 0.002,
        rating: 4.6,
        installs: 1540,
        tags: "gas,optimization,mempool,eip1559",
        skillType: "active",
        endpointUrl: process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/api/skills-internal/price`
          : "http://localhost:3000/api/skills-internal/price",
        gatewaySlug: "gas-predictor",
        pricePerCall: 0.002,
        fileType: "markdown",
        fileContent: `# Gas Fee Predictor

## Overview
You are a gas optimization agent. Predict optimal gas prices and recommend the best times to execute transactions.

## Supported Chains
Ethereum, Base, Arbitrum, Polygon, Optimism, BSC

## EIP-1559 Model
\`\`\`
Total Fee = (Base Fee + Priority Fee) * Gas Used

Priority by urgency:
  instant:  P90 of recent priority fees
  fast:     P75
  standard: P50
  slow:     P25
\`\`\`

## Gas Estimates by TX Type
- Simple transfer: 21,000
- ERC20 transfer: ~65,000
- Uniswap swap: ~150,000-300,000
- NFT mint: ~100,000-500,000

## Endpoint
POST /v1/predict
\`\`\`json
{ "chain": "ethereum", "urgency": "standard", "tx_type": "swap" }
\`\`\`

Response:
\`\`\`json
{
  "base_fee_gwei": 25.4,
  "priority_fee_gwei": 0.5,
  "max_fee_gwei": 40,
  "estimated_wait_seconds": 24,
  "best_time_today": "03:00-06:00 UTC (30% lower expected)"
}
\`\`\`

## Notes
Free skill. Uses public RPC endpoints. For high-frequency use, provide your own RPC URL.
`,
        isGated: false,
        creatorId: platform.id,
      },
    }),

    // 6. MEV Shield (passive, $2.50)
    prisma.skill.create({
      data: {
        name: "MEV Shield",
        description:
          "Protects transactions from sandwich attacks and front-running using private mempools and intelligent routing.",
        category: "DeFi",
        icon: "🔒",
        skillType: "passive",
        gatewaySlug: "mev-shield",
        price: 2.5,
        rating: 4.5,
        installs: 762,
        tags: "mev,protection,flashbots,sandwich,frontrunning",
        fileType: "markdown",
        fileContent: `# MEV Shield

## Overview
You are an MEV protection agent. Protect user transactions from sandwich attacks, front-running, and other MEV extraction.

## Attack Types

### Sandwich Attack
Attacker front-runs with buy (raises price) → your swap at worse price → attacker back-runs with sell.

### Front-Running
Attacker copies your profitable tx, submits with higher gas, gets included first.

### JIT Liquidity
Attacker adds liquidity before your swap, captures fees, removes after.

## Protection Strategies

### 1. Private Mempool
Submit via Flashbots Protect or MEV Blocker. TX goes directly to block builders, never visible in public mempool.

### 2. Slippage Calculation
\`\`\`
safe_slippage = base_price_impact + sandwich_cost_estimate + 0.1%
Rule: Never set slippage higher than necessary. High slippage = invitation to sandwich.
\`\`\`

### 3. Transaction Simulation
Before submitting: simulate with eth_call, check output matches expectation, simulate with front-run present.

### 4. Intelligent Routing
- Get quotes from multiple DEXs
- Split large trades across venues
- Prefer private/dark pools for size
- Use limit orders when possible

## Decision Matrix
- HIGH MEV risk → Flashbots private submission
- MEDIUM → MEV Blocker
- LOW → Public with tight slippage

## API Requirements
- FLASHBOTS_AUTH_KEY
- RPC with eth_sendPrivateTransaction support
`,
        isGated: true,
        creatorId: platform.id,
      },
    }),

    // 7. Sentiment Analyzer (active, $1.00)
    prisma.skill.create({
      data: {
        name: "Sentiment Analyzer",
        description:
          "Aggregates sentiment from social media, news, and on-chain data to gauge market mood for any token.",
        category: "Analytics",
        icon: "📊",
        price: 1.0,
        rating: 4.4,
        installs: 1203,
        tags: "sentiment,analytics,social,market,signals",
        skillType: "active",
        endpointUrl: process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/api/skills-internal/echo`
          : "http://localhost:3000/api/skills-internal/echo",
        gatewaySlug: "sentiment-analyzer",
        pricePerCall: 0.01,
        fileType: "markdown",
        fileContent: `# Sentiment Analyzer

## Overview
You are a market sentiment analysis agent. Aggregate and interpret signals from multiple sources to provide actionable market intelligence.

## Data Sources
- **Social:** Twitter/X, Reddit, Discord, Telegram
- **News:** CoinDesk, The Block, Decrypt, protocol blogs
- **On-chain:** Active addresses, tx volumes, exchange flows, whale movements

## Scoring Model
\`\`\`python
def calculate_sentiment(token):
    social   = aggregate_social(token)   * 0.40  # 40% weight
    news     = aggregate_news(token)     * 0.25  # 25% weight
    onchain  = calc_onchain(token)       * 0.35  # 35% weight
    score = social + news + onchain  # -100 to +100

    if score > 50:  return "EXTREME_GREED"
    if score > 20:  return "GREED"
    if score > -20: return "NEUTRAL"
    if score > -50: return "FEAR"
    return "EXTREME_FEAR"
\`\`\`

## Endpoint
POST /v1/analyze
\`\`\`json
{ "token": "ETH", "timeframe": "24h" }
\`\`\`

Response:
\`\`\`json
{
  "token": "ETH",
  "score": 42,
  "classification": "GREED",
  "momentum": "+8 (trending up)",
  "breakdown": {
    "social": 55,
    "news": 38,
    "onchain": 35
  },
  "signals": [
    "Exchange outflows suggest accumulation",
    "Social momentum positive and accelerating"
  ]
}
\`\`\`

## API Requirements
- TWITTER_BEARER_TOKEN
- Optional: REDDIT_API_KEY, NANSEN_API_KEY
`,
        isGated: true,
        creatorId: community1.id,
      },
    }),

    // 8. Polymarket Arbitrage (passive, $3.50)
    prisma.skill.create({
      data: {
        name: "Polymarket Arbitrage",
        description:
          "Identifies mispriced prediction market contracts and executes cross-platform arbitrage opportunities.",
        category: "Trading",
        icon: "🎯",
        skillType: "passive",
        gatewaySlug: "polymarket-arbitrage",
        price: 3.5,
        rating: 4.3,
        installs: 445,
        tags: "polymarket,arbitrage,predictions,betting,trading",
        fileType: "markdown",
        fileContent: `# Polymarket Arbitrage

## Overview
You are a prediction market arbitrage agent. Identify mispriced contracts across platforms and execute profitable strategies.

## Supported Platforms
- **Polymarket** (crypto-native, USDC)
- **Kalshi** (US regulated, USD)
- **Manifold** (play money, signal only)

## Arbitrage Types

### Same-Event Cross-Platform
\`\`\`
Polymarket "Event X" Yes = $0.52
Kalshi "Event X" Yes = $0.48

Buy Yes on Kalshi @ $0.48 + Buy No on Polymarket @ $0.48 (1-0.52)
Total cost: $0.96, Guaranteed payout: $1.00, Profit: 4.2%

Only profitable if: profit > (gas + trading fees + slippage)
\`\`\`

### Correlated Events
If P(B|A) from historical data differs significantly from market-implied P(B), there's an edge.

### Multi-Outcome Overround
Sum of all outcome prices > 100% = market's edge. Find markets with lower overround.

## Execution Workflow
1. IDENTIFY — Scan platforms for price discrepancies >2%
2. VALIDATE — Confirm events are equivalent, check settlement rules, verify liquidity
3. SIZE — Max position based on liquidity, account for capital lockup
4. EXECUTE — Simultaneous limit orders on both sides
5. MONITOR — Track until settlement
6. SETTLE — Claim winnings, record P&L

## Risk Management
\`\`\`
MAX_POSITION_PER_EVENT: 5% of portfolio
MAX_PLATFORM_EXPOSURE: 20% of portfolio
MIN_PROFIT_THRESHOLD: 2% after fees
MAX_SETTLEMENT_TIME: 90 days
\`\`\`

## API Requirements
- POLYMARKET_API_KEY
- KALSHI_API_KEY (requires US identity)
`,
        isGated: true,
        creatorId: community1.id,
      },
    }),

    // 9. Token Price Oracle (active, $0.005/call)
    prisma.skill.create({
      data: {
        name: "Token Price Oracle",
        description:
          "Real-time price feeds for any ERC-20 token. Aggregates spot price, TWAP, and 24h change from multiple DEX and CEX sources. Plug-and-play for any agent needing price context.",
        category: "Analytics",
        icon: "💰",
        price: 0.005,
        rating: 4.8,
        installs: 0,
        tags: "price,oracle,token,defi,analytics",
        skillType: "active",
        endpointUrl: process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/api/skills-internal/price`
          : "http://localhost:3000/api/skills-internal/price",
        gatewaySlug: "token-price-oracle",
        pricePerCall: 0.005,
        // --- Profile-driven renderer (2026-04-09) ---
        executionKind: "sync",
        inputShape: "form",
        outputShape: "json",
        estLatencyMs: 800,
        sandboxable: true,
        authRequired: false,
        inputSchema: JSON.stringify({
          type: "object",
          required: ["token"],
          properties: {
            token: {
              type: "string",
              title: "Token Symbol",
              description: "Token ticker (e.g. BNB, ETH, BTC) or contract address",
              default: "BNB",
            },
            chain: {
              type: "string",
              title: "Chain",
              enum: ["bsc", "eth", "base"],
              default: "bsc",
            },
            currency: {
              type: "string",
              title: "Output Currency",
              enum: ["usd", "eur", "jpy"],
              default: "usd",
            },
          },
        }),
        outputSchema: JSON.stringify({
          type: "object",
          properties: {
            token: { type: "string" },
            chain: { type: "string" },
            currency: { type: "string" },
            price_usd: { type: "number" },
            twap_1h: { type: "number" },
            change_24h: { type: "number" },
            source: { type: "string" },
            timestamp: { type: "string", format: "date-time" },
          },
        }),
        exampleInput: JSON.stringify({
          token: "BNB",
          chain: "bsc",
          currency: "usd",
        }),
        exampleOutput: JSON.stringify({
          token: "BNB",
          chain: "bsc",
          currency: "usd",
          price_usd: 312.45,
          twap_1h: 312.14,
          change_24h: 0.0123,
          source: "mock-oracle",
          timestamp: "2026-04-09T12:00:00.000Z",
        }),
        fileType: "markdown",
        fileContent: `# Token Price Oracle

## What it does
Returns real-time price data for any ERC-20 token. Aggregates spot price, TWAP, and 24h change from multiple DEX and CEX sources.

## Usage
\`\`\`
POST /v1/quote
{
  "token": "0x...",    // token address
  "chain": "bsc",      // bsc | eth | base
  "currency": "usd"    // output currency
}
\`\`\`

## Response
\`\`\`json
{
  "token": "0x...",
  "price_usd": 1.0023,
  "twap_1h": 1.0018,
  "change_24h": 0.0031,
  "source": "pancakeswap+binance"
}
\`\`\`

## Use cases
- Agents checking if a trade is profitable
- Portfolio valuation
- Alert triggers on price movement
`,
        isGated: false,
        creatorId: platform.id,
      },
    }),

    // 10. Echo Test (active, $0.001/call — nominal for metering demo)
    prisma.skill.create({
      data: {
        name: "Echo Test",
        description:
          "Minimal active skill for testing agent connectivity and the x402 payment flow. Accepts any payload and echoes it back with a latency timestamp. Use this to verify your agent is correctly calling Dojo skills before integrating real ones.",
        category: "Infra",
        icon: "🔁",
        price: 0.001,
        rating: 5.0,
        installs: 0,
        tags: "test,echo,debug,infra,x402",
        skillType: "active",
        endpointUrl: process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/api/skills-internal/echo`
          : "http://localhost:3000/api/skills-internal/echo",
        gatewaySlug: "echo-test",
        pricePerCall: 0.001,
        // --- Profile-driven renderer (2026-04-09) ---
        executionKind: "sync",
        inputShape: "form",
        outputShape: "json",
        estLatencyMs: 200,
        sandboxable: true,
        authRequired: false,
        inputSchema: JSON.stringify({
          type: "object",
          required: ["message"],
          properties: {
            message: {
              type: "string",
              title: "Message",
              description: "Any text the skill will echo back",
              default: "hello dojo",
            },
            data: {
              type: "string",
              title: "Optional Payload",
              description: "Optional free-form text payload",
            },
          },
        }),
        outputSchema: JSON.stringify({
          type: "object",
          properties: {
            echo: { type: "object" },
            latency_ms: { type: "number" },
            server_ts: { type: "string", format: "date-time" },
          },
        }),
        exampleInput: JSON.stringify({
          message: "hello dojo",
        }),
        exampleOutput: JSON.stringify({
          echo: { message: "hello dojo" },
          latency_ms: 12,
          server_ts: "2026-04-09T12:00:00.000Z",
        }),
        fileType: "markdown",
        fileContent: `# Echo Test

## What it does
Echoes any payload back with a server-side latency timestamp. Use it to verify agent-to-Dojo connectivity and confirm x402 payment headers are being sent correctly.

## Usage
\`\`\`
POST /v1/echo
{
  "message": "hello",
  "data": { "any": "payload" }
}
\`\`\`

## Response
\`\`\`json
{
  "echo": {
    "message": "hello",
    "data": { "any": "payload" }
  },
  "latency_ms": 12,
  "server_ts": "2026-04-07T00:00:00Z"
}
\`\`\`

## Use this to
- Verify your agent can hit a Dojo skill endpoint
- Test x402 payment headers end-to-end
- Measure round-trip latency from your agent to Dojo
`,
        isGated: false,
        creatorId: platform.id,
      },
    }),

    // 11. Knowledge Wiki Generator (passive, FREE)
    prisma.skill.create({
      data: {
        name: "Knowledge Wiki Generator",
        description:
          "Transforms raw notes, documents, and conversations into a structured personal wiki. Theme-driven atomic entries with [[wikilinks]] so knowledge compounds over time. Writer-not-filer philosophy: you capture, the wiki connects.",
        category: "Productivity",
        icon: "📚",
        skillType: "passive",
        gatewaySlug: "knowledge-wiki-generator",
        price: 0.0,
        rating: 4.9,
        installs: 0,
        tags: "wiki,knowledge,notes,productivity,writing",
        fileType: "markdown",
        fileContent: `# Knowledge Wiki Generator

A skill for building a compounding personal knowledge base. Theme-driven, atomic-entry format with [[wikilinks]].

**Philosophy:** Writer-not-filer. Capture raw, the wiki connects structure.

## Commands

### /wiki ingest <source>
Absorbs a document, conversation, or URL into the pipeline. Extracts key concepts, generates atomic entries, links to existing nodes.

### /wiki absorb
Processes the ingest queue. Converts raw captures into structured wiki entries with themes and [[wikilinks]].

### /wiki query <question>
Semantic search across the wiki. Returns matching entries with their connections and the reasoning path.

### /wiki cleanup
Audits for orphaned entries, duplicate concepts, and stale nodes. Suggests merges and pruning.

### /wiki breakdown <topic>
Decomposes a broad topic into atomic sub-entries. One entry = one concept, no more.

### /wiki rebuild-index
Regenerates the master index of all themes, entry titles, and the [[wikilink]] graph.

## Entry format
\`\`\`markdown
## <Concept Title>
<One clear sentence defining the concept.>

**Why it matters:** <connection to practice>
**Related:** [[linked-concept-1]] [[linked-concept-2]]
**Source:** <origin document or date>
\`\`\`

## Principles
- Atomic: one entry = one concept
- Linked: every entry connects to at least one other
- Themed: cluster by concept, not by date
- Compounding: the wiki gets more useful with every capture
`,
        isGated: false,
        creatorId: platform.id,
      },
    }),
  ]);

  // --- Agents ---
  const ronin = await prisma.agent.create({
    data: {
      name: "Ronin",
      description:
        "Autonomous DeFi strategist. Scans 12 protocols, optimizes yield, shields from MEV. 1,247 jobs completed with 99.2% success rate.",
      avatar: "🥷",
      rank: "Tatsujin 達人",
      xp: 12470,
      jobsCompleted: 1247,
      successRate: 99.2,
      totalEarnings: 34.2,
      earningsCurrency: "ETH",
      ownerId: platform.id,
      walletAddress: "0x046aB9D6aC4EA10C42501ad89D9a741115A76Fa9", // relayer wallet (testnet)
    },
  });
  const sentinel = await prisma.agent.create({
    data: {
      name: "Sentinel",
      description:
        "Security-focused agent. Audits contracts, traces suspicious transactions, monitors social sentiment for rug signals.",
      avatar: "🦅",
      rank: "Senpai 先輩",
      xp: 6340,
      jobsCompleted: 634,
      successRate: 97.8,
      totalEarnings: 18.7,
      earningsCurrency: "ETH",
      ownerId: platform.id,
    },
  });
  const oracle = await prisma.agent.create({
    data: {
      name: "Oracle",
      description:
        "Market intelligence agent. Finds alpha from Twitter, analyzes sentiment, and executes on prediction markets.",
      avatar: "🔮",
      rank: "Senpai 先輩",
      xp: 8920,
      jobsCompleted: 892,
      successRate: 95.1,
      totalEarnings: 21.4,
      earningsCurrency: "ETH",
      ownerId: platform.id,
    },
  });

  // --- Equip skills ---
  // Ronin: Yield Optimizer, Gas Predictor, MEV Shield, Forensics
  await prisma.agentSkill.createMany({
    data: [
      { agentId: ronin.id, skillId: skills[0].id },
      { agentId: ronin.id, skillId: skills[4].id },
      { agentId: ronin.id, skillId: skills[5].id },
      { agentId: ronin.id, skillId: skills[3].id },
    ],
  });
  // Sentinel: Auditor, Forensics, Sentiment
  await prisma.agentSkill.createMany({
    data: [
      { agentId: sentinel.id, skillId: skills[1].id },
      { agentId: sentinel.id, skillId: skills[3].id },
      { agentId: sentinel.id, skillId: skills[6].id },
    ],
  });
  // Oracle: Twitter Alpha, Sentiment, Polymarket, Yield, Gas
  await prisma.agentSkill.createMany({
    data: [
      { agentId: oracle.id, skillId: skills[2].id },
      { agentId: oracle.id, skillId: skills[6].id },
      { agentId: oracle.id, skillId: skills[7].id },
      { agentId: oracle.id, skillId: skills[0].id },
      { agentId: oracle.id, skillId: skills[4].id },
    ],
  });

  // --- Reviews ---
  await prisma.review.createMany({
    data: [
      {
        rating: 5,
        comment:
          "Best yield optimizer I've used. Found 12% APY on Aave that I missed.",
        userId: buyer1.id,
        skillId: skills[0].id,
      },
      {
        rating: 5,
        comment:
          "Caught a reentrancy bug that Slither missed. Worth every penny.",
        userId: buyer1.id,
        skillId: skills[1].id,
      },
      {
        rating: 4,
        comment:
          "Good alpha signals but sometimes slow during high-traffic events.",
        userId: buyer1.id,
        skillId: skills[2].id,
      },
      {
        rating: 5,
        comment:
          "Saved me from a sandwich attack on a 50 ETH swap. Paid for itself instantly.",
        userId: buyer1.id,
        skillId: skills[5].id,
      },
      {
        rating: 5,
        comment:
          "Ronin managed my DeFi positions for a month. Zero incidents, consistent yield.",
        userId: buyer1.id,
        agentId: ronin.id,
      },
      {
        rating: 4,
        comment:
          "Sentinel found 3 critical issues in our audit. Thorough but slow on large codebases.",
        userId: buyer1.id,
        agentId: sentinel.id,
      },
    ],
  });

  // --- Jobs ---
  await prisma.job.createMany({
    data: [
      {
        title: "Optimize yield across L2s",
        description: "Find best yield for 10 ETH across Base and Arbitrum",
        status: "completed",
        payment: 0.05,
        currency: "ETH",
        rating: 5,
        agentId: ronin.id,
        completedAt: new Date(),
      },
      {
        title: "Audit token contract",
        description: "Full security audit of ERC-20 with custom mechanics",
        status: "completed",
        payment: 0.12,
        currency: "ETH",
        rating: 5,
        agentId: sentinel.id,
        completedAt: new Date(),
      },
      {
        title: "Market sentiment report",
        description: "Weekly alpha report for top 20 tokens",
        status: "completed",
        payment: 0.03,
        currency: "ETH",
        rating: 4,
        agentId: oracle.id,
        completedAt: new Date(),
      },
      {
        title: "MEV protection for swap",
        description: "Route 50 ETH swap through private mempool",
        status: "completed",
        payment: 0.02,
        currency: "ETH",
        rating: 5,
        agentId: ronin.id,
        completedAt: new Date(),
      },
    ],
  });

  console.log("✅ Seed complete — SKILL.md + endpoint format");
  console.log("   - 3 users (platform + community + buyer)");
  console.log("   - 11 skills (SKILL.md as fileContent):");
  console.log("     1.  DeFi Yield Optimizer      (passive, $2.00)");
  console.log("     2.  Smart Contract Auditor    (passive, $5.00)");
  console.log("     3.  Twitter Alpha Scanner     (passive, $1.50)");
  console.log("     4.  On-Chain Forensics        (passive, $3.00)");
  console.log("     5.  Gas Fee Predictor         (active,  FREE)");
  console.log("     6.  MEV Shield                (passive, $2.50)");
  console.log("     7.  Sentiment Analyzer        (active,  $1.00)");
  console.log("     8.  Polymarket Arbitrage      (passive, $3.50)");
  console.log("     9.  Token Price Oracle        (active,  FREE)");
  console.log("    10.  Echo Test                 (active,  FREE)");
  console.log("    11.  Knowledge Wiki Generator  (passive, FREE)");
  console.log("   - 3 agents + skills equipped");
  console.log("   - 6 reviews + 4 jobs");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
