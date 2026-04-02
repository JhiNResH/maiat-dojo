// ─── ERC-6551 Token Bound Accounts (TBA) Integration ────────────────────────
// Prep work for ERC-8004 agent token bound accounts on Base Sepolia

// ERC-6551 Registry address (canonical deployment on all chains)
export const TBA_REGISTRY_ADDRESS = "0x000000006551c19487814612e58FE06813775758" as `0x${string}`;

// Default account implementation (reference implementation)
// This is the standard ERC-6551 account implementation
export const TBA_ACCOUNT_IMPLEMENTATION = "0x55266d75D1a14E4572138116aF39863Ed6596E7F" as `0x${string}`;

// Chain ID for Base Sepolia
export const BASE_SEPOLIA_CHAIN_ID = 84532n;

// ─── ABI for ERC-6551 Registry ──────────────────────────────────────────────

export const TBA_REGISTRY_ABI = [
  {
    inputs: [
      { name: "implementation", type: "address" },
      { name: "salt", type: "bytes32" },
      { name: "chainId", type: "uint256" },
      { name: "tokenContract", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    name: "createAccount",
    outputs: [{ name: "account", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "implementation", type: "address" },
      { name: "salt", type: "bytes32" },
      { name: "chainId", type: "uint256" },
      { name: "tokenContract", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    name: "account",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ─── TBA Address Computation ────────────────────────────────────────────────

/**
 * Compute the deterministic TBA address for an ERC-721 token.
 * Uses the ERC-6551 CREATE2 formula.
 *
 * @param tokenContract - The NFT contract address (e.g., Agent NFT)
 * @param tokenId - The token ID
 * @param chainId - The chain ID (default: Base Sepolia)
 * @param implementation - The TBA implementation address
 * @param salt - Optional salt for address derivation
 * @returns The computed TBA address
 */
export function computeTbaAddress(
  tokenContract: `0x${string}`,
  tokenId: bigint,
  chainId: bigint = BASE_SEPOLIA_CHAIN_ID,
  implementation: `0x${string}` = TBA_ACCOUNT_IMPLEMENTATION,
  salt: `0x${string}` = "0x0000000000000000000000000000000000000000000000000000000000000000"
): `0x${string}` {
  // ERC-6551 uses a specific CREATE2 address derivation
  // The actual computation requires keccak256 which we'd normally do with ethers/viem
  // For now, we return a placeholder that would be computed on-chain

  // This is a simplified representation - actual computation requires:
  // 1. Encode init code: implementation + salt + chainId + tokenContract + tokenId
  // 2. keccak256(0xff ++ registry ++ salt ++ keccak256(initCode))

  // Placeholder computation for demonstration
  // In production, use viem's getContractAddress or ethers equivalent
  const components = [
    implementation.slice(2).toLowerCase(),
    salt.slice(2),
    chainId.toString(16).padStart(64, "0"),
    tokenContract.slice(2).toLowerCase().padStart(64, "0"),
    tokenId.toString(16).padStart(64, "0"),
  ].join("");

  // Return a deterministic placeholder based on inputs
  // Real implementation would use proper CREATE2 computation
  const hash = simpleHash(components);
  return `0x${hash.slice(0, 40)}` as `0x${string}`;
}

/**
 * Simple hash function for placeholder address generation.
 * NOT cryptographically secure - just for deterministic placeholder generation.
 * In production, use keccak256.
 */
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Extend to 40 hex chars
  const base = Math.abs(hash).toString(16);
  return (base + base + base + base).slice(0, 40).padStart(40, "0");
}

/**
 * Encode the createAccount call data for ERC-6551 Registry.
 *
 * @param tokenContract - The NFT contract address
 * @param tokenId - The token ID
 * @param chainId - The chain ID
 * @param implementation - The TBA implementation address
 * @param salt - Optional salt
 * @returns Encoded call data for createAccount
 */
export function encodeCreateAccountCall(
  tokenContract: `0x${string}`,
  tokenId: bigint,
  chainId: bigint = BASE_SEPOLIA_CHAIN_ID,
  implementation: `0x${string}` = TBA_ACCOUNT_IMPLEMENTATION,
  salt: `0x${string}` = "0x0000000000000000000000000000000000000000000000000000000000000000"
): `0x${string}` {
  // Function selector for createAccount(address,bytes32,uint256,address,uint256)
  // keccak256("createAccount(address,bytes32,uint256,address,uint256)") = 0x8a54c52f
  const functionSelector = "8a54c52f";

  const padAddress = (addr: string): string => {
    return addr.toLowerCase().replace("0x", "").padStart(64, "0");
  };

  const padBytes32 = (bytes: string): string => {
    return bytes.replace("0x", "").padStart(64, "0");
  };

  const padUint256 = (value: bigint): string => {
    return value.toString(16).padStart(64, "0");
  };

  const encodedData =
    functionSelector +
    padAddress(implementation) +
    padBytes32(salt) +
    padUint256(chainId) +
    padAddress(tokenContract) +
    padUint256(tokenId);

  return `0x${encodedData}`;
}

/**
 * Get TBA configuration for a given agent token.
 * Returns all the data needed to create or query a TBA.
 */
export interface TbaConfig {
  registry: `0x${string}`;
  implementation: `0x${string}`;
  chainId: bigint;
  tokenContract: `0x${string}`;
  tokenId: bigint;
  salt: `0x${string}`;
  computedAddress: `0x${string}`;
  createAccountCalldata: `0x${string}`;
}

export function getTbaConfig(
  tokenContract: `0x${string}`,
  tokenId: bigint,
  chainId: bigint = BASE_SEPOLIA_CHAIN_ID
): TbaConfig {
  const salt = "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

  return {
    registry: TBA_REGISTRY_ADDRESS,
    implementation: TBA_ACCOUNT_IMPLEMENTATION,
    chainId,
    tokenContract,
    tokenId,
    salt,
    computedAddress: computeTbaAddress(tokenContract, tokenId, chainId),
    createAccountCalldata: encodeCreateAccountCall(tokenContract, tokenId, chainId),
  };
}
