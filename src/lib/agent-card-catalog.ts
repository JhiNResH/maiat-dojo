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

export type AgentServiceCard = {
  id: string;
  slug: string;
  name: string;
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

export const AGENT_SERVICE_CARDS: AgentServiceCard[] = [
  {
    id: "agent-jiagon-negotiator",
    slug: "jiagon-negotiator",
    name: "Jiagon Negotiator",
    collection: "Jiagon Commerce Agents",
    role: "Negotiator for merchant orders, refunds, and receipt-backed credit.",
    archetype: "Agent Card",
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
    collection: "Cafe Commerce Forks",
    role: "Coffee-shop order issue agent forked from Jiagon.",
    archetype: "Fork: Raposa Agent",
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
    collection: "Onchain Merchant Agents",
    role: "Onchain settlement assistant for commerce payments and claims.",
    archetype: "Fork: SOLYD Agent",
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
