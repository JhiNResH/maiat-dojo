import type { Prisma } from '@prisma/client';

interface RecordWorkflowRunInput {
  skillId: string;
  skillCallId: string;
  sessionId: string;
  buyerAgentId: string;
  requestHash: string;
  responseHash: string | null;
  delivered: boolean;
  validFormat: boolean;
  withinSla: boolean;
  score: number;
  costUsdc: number;
  settlementStatus: string;
}

export interface WorkflowReceiptSummary {
  id: string;
  workflowId: string;
  versionId: string | null;
  settlementStatus: string;
  anchorStatus: string;
  onchainRequestId: string | null;
  swapTxHash: string | null;
  settleTxHash: string | null;
}

export async function recordWorkflowRun(
  tx: Prisma.TransactionClient,
  input: RecordWorkflowRunInput,
): Promise<WorkflowReceiptSummary | null> {
  const workflow = await tx.workflow.findUnique({
    where: { skillId: input.skillId },
    include: {
      versions: {
        orderBy: { version: 'desc' },
        take: 1,
      },
    },
  });

  if (!workflow) return null;

  const latestVersion = workflow.versions[0] ?? null;
  const receipt = await tx.workflowRunReceipt.create({
    data: {
      workflowId: workflow.id,
      versionId: latestVersion?.id,
      skillCallId: input.skillCallId,
      sessionId: input.sessionId,
      buyerAgentId: input.buyerAgentId,
      creatorId: workflow.creatorId,
      requestHash: input.requestHash,
      responseHash: input.responseHash,
      delivered: input.delivered,
      validFormat: input.validFormat,
      withinSla: input.withinSla,
      score: input.score,
      costUsdc: input.costUsdc,
      settlementStatus: input.settlementStatus,
    },
  });

  const nextRunCount = workflow.runCount + 1;
  const nextTrustScore =
    ((workflow.trustScore * workflow.runCount) + (input.score * 100)) / nextRunCount;

  await tx.workflow.update({
    where: { id: workflow.id },
    data: {
      runCount: { increment: 1 },
      trustScore: nextTrustScore,
    },
  });

  return {
    id: receipt.id,
    workflowId: receipt.workflowId,
    versionId: receipt.versionId,
    settlementStatus: receipt.settlementStatus,
    anchorStatus: receipt.anchorStatus,
    onchainRequestId: receipt.onchainRequestId,
    swapTxHash: receipt.swapTxHash,
    settleTxHash: receipt.settleTxHash,
  };
}

export async function reconcileSessionReceipts(
  tx: Prisma.TransactionClient,
  sessionId: string,
  settlementStatus: 'paid' | 'refunded',
  anchor?: {
    status?: 'settled' | 'failed';
    settleTxHash?: string | null;
    error?: string | null;
  },
) {
  await tx.workflowRunReceipt.updateMany({
    where: { sessionId },
    data: {
      settlementStatus,
      ...(anchor?.status && { anchorStatus: anchor.status }),
      ...(anchor?.settleTxHash !== undefined && { settleTxHash: anchor.settleTxHash }),
      ...(anchor?.error !== undefined && { anchorError: anchor.error }),
    },
  });
}
