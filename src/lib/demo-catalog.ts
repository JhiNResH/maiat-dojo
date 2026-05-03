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
  inputSchema: string;
  outputSchema: string;
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

export const AGENT_REPO_ANALYST_INPUT = {
  repo_url: "https://github.com/garrytan/gbrain",
  question: "Is this useful for building persistent-memory agents?",
};

export const AGENT_REPO_ANALYST_OUTPUT = {
  workflow: "agent-repo-analyst",
  repo: "https://github.com/garrytan/gbrain",
  verdict: "strong_fit_for_agent_memory",
  fit_score: 0.91,
  summary:
    "GBrain packages persistent knowledge, skills, MCP access, ingestion, and maintenance loops for AI agents.",
  signals: [
    "MCP-compatible agent memory surface",
    "workflow encoded as reusable skills",
    "recurring autonomous maintenance loop",
  ],
  sources: [
    {
      title: "garrytan/gbrain README",
      url: "https://github.com/garrytan/gbrain",
    },
  ],
};

export const DEMO_SKILLS: DemoSkill[] = [
  {
    id: "demo-skill-agent-repo-analyst",
    name: "Agent Repo Analyst",
    description:
      "Analyzes a public agent repository and returns architecture summary, install path, fit score, risks, and source-backed evidence. Demo input uses Garry Tan's public GBrain repo.",
    category: "Agent Research",
    icon: "GitBranch",
    price: 0.003,
    pricePerCall: 0.003,
    gatewaySlug: "agent-repo-analyst",
    tags: "agent,research,github,gbrain,mcp,workflow",
    estLatencyMs: 3000,
    inputShape: "form",
    outputShape: "json",
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
    exampleInput: AGENT_REPO_ANALYST_INPUT,
    exampleOutput: AGENT_REPO_ANALYST_OUTPUT,
    trustScore: 100,
    callCount: 1,
    workflowId: "demo-workflow-agent-repo-analyst",
    workflowSlug: "agent-repo-analyst",
    workflowRunCount: 1,
    workflowForkCount: 0,
    royaltyBps: 500,
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
    summary: "Analyze a public agent repo and clear the result with a receipt.",
    slaMs: skill.estLatencyMs,
  },
}));

export function getDemoSkillById(id: string) {
  return DEMO_SKILLS.find((skill) => skill.id === id) ?? null;
}

export function getDemoSkillByWorkflowId(id: string) {
  return (
    DEMO_SKILLS.find(
      (skill) => skill.workflowId === id || skill.workflowSlug === id || skill.id === id,
    ) ?? null
  );
}

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
    skillType: "active",
    endpointUrl: `/api/skills-internal/repo-analyst`,
    executionKind: "sync",
    inputShape: skill.inputShape,
    outputShape: skill.outputShape,
    estLatencyMs: skill.estLatencyMs,
    sandboxable: true,
    authRequired: false,
    inputSchema: skill.inputSchema,
    outputSchema: skill.outputSchema,
    exampleInput: JSON.stringify(skill.exampleInput),
    exampleOutput: JSON.stringify(skill.exampleOutput),
    longDescription:
      "A live public-repo analysis workflow. The demo case analyzes Garry Tan's public GBrain repository and clears the result as paid agent work.",
    fileContent: null,
    workflowVersion: {
      id: `${skill.workflowId}-v1`,
      version: 1,
      summary: "Analyze a public agent repo and clear the result with a receipt.",
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
        summary: "Analyze a public agent repo and clear the result with a receipt.",
        slaMs: skill.estLatencyMs,
      },
    },
  };
}

export function runDemoSkill(skill: DemoSkill, input: Record<string, unknown>) {
  return {
    ...AGENT_REPO_ANALYST_OUTPUT,
    workflow: skill.gatewaySlug,
    repo: input.repo_url ?? input.repo ?? AGENT_REPO_ANALYST_INPUT.repo_url,
    question: input.question ?? AGENT_REPO_ANALYST_INPUT.question,
    receipt: {
      workflow_id: skill.workflowId,
      trust_signal: "+1 successful public repo analysis",
      generated_at: new Date().toISOString(),
    },
  };
}
