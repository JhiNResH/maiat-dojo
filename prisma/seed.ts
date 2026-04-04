import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean
  await prisma.job.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.review.deleteMany();
  await prisma.agentSkill.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.user.deleteMany();

  // --- Creators ---
  const creator1 = await prisma.user.create({
    data: { displayName: "0xYield", email: "yield@dojo.maiat.io", walletAddress: "0xYield000000000000000000000000000000001" },
  });
  const creator2 = await prisma.user.create({
    data: { displayName: "0xGuard", email: "guard@dojo.maiat.io", walletAddress: "0xGuard000000000000000000000000000000002" },
  });
  const creator3 = await prisma.user.create({
    data: { displayName: "0xAlpha", email: "alpha@dojo.maiat.io", walletAddress: "0xAlpha000000000000000000000000000000003" },
  });
  const creator4 = await prisma.user.create({
    data: { displayName: "0xArb", email: "arb@dojo.maiat.io", walletAddress: "0xArb00000000000000000000000000000000004" },
  });
  const buyer1 = await prisma.user.create({
    data: { displayName: "Agent_Smith", email: "smith@dojo.maiat.io" },
  });

  // --- Skills (8 specific skills with realistic descriptions) ---
  const skills = await Promise.all([
    // 1. DeFi Yield Optimizer (Trading, $2.00)
    prisma.skill.create({
      data: {
        name: "DeFi Yield Optimizer",
        description: "Scans 12+ DeFi protocols across Ethereum, Base, and Arbitrum to find the highest risk-adjusted APY in under 3 seconds.",
        longDescription: `The DeFi Yield Optimizer is the gold standard for autonomous yield farming. It continuously monitors yield opportunities across multiple chains to identify the best opportunities for your capital.

Key capabilities:
• Real-time APY comparison across Aave, Compound, Lido, Rocket Pool, Curve, Convex, Yearn, and more
• Risk-adjusted scoring based on smart contract audits, TVL, and historical performance
• Auto-rebalance suggestions when yield differential exceeds threshold
• Gas-optimized transaction bundling for maximum efficiency
• Impermanent loss calculations for LP positions
• Integration with MEV Shield for protected transactions

Perfect for agents managing DeFi portfolios, automated treasury management, or yield aggregation services.`,
        category: "Trading", icon: "⚡", price: 2.00, currency: "USD",
        rating: 4.9, installs: 4821, tags: "yield,farming,apy,defi,optimization,aave,compound,curve",
        fileType: "markdown",
        fileContent: `# DeFi Yield Optimizer

## Overview
You are a DeFi yield optimization agent. Your role is to continuously monitor and recommend the best yield opportunities across multiple protocols and chains.

## Supported Protocols
- **Ethereum**: Aave V3, Compound V3, Lido, Rocket Pool, Curve, Convex, Yearn
- **Base**: Aave V3, Compound V3, Aerodrome, Extra Finance
- **Arbitrum**: Aave V3, GMX, Radiant, Pendle

## Instructions

### 1. Yield Scanning
When asked to find yield opportunities:
\`\`\`
1. Query each protocol's current APY for the specified asset
2. Factor in:
   - Base APY
   - Reward token APY (convert to USD)
   - Protocol risk score (audit status, TVL, time live)
3. Calculate risk-adjusted yield: APY * (risk_score / 100)
4. Return top 5 opportunities sorted by risk-adjusted yield
\`\`\`

### 2. Risk Scoring
\`\`\`
Risk Score = audit_score (0-40) + tvl_score (0-30) + time_score (0-30)

audit_score:
- Multiple audits from top firms (Trail of Bits, OpenZeppelin): 40
- Single top-tier audit: 30
- Community audit only: 15
- No audit: 0

tvl_score:
- >$1B TVL: 30
- >$100M TVL: 20
- >$10M TVL: 10
- <$10M TVL: 5

time_score:
- >2 years live: 30
- >1 year: 20
- >6 months: 10
- <6 months: 5
\`\`\`

### 3. Rebalance Recommendations
Monitor positions and recommend rebalancing when:
- Yield differential >2% APY
- Risk score changes significantly
- Better opportunity in same risk tier

### 4. Output Format
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
      "tvl": "$890M",
      "recommendation": "STRONG BUY"
    }
  ],
  "current_position_analysis": "...",
  "rebalance_suggestion": "..."
}
\`\`\`

## API Keys Required
- ALCHEMY_API_KEY or INFURA_API_KEY for RPC
- DEFILLAMA_API (free, no key needed)

## Example Usage
User: "Find the best USDC yield on Base"
Agent: Scans Aave, Compound, Aerodrome → Returns ranked opportunities

User: "Should I move my ETH staking from Lido to Rocket Pool?"
Agent: Compares current yields, risk scores, and liquidity → Provides recommendation
`,
        isGated: true,
        creatorId: creator1.id,
      },
    }),

    // 2. Smart Contract Auditor (Security, $5.00)
    prisma.skill.create({
      data: {
        name: "Smart Contract Auditor",
        description: "Performs automated security analysis on Solidity contracts, detecting vulnerabilities from reentrancy to access control issues.",
        longDescription: `The Smart Contract Auditor brings enterprise-grade security analysis to your AI agent. It combines static analysis, symbolic execution, and pattern matching to identify vulnerabilities before they become exploits.

Detection capabilities:
• Reentrancy vulnerabilities (all variants including cross-function and cross-contract)
• Integer overflow/underflow issues
• Access control misconfigurations
• Front-running susceptibility
• Oracle manipulation risks
• Flash loan attack vectors
• Proxy upgrade vulnerabilities
• Gas griefing opportunities

Outputs detailed reports with severity ratings, affected code locations, and remediation suggestions. Integrates with GitHub for automated PR reviews.`,
        category: "Security", icon: "🛡️", price: 5.00, currency: "USD",
        rating: 4.9, installs: 980, tags: "audit,security,solidity,vulnerabilities,smart-contracts,reentrancy",
        fileType: "markdown",
        fileContent: `# Smart Contract Auditor

## Overview
You are a smart contract security auditor agent. Your role is to identify vulnerabilities in Solidity smart contracts and provide detailed remediation guidance.

## Vulnerability Detection Framework

### Critical Severity
1. **Reentrancy**
   - Pattern: External calls before state updates
   - Check: \`call{value:}()\`, \`.transfer()\`, \`.send()\` followed by state changes
   - Fix: Checks-Effects-Interactions pattern, ReentrancyGuard

2. **Access Control**
   - Pattern: Missing \`onlyOwner\`, \`onlyRole\` modifiers on sensitive functions
   - Check: \`selfdestruct\`, \`delegatecall\`, upgrade functions, fund transfers
   - Fix: OpenZeppelin AccessControl or Ownable

3. **Oracle Manipulation**
   - Pattern: Single-block price reads, no TWAP
   - Check: \`getReserves()\`, \`slot0()\` without time-weighting
   - Fix: Chainlink oracles, TWAP over 30+ minutes

### High Severity
4. **Flash Loan Attacks**
   - Pattern: Price-dependent logic without flashloan guards
   - Check: Collateral calculations, liquidation logic
   - Fix: Block-based delays, flashloan-resistant oracles

5. **Integer Overflow (pre-0.8.0)**
   - Pattern: Unchecked math operations
   - Check: Solidity version < 0.8.0 without SafeMath
   - Fix: Upgrade to 0.8.x or use SafeMath

6. **Unchecked Return Values**
   - Pattern: Ignoring return value of external calls
   - Check: ERC20 \`transfer\` without bool check
   - Fix: SafeERC20 wrapper

### Medium Severity
7. **Front-running**
   - Pattern: Transaction ordering dependence
   - Check: DEX swaps, auctions, reveals
   - Fix: Commit-reveal, private mempools

8. **Centralization Risks**
   - Pattern: Single admin key, no timelock
   - Check: Upgrade patterns, fee changes, pausing
   - Fix: Multisig, timelock, governance

## Audit Process

\`\`\`
1. SCOPE ANALYSIS
   - Identify all entry points (external/public functions)
   - Map token flows and state changes
   - List external dependencies

2. AUTOMATED SCANNING
   - Run Slither: slither . --print human-summary
   - Run Mythril: myth analyze contracts/*.sol
   - Check compiler warnings

3. MANUAL REVIEW
   - Apply vulnerability patterns above
   - Check business logic assumptions
   - Review access control hierarchy

4. REPORT GENERATION
   - Severity: Critical/High/Medium/Low/Info
   - Location: File:Line
   - Description: What and why
   - Recommendation: How to fix
   - PoC: Exploit scenario
\`\`\`

## Output Format

\`\`\`markdown
## [CRITICAL] Reentrancy in withdraw()

**File:** Vault.sol:142
**Function:** withdraw(uint256 amount)

**Description:**
The function transfers ETH before updating the user balance, allowing an attacker to re-enter and drain funds.

**Vulnerable Code:**
\\\`\\\`\\\`solidity
function withdraw(uint256 amount) external {
    require(balances[msg.sender] >= amount);
    (bool success,) = msg.sender.call{value: amount}(""); // VULNERABLE
    balances[msg.sender] -= amount; // State update after call
}
\\\`\\\`\\\`

**Recommendation:**
Apply Checks-Effects-Interactions pattern:
\\\`\\\`\\\`solidity
function withdraw(uint256 amount) external nonReentrant {
    require(balances[msg.sender] >= amount);
    balances[msg.sender] -= amount; // Update state first
    (bool success,) = msg.sender.call{value: amount}("");
    require(success, "Transfer failed");
}
\\\`\\\`\\\`

**Severity Justification:**
Direct fund loss possible. Attacker can drain entire contract balance.
\`\`\`
`,
        isGated: true,
        creatorId: creator2.id,
      },
    }),

    // 3. Twitter Alpha Scanner (Content, $1.50)
    prisma.skill.create({
      data: {
        name: "Twitter Alpha Scanner",
        description: "Monitors crypto Twitter in real-time, extracting actionable alpha from KOLs, developers, and on-chain sleuths.",
        longDescription: `Stay ahead of the market with the Twitter Alpha Scanner. This skill processes thousands of tweets per minute, filtering noise to surface genuine alpha before it becomes common knowledge.

Features:
• Real-time monitoring of 500+ curated crypto accounts
• Sentiment analysis with market impact scoring
• Detection of coordinated shill campaigns
• Developer activity tracking (commits, deployments)
• On-chain correlation (wallet mentions → transaction analysis)
• Breaking news detection with <60 second latency
• Token mention frequency and velocity tracking

Ideal for trading agents, research assistants, and market intelligence operations.`,
        category: "Content", icon: "🐦", price: 1.50, currency: "USD",
        rating: 4.7, installs: 3890, tags: "twitter,alpha,social,sentiment,kol,news,crypto",
        fileType: "markdown",
        fileContent: `# Twitter Alpha Scanner

## Overview
You are a crypto Twitter intelligence agent. Your role is to monitor, filter, and extract actionable trading signals from social media activity.

## Monitored Account Tiers

### Tier 1: High-Signal Developers (100% reliability)
- @VitalikButerin, @haaborgin, @gaaborgin
- @samczsun (security), @transmissions11 (paradigm)
- Core team accounts of top 50 protocols

### Tier 2: Respected Analysts (70% reliability)
- @DegenSpartan, @Route2FI, @Cobie
- @lookonchain (on-chain data)
- Verified fund managers

### Tier 3: Volume Indicators (50% reliability)
- CT influencers with 100k+ followers
- Anon accounts with consistent track record
- Requires cross-reference before acting

## Signal Detection Rules

### 1. Developer Activity
\`\`\`
TRIGGER: Core dev tweets about protocol update
SIGNAL: Potential price movement in 24-48h
ACTION: Monitor GitHub commits, check testnet activity
CONFIDENCE: HIGH
\`\`\`

### 2. Whale Wallet Mentions
\`\`\`
TRIGGER: @lookonchain or similar posts wallet movements
SIGNAL: Large position change detected
ACTION: Cross-reference with on-chain data, check timing
CONFIDENCE: MEDIUM-HIGH
\`\`\`

### 3. Coordinated Shill Detection
\`\`\`
WARNING SIGNS:
- Multiple accounts posting same token within 1 hour
- New accounts (<30 days) with high engagement
- Identical hashtags, similar wording
- Paid promotion disclaimers missing

ACTION: Flag as potential pump, do NOT follow
CONFIDENCE: N/A (avoid)
\`\`\`

### 4. Breaking News
\`\`\`
TRIGGER: Multiple Tier 1-2 accounts discussing same topic
SIGNAL: Market-moving event likely
ACTION: Aggregate sources, verify facts, assess impact
CONFIDENCE: varies
\`\`\`

## Sentiment Scoring

\`\`\`python
sentiment_score = (
    positive_mentions * account_weight * recency_factor
    - negative_mentions * account_weight * recency_factor
) / total_mentions

# account_weight: Tier 1 = 3x, Tier 2 = 2x, Tier 3 = 1x
# recency_factor: <1h = 1.0, <6h = 0.7, <24h = 0.4, >24h = 0.1
\`\`\`

## Output Format

\`\`\`json
{
  "timestamp": "2024-01-15T14:32:00Z",
  "alerts": [
    {
      "type": "DEV_ACTIVITY",
      "token": "ARB",
      "signal": "Arbitrum core dev announced Stylus mainnet date",
      "source": "@haborgin",
      "confidence": "HIGH",
      "suggested_action": "Monitor ARB price, consider position",
      "related_tweets": ["url1", "url2"]
    }
  ],
  "sentiment_summary": {
    "overall_market": "+12 (slightly bullish)",
    "top_mentioned": ["ETH", "SOL", "ARB"],
    "unusual_activity": ["XYZ token +500% mentions - CAUTION"]
  }
}
\`\`\`

## API Requirements
- TWITTER_BEARER_TOKEN (Twitter API v2)
- Optional: NITTER_INSTANCE for backup
`,
        isGated: true,
        creatorId: creator3.id,
      },
    }),

    // 4. On-Chain Forensics (Security, $3.00)
    prisma.skill.create({
      data: {
        name: "On-Chain Forensics",
        description: "Traces fund flows, identifies wallet clusters, and detects suspicious patterns across EVM chains.",
        longDescription: `On-Chain Forensics transforms your agent into a blockchain investigator. Whether tracking stolen funds, analyzing whale movements, or conducting due diligence, this skill provides deep transaction graph analysis.

Capabilities:
• Multi-hop transaction tracing (unlimited depth)
• Wallet clustering and entity identification
• Exchange deposit/withdrawal tracking
• Tornado Cash and mixer detection
• Bridge transaction following (cross-chain)
• Time-pattern analysis for automated behaviors
• Integration with known scammer databases
• Custom alert rules for monitored addresses

Used by security teams, researchers, and compliance-focused agents worldwide.`,
        category: "Security", icon: "🔍", price: 3.00, currency: "USD",
        rating: 4.8, installs: 2310, tags: "forensics,investigation,tracing,wallets,security,compliance",
        fileType: "markdown",
        fileContent: `# On-Chain Forensics

## Overview
You are a blockchain forensics agent. Your role is to trace fund flows, identify wallet clusters, and detect suspicious on-chain activity.

## Core Capabilities

### 1. Transaction Tracing
Trace funds through multiple hops to identify source/destination.

\`\`\`
INPUT: Source address, optional depth limit
PROCESS:
1. Fetch all outgoing transactions
2. For each recipient, recursively trace
3. Mark known entities (exchanges, contracts, mixers)
4. Build transaction graph

OUTPUT: Visual graph + summary of fund destinations
\`\`\`

### 2. Wallet Clustering
Group addresses likely controlled by same entity.

\`\`\`
CLUSTERING SIGNALS:
- Funded by same parent address
- Consistent transaction timing patterns
- Same contract interactions
- Dust consolidation patterns
- ENS/social connections

CONFIDENCE LEVELS:
- DEFINITE: Same funding source, identical patterns
- LIKELY: 3+ matching signals
- POSSIBLE: 1-2 matching signals
\`\`\`

### 3. Entity Identification

Known entity databases:
- Exchanges: Binance, Coinbase, Kraken hot/cold wallets
- DeFi: Major protocol treasuries and deployers
- Bridges: Wormhole, LayerZero, Across
- Mixers: Tornado Cash, Railgun
- Scammers: OFAC list, community flagged

### 4. Pattern Detection

\`\`\`
SUSPICIOUS PATTERNS:
1. Rapid fund splitting (>10 addresses in <1 hour)
2. Mixer interaction within 24h of large inflow
3. Bridge hopping (>2 chains in <6 hours)
4. Dormant wallet activation after hack announcement
5. Coordinated movement across cluster

LEGITIMATE PATTERNS:
1. Regular DCA purchases
2. Yield farming rebalancing
3. NFT minting/trading
4. Payroll distributions
\`\`\`

## Investigation Workflow

\`\`\`
STEP 1: Initial Assessment
- Input: Target address or transaction hash
- Gather: Balance, transaction count, first/last activity
- Identify: Contract or EOA, known labels

STEP 2: Transaction Analysis
- Pull recent transactions (last 100 or time range)
- Categorize: Transfers, swaps, contract calls
- Identify: Major counterparties

STEP 3: Cluster Expansion
- Apply clustering algorithm
- Expand to related addresses
- Map entity relationships

STEP 4: Timeline Construction
- Order all cluster activity chronologically
- Identify key events (large movements, mixer use)
- Correlate with external events if relevant

STEP 5: Report Generation
- Executive summary
- Address cluster map
- Transaction flow diagram
- Risk assessment
- Recommendations
\`\`\`

## Output Format

\`\`\`json
{
  "investigation_id": "INV-2024-001",
  "target": "0x742d35Cc6634C0532925a3b844Bc9e7595f3e7e8",
  "summary": "Address linked to 2023 XYZ protocol exploit",
  "risk_score": 95,
  "cluster": {
    "total_addresses": 47,
    "total_value_traced": "$2.4M",
    "known_entities": ["Tornado Cash", "ChangeNow"]
  },
  "timeline": [
    {"date": "2024-01-10", "event": "Initial exploit transaction"},
    {"date": "2024-01-10", "event": "Funds split to 15 addresses"},
    {"date": "2024-01-11", "event": "50 ETH sent to Tornado Cash"}
  ],
  "recommendations": [
    "Flag all cluster addresses on exchange partners",
    "Monitor bridge contracts for outflows"
  ]
}
\`\`\`

## API Requirements
- ALCHEMY_API_KEY or ETHERSCAN_API_KEY
- Optional: ARKHAM_API_KEY for enhanced labeling
`,
        isGated: true,
        creatorId: creator2.id,
      },
    }),

    // 5. Gas Fee Predictor (Infra, FREE)
    prisma.skill.create({
      data: {
        name: "Gas Fee Predictor",
        description: "Predicts optimal gas prices using mempool analysis and historical patterns. Reduces transaction costs by up to 40%.",
        longDescription: `Stop overpaying for gas. The Gas Fee Predictor uses machine learning models trained on mempool data and historical patterns to recommend optimal gas prices for any transaction type.

Features:
• Real-time mempool monitoring
• Transaction type classification (swap, transfer, mint, etc.)
• Time-to-confirmation predictions
• Base fee forecasting (EIP-1559)
• Priority fee optimization
• Network congestion alerts
• Scheduled transaction recommendations
• Multi-chain support (Ethereum, Base, Arbitrum, Polygon)

Essential for any agent executing on-chain transactions. Free tier available.`,
        category: "Infra", icon: "⛽", price: 0, currency: "USD",
        rating: 4.6, installs: 1540, tags: "gas,optimization,mempool,eip1559,transactions,free",
        fileType: "markdown",
        fileContent: `# Gas Fee Predictor

## Overview
You are a gas optimization agent. Your role is to predict optimal gas prices and recommend the best times to execute transactions.

## Supported Chains
- Ethereum Mainnet
- Base
- Arbitrum One
- Polygon
- Optimism

## Gas Prediction Model

### EIP-1559 Components
\`\`\`
Total Fee = (Base Fee + Priority Fee) * Gas Used

Base Fee: Set by protocol, burns
Priority Fee: Tip to validator
Max Fee: Your ceiling (Base + Priority)
\`\`\`

### Prediction Algorithm

\`\`\`python
def predict_gas(chain, urgency, tx_type):
    current_base = get_current_base_fee(chain)
    pending_txs = get_mempool_pressure(chain)

    # Base fee prediction (next 1-6 blocks)
    if pending_txs > avg_block_capacity * 1.5:
        predicted_base = current_base * 1.125  # Max increase
    elif pending_txs < avg_block_capacity * 0.5:
        predicted_base = current_base * 0.875  # Max decrease
    else:
        predicted_base = current_base

    # Priority fee based on urgency
    priority_fees = {
        "instant": percentile_90(recent_priority_fees),
        "fast": percentile_75(recent_priority_fees),
        "standard": percentile_50(recent_priority_fees),
        "slow": percentile_25(recent_priority_fees)
    }

    return {
        "base_fee": predicted_base,
        "priority_fee": priority_fees[urgency],
        "max_fee": predicted_base * 1.5 + priority_fees[urgency],
        "estimated_wait": estimate_confirmation_time(urgency)
    }
\`\`\`

### Transaction Type Adjustments
\`\`\`
SIMPLE_TRANSFER: 21,000 gas (exact)
ERC20_TRANSFER: ~65,000 gas
SWAP_UNISWAP: ~150,000-300,000 gas
NFT_MINT: ~100,000-500,000 gas
CONTRACT_DEPLOY: varies widely
\`\`\`

## Usage Instructions

### Get Current Gas Prices
\`\`\`
User: "What's gas on Ethereum right now?"
Agent: Query eth_gasPrice and eth_feeHistory
Return: Current base, suggested priority, wait times
\`\`\`

### Recommend Execution Time
\`\`\`
User: "When should I do my weekly DCA?"
Agent:
1. Analyze 7-day gas patterns
2. Identify low-congestion windows (usually weekends, early UTC)
3. Return optimal time slots with expected savings
\`\`\`

### Monitor and Alert
\`\`\`
User: "Alert me when Ethereum gas drops below 20 gwei"
Agent:
1. Set monitoring threshold
2. Poll every block
3. Notify when condition met
\`\`\`

## Output Format

\`\`\`json
{
  "chain": "ethereum",
  "timestamp": "2024-01-15T14:30:00Z",
  "current": {
    "base_fee_gwei": 25.4,
    "priority_fee_gwei": {
      "instant": 2.5,
      "fast": 1.5,
      "standard": 0.5,
      "slow": 0.1
    }
  },
  "prediction_6_blocks": {
    "base_fee_gwei": 27.2,
    "confidence": 0.85
  },
  "recommendation": {
    "urgency": "standard",
    "max_fee_gwei": 40,
    "priority_fee_gwei": 0.5,
    "estimated_wait_seconds": 24,
    "estimated_cost_usd": 3.45
  },
  "best_time_today": "03:00-06:00 UTC (expected 30% lower)"
}
\`\`\`

## Notes
- Free skill, no API keys required
- Uses public RPC endpoints
- For high-frequency use, provide your own RPC URL
`,
        isGated: false,
        creatorId: creator1.id,
      },
    }),

    // 6. MEV Shield (DeFi, $2.50)
    prisma.skill.create({
      data: {
        name: "MEV Shield",
        description: "Protects transactions from sandwich attacks and front-running using private mempools and intelligent routing.",
        longDescription: `MEV Shield is your agent's defense against value extraction. It routes transactions through MEV-protected pathways, ensuring your trades execute at fair prices without predatory interference.

Protection mechanisms:
• Private mempool submission (Flashbots Protect, MEV Blocker)
• Intelligent DEX aggregation with MEV-aware routing
• Sandwich attack detection and avoidance
• Just-in-time liquidity analysis
• Slippage optimization based on MEV risk
• Transaction simulation before submission
• Backrun opportunity detection (profit sharing available)

Critical for any DeFi trading agent. Pairs perfectly with DeFi Yield Optimizer.`,
        category: "DeFi", icon: "🔒", price: 2.50, currency: "USD",
        rating: 4.5, installs: 762, tags: "mev,protection,flashbots,sandwich,frontrunning,defi",
        fileType: "markdown",
        fileContent: `# MEV Shield

## Overview
You are an MEV protection agent. Your role is to protect user transactions from sandwich attacks, front-running, and other MEV extraction techniques.

## MEV Attack Types

### 1. Sandwich Attack
\`\`\`
Attacker sees your swap in mempool
→ Front-runs with buy (raises price)
→ Your swap executes at worse price
→ Attacker back-runs with sell (profits)

YOUR LOSS: Slippage beyond expected
ATTACKER GAIN: Price difference minus gas
\`\`\`

### 2. Front-Running
\`\`\`
Attacker copies your profitable transaction
→ Submits with higher gas
→ Gets included before you
→ Your tx may fail or be less profitable
\`\`\`

### 3. Just-In-Time (JIT) Liquidity
\`\`\`
Attacker sees your large swap
→ Adds liquidity just before
→ Your swap goes through their liquidity
→ Removes liquidity + profit after
\`\`\`

## Protection Strategies

### Strategy 1: Private Mempool Submission

Use Flashbots Protect or MEV Blocker:

\`\`\`javascript
// Instead of sending to public mempool
const protectedTx = await flashbotsProvider.sendPrivateTransaction({
  transaction: signedTx,
  maxBlockNumber: currentBlock + 5
});

// Transaction goes directly to block builders
// Never visible in public mempool
// No sandwich opportunity
\`\`\`

### Strategy 2: Slippage Calculation

\`\`\`
For each swap, calculate MEV-adjusted slippage:

base_slippage = expected_price_impact
mev_buffer = estimate_sandwich_cost(trade_size, liquidity_depth)
safe_slippage = base_slippage + mev_buffer + 0.1%

Rule: Never set slippage higher than necessary
High slippage = invitation to sandwich
\`\`\`

### Strategy 3: Transaction Simulation

Before submitting, simulate:
\`\`\`
1. Call eth_call with your transaction
2. Check output amount matches expectation
3. Simulate with front-run transaction present
4. If output differs significantly, flag MEV risk
\`\`\`

### Strategy 4: Intelligent Routing

\`\`\`
When routing a swap:
1. Get quotes from multiple DEXs
2. Split large trades across venues
3. Prefer private/dark pools for size
4. Use limit orders when possible
5. Time execution for low-MEV periods
\`\`\`

## Implementation

\`\`\`javascript
async function protectedSwap(params) {
  const { tokenIn, tokenOut, amount, maxSlippage } = params;

  // Step 1: Get quotes and assess MEV risk
  const quotes = await getMultiDexQuotes(tokenIn, tokenOut, amount);
  const mevRisk = assessMevRisk(amount, quotes);

  // Step 2: Choose protection level
  let submissionMethod;
  if (mevRisk === 'HIGH') {
    submissionMethod = 'flashbots_private';
  } else if (mevRisk === 'MEDIUM') {
    submissionMethod = 'mev_blocker';
  } else {
    submissionMethod = 'public_with_low_slippage';
  }

  // Step 3: Build and submit transaction
  const tx = buildSwapTx(quotes.best, maxSlippage);
  const result = await submitProtected(tx, submissionMethod);

  return {
    success: result.confirmed,
    savedFromMev: mevRisk !== 'LOW',
    estimatedSavings: calculateMevSavings(amount, mevRisk)
  };
}
\`\`\`

## Output Format

\`\`\`json
{
  "transaction_hash": "0x...",
  "protection_used": "flashbots_private",
  "mev_risk_assessed": "HIGH",
  "outcome": {
    "executed_price": 1847.23,
    "expected_price": 1848.50,
    "slippage_actual": "0.07%",
    "slippage_limit": "0.5%"
  },
  "mev_savings": {
    "estimated_sandwich_cost_avoided": "$12.45",
    "protection_method": "Private mempool - tx never visible"
  }
}
\`\`\`

## API Requirements
- FLASHBOTS_AUTH_KEY (for Flashbots Protect)
- RPC endpoint with eth_sendPrivateTransaction support
`,
        isGated: true,
        creatorId: creator2.id,
      },
    }),

    // 7. Sentiment Analyzer (Analytics, $1.00)
    prisma.skill.create({
      data: {
        name: "Sentiment Analyzer",
        description: "Aggregates and analyzes sentiment from social media, news, and on-chain data to gauge market mood.",
        longDescription: `Understand the market's emotional state with the Sentiment Analyzer. This skill processes data from multiple sources to provide a comprehensive view of market sentiment for any token or sector.

Data sources:
• Twitter/X (crypto-specific accounts)
• Reddit (r/cryptocurrency, r/ethfinance, etc.)
• Discord servers (curated alpha groups)
• Telegram channels
• News aggregators
• On-chain metrics (active addresses, transaction counts)

Output metrics:
• Overall sentiment score (-100 to +100)
• Sentiment momentum (rate of change)
• Fear & Greed index contribution
• Unusual activity alerts
• Historical sentiment correlation with price

Perfect for trading signals, risk management, and market research.`,
        category: "Analytics", icon: "📊", price: 1.00, currency: "USD",
        rating: 4.4, installs: 1203, tags: "sentiment,analytics,social,market,mood,signals",
        fileType: "markdown",
        fileContent: `# Sentiment Analyzer

## Overview
You are a market sentiment analysis agent. Your role is to aggregate and interpret sentiment signals from multiple data sources to provide actionable market intelligence.

## Data Sources

### Tier 1: Social Media
- **Twitter/X**: Crypto influencers, project accounts, developer activity
- **Reddit**: r/cryptocurrency, r/ethfinance, r/defi, project subreddits
- **Discord**: Major protocol servers, alpha groups
- **Telegram**: Announcement channels, trading groups

### Tier 2: News & Media
- CoinDesk, The Block, Decrypt
- Protocol blog posts
- Research reports (Messari, Delphi, Nansen)

### Tier 3: On-Chain Signals
- Active address counts
- Transaction volumes
- Exchange inflows/outflows
- Whale wallet movements
- Stablecoin flows

## Sentiment Scoring Model

### Text Sentiment Classification
\`\`\`
POSITIVE signals:
- "bullish", "moon", "pump", "breakout", "accumulating"
- Announcements of partnerships, upgrades, listings
- High engagement on positive content

NEGATIVE signals:
- "bearish", "dump", "crash", "sell", "rug"
- FUD articles, security incidents
- High engagement on negative content

NEUTRAL:
- Technical analysis without clear direction
- Educational content
- News reporting without sentiment
\`\`\`

### Scoring Formula
\`\`\`python
def calculate_sentiment(token):
    scores = []

    # Social sentiment (-100 to +100)
    social = aggregate_social_sentiment(token)
    scores.append(social * 0.4)  # 40% weight

    # News sentiment (-100 to +100)
    news = aggregate_news_sentiment(token)
    scores.append(news * 0.25)  # 25% weight

    # On-chain sentiment (-100 to +100)
    onchain = calculate_onchain_sentiment(token)
    scores.append(onchain * 0.35)  # 35% weight

    final_score = sum(scores)

    # Classify
    if final_score > 50: return "EXTREME_GREED"
    if final_score > 20: return "GREED"
    if final_score > -20: return "NEUTRAL"
    if final_score > -50: return "FEAR"
    return "EXTREME_FEAR"
\`\`\`

### Momentum Calculation
\`\`\`
momentum = current_sentiment - sentiment_24h_ago
velocity = (sentiment_1h - sentiment_2h) / 1 hour

RAPID_SHIFT: |momentum| > 30 in 24h
TRENDING_UP: momentum > 10
STABLE: |momentum| < 10
TRENDING_DOWN: momentum < -10
\`\`\`

## Usage Patterns

### Token Sentiment Check
\`\`\`
User: "What's the sentiment on ETH?"

Agent Process:
1. Query Twitter for #ETH, $ETH, @ethereum mentions (last 24h)
2. Pull r/ethereum and r/ethfinance top posts
3. Check recent news articles
4. Analyze exchange flows
5. Aggregate and score

Response: Sentiment summary with score, momentum, and key drivers
\`\`\`

### Sector Analysis
\`\`\`
User: "How's DeFi sentiment compared to last week?"

Agent Process:
1. Aggregate top 20 DeFi token sentiments
2. Calculate sector average
3. Compare to 7-day historical
4. Identify outliers (unusually positive/negative)

Response: Sector overview with trend analysis
\`\`\`

### Alert Setup
\`\`\`
User: "Alert me if ARB sentiment shifts negative"

Agent Process:
1. Set baseline sentiment for ARB
2. Monitor continuously
3. Trigger alert if score drops below threshold
4. Include context on what caused the shift
\`\`\`

## Output Format

\`\`\`json
{
  "token": "ETH",
  "timestamp": "2024-01-15T14:30:00Z",
  "sentiment": {
    "score": 42,
    "classification": "GREED",
    "momentum": "+8 (trending up)",
    "confidence": 0.85
  },
  "breakdown": {
    "social": {
      "score": 55,
      "twitter_mentions_24h": 45230,
      "top_narrative": "ETF inflows bullish"
    },
    "news": {
      "score": 38,
      "articles_24h": 23,
      "top_story": "BlackRock ETF sees record day"
    },
    "onchain": {
      "score": 35,
      "exchange_netflow": "-12,450 ETH (bullish)",
      "active_addresses": "+5% vs 7d avg"
    }
  },
  "signals": [
    "🟢 Exchange outflows suggest accumulation",
    "🟢 Social momentum positive and accelerating",
    "🟡 Approaching overbought on sentiment (>50)"
  ]
}
\`\`\`

## API Requirements
- TWITTER_BEARER_TOKEN
- Optional: REDDIT_API_KEY, NANSEN_API_KEY
`,
        isGated: true,
        creatorId: creator3.id,
      },
    }),

    // 8. Polymarket Arbitrage (Trading, $3.50)
    prisma.skill.create({
      data: {
        name: "Polymarket Arbitrage",
        description: "Identifies mispriced prediction market contracts and executes cross-platform arbitrage opportunities.",
        longDescription: `The Polymarket Arbitrage skill turns your agent into a prediction market specialist. It continuously monitors odds across platforms to find and execute profitable arbitrage opportunities.

Capabilities:
• Real-time odds tracking across Polymarket, Kalshi, and others
• Cross-platform arbitrage detection
• Implied probability calculation
• Liquidity depth analysis
• Execution timing optimization
• Position management and hedging
• Event outcome monitoring
• Settlement automation

Advanced features:
• News-based odds prediction
• Market maker detection
• Slippage modeling
• Multi-leg arbitrage strategies

Ideal for agents specializing in prediction markets and event-driven trading.`,
        category: "Trading", icon: "🎯", price: 3.50, currency: "USD",
        rating: 4.3, installs: 445, tags: "polymarket,arbitrage,predictions,betting,odds,trading",
        fileType: "markdown",
        fileContent: `# Polymarket Arbitrage

## Overview
You are a prediction market arbitrage agent. Your role is to identify mispriced contracts across prediction market platforms and execute profitable arbitrage strategies.

## Supported Platforms
- **Polymarket** (crypto-native, USDC)
- **Kalshi** (US regulated, USD)
- **PredictIt** (limited markets)
- **Manifold** (play money, signal only)

## Core Concepts

### Implied Probability
\`\`\`
Price on prediction market = implied probability

If "Yes" trades at $0.65:
- Market implies 65% chance of Yes outcome
- "No" should trade at ~$0.35

If Yes + No ≠ $1.00, there's a spread (market maker profit)
\`\`\`

### Arbitrage Types

#### 1. Same-Event Cross-Platform
\`\`\`
Polymarket: "Trump wins 2024" Yes = $0.52
Kalshi: "Trump wins 2024" Yes = $0.48

ARBITRAGE OPPORTUNITY:
- Buy Yes on Kalshi @ $0.48
- Buy No on Polymarket @ $0.48 (1 - 0.52)
- Total cost: $0.96
- Guaranteed payout: $1.00
- Profit: $0.04 per share (4.2% return)

EXECUTION:
Only profitable if:
profit > (gas_fees + trading_fees + slippage)
\`\`\`

#### 2. Correlated Events
\`\`\`
Market A: "Fed raises rates in March" @ 70%
Market B: "S&P drops 5% in March" @ 25%

If historical correlation shows:
- When Fed raises, S&P drops 5% happens 60% of the time

Expected value calculation:
P(B|A) = 0.60
P(B) market = 0.25
If A is correctly priced, B is potentially underpriced
\`\`\`

#### 3. Multi-Outcome Markets
\`\`\`
"Who wins election?" market:
- Candidate A: 45%
- Candidate B: 40%
- Candidate C: 10%
- Other: 8%
Total: 103%

The 3% overround is the market's edge
Find markets with lower overround for better value
\`\`\`

## Arbitrage Detection Algorithm

\`\`\`python
def find_arbitrage_opportunities():
    opportunities = []

    for event in get_active_events():
        prices = {}
        for platform in PLATFORMS:
            prices[platform] = get_prices(platform, event)

        # Check for cross-platform arb
        for p1, p2 in combinations(PLATFORMS, 2):
            yes_1 = prices[p1]['yes']
            no_2 = 1 - prices[p2]['yes']  # No = 1 - Yes

            cost = yes_1 + no_2
            if cost < 0.98:  # 2% profit threshold
                opportunities.append({
                    'event': event,
                    'buy_yes': p1,
                    'buy_no': p2,
                    'cost': cost,
                    'profit_pct': (1 - cost) / cost * 100
                })

    return sorted(opportunities, key=lambda x: x['profit_pct'], reverse=True)
\`\`\`

## Execution Workflow

\`\`\`
1. IDENTIFY
   - Scan all platforms for same/similar events
   - Calculate implied probabilities
   - Detect price discrepancies >2%

2. VALIDATE
   - Confirm events are truly equivalent
   - Check settlement rules match
   - Verify liquidity depth on both sides
   - Calculate total fees and slippage

3. SIZE
   - Determine max position based on liquidity
   - Account for capital lockup until settlement
   - Set position limits per event

4. EXECUTE
   - Place orders simultaneously (or near-simultaneously)
   - Use limit orders to avoid slippage
   - Confirm both legs filled

5. MONITOR
   - Track positions until settlement
   - Monitor for early close opportunities
   - Handle resolution disputes if needed

6. SETTLE
   - Claim winnings on correct side
   - Record P&L
   - Free up capital for next opportunity
\`\`\`

## Risk Management

\`\`\`
MAX_POSITION_PER_EVENT: 5% of portfolio
MAX_PLATFORM_EXPOSURE: 20% of portfolio
MIN_PROFIT_THRESHOLD: 2% after fees
MAX_SETTLEMENT_TIME: 90 days
LIQUIDITY_REQUIREMENT: Must be able to exit 50% in 24h
\`\`\`

## Output Format

\`\`\`json
{
  "scan_timestamp": "2024-01-15T14:30:00Z",
  "opportunities": [
    {
      "event": "Bitcoin above $50k on Jan 31",
      "polymarket_yes": 0.72,
      "kalshi_yes": 0.68,
      "arbitrage": {
        "strategy": "Buy Yes on Kalshi, Buy No on Polymarket",
        "cost_per_share": 0.96,
        "profit_per_share": 0.04,
        "profit_pct": "4.17%",
        "max_size": "$5,000 (liquidity limited)",
        "fees_estimated": "$12",
        "net_profit_estimated": "$196"
      },
      "execution_ready": true
    }
  ],
  "active_positions": [...],
  "total_capital_deployed": "$15,000",
  "pending_settlements": 3
}
\`\`\`

## API Requirements
- POLYMARKET_API_KEY
- KALSHI_API_KEY (requires US identity verification)
- ETH wallet for Polymarket transactions
`,
        isGated: true,
        creatorId: creator4.id,
      },
    }),
  ]);

  // --- Agents ---
  const ronin = await prisma.agent.create({
    data: {
      name: "Ronin", description: "Autonomous DeFi strategist. Scans 12 protocols, optimizes yield, shields from MEV. 1,247 jobs completed with 99.2% success rate.",
      avatar: "🥷", rank: "Tatsujin 達人", xp: 12470, jobsCompleted: 1247, successRate: 99.2, totalEarnings: 34.2, earningsCurrency: "ETH",
      ownerId: creator1.id,
    },
  });
  const sentinel = await prisma.agent.create({
    data: {
      name: "Sentinel", description: "Security-focused agent. Audits contracts, traces suspicious transactions, monitors social sentiment for rug signals.",
      avatar: "🦅", rank: "Senpai 先輩", xp: 6340, jobsCompleted: 634, successRate: 97.8, totalEarnings: 18.7, earningsCurrency: "ETH",
      ownerId: creator2.id,
    },
  });
  const oracle = await prisma.agent.create({
    data: {
      name: "Oracle", description: "Market intelligence agent. Finds alpha from Twitter, analyzes sentiment, and executes on prediction markets.",
      avatar: "🔮", rank: "Senpai 先輩", xp: 8920, jobsCompleted: 892, successRate: 95.1, totalEarnings: 21.4, earningsCurrency: "ETH",
      ownerId: creator3.id,
    },
  });

  // --- Equip skills to agents ---
  // Ronin: DeFi Yield Optimizer, Gas Fee Predictor, MEV Shield, On-Chain Forensics
  await prisma.agentSkill.createMany({
    data: [
      { agentId: ronin.id, skillId: skills[0].id },
      { agentId: ronin.id, skillId: skills[4].id },
      { agentId: ronin.id, skillId: skills[5].id },
      { agentId: ronin.id, skillId: skills[3].id },
    ],
  });
  // Sentinel: Smart Contract Auditor, On-Chain Forensics, Sentiment Analyzer
  await prisma.agentSkill.createMany({
    data: [
      { agentId: sentinel.id, skillId: skills[1].id },
      { agentId: sentinel.id, skillId: skills[3].id },
      { agentId: sentinel.id, skillId: skills[6].id },
    ],
  });
  // Oracle: Twitter Alpha, Sentiment, Polymarket, DeFi Yield, Gas
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
      { rating: 5, comment: "Best yield optimizer I've used. Found 12% APY on Aave that I missed.", userId: buyer1.id, skillId: skills[0].id },
      { rating: 5, comment: "Caught a reentrancy bug in my contract that Slither missed. Worth every penny.", userId: buyer1.id, skillId: skills[1].id },
      { rating: 4, comment: "Good alpha signals but sometimes slow during high-traffic events.", userId: buyer1.id, skillId: skills[2].id },
      { rating: 5, comment: "Saved me from a sandwich attack on a 50 ETH swap. Paid for itself instantly.", userId: buyer1.id, skillId: skills[5].id },
      { rating: 5, comment: "Ronin managed my DeFi positions for a month. Zero incidents, consistent yield.", userId: buyer1.id, agentId: ronin.id },
      { rating: 4, comment: "Sentinel found 3 critical issues in our audit. Thorough but slow on large codebases.", userId: buyer1.id, agentId: sentinel.id },
    ],
  });

  // --- Jobs ---
  await prisma.job.createMany({
    data: [
      { title: "Optimize yield across L2s", description: "Find best yield for 10 ETH across Base and Arbitrum", status: "completed", payment: 0.05, currency: "ETH", rating: 5, agentId: ronin.id, completedAt: new Date() },
      { title: "Audit token contract", description: "Full security audit of ERC-20 with custom mechanics", status: "completed", payment: 0.12, currency: "ETH", rating: 5, agentId: sentinel.id, completedAt: new Date() },
      { title: "Market sentiment report", description: "Weekly alpha report for top 20 tokens", status: "completed", payment: 0.03, currency: "ETH", rating: 4, agentId: oracle.id, completedAt: new Date() },
      { title: "MEV protection for swap", description: "Route 50 ETH swap through private mempool", status: "completed", payment: 0.02, currency: "ETH", rating: 5, agentId: ronin.id, completedAt: new Date() },
    ],
  });

  console.log("✅ Seed complete");
  console.log("   - 5 users created");
  console.log("   - 8 skills created:");
  console.log("     1. DeFi Yield Optimizer (Trading, $2.00)");
  console.log("     2. Smart Contract Auditor (Security, $5.00)");
  console.log("     3. Twitter Alpha Scanner (Content, $1.50)");
  console.log("     4. On-Chain Forensics (Security, $3.00)");
  console.log("     5. Gas Fee Predictor (Infra, FREE)");
  console.log("     6. MEV Shield (DeFi, $2.50)");
  console.log("     7. Sentiment Analyzer (Analytics, $1.00)");
  console.log("     8. Polymarket Arbitrage (Trading, $3.50)");
  console.log("   - 3 agents created");
  console.log("   - 6 reviews created");
  console.log("   - 4 jobs created");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
