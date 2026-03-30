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

  // --- Skills ---
  const skills = await Promise.all([
    prisma.skill.create({
      data: {
        name: "DeFi Yield Optimizer",
        description: "Scans 12 protocols, finds the highest risk-adjusted APY in under 3 seconds.",
        longDescription: "The DeFi Yield Optimizer continuously monitors yield opportunities across Ethereum, Base, and Arbitrum. It analyzes protocol risk scores, TVL changes, impermanent loss projections, and historical APY stability to recommend optimal positions. Supports Aave, Compound, Lido, Rocket Pool, Curve, Convex, Yearn, and 5 more protocols. Built for autonomous agents that need to manage treasury positions without human intervention.\n\nKey capabilities:\n• Real-time APY comparison across 12 protocols\n• Risk-adjusted scoring (considers smart contract risk, oracle risk, liquidity risk)\n• Auto-rebalance suggestions when yield differential exceeds threshold\n• Gas-optimized transaction bundling\n• Slippage protection and MEV-aware routing",
        category: "Trading", icon: "⚡", price: 4.99, currency: "USD",
        rating: 4.9, installs: 4821, tags: "defi,yield,farming,apy",
        creatorId: creator1.id,
      },
    }),
    prisma.skill.create({
      data: {
        name: "On-Chain Forensics",
        description: "Trace fund flows, identify wallet clusters, and detect suspicious patterns.",
        longDescription: "Advanced on-chain investigation tool that maps transaction graphs across EVM chains. Uses heuristic clustering to identify related wallets, flags mixer interactions, and generates visual fund flow diagrams. Integrates with known scam/hack databases for automatic risk flagging.",
        category: "Security", icon: "🔍", price: 7.99, currency: "USD",
        rating: 4.8, installs: 2310, tags: "security,forensics,investigation,tracing",
        creatorId: creator2.id,
      },
    }),
    prisma.skill.create({
      data: {
        name: "Twitter Alpha Scanner",
        description: "Monitors crypto Twitter for early alpha signals and sentiment shifts.",
        longDescription: "Scans 500+ key opinion leaders, project accounts, and whale watchers in real-time. Uses NLP to extract actionable signals from noise. Tracks narrative momentum, identifies emerging tokens before they trend, and correlates social sentiment with on-chain data.",
        category: "Content", icon: "🐦", price: 2.99, currency: "USD",
        rating: 4.7, installs: 3890, tags: "twitter,alpha,sentiment,social",
        creatorId: creator3.id,
      },
    }),
    prisma.skill.create({
      data: {
        name: "Gas Fee Predictor",
        description: "Predicts optimal gas prices for the next 1-60 minutes on EVM chains.",
        longDescription: "ML model trained on 2 years of gas price data. Predicts base fee and priority fee with 94% accuracy within 15-minute windows. Helps agents time transactions to minimize gas costs.",
        category: "Infra", icon: "⛽", price: 1.99, currency: "USD",
        rating: 4.6, installs: 1540, tags: "gas,optimization,infra,evm",
        creatorId: creator1.id,
      },
    }),
    prisma.skill.create({
      data: {
        name: "Smart Contract Auditor",
        description: "Static analysis + AI review. Catches 94% of known vulnerability patterns.",
        longDescription: "Combines Slither-style static analysis with LLM-powered semantic review. Detects reentrancy, integer overflow, access control issues, oracle manipulation, and 40+ vulnerability patterns. Generates detailed audit reports with severity ratings and fix suggestions.",
        category: "Security", icon: "🛡️", price: 11.99, currency: "USD",
        rating: 4.9, installs: 980, tags: "security,audit,smart-contract,solidity",
        creatorId: creator2.id,
      },
    }),
    prisma.skill.create({
      data: {
        name: "MEV Shield",
        description: "Protects transactions from sandwich attacks and frontrunning.",
        longDescription: "Routes transactions through private mempools (Flashbots Protect, MEV Blocker) and uses backrunning-aware slippage settings. Monitors pending transactions for potential MEV extraction and alerts the agent.",
        category: "DeFi", icon: "🔒", price: 5.99, currency: "USD",
        rating: 4.5, installs: 762, tags: "mev,protection,defi,security",
        creatorId: creator2.id,
      },
    }),
    prisma.skill.create({
      data: {
        name: "Sentiment Analyzer",
        description: "Multi-source sentiment analysis for crypto assets and narratives.",
        longDescription: "Aggregates sentiment from Twitter, Reddit, Telegram, Discord, and on-chain governance forums. Produces hourly sentiment scores per asset with trend direction and confidence levels.",
        category: "Analytics", icon: "📊", price: 3.99, currency: "USD",
        rating: 4.4, installs: 1203, tags: "analytics,sentiment,social,data",
        creatorId: creator3.id,
      },
    }),
    prisma.skill.create({
      data: {
        name: "Polymarket Arbitrage",
        description: "Finds mispriced prediction markets and calculates EV opportunities.",
        longDescription: "Scans Polymarket, Kalshi, and other prediction markets for arbitrage between platforms and +EV bets based on aggregated probability models. Calculates Kelly criterion sizing and tracks historical accuracy.",
        category: "Trading", icon: "🎯", price: 6.99, currency: "USD",
        rating: 4.3, installs: 445, tags: "trading,prediction,arbitrage,polymarket",
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
      { agentId: ronin.id, skillId: skills[3].id },
      { agentId: ronin.id, skillId: skills[5].id },
      { agentId: ronin.id, skillId: skills[1].id },
    ],
  });
  // Sentinel: Smart Contract Auditor, On-Chain Forensics, Sentiment Analyzer
  await prisma.agentSkill.createMany({
    data: [
      { agentId: sentinel.id, skillId: skills[4].id },
      { agentId: sentinel.id, skillId: skills[1].id },
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
      { agentId: oracle.id, skillId: skills[3].id },
    ],
  });

  // --- Reviews ---
  await prisma.review.createMany({
    data: [
      { rating: 5, comment: "Best yield optimizer I've used. Found 12% APY on Aave that I missed.", userId: buyer1.id, skillId: skills[0].id },
      { rating: 5, comment: "Caught a reentrancy bug in my contract that Slither missed. Worth every penny.", userId: buyer1.id, skillId: skills[4].id },
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
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
