import { describe, expect, it } from "vitest";
import { publicWorkflowWhere } from "@/lib/public-workflow-filter";

describe("publicWorkflowWhere", () => {
  it("keeps public catalogs scoped to published workflows", () => {
    expect(publicWorkflowWhere()).toMatchObject({ status: "published" });
  });

  it("excludes Codex production E2E fork workflows from public catalogs", () => {
    expect(JSON.stringify(publicWorkflowWhere())).toContain("Codex Production E2E");
    expect(JSON.stringify(publicWorkflowWhere())).toContain("E2E Fork");
    expect(JSON.stringify(publicWorkflowWhere())).toContain("mohseow");
  });

  it("excludes Codex quick audit test workflows from public catalogs", () => {
    expect(JSON.stringify(publicWorkflowWhere())).toContain("Codex E2E Quick Audit");
    expect(JSON.stringify(publicWorkflowWhere())).toContain("codex-e2e-quick-audit");
    expect(JSON.stringify(publicWorkflowWhere())).toContain("mohs6djl");
  });

  it("preserves route-specific filters", () => {
    expect(publicWorkflowWhere({ category: "Agent Research" })).toMatchObject({
      status: "published",
      category: "Agent Research",
    });
  });
});
