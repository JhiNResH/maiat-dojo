import { prisma } from '@/lib/prisma';
import type { WorkflowMaturityReceiptEvidence } from '@/lib/skill-maturity';

const MATURITY_RECEIPT_SELECT = {
  workflowId: true,
  settlementStatus: true,
  score: true,
  skillVersion: true,
  contextRefs: true,
  artifactRefs: true,
  evaluatorEvidence: true,
  lineageDepth: true,
} as const;

const MAX_MATURITY_RECEIPTS_PER_WORKFLOW = 100;
const MATURITY_RECEIPT_QUERY_BATCH_SIZE = 8;

function clampPerWorkflowTake(perWorkflowTake: number) {
  if (!Number.isFinite(perWorkflowTake)) return MAX_MATURITY_RECEIPTS_PER_WORKFLOW;
  return Math.max(1, Math.min(MAX_MATURITY_RECEIPTS_PER_WORKFLOW, Math.floor(perWorkflowTake)));
}

export async function fetchLatestMaturityReceiptsByWorkflowId(
  workflowIds: string[],
  perWorkflowTake = 20,
): Promise<WorkflowMaturityReceiptEvidence[]> {
  const uniqueWorkflowIds = [...new Set(workflowIds)];
  if (uniqueWorkflowIds.length === 0) return [];

  const take = clampPerWorkflowTake(perWorkflowTake);
  const rows: WorkflowMaturityReceiptEvidence[][] = [];
  for (let offset = 0; offset < uniqueWorkflowIds.length; offset += MATURITY_RECEIPT_QUERY_BATCH_SIZE) {
    const batch = uniqueWorkflowIds.slice(offset, offset + MATURITY_RECEIPT_QUERY_BATCH_SIZE);
    const batchRows = await Promise.all(
      batch.map((workflowId) => prisma.workflowRunReceipt.findMany({
        where: { workflowId },
        orderBy: { createdAt: 'desc' },
        take,
        select: MATURITY_RECEIPT_SELECT,
      })),
    );
    rows.push(...batchRows);
  }

  return rows.flat();
}
