// SkillRegistry ABI (subset — only what the frontend needs)
export const SKILL_REGISTRY_ABI = [
  {
    inputs: [
      { name: "name", type: "string" },
      { name: "description", type: "string" },
      { name: "price", type: "uint256" },
      { name: "royaltyBps", type: "uint16" },
    ],
    name: "createSkill",
    outputs: [{ name: "skillId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "skillId", type: "uint256" }],
    name: "buySkill",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "skillId", type: "uint256" }],
    name: "getSkill",
    outputs: [
      { name: "creator", type: "address" },
      { name: "name", type: "string" },
      { name: "description", type: "string" },
      { name: "price", type: "uint256" },
      { name: "royaltyBps", type: "uint16" },
      { name: "totalBuyers", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "agent", type: "address" }],
    name: "getAgentSkills",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
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
  {
    inputs: [
      { name: "", type: "address" },
      { name: "", type: "uint256" },
    ],
    name: "hasSkill",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextSkillId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "uint256" }],
    name: "skills",
    outputs: [
      { name: "creator", type: "address" },
      { name: "name", type: "string" },
      { name: "description", type: "string" },
      { name: "price", type: "uint256" },
      { name: "royaltyBps", type: "uint16" },
      { name: "totalBuyers", type: "uint256" },
      { name: "exists", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "skillId", type: "uint256" },
      { indexed: true, name: "creator", type: "address" },
      { name: "name", type: "string" },
      { name: "price", type: "uint256" },
    ],
    name: "SkillCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "skillId", type: "uint256" },
      { indexed: true, name: "buyer", type: "address" },
      { indexed: true, name: "creator", type: "address" },
      { name: "pricePaid", type: "uint256" },
    ],
    name: "SkillPurchased",
    type: "event",
  },
] as const;

// Contract addresses — update after deployment
export const CONTRACTS = {
  // Base Mainnet
  base: {
    skillRegistry: "0x0000000000000000000000000000000000000000" as `0x${string}`, // TODO: deploy
    agentIdentity: "0x8004A169000000000000000000000000000b9432" as `0x${string}`, // existing
    reputationEngine: "0x0000000000000000000000000000000000000000" as `0x${string}`, // TODO: deploy
  },
  // Base Sepolia (testnet)
  baseSepolia: {
    skillRegistry: "0x0000000000000000000000000000000000000000" as `0x${string}`, // TODO: deploy
    agentIdentity: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    reputationEngine: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  },
} as const;
