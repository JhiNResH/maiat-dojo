import { PrismaClient } from "@prisma/client";
import {
  AGENT_REPO_ANALYST_INPUT,
  AGENT_REPO_ANALYST_OUTPUT,
} from "../src/lib/demo-catalog";

const prisma = new PrismaClient();

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

async function main() {
  // Clean (order matters: FK constraints). This seed is intentionally narrow:
  // the product demo should show one real public-repo workflow, not a fake
  // marketplace full of toy skills.
  await prisma.workflowRunReceipt.deleteMany();
  await prisma.workflowFork.deleteMany();
  await prisma.workflowVersion.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.skillCall.deleteMany();
  await prisma.session.deleteMany();
  await prisma.job.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.review.deleteMany();
  await prisma.agentSkill.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.user.deleteMany();

  const platform = await prisma.user.create({
    data: {
      privyId: "did:privy:seed-platform-001",
      displayName: "Maiat Dojo",
      email: "system@maiat.io",
      walletAddress: "0x000000000000000000000000446f6a6f446f6a6f",
    },
  });

  const buyer = await prisma.user.create({
    data: {
      privyId: "did:privy:seed-buyer-003",
      displayName: "Agent_Smith",
      email: "smith@dojo.maiat.io",
      creditBalance: 10,
    },
  });

  const skill = await prisma.skill.create({
    data: {
      name: "Agent Repo Analyst",
      description:
        "Analyzes a public agent repository and returns architecture summary, install path, fit score, risks, and source-backed evidence. Demo input uses Garry Tan's public GBrain repo.",
      category: "Agent Research",
      icon: "GitBranch",
      price: 0.003,
      rating: 5,
      installs: 1,
      tags: "agent,research,github,gbrain,mcp,workflow",
      skillType: "active",
      endpointUrl: `${appUrl()}/api/skills-internal/repo-analyst`,
      gatewaySlug: "agent-repo-analyst",
      pricePerCall: 0.003,
      expectedCallsPerSession: 50,
      executionKind: "sync",
      inputShape: "form",
      outputShape: "json",
      estLatencyMs: 3000,
      sandboxable: true,
      authRequired: false,
      inputSchema: JSON.stringify({
        type: "object",
        required: ["repo_url"],
        properties: {
          repo_url: {
            type: "string",
            title: "Public GitHub Repository",
            description: "github.com owner/repo URL to analyze",
            default: AGENT_REPO_ANALYST_INPUT.repo_url,
          },
          question: {
            type: "string",
            title: "Question",
            description: "What should the analyst focus on?",
            default: AGENT_REPO_ANALYST_INPUT.question,
          },
        },
      }),
      outputSchema: JSON.stringify({
        type: "object",
        required: ["workflow", "repo", "verdict", "fit_score", "summary", "sources"],
        properties: {
          workflow: { type: "string" },
          repo: { type: "string" },
          verdict: { type: "string" },
          fit_score: { type: "number" },
          summary: { type: "string" },
          signals: { type: "array", items: { type: "string" } },
          install_path: { type: "string" },
          risks: { type: "array", items: { type: "string" } },
          sources: { type: "array" },
        },
      }),
      exampleInput: JSON.stringify(AGENT_REPO_ANALYST_INPUT),
      exampleOutput: JSON.stringify(AGENT_REPO_ANALYST_OUTPUT),
      fileType: "markdown",
      fileContent: `# Agent Repo Analyst

## What it does
Analyzes a public GitHub repository for agent builders. The demo input is Garry Tan's public GBrain repo.

## Inputs
- \`repo_url\`: public github.com owner/repo URL
- \`question\`: what the analysis should focus on

## Output
Structured architecture summary, install path, fit score, risks, and source-backed evidence.

## Settlement
The workflow is paid per successful run. Dojo evaluates the JSON response, clears payment, and writes a receipt.
`,
      isGated: false,
      evaluationScore: 100,
      evaluationPassed: true,
      creatorId: platform.id,
    },
  });

  const workflow = await prisma.workflow.create({
    data: {
      slug: "agent-repo-analyst",
      name: "Agent Repo Analyst",
      description: skill.description,
      category: skill.category,
      icon: skill.icon,
      pricePerRun: skill.pricePerCall ?? skill.price,
      royaltyBps: 500,
      runCount: 1,
      forkCount: 0,
      trustScore: 100,
      creatorId: platform.id,
      skillId: skill.id,
    },
  });

  await prisma.workflowVersion.create({
    data: {
      workflowId: workflow.id,
      version: 1,
      title: "Agent Repo Analyst",
      summary: "Analyze a public agent repo and clear the result with a receipt.",
      inputSchema: skill.inputSchema,
      outputSchema: skill.outputSchema,
      stepGraph: JSON.stringify([
        { id: "repo", type: "input", label: "Accept public GitHub repo URL" },
        { id: "readme", type: "tool", label: "Fetch public README" },
        { id: "signals", type: "evaluator", label: "Extract agent-builder signals and risks" },
        { id: "receipt", type: "output", label: "Return source-backed analysis" },
      ]),
      evaluatorPolicy: JSON.stringify({
        evaluator: "dojo-sanity-v1",
        pass: "2xx JSON response within SLA with sources and fit score",
        domainSignals: ["MCP", "skills", "memory", "cron", "knowledge graph"],
      }),
      slaMs: skill.estLatencyMs,
    },
  });

  const ronin = await prisma.agent.create({
    data: {
      name: "Ronin",
      description:
        "Demo buyer agent. Hires public-repo workflows online and pays only when the analysis clears evaluation.",
      avatar: "🥷",
      rank: "Tatsujin 達人",
      xp: 120,
      jobsCompleted: 1,
      successRate: 100,
      totalEarnings: 0,
      earningsCurrency: "USDC",
      ownerId: buyer.id,
      walletAddress: "0x046aB9D6aC4EA10C42501ad89D9a741115A76Fa9",
    },
  });

  await prisma.agentSkill.create({
    data: {
      agentId: ronin.id,
      skillId: skill.id,
    },
  });

  await prisma.review.create({
    data: {
      rating: 5,
      comment:
        "Ran the GBrain repo analysis and got a source-backed architecture summary with risks and install path.",
      userId: buyer.id,
      skillId: skill.id,
    },
  });

  console.log("✅ Seed complete — one real demo workflow");
  console.log("   - Agent Repo Analyst (active, $0.003/run → /api/skills-internal/repo-analyst)");
  console.log("   - Demo input: https://github.com/garrytan/gbrain");
  console.log("   - Buyer agent funded with 10 credits");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
