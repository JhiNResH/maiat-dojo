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
 * Uses the ERC-6551 Registry's `account()` view function on-chain.
 *
 * NOTE: Off-chain computation requires keccak256 (viem/ethers).
 * For MVP, use this with a publicClient to call the registry directly:
 *
 *   const address = await publicClient.readContract({
 *     address: TBA_REGISTRY_ADDRESS,
 *     abi: TBA_REGISTRY_ABI,
 *     functionName: 'account',
 *     args: [implementation, salt, chainId, tokenContract, tokenId],
 *   });
 *
 * @param tokenContract - The NFT contract address (e.g., Agent NFT)
 * @param tokenId - The token ID
 * @param chainId - The chain ID (default: Base Sepolia)
 * @param implementation - The TBA implementation address
 * @param salt - Optional salt for address derivation
 * @returns Args tuple for calling registry.account() on-chain
 */
export function getTbaAccountArgs(
  tokenContract: `0x${string}`,
  tokenId: bigint,
  chainId: bigint = BASE_SEPOLIA_CHAIN_ID,
  implementation: `0x${string}` = TBA_ACCOUNT_IMPLEMENTATION,
  salt: `0x${string}` = "0x0000000000000000000000000000000000000000000000000000000000000000"
) {
  // TODO: Replace with proper CREATE2 computation using viem's getContractAddress
  // For now, return the args needed for on-chain registry.account() call
  return {
    implementation,
    salt,
    chainId,
    tokenContract,
    tokenId,
  } as const;
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
    // NOTE: computedAddress requires on-chain call to registry.account()
    // Use getTbaAccountArgs() with publicClient.readContract() to get actual address
    computedAddress: "0x0000000000000000000000000000000000000000" as `0x${string}`, // placeholder — compute on-chain
    createAccountCalldata: encodeCreateAccountCall(tokenContract, tokenId, chainId),
  };
}
