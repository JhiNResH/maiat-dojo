/**
 * reconcile-pending-bsc-settle.ts
 *
 * Cron script: retry on-chain settle for sessions whose close handler couldn't
 * fire settleSessionOnChain inline (typically because open's fire-and-forget
 * BSC bind was still in flight when close arrived).
 *
 * Run: npx tsx scripts/reconcile-pending-bsc-settle.ts
 * Schedule: Vercel cron every 5 min
 *
 * Algorithm:
 *   1. Find recently-closed sessions (status in settled|refunded, settledAt within lookback)
 *   2. For each, resolve onchainJobId (re-read DB in case open's bind landed post-close)
 *   3. Read on-chain job status:
 *        Open(0)/Funded(1)/Submitted(2) → still needs settle → call settleSessionOnChain
 *        Completed(3)/Rejected(4)/Expired(5) → already terminal on-chain → skip
 *   4. Skip FAIL (refunded) sessions — Phase 1 evaluator auto-rejects nothing and
 *      there's no refund-release path until Phase 2 MicroEvaluator. Log only.
 *
 * Idempotent: re-runs are safe. settleSessionOnChain is guarded by on-chain
 * status; if the tx already landed, the next read returns Completed/Rejected
 * and this script skips.
 *
 * Related: src/app/api/sessions/[id]/close/route.ts (the handler that defers
 * settle when onchainJobId is still null at close time).
 */

import { PrismaClient } from '@prisma/client';
import { createBscPublicClient } from '@/lib/erc8004';
import { getContracts } from '@/lib/contracts';
import { settleSessionOnChain } from '@/lib/bsc-acp';

const prisma = new PrismaClient();
const MAX_PER_RUN = 25;
const LOOKBACK_MINUTES = 60; // only reconcile sessions closed within the last hour

// Matches scripts/check-onchain-job.ts — auto-getter output shape.
const ACP_ABI = [
  {
    type: 'function', name: 'jobs',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'id',          type: 'uint256' },
      { name: 'client',      type: 'address' },
      { name: 'provider',    type: 'address' },
      { name: 'evaluator',   type: 'address' },
      { name: 'hook',        type: 'address' },
      { name: 'description', type: 'string' },
      { name: 'budget',      type: 'uint256' },
      { name: 'expiredAt',   type: 'uint256' },
      { name: 'status',      type: 'uint8' },
    ],
    stateMutability: 'view',
  },
] as const;

const STATUS = ['Open', 'Funded', 'Submitted', 'Completed', 'Rejected', 'Expired'] as const;
const NEEDS_SETTLE = new Set([0, 1, 2]); // Open, Funded, Submitted

async function readJobStatus(acp: `0x${string}`, jobId: bigint): Promise<number | null> {
  try {
    const client = createBscPublicClient();
    const result = await client.readContract({
      address: acp,
      abi: ACP_ABI,
      functionName: 'jobs',
      args: [jobId],
    }) as readonly [bigint, string, string, string, string, string, bigint, bigint, number];
    return result[8];
  } catch (e) {
    console.warn(`[reconcile] jobs(${jobId}) read failed:`, (e as Error).message);
    return null;
  }
}

async function main() {
  console.log('[reconcile] starting pending BSC settle reconciliation...');

  const acpAddress = (process.env.BSC_ACP_ADDRESS ?? getContracts().agenticCommerceHooked) as `0x${string}`;
  if (!acpAddress || acpAddress === '0x0000000000000000000000000000000000000000') {
    console.error('[reconcile] BSC_ACP_ADDRESS not configured — aborting');
    return;
  }

  const since = new Date(Date.now() - LOOKBACK_MINUTES * 60 * 1000);

  // PASS sessions (settled) only — FAIL (refunded) has no release path in Phase 1.
  const candidates = await prisma.session.findMany({
    where: {
      status: 'settled',
      settledAt: { gte: since },
    },
    select: {
      id: true,
      onchainJobId: true,
      callCount: true,
      settledAt: true,
    },
    orderBy: { settledAt: 'asc' },
    take: MAX_PER_RUN,
  });

  console.log(`[reconcile] found ${candidates.length} recently-settled session(s) to check`);

  let checked = 0;
  let skippedNoJobId = 0;
  let skippedTerminal = 0;
  let settled = 0;
  let failed = 0;

  for (const session of candidates) {
    checked++;

    if (!session.onchainJobId) {
      console.log(`[reconcile] ${session.id} — onchainJobId still null, open bind has not landed yet, skipping`);
      skippedNoJobId++;
      continue;
    }

    const jobId = BigInt(session.onchainJobId);
    const onChainStatus = await readJobStatus(acpAddress, jobId);
    if (onChainStatus === null) continue;

    if (!NEEDS_SETTLE.has(onChainStatus)) {
      // Already Completed / Rejected / Expired — nothing to do.
      skippedTerminal++;
      continue;
    }

    console.log(`[reconcile] ${session.id} — job ${jobId} is ${STATUS[onChainStatus]}, firing settle...`);
    const result = await settleSessionOnChain({
      jobId: session.onchainJobId,
      sessionId: session.id,
      callCount: session.callCount,
    });

    if (result.success) {
      settled++;
      console.log(`[reconcile] ${session.id} — settle ok: tx=${result.txHash}`);
    } else {
      failed++;
      console.error(`[reconcile] ${session.id} — settle failed: ${result.error}`);
    }
  }

  console.log('[reconcile] done:', {
    checked,
    skippedNoJobId,
    skippedTerminal,
    settled,
    failed,
  });

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('[reconcile] fatal:', err);
  process.exit(1);
});
