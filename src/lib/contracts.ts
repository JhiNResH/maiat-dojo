// ─── Chain Config ──────────────────────────────────────
// Set to 'baseSepolia' for testnet, 'base' for mainnet
export const ACTIVE_CHAIN = 'baseSepolia' as const;

// ─── Contract Addresses ───────────────────────────────
export const CONTRACTS = {
  base: {
    skillNft: "0x0000000000000000000000000000000000000000" as `0x${string}`, // TODO: deploy
    skillRoyaltySplitter: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`,
    agentIdentity: "0x8004A169000000000000000000000000000b9432" as `0x${string}`,
  },
  baseSepolia: {
    skillNft: "0x52635F45b087c1059B3a997fb089bae5Db095B74" as `0x${string}`,
    skillRoyaltySplitter: "0x98D34100F6030DFDc1370fB45dFa1Ad7980D4bD8" as `0x${string}`,
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as `0x${string}`,
    agentIdentity: "0x0000000000000000000000000000000000000000" as `0x${string}`,
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

// ─── SkillNFT ABI (frontend-relevant subset) ─────────
export const SKILL_NFT_ABI = [
  // buySkill(uint256 skillId, address recipient)
  {
    inputs: [
      { name: "skillId", type: "uint256" },
      { name: "recipient", type: "address" },
    ],
    name: "buySkill",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // getSkill(uint256) → Skill tuple
  {
    inputs: [{ name: "skillId", type: "uint256" }],
    name: "getSkill",
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "price", type: "uint256" },
          { name: "creator", type: "address" },
          { name: "royaltyBps", type: "uint16" },
          { name: "uri", type: "string" },
          { name: "totalSold", type: "uint256" },
          { name: "active", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  // balanceOf(address, uint256) → uint256
  {
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // nextSkillId() → uint256
  {
    inputs: [],
    name: "nextSkillId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // getCreator(uint256) → address
  {
    inputs: [{ name: "skillId", type: "uint256" }],
    name: "getCreator",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  // getSkillActive(uint256) → bool
  {
    inputs: [{ name: "skillId", type: "uint256" }],
    name: "getSkillActive",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  // skills(uint256) → tuple
  {
    inputs: [{ name: "", type: "uint256" }],
    name: "skills",
    outputs: [
      { name: "price", type: "uint256" },
      { name: "creator", type: "address" },
      { name: "royaltyBps", type: "uint16" },
      { name: "uri", type: "string" },
      { name: "totalSold", type: "uint256" },
      { name: "active", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // MIN_PRICE() → uint256
  {
    inputs: [],
    name: "MIN_PRICE",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "skillId", type: "uint256" },
      { indexed: true, name: "creator", type: "address" },
      { name: "price", type: "uint256" },
      { name: "royaltyBps", type: "uint16" },
      { name: "uri", type: "string" },
    ],
    name: "SkillCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "skillId", type: "uint256" },
      { indexed: true, name: "buyer", type: "address" },
      { indexed: true, name: "recipient", type: "address" },
      { name: "price", type: "uint256" },
      { name: "creatorShare", type: "uint256" },
      { name: "platformShare", type: "uint256" },
      { name: "reputationShare", type: "uint256" },
    ],
    name: "SkillPurchased",
    type: "event",
  },
] as const;

// Legacy export for backward compatibility
export const SKILL_REGISTRY_ABI = SKILL_NFT_ABI;
