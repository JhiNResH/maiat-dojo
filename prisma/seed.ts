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
