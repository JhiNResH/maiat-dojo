export type WorkflowSpiritInput = {
  workflowId: string;
  slug: string;
  name: string;
  category: string | null;
  creatorId?: string | null;
  creatorName?: string | null;
  runCount?: number | null;
  forkCount?: number | null;
  trustScore?: number | null;
  royaltyBps?: number | null;
};

export type WorkflowSpiritProfile = {
  profileId: string;
  mintStatus: "generated";
  name: string;
  archetype: string;
  discipline: string;
  belt: string;
  level: number;
  mood: "focused" | "training" | "needs review";
  aura: string;
  pattern: string;
  palette: {
    accent: string;
    mat: string;
    ink: string;
  };
  stats: {
    receipts: number;
    passRate: number;
    lineage: number;
    royaltyBps: number;
  };
  lineageRevenue: {
    royaltyBps: number;
    label: string;
  };
};

export type WorkflowFeedingEvent = {
  kind: "feeding_event";
  profileId: string;
  receiptId: string;
  result: "PASS" | "FAIL";
  score: number;
  settlementStatus: string;
  levelAfter: number;
  reputationDelta: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeTrust(value: number | null | undefined) {
  const raw = value ?? 0;
  return clamp(raw > 1 ? raw / 100 : raw, 0, 1);
}

function hashSeed(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pick<T>(items: readonly T[], seed: number, offset = 0): T {
  return items[(seed + offset) % items.length];
}

function disciplineFor(category: string | null) {
  const value = (category ?? "workflow").toLowerCase();
  if (value.includes("research")) return "Research Kata";
  if (value.includes("code") || value.includes("dev")) return "Builder Kata";
  if (value.includes("data") || value.includes("analytics")) return "Signal Kata";
  if (value.includes("writing") || value.includes("content")) return "Script Kata";
  if (value.includes("agent")) return "Agent Kata";
  return "Workflow Kata";
}

function beltFor(level: number) {
  if (level >= 32) return "black belt";
  if (level >= 20) return "brown belt";
  if (level >= 12) return "green belt";
  if (level >= 6) return "yellow belt";
  return "white belt";
}

function levelFrom(receipts: number, passRate: number, lineage: number) {
  const trustBoost = Math.round(passRate * 4);
  const lineageBoost = Math.min(8, Math.floor(lineage / 2));
  return clamp(Math.max(1, Math.floor(receipts / 3) + trustBoost + lineageBoost), 1, 99);
}

export function buildWorkflowSpiritProfile(input: WorkflowSpiritInput): WorkflowSpiritProfile {
  const receipts = Math.max(0, input.runCount ?? 0);
  const lineage = Math.max(0, input.forkCount ?? 0);
  const passRate = normalizeTrust(input.trustScore);
  const royaltyBps = Math.max(0, input.royaltyBps ?? 0);
  const seed = hashSeed([
    input.workflowId,
    input.slug,
    input.category ?? "",
    input.creatorId ?? input.creatorName ?? "",
  ].join(":"));
  const level = levelFrom(receipts, passRate, lineage);
  const mood = passRate >= 0.95 ? "focused" : passRate >= 0.8 ? "training" : "needs review";
  const discipline = disciplineFor(input.category);
  const archetype = pick(
    ["Mantis Adept", "Gate Runner", "Receipt Monk", "Fork Student", "Ledger Sensei"],
    seed,
  );
  const aura = pick(["bamboo", "ink", "vermilion", "gold", "night"], seed, 2);
  const pattern = pick(["tatami", "seal", "lineage", "ring", "ledger"], seed, 4);
  const palettes = [
    { accent: "#A92727", mat: "#DCE5CB", ink: "#0B0C0E" },
    { accent: "#1E7954", mat: "#E7ECD7", ink: "#102017" },
    { accent: "#A67A2B", mat: "#EEE6D2", ink: "#20170B" },
    { accent: "#4F5F8F", mat: "#E4E8DC", ink: "#111827" },
    { accent: "#7A3E5C", mat: "#ECE6DF", ink: "#1A1016" },
  ] as const;
  const palette = pick(palettes, seed, 6);

  return {
    profileId: `spirit_${hashSeed(`${input.workflowId}:${input.slug}`).toString(16).padStart(8, "0")}`,
    mintStatus: "generated",
    name: `${input.name} Spirit`,
    archetype,
    discipline,
    belt: beltFor(level),
    level,
    mood,
    aura,
    pattern,
    palette,
    stats: {
      receipts,
      passRate,
      lineage,
      royaltyBps,
    },
    lineageRevenue: {
      royaltyBps,
      label: `${(royaltyBps / 100).toFixed(1)}% lineage revenue`,
    },
  };
}

export function buildWorkflowFeedingEvent({
  receiptId,
  score,
  settlementStatus,
  spirit,
}: {
  receiptId: string;
  score: number;
  settlementStatus: string;
  spirit: WorkflowSpiritProfile;
}): WorkflowFeedingEvent {
  const passed = score > 0 && settlementStatus === "paid";
  return {
    kind: "feeding_event",
    profileId: spirit.profileId,
    receiptId,
    result: passed ? "PASS" : "FAIL",
    score,
    settlementStatus,
    levelAfter: spirit.level,
    reputationDelta: passed ? "+feed" : "recorded-no-feed",
  };
}
