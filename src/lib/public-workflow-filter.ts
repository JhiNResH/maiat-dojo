import type { Prisma } from "@prisma/client";

const internalWorkflowMarkers = [
  "Codex E2E Quick Audit",
  "Codex Production E2E",
  "Production E2E",
  "E2E Fork",
];

const internalWorkflowSlugMarkers = [
  "codex-e2e-quick-audit",
  "codex-production-e2e",
  "production-e2e",
  "e2e-fork",
  "mohs6djl",
  "mohseow",
];

const internalWorkflowClauses: Prisma.WorkflowWhereInput[] = [
  ...internalWorkflowMarkers.map((marker) => ({ name: { contains: marker } })),
  ...internalWorkflowSlugMarkers.map((marker) => ({ slug: { contains: marker } })),
];

export function publicWorkflowWhere(extra: Prisma.WorkflowWhereInput = {}): Prisma.WorkflowWhereInput {
  return {
    status: "published",
    NOT: [{ OR: internalWorkflowClauses }],
    ...extra,
  };
}
