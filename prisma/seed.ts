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

  // --- Buyer (for reviews / E2E testing) ---
  const buyer1 = await prisma.user.create({
    data: {
      privyId: "did:privy:seed-buyer-003",
      displayName: "Agent_Smith",
      email: "smith@dojo.maiat.io",
    },
  });

  // ---------------------------------------------------------------------------
  // Skills — only real skills with working internal endpoints
  // ---------------------------------------------------------------------------

  const skills = await Promise.all([
    // 1. Token Price Oracle (active, $0.005/call)
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

    // 3. Web Scraper (active, $0.003/call — Jina Reader)
    prisma.skill.create({
      data: {
        name: "Web Scraper",
        description:
          "Converts any public URL into clean structured markdown. Powered by Jina Reader. Essential for agent RAG pipelines, research, and content extraction.",
        category: "Infra",
        icon: "🌐",
        price: 0.003,
        rating: 4.8,
        installs: 0,
        tags: "scrape,web,markdown,research,rag,jina",
        skillType: "active",
        endpointUrl: process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/api/skills-internal/scrape`
          : "http://localhost:3000/api/skills-internal/scrape",
        gatewaySlug: "web-scraper",
        pricePerCall: 0.003,
        executionKind: "sync",
        inputShape: "form",
        outputShape: "json",
        estLatencyMs: 2000,
        sandboxable: true,
        authRequired: false,
        inputSchema: JSON.stringify({
          type: "object",
          required: ["url"],
          properties: {
            url: {
              type: "string",
              title: "URL",
              description: "Public URL to scrape",
              default: "https://example.com",
            },
          },
        }),
        outputSchema: JSON.stringify({
          type: "object",
          properties: {
            url: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            content: { type: "string" },
            word_count: { type: "number" },
            timestamp: { type: "string", format: "date-time" },
          },
        }),
        exampleInput: JSON.stringify({ url: "https://example.com" }),
        exampleOutput: JSON.stringify({
          url: "https://example.com",
          title: "Example Domain",
          description: "",
          content: "# Example Domain\n\nThis domain is for use in illustrative examples.",
          word_count: 12,
          timestamp: "2026-04-13T00:00:00.000Z",
        }),
        fileType: "markdown",
        fileContent: `# Web Scraper

## What it does
Converts any public URL into clean structured markdown via Jina Reader. No browser required, no API key needed.

## Usage
\`\`\`
POST /v1/scrape
{ "url": "https://example.com" }
\`\`\`

## Response
\`\`\`json
{
  "url": "https://example.com",
  "title": "Example Domain",
  "content": "# Example Domain\\n\\n...",
  "word_count": 482,
  "timestamp": "2026-04-13T00:00:00Z"
}
\`\`\`

## Use cases
- Agent RAG: scrape docs into context before answering
- Research pipelines: extract content for summarization
- Monitoring: detect changes on web pages
`,
        isGated: false,
        creatorId: platform.id,
      },
    }),

    // 4. Web Search (active, $0.005/call — Jina Search)
    prisma.skill.create({
      data: {
        name: "Web Search",
        description:
          "Returns structured search results for any query. Powered by Jina Search. Essential for agents that need up-to-date information beyond their training data.",
        category: "Infra",
        icon: "🔎",
        price: 0.005,
        rating: 4.7,
        installs: 0,
        tags: "search,web,research,rag,jina,realtime",
        skillType: "active",
        endpointUrl: process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/api/skills-internal/search`
          : "http://localhost:3000/api/skills-internal/search",
        gatewaySlug: "web-search",
        pricePerCall: 0.005,
        executionKind: "sync",
        inputShape: "form",
        outputShape: "json",
        estLatencyMs: 1500,
        sandboxable: true,
        authRequired: false,
        inputSchema: JSON.stringify({
          type: "object",
          required: ["query"],
          properties: {
            query: {
              type: "string",
              title: "Search Query",
              description: "What to search for",
              default: "BNB price today",
            },
            max_results: {
              type: "number",
              title: "Max Results",
              description: "Number of results to return (1-10)",
              default: 5,
            },
          },
        }),
        outputSchema: JSON.stringify({
          type: "object",
          properties: {
            query: { type: "string" },
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  url: { type: "string" },
                  description: { type: "string" },
                  content: { type: "string" },
                },
              },
            },
            result_count: { type: "number" },
            timestamp: { type: "string", format: "date-time" },
          },
        }),
        exampleInput: JSON.stringify({ query: "BNB price today", max_results: 3 }),
        exampleOutput: JSON.stringify({
          query: "BNB price today",
          results: [
            { title: "BNB Price | CoinGecko", url: "https://coingecko.com/en/coins/bnb", description: "BNB live price...", content: "" },
          ],
          result_count: 1,
          timestamp: "2026-04-13T00:00:00.000Z",
        }),
        fileType: "markdown",
        fileContent: `# Web Search

## What it does
Returns structured search results for any query via Jina Search. Keeps agents grounded in current reality.

## Usage
\`\`\`
POST /v1/search
{ "query": "BNB price today", "max_results": 5 }
\`\`\`

## Response
\`\`\`json
{
  "query": "BNB price today",
  "results": [
    {
      "title": "BNB Price | CoinGecko",
      "url": "https://coingecko.com/en/coins/bnb",
      "description": "BNB live price, charts, and market data.",
      "content": "..."
    }
  ],
  "result_count": 5,
  "timestamp": "2026-04-13T00:00:00Z"
}
\`\`\`

## Use cases
- Real-time price lookups
- News and event monitoring
- Fact-checking before acting
- Research pipelines
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
  // skills[0] = Token Price Oracle, [1] = Echo Test, [2] = Web Scraper, [3] = Web Search
  // Ronin: Token Price Oracle + Web Search
  await prisma.agentSkill.createMany({
    data: [
      { agentId: ronin.id, skillId: skills[0].id },
      { agentId: ronin.id, skillId: skills[3].id },
    ],
  });
  // Sentinel: Echo Test + Web Scraper
  await prisma.agentSkill.createMany({
    data: [
      { agentId: sentinel.id, skillId: skills[1].id },
      { agentId: sentinel.id, skillId: skills[2].id },
    ],
  });
  // Oracle: all 4 skills
  await prisma.agentSkill.createMany({
    data: [
      { agentId: oracle.id, skillId: skills[0].id },
      { agentId: oracle.id, skillId: skills[1].id },
      { agentId: oracle.id, skillId: skills[2].id },
      { agentId: oracle.id, skillId: skills[3].id },
    ],
  });

  // --- Reviews ---
  await prisma.review.createMany({
    data: [
      {
        rating: 5,
        comment: "Exactly what I needed for real-time BNB price in my agent. Zero setup.",
        userId: buyer1.id,
        skillId: skills[0].id, // Token Price Oracle
      },
      {
        rating: 5,
        comment: "Used Echo Test to verify my x402 payment headers. Works perfectly.",
        userId: buyer1.id,
        skillId: skills[1].id, // Echo Test
      },
      {
        rating: 5,
        comment: "Web Scraper saved hours — plugged docs straight into my RAG pipeline.",
        userId: buyer1.id,
        skillId: skills[2].id, // Web Scraper
      },
      {
        rating: 4,
        comment: "Web Search gives my agent real-time context. Results are clean and structured.",
        userId: buyer1.id,
        skillId: skills[3].id, // Web Search
      },
      {
        rating: 5,
        comment: "Ronin's been running price checks and searches autonomously. Solid.",
        userId: buyer1.id,
        agentId: ronin.id,
      },
      {
        rating: 4,
        comment: "Sentinel handles the scraping and echo testing for our CI pipeline.",
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

  console.log("✅ Seed complete — real skills only");
  console.log("   - 3 users (platform + community + buyer)");
  console.log("   - 4 skills (working internal endpoints):");
  console.log("     1.  Token Price Oracle  (active, $0.005/call → /api/skills-internal/price)");
  console.log("     2.  Echo Test           (active, $0.001/call → /api/skills-internal/echo)");
  console.log("     3.  Web Scraper         (active, $0.003/call → /api/skills-internal/scrape)");
  console.log("     4.  Web Search          (active, $0.005/call → /api/skills-internal/search)");
  console.log("   - 3 agents + skills equipped");
  console.log("   - 6 reviews + 4 jobs");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
