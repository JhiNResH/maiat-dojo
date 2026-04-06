/**
 * BAS (BSC Attestation Service) Integration
 *
 * BAS is EAS-compatible. Same ABI, different contract addresses on BSC.
 * Mainnet only — no BAS on BSC testnet (skip attestation if testnet RPC).
 *
 * Schema: SessionEvaluation
 *   address agentWallet, uint256 agentId, string skillId,
 *   uint256 callCount, uint256 budgetUsedUsdc, uint8 outcome
 *
 * outcome: 0 = refunded (early close), 1 = settled (completed)
 * budgetUsedUsdc: (budgetTotal - budgetRemaining) in USDC micro units (× 1e6)
 */

import { encodeAbiParameters, parseAbiParameters, parseEventLogs } from 'viem';
import { createBscPublicClient, createBscWalletClient } from './erc8004';

// ─── Contract Addresses ─────────────────────────────────────────────────────

export const BAS_ADDRESS = '0x247Fe62d887bc9410c3848DF2f322e52DA9a51bC' as `0x${string}`;
export const BAS_SCHEMA_REGISTRY = '0x5e905F77f59491F03eBB78c204986aaDEB0C6bDa' as `0x${string}`;

// ─── Schema ─────────────────────────────────────────────────────────────────

export const SESSION_EVALUATION_SCHEMA =
  'address agentWallet, uint256 agentId, string skillId, uint256 callCount, uint256 budgetUsedUsdc, uint8 outcome';

// Set via env after registering schema on BSC BAS:
//   npx tsx scripts/register-bas-schema.ts
export function getSessionEvaluationSchemaUid(): `0x${string}` | null {
  const uid = process.env.BAS_SESSION_SCHEMA_UID;
  if (!uid || uid === '0x') return null;
  return uid as `0x${string}`;
}

// ─── ABI (EAS-compatible) ───────────────────────────────────────────────────

export const BAS_ABI = [
  {
    inputs: [
      {
        name: 'request',
        type: 'tuple',
        components: [
          { name: 'schema', type: 'bytes32' },
          {
            name: 'data',
            type: 'tuple',
            components: [
              { name: 'recipient', type: 'address' },
              { name: 'expirationTime', type: 'uint64' },
              { name: 'revocable', type: 'bool' },
              { name: 'refUID', type: 'bytes32' },
              { name: 'data', type: 'bytes' },
              { name: 'value', type: 'uint256' },
            ],
          },
        ],
      },
    ],
    name: 'attest',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    type: 'event',
    name: 'Attested',
    inputs: [
      { name: 'recipient', type: 'address', indexed: true, internalType: 'address' },
      { name: 'attester', type: 'address', indexed: true, internalType: 'address' },
      { name: 'uid', type: 'bytes32', indexed: false, internalType: 'bytes32' },
      { name: 'schemaUID', type: 'bytes32', indexed: true, internalType: 'bytes32' },
    ],
    anonymous: false,
  },
] as const;

export const BAS_SCHEMA_REGISTRY_ABI = [
  {
    inputs: [
      { name: 'schema', type: 'string' },
      { name: 'resolver', type: 'address' },
      { name: 'revocable', type: 'bool' },
    ],
    name: 'register',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// ─── Encoding ────────────────────────────────────────────────────────────────

export interface SessionEvaluationData {
  agentWallet: `0x${string}`;
  agentId: bigint;           // ERC-8004 agentId (0n if not minted yet)
  skillId: string;           // DB skillId (off-chain string)
  callCount: bigint;
  budgetUsedUsdc: bigint;    // (budgetTotal - budgetRemaining) × 1e6
  outcome: 0 | 1;            // 0 = refunded, 1 = settled
}

export function encodeSessionEvaluation(data: SessionEvaluationData): `0x${string}` {
  return encodeAbiParameters(
    parseAbiParameters(SESSION_EVALUATION_SCHEMA),
    [
      data.agentWallet,
      data.agentId,
      data.skillId,
      data.callCount,
      data.budgetUsedUsdc,
      data.outcome,
    ]
  );
}

// ─── Attestation ─────────────────────────────────────────────────────────────

export interface AttestResult {
  success: boolean;
  uid?: `0x${string}`;
  txHash?: `0x${string}`;
  error?: string;
}

/**
 * Submit a SessionEvaluation attestation to BAS on BSC mainnet.
 * Fire-and-forget: caller should not await this in the critical path.
 *
 * Skips gracefully if:
 *   - BSC RPC is testnet (no BAS deployed)
 *   - BAS_SESSION_SCHEMA_UID env not set (schema not registered yet)
 *   - DOJO_RELAYER_PRIVATE_KEY not set
 */
export async function attestSessionClose(data: SessionEvaluationData): Promise<AttestResult> {
  // Skip on testnet
  const rpcUrl = process.env.BSC_RPC_URL ?? '';
  if (rpcUrl.includes('prebsc') || rpcUrl.includes('testnet') || rpcUrl.includes('97')) {
    console.log('[bas] testnet RPC — skipping attestation');
    return { success: false, error: 'testnet — no BAS' };
  }

  const schemaUid = getSessionEvaluationSchemaUid();
  if (!schemaUid) {
    console.warn('[bas] BAS_SESSION_SCHEMA_UID not set — skipping attestation');
    return { success: false, error: 'schema UID not configured' };
  }

  if (!process.env.DOJO_RELAYER_PRIVATE_KEY) {
    return { success: false, error: 'DOJO_RELAYER_PRIVATE_KEY not set' };
  }

  try {
    const walletClient = createBscWalletClient();
    const publicClient = createBscPublicClient();

    const encoded = encodeSessionEvaluation(data);

    const txHash = await walletClient.writeContract({
      address: BAS_ADDRESS,
      abi: BAS_ABI,
      functionName: 'attest',
      args: [
        {
          schema: schemaUid,
          data: {
            recipient: data.agentWallet,
            expirationTime: 0n,
            revocable: false,
            refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
            data: encoded,
            value: 0n,
          },
        },
      ],
    });

    console.log('[bas] attest tx sent:', txHash);

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 1,
      timeout: 20_000,
    });

    if (receipt.status !== 'success') {
      return { success: false, txHash, error: 'attest tx reverted' };
    }

    // Parse true attestation UID from Attested event log.
    // BAS (EAS-compatible) emits: Attested(recipient indexed, attester indexed, uid, schemaUID indexed)
    // uid is non-indexed — lives in log.data as 32 bytes.
    const attestedLogs = parseEventLogs({
      abi: BAS_ABI,
      eventName: 'Attested',
      logs: receipt.logs,
    });
    const uid = attestedLogs[0]?.args.uid;

    console.log('[bas] attestation confirmed:', { txHash, uid, skillId: data.skillId });

    return { success: true, txHash, uid };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[bas] attestSessionClose failed:', message);
    return { success: false, error: message };
  }
}
