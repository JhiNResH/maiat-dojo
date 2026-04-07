// ─── Chain Config ──────────────────────────────────────
// Set to 'bscTestnet' for testnet, 'bsc' for mainnet
export const ACTIVE_CHAIN = 'bscTestnet' as const;

// ─── Contract Addresses ───────────────────────────────
export const CONTRACTS = {
  bsc: {
    agentIdentity: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" as `0x${string}`,
    bas: "0x247Fe62d887bc9410c3848DF2f322e52DA9a51bC" as `0x${string}`,
    basSchemaRegistry: "0x5e905F77f59491F03eBB78c204986aaDEB0C6bDa" as `0x${string}`,
    usdc: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d" as `0x${string}`, // 18 decimals on BSC
    agenticCommerceHooked: "0x0000000000000000000000000000000000000000" as `0x${string}`, // TODO: mainnet deploy
    trustGateACPHook: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    compositeRouterHook: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  },
  bscTestnet: {
    agentIdentity: "0xbb1d304179bdd577d5ef15fec91a5ba9756a6e41" as `0x${string}`,
    bas: "0x0000000000000000000000000000000000000000" as `0x${string}`, // no BAS on testnet
    basSchemaRegistry: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    usdc: "0x0000000000000000000000000000000000000000" as `0x${string}`, // TODO: testnet USDC
    agenticCommerceHooked: "0x1C86C5cAC643325534Ac2198f55B32A7A613f9F8" as `0x${string}`,
    trustGateACPHook: "0xaB6bd9F9b670b93a5586Ba027EC6f1E18a3534C9" as `0x${string}`,
    compositeRouterHook: "0x73d1fd86d6f0447B20De1EC1083f1dcEB4b9694b" as `0x${string}`,
  },
} as const;

// Helper to get current chain's addresses
export const getContracts = () => CONTRACTS[ACTIVE_CHAIN];

// ─── USDC ABI (just approve + balanceOf + allowance) ──
export const USDC_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ─── AgentIdentity ABI (re-export from erc8004 for convenience) ─────────
export { AgentIdentityABI } from './erc8004';
