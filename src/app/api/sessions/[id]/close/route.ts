import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPrivyAuth } from '@/lib/privy-server';
import { attestSessionClose } from '@/lib/bas';
import { settleSessionOnChain } from '@/lib/bsc-acp';
import { updateCreatorTrustScore } from '@/lib/trust-oracle';

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

    // 4. Resolve session with agent (+ owner for erc8004TokenId) + skill (+ creator for trust update)
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        agent: { include: { owner: true } },
        skill: { include: { creator: true } },
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

    // 8. Aggregate SkillCall scores → PASS/FAIL decision
    const calls = await prisma.skillCall.findMany({
      where: { sessionId: session.id },
      select: { score: true },
    });

    const totalCalls = calls.length;
    const passedCalls = calls.filter((c) => c.score >= 1.0).length;
    const passRate = totalCalls > 0 ? Math.round((passedCalls / totalCalls) * 100) : 0;
    const finalScore = passRate; // 0–100; same as passRate for binary Phase 1 scoring
    const PASS_THRESHOLD = 80;  // ≥80% of calls must pass
    const isPASS = totalCalls > 0 && passRate >= PASS_THRESHOLD;

    console.log('[sessions/close] evaluation:', {
      sessionId: session.id,
      totalCalls,
      passedCalls,
      passRate,
      isPASS,
    });

    // 9. Fire-and-forget: on-chain settle (PASS only) via TrustBasedEvaluator.
    //    Runs concurrently with DB update — failures are logged, never block response.
    if (isPASS && session.onchainJobId) {
      settleSessionOnChain({
        jobId: session.onchainJobId,
        sessionId: session.id,
        callCount: session.callCount,
      })
        .then((result) => {
          console.log('[sessions/close] BSC settle:', {
            sessionId: session.id,
            onchainJobId: session.onchainJobId,
            success: result.success,
            txHash: result.txHash,
            error: result.error,
          });
        })
        .catch((err) => {
          console.error('[sessions/close] BSC settle exception:', err);
        });
    }

    // 10. Atomic close with status guard — PASS→settled, FAIL→refunded
    const now = new Date();
    const newStatus = isPASS ? 'settled' : 'refunded';

    const closeResult = await prisma.session.updateMany({
      where: {
        id: session.id,
        status: { in: ['funded', 'active'] },
      },
      data: {
        status: newStatus,
        settledAt: now,
        // budgetRemaining intentionally preserved — records remaining amount for audit
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
      isPASS,
      passRate,
      callCount: updated.callCount,
      settledAt: now.toISOString(),
    });

    // 11. BAS attestation → TrustScoreOracle update — fire-and-forget, chained sequentially.
    //     Trust update runs AFTER attestation (Attest[8] → Trust[10] ordering).
    //     Trust oracle receives cumulative passRate across all skill sessions (not per-session)
    //     because DojoTrustScore.updateScore() does direct assignment, not EMA.
    void (async () => {
      try {
        const agentAddress = (session.agent.walletAddress ?? '0x0000000000000000000000000000000000000000') as `0x${string}`;
        const creatorAddress = (session.skill.creator.walletAddress ?? '0x0000000000000000000000000000000000000000') as `0x${string}`;

        const result = await attestSessionClose({
          sessionId: updated.id,
          finalScore,
          callCount: updated.callCount,
          passRate,
          creatorAddress,
          agentAddress,
        });

        if (result.success && result.uid) {
          await prisma.session.update({
            where: { id: updated.id },
            data: { basAttestationUid: result.uid },
          });
          console.log('[bas] attestation stored:', { sessionId: updated.id, uid: result.uid });
        }

        // Trust oracle update — runs after attestation is queued
        const creatorWallet = session.skill.creator.walletAddress;
        if (!creatorWallet) {
          console.warn('[trust] creator has no wallet — skipping trust update for session:', updated.id);
          return;
        }

        // Compute cumulative passRate across all terminal sessions for this skill.
        // DojoTrustScore.updateScore() is a direct assignment (not EMA), so we must
        // pass the all-time passRate, not just this session's.
        const [allCalls, sessionCount] = await Promise.all([
          prisma.skillCall.findMany({
            where: {
              session: {
                skillId: session.skillId,
                status: { in: ['settled', 'refunded'] },
              },
            },
            select: { score: true },
          }),
          prisma.session.count({
            where: {
              skillId: session.skillId,
              status: { in: ['settled', 'refunded'] },
            },
          }),
        ]);

        const totalCumCalls = allCalls.length;
        const passedCumCalls = allCalls.filter((c) => c.score >= 1.0).length;
        const cumulativePassRate =
          totalCumCalls > 0 ? Math.round((passedCumCalls / totalCumCalls) * 100) : passRate;

        await updateCreatorTrustScore({
          creatorAddress: creatorWallet,
          passRate: cumulativePassRate,
          sessionCount,
        });
      } catch (err) {
        console.error('[bas+trust] fire-and-forget failed:', err);
      }
    })();

    // 13. Return updated session
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
