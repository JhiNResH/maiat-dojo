import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPrivyAuth } from '@/lib/privy-server';
import { attestSessionClose } from '@/lib/bas';

export const dynamic = 'force-dynamic';

/**
 * POST /api/sessions/[id]/close
 *
 * Agent owner manually closes an active/funded session early and marks the
 * remaining budget as refunded. DB-only in Phase 1 — no on-chain USDC refund
 * tx yet (Phase 2 adds MicroEvaluator settle + actual fund release).
 *
 * Idempotent: if session is already 'settled' or 'refunded', returns current
 * state with 200 rather than an error.
 *
 * See: specs/2026-04-05-session-as-job-migration.md
 *
 * Body: {
 *   privyId: string;   // must match Authorization header JWT subject
 * }
 *
 * Response 200: {
 *   session: {
 *     id, status, budgetTotal, budgetRemaining, pricePerCall,
 *     callCount, openedAt, expiresAt, settledAt, skillId, payerAgentId,
 *     onchainJobId, refundedAmount
 *   }
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;

    // 1. Parse body — require privyId
    const body = await req.json();
    const { privyId } = body as { privyId?: string };

    if (!privyId) {
      return NextResponse.json(
        { error: 'Missing required field: privyId' },
        { status: 400 }
      );
    }

    // 2. Verify JWT; privyId in body must match token subject
    const authResult = await verifyPrivyAuth(req.headers.get('Authorization'));
    if (!authResult.success || authResult.privyId !== privyId) {
      return NextResponse.json(
        { error: 'Unauthorized — privyId mismatch' },
        { status: 403 }
      );
    }

    // 3. Resolve user
    const user = await prisma.user.findUnique({ where: { privyId } });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found — sync account first' },
        { status: 404 }
      );
    }

    // 4. Resolve session with agent (+ owner for erc8004TokenId) + skill
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        agent: { include: { owner: true } },
        skill: true,
      },
    });
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // 5. Verify ownership — caller must own the payer agent
    if (session.agent.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden — not owner of this session' },
        { status: 403 }
      );
    }

    // 6. Idempotency — already terminal, return current state (no error)
    if (session.status === 'refunded' || session.status === 'settled') {
      return NextResponse.json({
        session: buildResponse(session),
      });
    }

    // 7. State guard — only funded/active sessions can be manually closed
    if (session.status !== 'funded' && session.status !== 'active') {
      return NextResponse.json(
        {
          error: `Cannot close session in status '${session.status}' — must be 'funded' or 'active'`,
        },
        { status: 409 }
      );
    }

    // Warn if on-chain binding never completed (ops reconciliation)
    if (!session.onchainJobId) {
      console.warn('[sessions/close] onchainJobId not set at close time:', {
        sessionId: session.id,
        status: session.status,
        reason: 'on-chain binding may have failed at open — reconcile manually',
      });
    }

    // 8. Update session — mark refunded, stamp settledAt, preserve budgetRemaining for audit
    // TODO(Phase 2): call MicroEvaluator.settle(onchainJobId) here to release
    //   actual USDC escrow back to agent wallet on-chain before updating DB.
    const refundedAmount = session.budgetRemaining;
    const now = new Date();

    // Atomic close with status guard — prevents race with concurrent gateway calls
    const closeResult = await prisma.session.updateMany({
      where: {
        id: session.id,
        status: { in: ['funded', 'active'] },
      },
      data: {
        status: 'refunded',
        settledAt: now,
        // budgetRemaining intentionally preserved — records the refund amount
      },
    });

    if (closeResult.count === 0) {
      // Another request won the race — re-read current state and return idempotently
      const current = await prisma.session.findUnique({
        where: { id: session.id },
        include: { agent: true, skill: true },
      });
      if (!current) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      return NextResponse.json({ session: buildResponse(current) });
    }

    // Re-read with includes for response shape
    const updated = await prisma.session.findUniqueOrThrow({
      where: { id: session.id },
      include: {
        agent: true,
        skill: true,
      },
    });

    console.log('[sessions/close] session closed:', {
      sessionId: updated.id,
      previousStatus: session.status,
      newStatus: updated.status,
      refundedAmount,
      callCount: updated.callCount,
      settledAt: now.toISOString(),
    });

    // 9. BAS attestation — fire-and-forget, never blocks response
    void (async () => {
      try {
        const agentWallet = (session.agent.walletAddress ?? '0x0000000000000000000000000000000000000000') as `0x${string}`;
        const agentId = session.agent.owner.erc8004TokenId ?? 0n;
        const budgetUsedUsdc = BigInt(
          Math.max(0, Math.round((updated.budgetTotal - updated.budgetRemaining) * 1e6))
        );

        const result = await attestSessionClose({
          agentWallet,
          agentId,
          skillId: updated.skillId,
          callCount: BigInt(updated.callCount),
          budgetUsedUsdc,
          outcome: 0, // refunded (manual close)
        });

        if (result.success && result.uid) {
          await prisma.session.update({
            where: { id: updated.id },
            data: { basAttestationUid: result.uid },
          });
          console.log('[bas] attestation stored:', { sessionId: updated.id, uid: result.uid });
        }
      } catch (err) {
        console.error('[bas] fire-and-forget attestation failed:', err);
      }
    })();

    // 10. Return updated session
    return NextResponse.json({
      session: buildResponse(updated),
    });
  } catch (err: unknown) {
    console.error('[POST /api/sessions/[id]/close]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Shape matches sessions/open response + adds settledAt and refundedAmount. */
function buildResponse(session: {
  id: string;
  status: string;
  budgetTotal: number;
  budgetRemaining: number;
  pricePerCall: number;
  callCount: number;
  openedAt: Date;
  expiresAt: Date;
  settledAt: Date | null;
  skillId: string;
  payerAgentId: string;
  onchainJobId: string | null;
}) {
  return {
    id: session.id,
    status: session.status,
    budgetTotal: session.budgetTotal,
    budgetRemaining: session.budgetRemaining,
    pricePerCall: session.pricePerCall,
    callCount: session.callCount,
    openedAt: session.openedAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    settledAt: session.settledAt?.toISOString() ?? null,
    skillId: session.skillId,
    payerAgentId: session.payerAgentId,
    onchainJobId: session.onchainJobId,
    refundedAmount: session.budgetRemaining,
  };
}
