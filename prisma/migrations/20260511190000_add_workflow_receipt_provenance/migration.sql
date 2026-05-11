-- Add W3 receipt provenance fields used by the unified maturity ledger.
ALTER TABLE "WorkflowRunReceipt" ADD COLUMN "contextRefs" TEXT;
ALTER TABLE "WorkflowRunReceipt" ADD COLUMN "planSummary" TEXT;
ALTER TABLE "WorkflowRunReceipt" ADD COLUMN "artifactRefs" TEXT;
ALTER TABLE "WorkflowRunReceipt" ADD COLUMN "evaluatorEvidence" TEXT;
ALTER TABLE "WorkflowRunReceipt" ADD COLUMN "skillVersion" INTEGER;
ALTER TABLE "WorkflowRunReceipt" ADD COLUMN "skillUpdateSuggested" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WorkflowRunReceipt" ADD COLUMN "protocolUpdateSuggested" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WorkflowRunReceipt" ADD COLUMN "failurePatchType" TEXT;
ALTER TABLE "WorkflowRunReceipt" ADD COLUMN "quotedPriceUsdc" DOUBLE PRECISION;
ALTER TABLE "WorkflowRunReceipt" ADD COLUMN "maxPriceUsdc" DOUBLE PRECISION;
ALTER TABLE "WorkflowRunReceipt" ADD COLUMN "lineageParentWorkflowId" TEXT;
ALTER TABLE "WorkflowRunReceipt" ADD COLUMN "lineageDepth" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "WorkflowRunReceipt_skillVersion_idx" ON "WorkflowRunReceipt"("skillVersion");
CREATE INDEX "WorkflowRunReceipt_lineageParentWorkflowId_idx" ON "WorkflowRunReceipt"("lineageParentWorkflowId");
