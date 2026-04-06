/**
 * BSC AgenticCommerceHooked Integration
 *
 * Creates on-chain job records on BSC when a Dojo session opens.
 * The relayer submits the tx — job.client = relayer address (not agent wallet).
 * hook = address(0) for Phase 1: trust gate skipped because relayer has no
 * trust score. On-chain binding is fire-and-forget; the DB session is the
 * source of truth for budget and metering.
 *
 * Deployed addresses come from env:
 *   BSC_ACP_ADDRESS      — AgenticCommerceHooked proxy
 *   BSC_EVALUATOR_ADDRESS — TrustBasedEvaluator proxy
 */

import { createPublicClient, createWalletClient, http, type Hash } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getBscConfig } from './erc8004';

// ─── ABI (minimal — createJob only) ─────────────────────────────────────────

const AgenticCommerceHookedABI = [
  {
    type: 'function',
    name: 'createJob',
    inputs: [
      { name: 'provider', type: 'address', internalType: 'address' },
      { name: 'evaluator', type: 'address', internalType: 'address' },
      { name: 'expiredAt', type: 'uint256', internalType: 'uint256' },
      { name: 'description', type: 'string', internalType: 'string' },
      { name: 'hook', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: 'jobId', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'JobCreated',
    inputs: [
      { name: 'jobId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'client', type: 'address', indexed: true, internalType: 'address' },
      { name: 'provider', type: 'address', indexed: true, internalType: 'address' },
      { name: 'evaluator', type: 'address', indexed: false, internalType: 'address' },
      { name: 'expiredAt', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'hook', type: 'address', indexed: false, internalType: 'address' },
    ],
    anonymous: false,
  },
] as const;

// ─── Config ──────────────────────────────────────────────────────────────────

function getBscAcpConfig() {
  const bsc = getBscConfig();
  const acpAddress = process.env.BSC_ACP_ADDRESS as `0x${string}` | undefined;
  const evaluatorAddress = (process.env.BSC_EVALUATOR_ADDRESS ?? '0x0000000000000000000000000000000000000000') as `0x${string}`;
  return { ...bsc, acpAddress, evaluatorAddress };
}

// ─── createSessionOnChain ────────────────────────────────────────────────────

export interface CreateBscSessionParams {
  providerAddr: `0x${string}`;
  description: string;
  expiredAt: bigint; // unix timestamp
}

export interface CreateBscSessionResult {
  success: boolean;
  jobId?: string;
  txHash?: Hash;
  error?: string;
}

/**
 * Record a session opening as a job on BSC AgenticCommerceHooked.
 * hook = address(0): trust gate skipped (relayer is client, not the agent).
 */
export async function createSessionOnChain(
  params: CreateBscSessionParams
): Promise<CreateBscSessionResult> {
  const config = getBscAcpConfig();

  if (!config.acpAddress) {
    console.warn('[bsc-acp] BSC_ACP_ADDRESS not set — skipping on-chain binding');
    return { success: false, error: 'BSC_ACP_ADDRESS not configured' };
  }

  if (!config.privateKey) {
    console.warn('[bsc-acp] DOJO_RELAYER_PRIVATE_KEY not set — skipping on-chain binding');
    return { success: false, error: 'DOJO_RELAYER_PRIVATE_KEY not configured' };
  }

  // evaluator must be non-zero (AgenticCommerceHooked reverts on ZeroAddress)
  if (config.evaluatorAddress === '0x0000000000000000000000000000000000000000') {
    console.warn('[bsc-acp] BSC_EVALUATOR_ADDRESS not set — skipping on-chain binding');
    return { success: false, error: 'BSC_EVALUATOR_ADDRESS not configured' };
  }

  try {
    const walletClient = createWalletClient({
      account: privateKeyToAccount(config.privateKey),
      chain: config.chain,
      transport: http(config.rpcUrl),
    });
    const publicClient = createPublicClient({
      chain: config.chain,
      transport: http(config.rpcUrl),
    });

    const txHash = await walletClient.writeContract({
      address: config.acpAddress,
      abi: AgenticCommerceHookedABI,
      functionName: 'createJob',
      args: [
        params.providerAddr,
        config.evaluatorAddress,
        params.expiredAt,
        params.description,
        '0x0000000000000000000000000000000000000000', // no hook Phase 1
      ],
    });

    console.log('[bsc-acp] createJob tx sent:', txHash);

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 1,
      timeout: 15_000,
    });

    if (receipt.status !== 'success') {
      return { success: false, txHash, error: 'createJob reverted' };
    }

    // Extract jobId from JobCreated event topics[1]
    const log = receipt.logs.find(
      (l) =>
        l.address.toLowerCase() === config.acpAddress!.toLowerCase() &&
        l.topics.length >= 2
    );
    const jobId = log?.topics[1] ? BigInt(log.topics[1]).toString() : undefined;

    console.log('[bsc-acp] job created:', { jobId, txHash });
    return { success: true, jobId, txHash };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[bsc-acp] createSessionOnChain failed:', message);
    return { success: false, error: message };
  }
}
