import type { AgentFamilyCode } from "@prisma/client";

export const AGENT_FAMILY_CODES = ["R8", "SLR", "BYR", "NEG", "VFY"] as const;

export type CanonicalAgentFamilyCode = (typeof AGENT_FAMILY_CODES)[number];

export function normalizeAgentFamilyCode(input: unknown): AgentFamilyCode {
  if (typeof input !== "string" || input.trim() === "") return "R8";

  const normalized = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (normalized === "SLLR" || normalized === "SELLER") return "SLR";

  if (AGENT_FAMILY_CODES.includes(normalized as CanonicalAgentFamilyCode)) {
    return normalized as AgentFamilyCode;
  }

  throw new Error(`Unsupported agent family code: ${input}`);
}

export function defaultAgentFamilyName(code: AgentFamilyCode) {
  if (code === "R8") return "Review Agents";
  if (code === "SLR") return "Seller Agents";
  if (code === "BYR") return "Buyer Agents";
  if (code === "NEG") return "Negotiator Agents";
  return "Verifier Agents";
}
