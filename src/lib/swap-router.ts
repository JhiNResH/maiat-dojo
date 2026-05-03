/**
 * SwapRouter — Phase 2 Tokenized Commerce Layer
 *
 * Anchors /api/v1/run executions to BSC on-chain via the SwapRouter contract.
 * For the Phase 2 demo, the relayer pays USDC into `swap()` on the agent's
 * behalf and immediately `settle()`s — net zero USDC flow but real on-chain
 * evidence (ExecutionRequested + ExecutionSettled events; BAS attestation
 * hook chain fires).
 *
 * Fire-and-forget semantics: anchoring never blocks the API response. Errors
 * are logged; REST flow succeeds regardless so a broken RPC doesn't brick demo.
 *
 * See specs/2026-04-16-agent-commerce-protocol.md and
 *     brain/wiki/decisions/2026-04-16-tokens-as-interface-reputation-as-allocation.md
 */

import { createPublicClient, createWalletClient, http, keccak256, parseEventLogs, toBytes, type Hash } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bscTestnet, withRelayerLock } from './erc8004';
import { logError } from './logger';

// ─── Config ─────────────────────────────────────────────────────────────────

export const PHASE2_ADDRESSES = {
  skillRegistry:  (process.env.BSC_SKILL_REGISTRY ?? '0x104579420Ab86579631E8452EE553A75Fc257690') as `0x${string}`,
  swapRouter:     (process.env.BSC_SWAP_ROUTER    ?? '0x2844515814b44Ab23d5001571e2E1C726295536a') as `0x${string}`,
  reputationHub:  (process.env.BSC_REPUTATION_HUB ?? '0x6c6b8b4a72A291d95eC461FEc29cd764bbfcC159') as `0x${string}`,
  usdc:           (process.env.BSC_USDC           ?? '0x2F808cc071D7B54d23a7647d79d7EF6E2C830d31') as `0x${string}`,
} as const;

// ─── ABI (minimal) ──────────────────────────────────────────────────────────

const SWAP_ROUTER_ABI = [
  {
    type: 'function',
    name: 'swap',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'skillId',      type: 'bytes32' },
      { name: 'maxPriceUSDC', type: 'uint256' },
      { name: 'params',       type: 'bytes'   },
    ],
    outputs: [{ name: 'requestId', type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'settle',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'requestId',  type: 'bytes32' },
      { name: 'success',    type: 'bool'    },
      { name: 'resultHash', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    type: 'event',
    name: 'ExecutionRequested',
    inputs: [
      { name: 'requestId',  type: 'bytes32', indexed: true  },
      { name: 'skillId',    type: 'bytes32', indexed: true  },
      { name: 'agent',      type: 'address', indexed: true  },
      { name: 'amountUSDC', type: 'uint256', indexed: false },
      { name: 'params',     type: 'bytes',   indexed: false },
    ],
  },
] as const;

const SKILL_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'register',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'slug', type: 'string' },
      { name: 'priceUSDC', type: 'uint256' },
      { name: 'creator', type: 'address' },
      { name: 'metadataURI', type: 'string' },
      { name: 'gatewaySlug', type: 'bytes32' },
      { name: 'category', type: 'uint8' },
      { name: 'minReputation', type: 'uint256' },
    ],
    outputs: [
      { name: 'skillId', type: 'bytes32' },
      { name: 'runToken', type: 'address' },
    ],
  },
  {
    type: 'function',
    name: 'getSkill',
    stateMutability: 'view',
    inputs: [{ name: 'skillId', type: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'provider', type: 'address' },
          { name: 'creator', type: 'address' },
          { name: 'runToken', type: 'address' },
          { name: 'priceUSDC', type: 'uint256' },
          { name: 'minReputation', type: 'uint256' },
          { name: 'metadataURI', type: 'string' },
          { name: 'gatewaySlug', type: 'bytes32' },
          { name: 'category', type: 'uint8' },
          { name: 'active', type: 'bool' },
          { name: 'registeredAt', type: 'uint64' },
        ],
      },
    ],
  },
] as const;

// ─── Clients ────────────────────────────────────────────────────────────────

function getRelayerKey(): `0x${string}` | null {
  const key = process.env.DOJO_RELAYER_PRIVATE_KEY;
  if (!key) return null;
  return (key.startsWith('0x') ? key : `0x${key}`) as `0x${string}`;
}

export function getRegistryRelayerAddress(): `0x${string}` | null {
  const key = getRelayerKey();
  if (!key) return null;
  return privateKeyToAccount(key).address;
}

export function normalizeHexAddress(value: string | null | undefined): `0x${string}` | null {
  if (!value || !/^0x[a-fA-F0-9]{40}$/.test(value)) return null;
  return value as `0x${string}`;
}

function getClients() {
  const key = getRelayerKey();
  if (!key) throw new Error('DOJO_RELAYER_PRIVATE_KEY not configured');

  const rpcUrl = process.env.BSC_RPC_URL ?? 'https://data-seed-prebsc-1-s1.binance.org:8545';
  const account = privateKeyToAccount(key);

  const pub = createPublicClient({ chain: bscTestnet, transport: http(rpcUrl) });
  const wallet = createWalletClient({
    account,
    chain: bscTestnet,
    transport: http(rpcUrl),
  });
  return { pub, wallet, account };
}

function getPublicClient() {
  const rpcUrl = process.env.BSC_RPC_URL ?? 'https://data-seed-prebsc-1-s1.binance.org:8545';
  return createPublicClient({ chain: bscTestnet, transport: http(rpcUrl) });
}

// ─── Public API ─────────────────────────────────────────────────────────────

export interface AnchorResult {
  ok: boolean;
  swapTxHash?: Hash;
  settleTxHash?: Hash;
  requestId?: `0x${string}`;
  error?: string;
}

export interface RegistryStatus {
  registered: boolean;
  active: boolean;
  transient?: boolean;
  provider?: `0x${string}`;
  creator?: `0x${string}`;
  runToken?: `0x${string}`;
  priceUSDC?: bigint;
  error?: string;
}

export interface WorkflowRegistryValidation {
  ok: boolean;
  status: number;
  code?: 'ONCHAIN_REGISTRY_UNAVAILABLE' | 'ONCHAIN_SKILL_NOT_REGISTERED';
  error?: string;
  skillId: `0x${string}`;
  registry: `0x${string}`;
  active?: boolean;
  reason?: string;
}

export interface EnsureSkillRegistrationResult {
  ok: boolean;
  skillId: `0x${string}`;
  registry: `0x${string}`;
  active?: boolean;
  runToken?: `0x${string}`;
  txHash?: Hash;
  transient?: boolean;
  error?: string;
}

function isTransientRegistryError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes('timeout') ||
    lower.includes('failed to fetch') ||
    lower.includes('fetch failed') ||
    lower.includes('network') ||
    lower.includes('econnreset') ||
    lower.includes('etimedout') ||
    lower.includes('econnrefused') ||
    lower.includes('enetunreach') ||
    lower.includes('502') ||
    lower.includes('503') ||
    lower.includes('504')
  );
}

export function skillIdForSlug(slug: string): `0x${string}` {
  return keccak256(toBytes(slug));
}

function priceToMicrousd(pricePerCall: number): bigint {
  if (!Number.isFinite(pricePerCall) || pricePerCall <= 0) {
    throw new Error('pricePerCall must be a positive number');
  }
  return BigInt(Math.max(1_000, Math.round(pricePerCall * 1_000_000)));
}

function registrationResultFromStatus(
  status: RegistryStatus,
  skillId: `0x${string}`,
  priceUSDC: bigint,
): EnsureSkillRegistrationResult | null {
  if (!status.registered) return null;

  if (!status.active) {
    return {
      ok: false,
      skillId,
      registry: PHASE2_ADDRESSES.skillRegistry,
      active: false,
      error: 'Workflow is registered but inactive in the BSC SkillRegistry',
    };
  }

  if (status.priceUSDC !== undefined && status.priceUSDC !== priceUSDC) {
    return {
      ok: false,
      skillId,
      registry: PHASE2_ADDRESSES.skillRegistry,
      active: status.active,
      runToken: status.runToken,
      error: `On-chain price mismatch: registry=${status.priceUSDC.toString()} expected=${priceUSDC.toString()}`,
    };
  }

  return {
    ok: true,
    skillId,
    registry: PHASE2_ADDRESSES.skillRegistry,
    active: status.active,
    runToken: status.runToken,
  };
}

export async function getSkillRegistryStatus(skillId: `0x${string}`): Promise<RegistryStatus> {
  try {
    const pub = getPublicClient();
    const skill = await pub.readContract({
      address: PHASE2_ADDRESSES.skillRegistry,
      abi: SKILL_REGISTRY_ABI,
      functionName: 'getSkill',
      args: [skillId],
    });

    return {
      registered: true,
      active: skill.active,
      provider: skill.provider,
      creator: skill.creator,
      runToken: skill.runToken,
      priceUSDC: skill.priceUSDC,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const notFound =
      message.includes('SkillNotFound') ||
      message.includes('0x9c4a');
    return {
      registered: false,
      active: false,
      transient: !notFound || isTransientRegistryError(message),
      error: notFound ? 'Skill not registered in SkillRegistry' : message,
    };
  }
}

export function shouldRequireOnchainRegistration() {
  return process.env.DOJO_REQUIRE_ONCHAIN_REGISTRATION !== 'false';
}

export async function validateRegisteredWorkflowSlug(slug: string): Promise<WorkflowRegistryValidation> {
  const skillId = skillIdForSlug(slug);
  if (!shouldRequireOnchainRegistration()) {
    return { ok: true, status: 200, skillId, registry: PHASE2_ADDRESSES.skillRegistry };
  }

  const registry = await getSkillRegistryStatus(skillId);
  if (registry.registered && registry.active) {
    return { ok: true, status: 200, skillId, registry: PHASE2_ADDRESSES.skillRegistry, active: true };
  }
  if (registry.transient) {
    return {
      ok: false,
      status: 503,
      code: 'ONCHAIN_REGISTRY_UNAVAILABLE',
      error: 'BSC SkillRegistry is temporarily unavailable',
      skillId,
      registry: PHASE2_ADDRESSES.skillRegistry,
      reason: registry.error,
    };
  }

  return {
    ok: false,
    status: 409,
    code: 'ONCHAIN_SKILL_NOT_REGISTERED',
    error: 'Workflow is not registered in the BSC SkillRegistry',
    skillId,
    registry: PHASE2_ADDRESSES.skillRegistry,
    active: registry.active,
    reason: registry.error,
  };
}

export async function ensureSkillRegisteredOnchain(input: {
  slug: string;
  pricePerCall: number;
  creatorAddress?: `0x${string}` | null;
  metadataURI?: string | null;
  category?: number;
  minReputation?: bigint;
}): Promise<EnsureSkillRegistrationResult> {
  const skillId = skillIdForSlug(input.slug);
  const priceUSDC = priceToMicrousd(input.pricePerCall);
  const existing = await getSkillRegistryStatus(skillId);
  const existingResult = registrationResultFromStatus(existing, skillId, priceUSDC);

  if (existingResult) return existingResult;

  if (existing.transient) {
    return {
      ok: false,
      skillId,
      registry: PHASE2_ADDRESSES.skillRegistry,
      transient: true,
      error: existing.error ?? 'BSC SkillRegistry is temporarily unavailable',
    };
  }

  const creator = input.creatorAddress ?? getRegistryRelayerAddress();
  if (!creator) {
    return {
      ok: false,
      skillId,
      registry: PHASE2_ADDRESSES.skillRegistry,
      error: 'DOJO_RELAYER_PRIVATE_KEY is required to register workflows on-chain',
    };
  }

  return withRelayerLock(async () => {
    try {
      const lockedExisting = await getSkillRegistryStatus(skillId);
      const lockedExistingResult = registrationResultFromStatus(lockedExisting, skillId, priceUSDC);
      if (lockedExistingResult) return lockedExistingResult;
      if (lockedExisting.transient) {
        return {
          ok: false,
          skillId,
          registry: PHASE2_ADDRESSES.skillRegistry,
          transient: true,
          error: lockedExisting.error ?? 'BSC SkillRegistry is temporarily unavailable',
        };
      }

      const { pub, wallet } = getClients();
      const txHash = await wallet.writeContract({
        address: PHASE2_ADDRESSES.skillRegistry,
        abi: SKILL_REGISTRY_ABI,
        functionName: 'register',
        args: [
          input.slug,
          priceUSDC,
          creator,
          input.metadataURI ?? `dojo://workflow/${input.slug}`,
          skillId,
          input.category ?? 0,
          input.minReputation ?? 0n,
        ],
      });

      const receipt = await pub.waitForTransactionReceipt({ hash: txHash, confirmations: 1 });
      if (receipt.status !== 'success') {
        return {
          ok: false,
          skillId,
          registry: PHASE2_ADDRESSES.skillRegistry,
          txHash,
          error: 'SkillRegistry.register reverted',
        };
      }

      const status = await getSkillRegistryStatus(skillId);
      return {
        ok: status.registered && status.active,
        skillId,
        registry: PHASE2_ADDRESSES.skillRegistry,
        active: status.active,
        runToken: status.runToken,
        txHash,
        error: status.registered && status.active ? undefined : status.error,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('SkillAlreadyRegistered')) {
        const status = await getSkillRegistryStatus(skillId);
        return registrationResultFromStatus(status, skillId, priceUSDC) ?? {
          ok: false,
          skillId,
          registry: PHASE2_ADDRESSES.skillRegistry,
          transient: status.transient,
          error: status.error ?? message,
        };
      }

      return {
        ok: false,
        skillId,
        registry: PHASE2_ADDRESSES.skillRegistry,
        transient: isTransientRegistryError(message),
        error: message,
      };
    }
  });
}

/**
 * Fire a full demo cycle: swap → settle.
 * Returns both tx hashes + requestId. Intended to run fire-and-forget from API
 * handlers — caller should `void anchorExecution(...).catch(...)`.
 *
 * @param skillId    keccak256 of the skill slug (on-chain identifier)
 * @param success    settlement outcome (result delivery ok?)
 * @param resultHash keccak256 of the execution payload (for BAS attestation)
 */
export async function anchorExecution(
  skillId: `0x${string}`,
  success: boolean,
  resultHash: `0x${string}`,
): Promise<AnchorResult> {
  return withRelayerLock(async () => anchorExecutionUnlocked(skillId, success, resultHash));
}

async function anchorExecutionUnlocked(
  skillId: `0x${string}`,
  success: boolean,
  resultHash: `0x${string}`,
): Promise<AnchorResult> {
  try {
    const { pub, wallet, account } = getClients();

    // 1. swap(skillId, maxPriceUSDC=uint256.max, params="0x")
    //    Relayer pays USDC on behalf of the agent for demo purposes.
    const swapTx = await wallet.writeContract({
      address: PHASE2_ADDRESSES.swapRouter,
      abi: SWAP_ROUTER_ABI,
      functionName: 'swap',
      args: [skillId, 2n ** 256n - 1n, '0x'],
    });

    const swapReceipt = await pub.waitForTransactionReceipt({ hash: swapTx, confirmations: 1 });

    const requestedLogs = parseEventLogs({
      abi: SWAP_ROUTER_ABI,
      eventName: 'ExecutionRequested',
      logs: swapReceipt.logs,
    });
    const requestId = requestedLogs.find(
      (log) => log.address.toLowerCase() === PHASE2_ADDRESSES.swapRouter.toLowerCase(),
    )?.args.requestId;

    if (!requestId) {
      return { ok: false, swapTxHash: swapTx, error: 'ExecutionRequested event not found' };
    }

    // 2. settle(requestId, success, resultHash) — same relayer acts as gateway.
    const settleTx = await wallet.writeContract({
      address: PHASE2_ADDRESSES.swapRouter,
      abi: SWAP_ROUTER_ABI,
      functionName: 'settle',
      args: [requestId, success, resultHash],
    });
    await pub.waitForTransactionReceipt({ hash: settleTx, confirmations: 1 });

    return { ok: true, swapTxHash: swapTx, settleTxHash: settleTx, requestId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logError('swap-router:anchor', err instanceof Error ? err : new Error(msg), {
      skillId,
      success,
    });
    return { ok: false, error: msg };
  }
}

/**
 * Sugar over `anchorExecution` for fire-and-forget use in request handlers.
 * Never throws. Logs errors. Returns a promise consumers can ignore.
 */
export function anchorExecutionAsync(
  skillId: `0x${string}` | null | undefined,
  success: boolean,
  resultHash: string,
): Promise<AnchorResult> {
  if (!skillId) return Promise.resolve({ ok: false, error: 'no onchain skillId' });
  const hash = (resultHash.startsWith('0x') ? resultHash : `0x${resultHash}`) as `0x${string}`;
  return anchorExecution(skillId, success, hash).catch((err) => ({
    ok: false,
    error: err instanceof Error ? err.message : String(err),
  }));
}
