import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/receipts/:receiptId
 *
 * Public proof endpoint for cleared workflow runs.
 * Used by MCP / CLI / external agents to inspect the receipt behind /r/:id.
 */
export async function GET(
  _req: Request,
  { params }: { params: { receiptId: string } },
) {
  const receipt = await prisma.workflowRunReceipt.findUnique({
    where: { id: params.receiptId },
    include: {
      workflow: {
        select: {
          id: true,
          slug: true,
          name: true,
          trustScore: true,
          runCount: true,
        },
      },
      version: {
        select: {
          id: true,
          version: true,
          title: true,
          evaluatorPolicy: true,
          slaMs: true,
        },
      },
      skillCall: {
        select: {
          id: true,
          nonce: true,
          status: true,
          httpStatus: true,
          latencyMs: true,
          createdAt: true,
        },
      },
      session: {
        select: {
          id: true,
          status: true,
          onchainJobId: true,
          basAttestationUid: true,
          skill: {
            select: {
              id: true,
              name: true,
              gatewaySlug: true,
            },
          },
        },
      },
      buyerAgent: {
        select: {
          id: true,
          name: true,
          walletAddress: true,
          trustScore: true,
        },
      },
      creator: {
        select: {
          id: true,
          displayName: true,
          walletAddress: true,
        },
      },
    },
  });

  if (!receipt) {
    return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: receipt.id,
    url: `/r/${receipt.id}`,
    workflow: {
      id: receipt.workflow.id,
      slug: receipt.workflow.slug,
      name: receipt.workflow.name,
      trust_score: receipt.workflow.trustScore,
      run_count: receipt.workflow.runCount,
    },
    version: receipt.version
      ? {
          id: receipt.version.id,
          version: receipt.version.version,
          title: receipt.version.title,
          evaluator_policy: receipt.version.evaluatorPolicy,
          sla_ms: receipt.version.slaMs,
        }
      : null,
    skill: {
      id: receipt.session.skill.id,
      name: receipt.session.skill.name,
      gateway_slug: receipt.session.skill.gatewaySlug,
    },
    clearing: {
      result: receipt.score > 0 && receipt.settlementStatus === 'paid' ? 'PASS' : 'FAIL',
      score: receipt.score,
      settlement_status: receipt.settlementStatus,
      cost_usdc: receipt.costUsdc,
      creator_received_usdc: receipt.settlementStatus === 'paid'
        ? Math.max(0, receipt.costUsdc * 0.9)
        : 0,
      platform_fee_usdc: receipt.settlementStatus === 'paid' ? receipt.costUsdc * 0.05 : 0,
      reputation_pool_usdc: receipt.settlementStatus === 'paid' ? receipt.costUsdc * 0.05 : 0,
    },
    evaluator: {
      name: receipt.evaluator,
      delivered: receipt.delivered,
      valid_format: receipt.validFormat,
      within_sla: receipt.withinSla,
      latency_ms: receipt.skillCall?.latencyMs ?? null,
      http_status: receipt.skillCall?.httpStatus ?? null,
    },
    proof: {
      request_hash: receipt.requestHash,
      response_hash: receipt.responseHash,
      attestation_uid: receipt.attestationUid ?? receipt.session.basAttestationUid,
      anchor_status: receipt.anchorStatus,
      onchain_request_id: receipt.onchainRequestId,
      swap_tx_hash: receipt.swapTxHash,
      settle_tx_hash: receipt.settleTxHash,
      anchor_error: receipt.anchorError,
    },
    participants: {
      buyer_agent: receipt.buyerAgent,
      creator: receipt.creator,
    },
    session: {
      id: receipt.session.id,
      status: receipt.session.status,
      onchain_job_id: receipt.session.onchainJobId,
    },
    created_at: receipt.createdAt.toISOString(),
  });
}
