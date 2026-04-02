import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Map seed skill names to on-chain IDs (from SeedSkills + SeedRemaining scripts)
const SKILL_MAP: Record<string, number> = {
  "DeFi Yield Optimizer": 2,
  "Smart Contract Auditor": 3,
  "Twitter Alpha Scanner": 4,
  "On-Chain Forensics": 5,
  "Gas Fee Predictor": 6,
  "MEV Shield": 7,
  "Sentiment Analyzer": 8,
  "Polymarket Arbitrage": 9,
};

async function main() {
  for (const [name, onChainId] of Object.entries(SKILL_MAP)) {
    const result = await prisma.skill.updateMany({
      where: { name },
      data: { onChainId },
    });
    console.log(`${name} → onChainId ${onChainId} (${result.count} updated)`);
  }
  console.log("\nDone! All skills linked to on-chain IDs.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
