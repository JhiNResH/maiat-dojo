export const LEGACY_WORKFLOW_SLUGS = new Set([
  "agent-repo-analyst",
  "market-hotspot-brief",
  "token-risk-check",
]);

export function isLegacyWorkflowSlug(slug: string | null | undefined) {
  return Boolean(slug && LEGACY_WORKFLOW_SLUGS.has(slug));
}
