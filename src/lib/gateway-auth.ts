import { recoverTypedDataAddress, type Address } from 'viem';
import { AgentIdentityABI, createBscPublicClient, getBscConfig } from './erc8004';

export const DOJO_GATEWAY_DOMAIN_NAME = 'DojoGateway';
export const DOJO_GATEWAY_DOMAIN_VERSION = '1';

export const DOJO_GATEWAY_TYPES = {
  DojoRun: [
    { name: 'jobId', type: 'string' },
    { name: 'agentTokenId', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'expiresAt', type: 'uint256' },
    { name: 'requestHash', type: 'bytes32' },
    { name: 'skill', type: 'string' },
  ],
} as const;

export interface VerifyGatewayAuthInput {
  signature: string;
  jobId: string;
  agentTokenId: bigint;
  nonce: bigint;
  expiresAt: bigint;
  requestHash: `0x${string}`;
  skill: string;
}

export type VerifyGatewayAuthResult =
  | { ok: true; signer: Address; agentId: bigint }
  | { ok: false; code: string; error: string; signer?: Address; agentId?: bigint };

export async function verifyGatewayAuth(
  input: VerifyGatewayAuthInput,
): Promise<VerifyGatewayAuthResult> {
  if (!/^0x[0-9a-fA-F]{130}$/.test(input.signature)) {
    return {
      ok: false,
      code: 'signature-invalid',
      error: 'X-Dojo-Auth must be a 65-byte hex signature',
    };
  }

  const config = getBscConfig();
  const domain = {
    name: DOJO_GATEWAY_DOMAIN_NAME,
    version: DOJO_GATEWAY_DOMAIN_VERSION,
    chainId: config.chain.id,
    verifyingContract: config.contractAddress,
  } as const;

  let signer: Address;
  try {
    signer = await recoverTypedDataAddress({
      domain,
      types: DOJO_GATEWAY_TYPES,
      primaryType: 'DojoRun',
      message: {
        jobId: input.jobId,
        agentTokenId: input.agentTokenId,
        nonce: input.nonce,
        expiresAt: input.expiresAt,
        requestHash: input.requestHash,
        skill: input.skill,
      },
      signature: input.signature as `0x${string}`,
    });
  } catch (err) {
    return {
      ok: false,
      code: 'signature-invalid',
      error: err instanceof Error ? err.message : 'Failed to recover EIP-712 signer',
    };
  }

  try {
    const publicClient = createBscPublicClient();
    const agentId = await publicClient.readContract({
      address: config.contractAddress,
      abi: AgentIdentityABI,
      functionName: 'agentIdOf',
      args: [signer],
    });

    if (agentId === 0n) {
      return {
        ok: false,
        code: 'agent-not-registered',
        error: 'Recovered signer does not have an AgentIdentity token',
        signer,
      };
    }

    if (agentId !== input.agentTokenId) {
      return {
        ok: false,
        code: 'agent-token-mismatch',
        error: 'Recovered signer does not control X-Dojo-AgentTokenId',
        signer,
        agentId,
      };
    }

    return { ok: true, signer, agentId };
  } catch (err) {
    return {
      ok: false,
      code: 'agent-identity-read-failed',
      error: err instanceof Error ? err.message : 'Failed to read AgentIdentity',
      signer,
    };
  }
}
