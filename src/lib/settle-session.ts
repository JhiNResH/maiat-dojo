/**
 * Settlement Pipeline — extracted from sessions/[id]/close/route.ts
 *
 * Reusable module for settling sessions from any caller:
 *   - POST /api/sessions/[id]/close  (Privy JWT auth)
 *   - POST /api/v1/run               (auto-close on budget exhaustion)
 *   - POST /api/v1/close             (API key auth, manual close)
 *
 * Pipeline (sequential, fire-and-forget from caller):
 *   1. Load session + relations
 *   2. Aggregate SkillCall scores → passRate → PASS/FAIL
 *   3. On-chain bind (if onchainJobId null) → createSessionOnChain
 *   4. On-chain settle (if PASS + jobId) → settleSessionOnChain
 *   5. DB close → settled | refunded
 *   6. BAS attestation → store uid
 *   7. Trust update → cumulative passRate → DojoTrustScore
 *
 * Phase 1: relayer = client = provider. USDC is circular.
 */

import { prisma } from '@/lib/prisma';
import { createSessionOnChain, settleSessionOnChain } from '@/lib/bsc-acp';
import { attestSessionClose } from '@/lib/bas';
import { updateCreatorTrustScore } from '@/lib/trust-oracle';

const PASS_THRESHOLD = 80; // ≥80% of calls must pass

export interface SettleResult {
  success: boolean;
  status: 'settled' | 'refunded' | 'already_terminal';
  passRate: number;
  totalCalls: number;
  onchainJobId: string | null;
  basAttestationUid: string | null;
  error?: string;
}

/**
 * Settle a session end-to-end: score → on-chain → DB close → BAS → trust.
 *
 * Idempotent: returns early if session is already in a terminal state.
 * Graceful degradation: on-chain/BAS/trust failures are logged, never thrown.
 */
export async function settleSession(sessionId: string): Promise<SettleResult> {
  // 1. Load session with agent (+ owner) + skill (+ creator)
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      agent: { include: { owner: true } },
      skill: { include: { creator: true } },
    },
  });

  if (!session) {
    return {
      success: false,
      status: 'already_terminal',
      passRate: 0,
      totalCalls: 0,
      onchainJobId: null,
      basAttestationUid: null,
      error: 'Session not found',
    };
  }

  // Idempotency — already terminal
  if (session.status === 'settled' || session.status === 'refunded') {
    return {
      success: true,
      status: 'already_terminal',
      passRate: 0,
      totalCalls: 0,
      onchainJobId: session.onchainJobId,
      basAttestationUid: session.basAttestationUid,
    };
  }

  // State guard — only funded/active sessions can be settled
  if (session.status !== 'funded' && session.status !== 'active') {
    return {
      success: false,
      status: 'already_terminal',
      passRate: 0,
      totalCalls: 0,
      onchainJobId: session.onchainJobId,
      basAttestationUid: null,
      error: `Cannot settle session in status '${session.status}'`,
    };
  }

  // 2. Aggregate SkillCall scores → PASS/FAIL
  const calls = await prisma.skillCall.findMany({
    where: { sessionId: session.id },
    select: { score: true },
  });

  const totalCalls = calls.length;
  const passedCalls = calls.filter((c) => c.score > 0.5).length;
  const passRate = totalCalls > 0 ? Math.round((passedCalls / totalCalls) * 100) : 0;
  const finalScore = passRate;
  const isPASS = totalCalls > 0 && passRate >= PASS_THRESHOLD;

  console.log('[settle] evaluation:', {
    sessionId: session.id,
    totalCalls,
    passedCalls,
    passRate,
    isPASS,
  });

  // 3. On-chain bind (if onchainJobId is null)
  // Budget = amount actually spent (not the pre-funded session budget)
  let onchainJobId = session.onchainJobId;

  if (!onchainJobId && process.env.DOJO_RELAYER_PRIVATE_KEY) {
    const amountSpent = session.budgetTotal - session.budgetRemaining;
    // Only create on-chain job if there was actual spend
    if (amountSpent > 0) {
      try {
        // Convert USDC to 18-decimal bigint (BSC USDC = 18 decimals)
        const budgetUsdc = BigInt(Math.round(amountSpent * 1e18));
        const expiredAt = BigInt(Math.floor(session.expiresAt.getTime() / 1000));

        const bindResult = await createSessionOnChain({
          description: `dojo:${session.id}`,
          expiredAt,
          budgetUsdc,
        });

        if (bindResult.success && bindResult.jobId) {
          onchainJobId = bindResult.jobId;
          await prisma.session.update({
            where: { id: session.id },
            data: { onchainJobId },
          });
          console.log('[settle] on-chain bind:', { sessionId: session.id, jobId: onchainJobId });
        } else {
          console.warn('[settle] on-chain bind failed (non-fatal):', {
            sessionId: session.id,
            error: bindResult.error,
          });
        }
      } catch (err) {
        console.error('[settle] on-chain bind exception (non-fatal):', err);
      }
    }
  } else if (!onchainJobId) {
    console.warn('[settle] DOJO_RELAYER_PRIVATE_KEY not set — skipping on-chain bind');
  }

  // 4. On-chain settle (PASS only + jobId exists)
  if (isPASS && onchainJobId) {
    try {
      const settleResult = await settleSessionOnChain({
        jobId: onchainJobId,
        sessionId: session.id,
        callCount: session.callCount,
      });
      console.log('[settle] on-chain settle:', {
        sessionId: session.id,
        onchainJobId,
        success: settleResult.success,
        txHash: settleResult.txHash,
        error: settleResult.error,
      });
    } catch (err) {
      console.error('[settle] on-chain settle exception (non-fatal):', err);
    }
  }

  // 5. DB close — PASS→settled, FAIL→refunded
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
    },
  });

  if (closeResult.count === 0) {
    // Another request won the race — idempotent return
    const current = await prisma.session.findUnique({
      where: { id: session.id },
    });
    return {
      success: true,
      status: 'already_terminal',
      passRate,
      totalCalls,
      onchainJobId: current?.onchainJobId ?? onchainJobId,
      basAttestationUid: current?.basAttestationUid ?? null,
    };
  }

  console.log('[settle] session closed:', {
    sessionId: session.id,
    newStatus,
    isPASS,
    passRate,
    callCount: session.callCount,
  });

  // 6. BAS attestation + 7. Trust update — sequential, fire-and-forget
  let basAttestationUid: string | null = null;

  try {
    const agentAddress = session.agent.walletAddress as `0x${string}` | null;
    const creatorAddress = session.skill.creator.walletAddress as `0x${string}` | null;

    if (!agentAddress || !creatorAddress) {
      console.warn('[settle] skipping attestation — missing wallet address:', {
        sessionId: session.id,
        agentHasWallet: !!agentAddress,
        creatorHasWallet: !!creatorAddress,
      });
    } else {
      const attestResult = await attestSessionClose({
        sessionId: session.id,
        finalScore,
        callCount: session.callCount,
        passRate,
        creatorAddress,
        agentAddress,
      });

      if (attestResult.success && attestResult.uid) {
        basAttestationUid = attestResult.uid;
        await prisma.session.update({
          where: { id: session.id },
          data: { basAttestationUid },
        });
        console.log('[settle] attestation stored:', { sessionId: session.id, uid: basAttestationUid });
      }
    }

    // Trust oracle update — cumulative passRate across all terminal sessions
    const creatorWallet = session.skill.creator.walletAddress;
    if (creatorWallet) {
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
      const passedCumCalls = allCalls.filter((c) => c.score > 0.5).length;
      const cumulativePassRate =
        totalCumCalls > 0 ? Math.round((passedCumCalls / totalCumCalls) * 100) : passRate;

      await updateCreatorTrustScore({
        creatorAddress: creatorWallet,
        passRate: cumulativePassRate,
        sessionCount,
      });
    } else {
      console.warn('[settle] creator has no wallet — skipping trust update:', session.id);
    }
  } catch (err) {
    console.error('[settle] BAS/trust fire-and-forget failed:', err);
  }

  return {
    success: true,
    status: newStatus,
    passRate,
    totalCalls,
    onchainJobId,
    basAttestationUid,
  };
}
