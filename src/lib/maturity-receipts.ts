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

export async function fetchLatestMaturityReceiptsByWorkflowId(
  workflowIds: string[],
  perWorkflowTake = 20,
): Promise<WorkflowMaturityReceiptEvidence[]> {
  const uniqueWorkflowIds = [...new Set(workflowIds)];
  if (uniqueWorkflowIds.length === 0) return [];

  const rows = await Promise.all(
    uniqueWorkflowIds.map((workflowId) => prisma.workflowRunReceipt.findMany({
      where: { workflowId },
      orderBy: { createdAt: 'desc' },
      take: perWorkflowTake,
      select: MATURITY_RECEIPT_SELECT,
    })),
  );

  return rows.flat();
}
