export type AgentServicePricing = {
  setupFeeUsd: number;
  monthlyUsd: number;
  perClearedCaseUsd: number;
  successFeeBps: number;
  royaltyBps: number;
};

export type AgentServiceLineage = {
  root: string;
  parent?: string;
  forks?: string[];
  generation: number;
  royaltyTo?: string;
};

export type AgentServiceReputation = {
  receiptsCleared: number;
  successRate: number;
  savedAmountUsd: number;
  verifiedVolumeUsd: number;
  disputes: number;
  creditScore: number;
};

export type AgentServiceReceipt = {
  id: string;
  label: string;
  amountUsd: number;
  status: "cleared" | "refunded" | "disputed";
};

export type AgentFamilyCode = "NEG" | "R8" | "SLR" | "BYR" | "VFY";

export type AgentProofLevel = "identity" | "execution" | "clearing" | "settlement";

export type AgentFamily = {
  code: AgentFamilyCode;
  name: string;
  role: string;
};

export type AgentServiceCard = {
  id: string;
  slug: string;
  name: string;
  nfaId: string;
  agentId: string;
  familyCode: AgentFamilyCode;
  familyName: string;
  familyRole: string;
  proofLevel: AgentProofLevel;
  proofSummary: string;
  ownerIdentity: string;
  collection: string;
  role: string;
  archetype: string;
  summary: string;
  status: "root-template" | "merchant-fork" | "verified-service";
  category: string;
  avatarSeed: string;
  paymentRails: string[];
  integrations: string[];
  abilities: string[];
  workflowDeck: string[];
  receiptKinds: string[];
  attributes: Array<{ label: string; value: string }>;
  pricing: AgentServicePricing;
  lineage: AgentServiceLineage;
  reputation: AgentServiceReputation;
  receipts: AgentServiceReceipt[];
  detailHref: string;
  runHref: string;
  subscribeHref: string;
  forkHref: string;
  receiptsHref: string;
};

export const AGENT_FAMILIES: AgentFamily[] = [
  {
    code: "NEG",
    name: "Negotiator",
    role: "Resolve orders, refunds, claims, and merchant settlement outcomes.",
  },
  {
    code: "R8",
    name: "Review",
    role: "Rate, review, and turn verified consumption into taste reputation.",
  },
  {
    code: "SLR",
    name: "Seller",
    role: "Represent merchant inventory, pricing, offers, and fulfillment.",
  },
  {
    code: "BYR",
    name: "Buyer",
    role: "Shop, compare, negotiate, and purchase on behalf of a user.",
  },
  {
    code: "VFY",
    name: "Verifier",
    role: "Evaluate work, stake judgment, and clear receipts into reputation.",
  },
];

export const AGENT_SERVICE_CARDS: AgentServiceCard[] = [
  {
    id: "agent-jiagon-negotiator",
    slug: "jiagon-negotiator",
    name: "Jiagon Negotiator",
    nfaId: "NFA-NEG-0001",
    agentId: "erc8004:neg:jiagon",
    familyCode: "NEG",
    familyName: "Negotiator Agents",
    familyRole: "Resolve merchant orders, refunds, claims, and settlement outcomes.",
    proofLevel: "clearing",
    proofSummary:
      "Identity, endpoint, evaluator outcomes, receipt history, and fork lineage are tracked as one portable agent record.",
    ownerIdentity: "Jiagon / Maiat Dojo",
    collection: "NEG Agent Family",
    role: "Negotiator for merchant orders, refunds, and receipt-backed credit.",
    archetype: "NEG root NFA",
    summary:
      "Handles paid commerce cases for merchants: verify the order, negotiate refund or discount, clear the settlement, and turn every receipt into reputation.",
    status: "root-template",
    category: "Commerce Negotiation",
    avatarSeed: "jiagon-root-negotiator",
    paymentRails: ["BNB", "MoonPay", "USDC"],
    integrations: ["MoonPay Commerce", "Telegram", "Merchant receipts"],
    abilities: [
      "Quote order",
      "Negotiate issue/refund",
      "Issue receipt",
      "Build credit signal",
    ],
    workflowDeck: [
      "Raposa order handling",
      "SOLYD shipping quote",
      "Receipt claim",
      "Refund negotiation",
    ],
    receiptKinds: [
      "Cleared orders",
      "Fulfilled claims",
      "Refunds resolved",
    ],
    attributes: [
      { label: "Class", value: "Negotiator" },
      { label: "Lineage", value: "Genesis" },
      { label: "Royalty", value: "7.5%" },
      { label: "Credit", value: "A-" },
    ],
    pricing: {
      setupFeeUsd: 299,
      monthlyUsd: 149,
      perClearedCaseUsd: 1.5,
      successFeeBps: 1000,
      royaltyBps: 750,
    },
    lineage: {
      root: "Jiagon",
      forks: ["Raposa Agent", "SOLYD Agent"],
      generation: 0,
    },
    reputation: {
      receiptsCleared: 128,
      successRate: 0.92,
      savedAmountUsd: 18420,
      verifiedVolumeUsd: 96200,
      disputes: 3,
      creditScore: 84,
    },
    receipts: [
      { id: "rcpt_jgn_128", label: "Refund saved", amountUsd: 84, status: "cleared" },
      { id: "rcpt_jgn_127", label: "Order claim settled", amountUsd: 42, status: "cleared" },
      { id: "rcpt_jgn_126", label: "Discount negotiated", amountUsd: 18, status: "cleared" },
    ],
    detailHref: "/agent/jiagon-negotiator",
    runHref: "/agent/jiagon-negotiator?mode=run",
    subscribeHref: "/agent/jiagon-negotiator?mode=subscribe",
    forkHref: "/agent/jiagon-negotiator?mode=license",
    receiptsHref: "/leaderboard",
  },
  {
    id: "agent-raposa-coffee",
    slug: "raposa-coffee-agent",
    name: "Raposa Coffee Agent",
    nfaId: "NFA-NEG-0001-F01",
    agentId: "erc8004:neg:raposa",
    familyCode: "NEG",
    familyName: "Negotiator Agents",
    familyRole: "Resolve merchant orders, refunds, claims, and settlement outcomes.",
    proofLevel: "execution",
    proofSummary:
      "Forked agent identity with merchant-specific workflow deck, cleared pickup receipts, and royalty lineage to Jiagon.",
    ownerIdentity: "Raposa Coffee fork",
    collection: "NEG Agent Family",
    role: "Coffee-shop order issue agent forked from Jiagon.",
    archetype: "Merchant NEG fork",
    summary:
      "A cafe-specific fork that handles paid pickup issues, refund requests, loyalty make-goods, and claim receipts for Raposa-style merchants.",
    status: "merchant-fork",
    category: "Merchant Service",
    avatarSeed: "raposa-coffee-fork",
    paymentRails: ["BNB", "MoonPay"],
    integrations: ["MoonPay Commerce", "POS receipt", "Telegram"],
    abilities: [
      "Quote order",
      "Negotiate issue/refund",
      "Issue receipt",
      "Build credit signal",
    ],
    workflowDeck: [
      "Raposa order handling",
      "Receipt claim",
      "Refund negotiation",
    ],
    receiptKinds: [
      "Cleared orders",
      "Fulfilled claims",
      "Refunds resolved",
    ],
    attributes: [
      { label: "Class", value: "Cafe fork" },
      { label: "Parent", value: "Jiagon" },
      { label: "Royalty", value: "3.0%" },
      { label: "Credit", value: "B+" },
    ],
    pricing: {
      setupFeeUsd: 149,
      monthlyUsd: 79,
      perClearedCaseUsd: 0.75,
      successFeeBps: 600,
      royaltyBps: 300,
    },
    lineage: {
      root: "Jiagon",
      parent: "Jiagon Negotiator",
      forks: ["Raposa Agent"],
      generation: 1,
      royaltyTo: "Jiagon",
    },
    reputation: {
      receiptsCleared: 46,
      successRate: 0.89,
      savedAmountUsd: 3260,
      verifiedVolumeUsd: 18400,
      disputes: 1,
      creditScore: 76,
    },
    receipts: [
      { id: "rcpt_rap_046", label: "Pickup claim cleared", amountUsd: 26, status: "cleared" },
      { id: "rcpt_rap_045", label: "Remake approved", amountUsd: 12, status: "cleared" },
      { id: "rcpt_rap_044", label: "Refund avoided", amountUsd: 31, status: "cleared" },
    ],
    detailHref: "/agent/raposa-coffee-agent",
    runHref: "/agent/raposa-coffee-agent?mode=run",
    subscribeHref: "/agent/raposa-coffee-agent?mode=subscribe",
    forkHref: "/agent/raposa-coffee-agent?mode=license",
    receiptsHref: "/leaderboard",
  },
  {
    id: "agent-solyd-commerce",
    slug: "solyd-commerce-agent",
    name: "SOLYD Commerce Agent",
    nfaId: "NFA-NEG-0001-F02",
    agentId: "erc8004:neg:solyd",
    familyCode: "NEG",
    familyName: "Negotiator Agents",
    familyRole: "Resolve merchant orders, refunds, claims, and settlement outcomes.",
    proofLevel: "settlement",
    proofSummary:
      "Payment-native fork with wallet evidence, receipt API, settlement routing, and verified commerce volume.",
    ownerIdentity: "SOLYD merchant fork",
    collection: "NEG Agent Family",
    role: "Onchain settlement assistant for commerce payments and claims.",
    archetype: "Settlement NEG fork",
    summary:
      "A payment-native fork for merchants that need order proofs, customer claims, and chain-backed settlement records before issuing credit.",
    status: "verified-service",
    category: "Payment Clearing",
    avatarSeed: "solyd-commerce-agent",
    paymentRails: ["BNB", "USDC", "Solana evidence"],
    integrations: ["MoonPay Commerce", "Wallet proof", "Receipt API"],
    abilities: [
      "Quote order",
      "Negotiate issue/refund",
      "Issue receipt",
      "Build credit signal",
    ],
    workflowDeck: [
      "SOLYD shipping quote",
      "Receipt claim",
      "Refund negotiation",
    ],
    receiptKinds: [
      "Cleared orders",
      "Fulfilled claims",
      "Refunds resolved",
    ],
    attributes: [
      { label: "Class", value: "Verifier" },
      { label: "Parent", value: "Jiagon" },
      { label: "Royalty", value: "4.0%" },
      { label: "Credit", value: "A" },
    ],
    pricing: {
      setupFeeUsd: 499,
      monthlyUsd: 249,
      perClearedCaseUsd: 2.25,
      successFeeBps: 800,
      royaltyBps: 400,
    },
    lineage: {
      root: "Jiagon",
      parent: "Jiagon Negotiator",
      forks: ["SOLYD Agent"],
      generation: 1,
      royaltyTo: "Jiagon",
    },
    reputation: {
      receiptsCleared: 73,
      successRate: 0.94,
      savedAmountUsd: 9100,
      verifiedVolumeUsd: 74400,
      disputes: 2,
      creditScore: 88,
    },
    receipts: [
      { id: "rcpt_sld_073", label: "Payment verified", amountUsd: 240, status: "cleared" },
      { id: "rcpt_sld_072", label: "Claim approved", amountUsd: 118, status: "cleared" },
      { id: "rcpt_sld_071", label: "Settlement routed", amountUsd: 360, status: "cleared" },
    ],
    detailHref: "/agent/solyd-commerce-agent",
    runHref: "/agent/solyd-commerce-agent?mode=run",
    subscribeHref: "/agent/solyd-commerce-agent?mode=subscribe",
    forkHref: "/agent/solyd-commerce-agent?mode=license",
    receiptsHref: "/leaderboard",
  },
];

export function agentCardStatusLabel(status: AgentServiceCard["status"]) {
  if (status === "root-template") return "Root template";
  if (status === "merchant-fork") return "Merchant fork";
  return "Verified service";
}

export function agentProofLevelLabel(level: AgentProofLevel) {
  if (level === "identity") return "Identity";
  if (level === "execution") return "Execution";
  if (level === "clearing") return "Clearing";
  return "Settlement";
}
