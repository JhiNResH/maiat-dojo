-- Persist NFA marketplace family metadata on Agent.
-- "SLL-R" user shorthand maps to the canonical seller code "SLR".

CREATE TYPE "AgentFamilyCode" AS ENUM ('R8', 'SLR', 'BYR', 'NEG', 'VFY');

ALTER TABLE "Agent" ADD COLUMN "familyCode" "AgentFamilyCode" NOT NULL DEFAULT 'R8';
ALTER TABLE "Agent" ADD COLUMN "familyName" TEXT;
ALTER TABLE "Agent" ADD COLUMN "nfaId" TEXT;
ALTER TABLE "Agent" ADD COLUMN "agentIdentity" TEXT;
ALTER TABLE "Agent" ADD COLUMN "proofLevel" TEXT NOT NULL DEFAULT 'identity';
ALTER TABLE "Agent" ADD COLUMN "serviceEndpoint" TEXT;
ALTER TABLE "Agent" ADD COLUMN "royaltyBps" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Agent" ADD COLUMN "lineageRoot" TEXT;
ALTER TABLE "Agent" ADD COLUMN "lineageParent" TEXT;

CREATE UNIQUE INDEX "Agent_nfaId_key" ON "Agent"("nfaId");
CREATE UNIQUE INDEX "Agent_agentIdentity_key" ON "Agent"("agentIdentity");
CREATE INDEX "Agent_familyCode_idx" ON "Agent"("familyCode");
CREATE INDEX "Agent_familyCode_proofLevel_idx" ON "Agent"("familyCode", "proofLevel");
