-- Add workflow marketplace primitives.
-- Current Skill rows remain the v1 execution target; Workflow wraps them with
-- versioning, fork lineage, run receipts, and reputation.

CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '⚙️',
    "status" TEXT NOT NULL DEFAULT 'published',
    "pricePerRun" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "royaltyBps" INTEGER NOT NULL DEFAULT 500,
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "forkCount" INTEGER NOT NULL DEFAULT 0,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "skillId" TEXT,
    "creatorId" TEXT NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkflowVersion" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "inputSchema" TEXT,
    "outputSchema" TEXT,
    "stepGraph" TEXT NOT NULL,
    "evaluatorPolicy" TEXT NOT NULL,
    "slaMs" INTEGER NOT NULL DEFAULT 5000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkflowFork" (
    "id" TEXT NOT NULL,
    "parentWorkflowId" TEXT NOT NULL,
    "childWorkflowId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "royaltyBps" INTEGER NOT NULL DEFAULT 500,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowFork_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkflowRunReceipt" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "versionId" TEXT,
    "skillCallId" TEXT,
    "sessionId" TEXT NOT NULL,
    "buyerAgentId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "evaluator" TEXT NOT NULL DEFAULT 'dojo-sanity-v1',
    "requestHash" TEXT NOT NULL,
    "responseHash" TEXT,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "validFormat" BOOLEAN NOT NULL DEFAULT false,
    "withinSla" BOOLEAN NOT NULL DEFAULT false,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costUsdc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "settlementStatus" TEXT NOT NULL DEFAULT 'paid',
    "attestationUid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowRunReceipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Workflow_slug_key" ON "Workflow"("slug");
CREATE UNIQUE INDEX "Workflow_skillId_key" ON "Workflow"("skillId");
CREATE INDEX "Workflow_status_category_idx" ON "Workflow"("status", "category");
CREATE INDEX "Workflow_creatorId_idx" ON "Workflow"("creatorId");

CREATE UNIQUE INDEX "WorkflowVersion_workflowId_version_key" ON "WorkflowVersion"("workflowId", "version");
CREATE INDEX "WorkflowVersion_workflowId_idx" ON "WorkflowVersion"("workflowId");

CREATE UNIQUE INDEX "WorkflowFork_childWorkflowId_key" ON "WorkflowFork"("childWorkflowId");
CREATE INDEX "WorkflowFork_parentWorkflowId_idx" ON "WorkflowFork"("parentWorkflowId");
CREATE INDEX "WorkflowFork_creatorId_idx" ON "WorkflowFork"("creatorId");

CREATE UNIQUE INDEX "WorkflowRunReceipt_skillCallId_key" ON "WorkflowRunReceipt"("skillCallId");
CREATE INDEX "WorkflowRunReceipt_workflowId_createdAt_idx" ON "WorkflowRunReceipt"("workflowId", "createdAt");
CREATE INDEX "WorkflowRunReceipt_buyerAgentId_createdAt_idx" ON "WorkflowRunReceipt"("buyerAgentId", "createdAt");
CREATE INDEX "WorkflowRunReceipt_creatorId_createdAt_idx" ON "WorkflowRunReceipt"("creatorId", "createdAt");
CREATE INDEX "WorkflowRunReceipt_sessionId_idx" ON "WorkflowRunReceipt"("sessionId");

ALTER TABLE "Workflow"
ADD CONSTRAINT "Workflow_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Workflow"
ADD CONSTRAINT "Workflow_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkflowVersion"
ADD CONSTRAINT "WorkflowVersion_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkflowFork"
ADD CONSTRAINT "WorkflowFork_parentWorkflowId_fkey" FOREIGN KEY ("parentWorkflowId") REFERENCES "Workflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkflowFork"
ADD CONSTRAINT "WorkflowFork_childWorkflowId_fkey" FOREIGN KEY ("childWorkflowId") REFERENCES "Workflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkflowFork"
ADD CONSTRAINT "WorkflowFork_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkflowRunReceipt"
ADD CONSTRAINT "WorkflowRunReceipt_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkflowRunReceipt"
ADD CONSTRAINT "WorkflowRunReceipt_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "WorkflowVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WorkflowRunReceipt"
ADD CONSTRAINT "WorkflowRunReceipt_skillCallId_fkey" FOREIGN KEY ("skillCallId") REFERENCES "SkillCall"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WorkflowRunReceipt"
ADD CONSTRAINT "WorkflowRunReceipt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkflowRunReceipt"
ADD CONSTRAINT "WorkflowRunReceipt_buyerAgentId_fkey" FOREIGN KEY ("buyerAgentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkflowRunReceipt"
ADD CONSTRAINT "WorkflowRunReceipt_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
