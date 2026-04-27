export type DemoSkill = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  price: number;
  pricePerCall: number;
  gatewaySlug: string;
  tags: string;
  estLatencyMs: number;
  inputShape: string;
  outputShape: string;
  exampleInput: unknown;
  exampleOutput: unknown;
  trustScore: number;
  callCount: number;
  workflowId: string;
  workflowSlug: string;
  workflowRunCount: number;
  workflowForkCount: number;
  royaltyBps: number;
};

export type DemoWorkflow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  price_per_run: number;
  royalty_bps: number;
  runs: number;
  forks: number;
  trust_score: number;
  creator: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  executable_skill: {
    id: string;
    gatewaySlug: string;
    pricePerCall: number;
  };
  version: {
    id: string;
    version: number;
    summary: string;
    slaMs: number;
  };
};

const CREATOR = {
  id: "demo-creator-maiat-dojo",
  displayName: "Maiat Dojo",
  avatarUrl: null,
};

export const DEMO_SKILLS: DemoSkill[] = [
  {
    id: "demo-skill-quick-audit",
    name: "Quick Audit Workflow",
    description:
      "Fast smart-contract security workflow for agents. Takes a contract address or source URL and returns a structured risk report with findings, severity, and next actions.",
    category: "Security",
    icon: "shield",
    price: 0.015,
    pricePerCall: 0.015,
    gatewaySlug: "quick-audit-workflow",
    tags: "security,audit,solidity,bnb,workflow,risk",
    estLatencyMs: 1200,
    inputShape: "form",
    outputShape: "json",
    exampleInput: {
      target: "0x0000000000000000000000000000000000000000",
      chain: "bsc",
    },
    exampleOutput: {
      workflow: "quick-audit-workflow",
      risk_score: 42,
      verdict: "medium_risk",
      findings: [{ severity: "medium", title: "Owner-controlled privileged function" }],
    },
    trustScore: 92,
    callCount: 87,
    workflowId: "demo-workflow-quick-audit",
    workflowSlug: "quick-audit-workflow",
    workflowRunCount: 87,
    workflowForkCount: 23,
    royaltyBps: 750,
  },
  {
    id: "demo-skill-pr-review",
    name: "PR Review Workflow",
    description:
      "Reviews a pull request diff, flags risky changes, and returns a concise engineering review with blockers and follow-ups.",
    category: "DevTools",
    icon: "git-pull-request",
    price: 0.012,
    pricePerCall: 0.012,
    gatewaySlug: "pr-review-workflow",
    tags: "code-review,github,devtools,workflow",
    estLatencyMs: 1800,
    inputShape: "form",
    outputShape: "markdown",
    exampleInput: { pull_request_url: "https://github.com/acme/app/pull/42" },
    exampleOutput: {
      verdict: "needs_changes",
      findings: ["Migration missing rollback path", "API response changed without tests"],
    },
    trustScore: 88,
    callCount: 64,
    workflowId: "demo-workflow-pr-review",
    workflowSlug: "pr-review-workflow",
    workflowRunCount: 64,
    workflowForkCount: 17,
    royaltyBps: 650,
  },
  {
    id: "demo-skill-token-risk",
    name: "Token Risk Workflow",
    description:
      "Checks token metadata, ownership, liquidity, and basic transfer behavior before an agent interacts with a token.",
    category: "DeFi",
    icon: "coins",
    price: 0.009,
    pricePerCall: 0.009,
    gatewaySlug: "token-risk-workflow",
    tags: "defi,token,risk,bsc,workflow",
    estLatencyMs: 1500,
    inputShape: "form",
    outputShape: "json",
    exampleInput: { token: "BNB", chain: "bsc" },
    exampleOutput: { verdict: "low_risk", risk_score: 22 },
    trustScore: 84,
    callCount: 51,
    workflowId: "demo-workflow-token-risk",
    workflowSlug: "token-risk-workflow",
    workflowRunCount: 51,
    workflowForkCount: 12,
    royaltyBps: 500,
  },
  {
    id: "demo-skill-web-scraper",
    name: "Web Scraper Workflow",
    description:
      "Converts public URLs into clean markdown for agent research, monitoring, and RAG pipelines.",
    category: "Infra",
    icon: "globe",
    price: 0.003,
    pricePerCall: 0.003,
    gatewaySlug: "web-scraper",
    tags: "scrape,web,markdown,research,rag",
    estLatencyMs: 2000,
    inputShape: "form",
    outputShape: "json",
    exampleInput: { url: "https://example.com" },
    exampleOutput: { title: "Example Domain", word_count: 12 },
    trustScore: 79,
    callCount: 42,
    workflowId: "demo-workflow-web-scraper",
    workflowSlug: "web-scraper-workflow",
    workflowRunCount: 42,
    workflowForkCount: 9,
    royaltyBps: 500,
  },
  {
    id: "demo-skill-echo",
    name: "Echo Connectivity Workflow",
    description:
      "Minimal workflow for testing agent connectivity, metering, and execution receipts before integrating production tools.",
    category: "Infra",
    icon: "repeat",
    price: 0.001,
    pricePerCall: 0.001,
    gatewaySlug: "echo-test",
    tags: "test,echo,debug,infra,workflow",
    estLatencyMs: 200,
    inputShape: "form",
    outputShape: "json",
    exampleInput: { message: "hello dojo" },
    exampleOutput: { echo: { message: "hello dojo" }, latency_ms: 12 },
    trustScore: 95,
    callCount: 139,
    workflowId: "demo-workflow-echo",
    workflowSlug: "echo-connectivity-workflow",
    workflowRunCount: 139,
    workflowForkCount: 31,
    royaltyBps: 0,
  },
];

export const DEMO_WORKFLOWS: DemoWorkflow[] = DEMO_SKILLS.map((skill) => ({
  id: skill.workflowId,
  slug: skill.workflowSlug,
  name: skill.name,
  description: skill.description,
  category: skill.category,
  icon: skill.icon,
  price_per_run: skill.pricePerCall,
  royalty_bps: skill.royaltyBps,
  runs: skill.workflowRunCount,
  forks: skill.workflowForkCount,
  trust_score: skill.trustScore,
  creator: CREATOR,
  executable_skill: {
    id: skill.id,
    gatewaySlug: skill.gatewaySlug,
    pricePerCall: skill.pricePerCall,
  },
  version: {
    id: `${skill.workflowId}-v1`,
    version: 1,
    summary: `${skill.name} v1 demo workflow`,
    slaMs: skill.estLatencyMs,
  },
}));

export function filterDemoSkills({
  q,
  category,
  freeOnly,
  limit,
  offset = 0,
}: {
  q?: string;
  category?: string;
  freeOnly?: boolean;
  limit: number;
  offset?: number;
}) {
  const normalizedQ = q?.trim().toLowerCase();
  const rows = DEMO_SKILLS.filter((skill) => {
    const matchesCategory = !category || skill.category === category;
    const matchesFree = !freeOnly || skill.pricePerCall === 0;
    const matchesQuery =
      !normalizedQ ||
      skill.name.toLowerCase().includes(normalizedQ) ||
      skill.description.toLowerCase().includes(normalizedQ) ||
      skill.tags.toLowerCase().includes(normalizedQ);
    return matchesCategory && matchesFree && matchesQuery;
  });

  return {
    total: rows.length,
    skills: rows.slice(offset, offset + limit),
  };
}

export function filterDemoWorkflows({
  q,
  category,
  limit,
}: {
  q?: string;
  category?: string;
  limit: number;
}) {
  const normalizedQ = q?.trim().toLowerCase();
  return DEMO_WORKFLOWS.filter((workflow) => {
    const matchesCategory = !category || workflow.category === category;
    const matchesQuery =
      !normalizedQ ||
      workflow.name.toLowerCase().includes(normalizedQ) ||
      workflow.description.toLowerCase().includes(normalizedQ) ||
      workflow.slug.toLowerCase().includes(normalizedQ);
    return matchesCategory && matchesQuery;
  }).slice(0, limit);
}

export function toPublicSkill(skill: DemoSkill) {
  return {
    ...skill,
    creator: CREATOR,
    rating: 5,
    installs: skill.workflowRunCount,
    evaluationScore: skill.trustScore,
    workflowVersion: {
      id: `${skill.workflowId}-v1`,
      version: 1,
      summary: `${skill.name} v1 demo workflow`,
      slaMs: skill.estLatencyMs,
    },
  };
}

export function toV1Skill(skill: DemoSkill) {
  return {
    skill: skill.gatewaySlug,
    name: skill.name,
    description: skill.description,
    price_per_call: skill.pricePerCall,
    category: skill.category,
    tags: skill.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    icon: skill.icon,
    latency_ms: skill.estLatencyMs,
    input_shape: skill.inputShape,
    output_shape: skill.outputShape,
    example_input: skill.exampleInput,
    example_output: skill.exampleOutput,
    workflow: {
      id: skill.workflowId,
      slug: skill.workflowSlug,
      runs: skill.workflowRunCount,
      forks: skill.workflowForkCount,
      royalty_bps: skill.royaltyBps,
      version: {
        version: 1,
        summary: `${skill.name} v1 demo workflow`,
        slaMs: skill.estLatencyMs,
      },
    },
  };
}
