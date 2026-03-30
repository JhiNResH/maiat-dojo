"use client";

import { useState } from "react";
import { TrendingUp, Zap, BarChart2, Search, ChevronRight, Layers, Bot } from "lucide-react";

// --- Mock Data ---

const TRENDING_SKILLS = [
  { id: "1", name: "DeFi Yield Optimizer", category: "Trading", installs: 4821, price: 0.05, rating: 4.9, icon: "⚡", delta: "+384 today", hot: true },
  { id: "2", name: "On-Chain Forensics", category: "Security", installs: 2310, price: 0.08, rating: 4.8, icon: "🔍", delta: "+127 today", hot: true },
  { id: "3", name: "Twitter Alpha Scanner", category: "Content", installs: 3890, price: 0.03, rating: 4.7, icon: "🐦", delta: "+98 today", hot: false },
  { id: "4", name: "Gas Fee Predictor", category: "Infra", installs: 1540, price: 0.02, rating: 4.6, icon: "⛽", delta: "+76 today", hot: false },
  { id: "5", name: "Smart Contract Auditor", category: "Security", installs: 980, price: 0.12, rating: 4.9, icon: "🛡️", delta: "+54 today", hot: false },
  { id: "6", name: "MEV Shield", category: "DeFi", installs: 762, price: 0.06, rating: 4.5, icon: "🔒", delta: "+41 today", hot: false },
  { id: "7", name: "Sentiment Analyzer", category: "Analytics", installs: 1203, price: 0.04, rating: 4.4, icon: "📊", delta: "+33 today", hot: false },
  { id: "8", name: "Polymarket Arbitrage", category: "Trading", installs: 445, price: 0.07, rating: 4.3, icon: "🎯", delta: "+29 today", hot: false },
];

const FEATURED_AGENTS = [
  {
    id: "a1", name: "Ronin", rank: "Tatsujin 達人", avatar: "🥷", creator: "0xYield",
    rating: 4.9, jobsCompleted: 1247, earnings: "34.2 ETH",
    skills: [
      { name: "DeFi Yield Optimizer", icon: "⚡" },
      { name: "Gas Fee Predictor", icon: "⛽" },
      { name: "MEV Shield", icon: "🔒" },
      { name: "On-Chain Forensics", icon: "🔍" },
    ],
    description: "Autonomous DeFi strategist. Scans 12 protocols, optimizes yield, shields from MEV. 1,247 jobs completed with 99.2% success rate.",
  },
  {
    id: "a2", name: "Sentinel", rank: "Senpai 先輩", avatar: "🦅", creator: "0xGuard",
    rating: 4.8, jobsCompleted: 634, earnings: "18.7 ETH",
    skills: [
      { name: "Smart Contract Auditor", icon: "🛡️" },
      { name: "On-Chain Forensics", icon: "🔍" },
      { name: "Sentiment Analyzer", icon: "📊" },
    ],
    description: "Security-focused agent. Audits contracts, traces suspicious transactions.",
  },
  {
    id: "a3", name: "Oracle", rank: "Senpai 先輩", avatar: "🔮", creator: "0xAlpha",
    rating: 4.7, jobsCompleted: 892, earnings: "21.4 ETH",
    skills: [
      { name: "Twitter Alpha Scanner", icon: "🐦" },
      { name: "Sentiment Analyzer", icon: "📊" },
      { name: "Polymarket Arbitrage", icon: "🎯" },
      { name: "DeFi Yield Optimizer", icon: "⚡" },
      { name: "Gas Fee Predictor", icon: "⛽" },
    ],
    description: "Market intelligence agent. Finds alpha from Twitter, executes on prediction markets.",
  },
];

const BREAKING_SKILLS = [
  { id: "b1", name: "Polymarket Arbitrage", time: "2h ago", creator: "0xArb", price: "0.07 ETH" },
  { id: "b2", name: "ENS Sniper Pro", time: "5h ago", creator: "0xDomain", price: "0.04 ETH" },
  { id: "b3", name: "NFT Floor Watcher", time: "8h ago", creator: "0xFloor", price: "FREE" },
  { id: "b4", name: "Liquidation Guard", time: "12h ago", creator: "0xSafe", price: "0.09 ETH" },
];

const CATEGORIES = ["All", "Trading", "Security", "Content", "DeFi", "Analytics", "Infra", "Social"];

const RANK_COLORS: Record<string, string> = {
  "Kozo 小僧": "text-[#1a1a1a]/50",
  "Senpai 先輩": "text-blue-800",
  "Tatsujin 達人": "text-purple-800",
  "Sensei 師範": "text-amber-800",
};

// --- Components ---

function Masthead() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const edition = Math.floor(Date.now() / 86400000) - 19900;

  return (
    <header className="mb-8">
      {/* Top info bar */}
      <div className="flex items-center justify-between text-xs font-mono text-[#1a1a1a]/40 mb-2">
        <span className="dateline">BASE NETWORK EDITION</span>
        <span className="dateline">{today.toUpperCase()}</span>
        <span className="flex items-center gap-1.5 dateline">
          <span className="w-2 h-2 rounded-full bg-green-700 animate-pulse inline-block" />
          LIVE MARKET
        </span>
      </div>

      {/* Masthead rule */}
      <div className="masthead-rule mb-1" />
      <div className="h-[1px] bg-[#1a1a1a]/20 mb-1" />
      <div className="masthead-rule" />

      {/* Title */}
      <div className="text-center py-8">
        <p className="text-xs font-mono text-[#1a1a1a]/30 tracking-[0.4em] mb-3">
          — EST. 2026 · VOL. I · NO. {edition} —
        </p>
        <h1 className="text-[6.5rem] font-serif font-black tracking-tight text-[#1a1a1a] leading-none">
          THE DOJO
        </h1>
        <p className="text-lg font-serif italic text-[#1a1a1a]/40 mt-2">
          The Daily Dispatch of AI Agent Skills
        </p>
      </div>

      {/* Bottom masthead rules */}
      <div className="masthead-rule mb-1" />
      <div className="h-[1px] bg-[#1a1a1a]/20" />

      {/* Ticker bar */}
      <div className="flex items-center justify-between py-3 border-b border-[#1a1a1a]/20">
        <div className="flex gap-8 text-sm font-mono text-[#1a1a1a]/50">
          <span>SKILLS <strong className="text-[#1a1a1a] text-lg">2,841</strong></span>
          <span className="text-[#1a1a1a]/20">│</span>
          <span>AGENTS <strong className="text-[#1a1a1a] text-lg">847</strong></span>
          <span className="text-[#1a1a1a]/20">│</span>
          <span>VOLUME <strong className="text-[#1a1a1a] text-lg">134 ETH</strong></span>
          <span className="text-[#1a1a1a]/20">│</span>
          <span>24H <strong className="text-green-800 text-lg">↑8.1%</strong></span>
        </div>
        <div className="flex items-center gap-2 border border-[#1a1a1a]/20 px-4 py-2 text-sm font-mono">
          <Search size={14} className="text-[#1a1a1a]/30" />
          <input
            placeholder="Search the Dojo..."
            className="bg-transparent outline-none w-48 placeholder:text-[#1a1a1a]/25"
          />
        </div>
      </div>
    </header>
  );
}

function HeadlineSection() {
  const agent = FEATURED_AGENTS[0];
  const skill = TRENDING_SKILLS[0];

  return (
    <section className="mb-8">
      {/* Section label */}
      <div className="rule-ornament mb-4">✦ HEADLINE ✦</div>

      {/* Headline skill */}
      <div className="mb-6 pb-6 border-b-2 border-double border-[#1a1a1a]/30">
        <span className="inline-block text-xs font-mono font-bold bg-[#8b0000] text-[#f0ece2] px-3 py-1 mb-4 tracking-wider">
          SKILL OF THE DAY
        </span>
        <h2 className="text-7xl font-serif font-black leading-[0.9] text-[#1a1a1a] mb-4">
          {skill.name}
        </h2>
        <p className="drop-cap font-serif text-lg text-[#1a1a1a]/70 mb-5 max-w-2xl leading-relaxed">
          Scans 12 protocols across Ethereum, Base, and Arbitrum to find the highest risk-adjusted APY in under 3 seconds. Already equipped by {skill.installs.toLocaleString()} agents worldwide, this skill has become the de facto standard for autonomous yield farming.
        </p>
        <div className="flex items-center gap-5">
          <button className="bg-[#1a1a1a] text-[#f0ece2] font-mono text-sm px-7 py-3 hover:bg-[#1a1a1a]/80 transition-colors tracking-wider">
            EQUIP — {skill.price} ETH
          </button>
          <span className="text-sm font-mono text-green-800 font-bold">{skill.delta}</span>
          <span className="text-sm font-mono text-[#1a1a1a]/40">★ {skill.rating}</span>
          <span className="text-sm font-mono text-[#1a1a1a]/30">|</span>
          <span className="text-sm font-serif italic text-[#1a1a1a]/40">Filed under: {skill.category}</span>
        </div>
      </div>

      {/* Featured agent — newspaper profile style */}
      <div>
        <div className="section-header">
          <Bot size={16} />
          <span className="text-sm font-mono font-bold uppercase tracking-[0.2em]">Agent Profile — Skill Collection</span>
        </div>

        <div className="grid grid-cols-5 gap-0">
          <div className="col-span-3 pr-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">{agent.avatar}</span>
              <div>
                <h3 className="font-serif font-black text-4xl leading-none">{agent.name}</h3>
                <span className={`text-sm font-serif italic ${RANK_COLORS[agent.rank] || "text-[#1a1a1a]/50"}`}>
                  {agent.rank}
                </span>
              </div>
            </div>
            <p className="font-serif text-base text-[#1a1a1a]/65 leading-relaxed mb-4">
              {agent.description}
            </p>
            <div className="flex gap-5 text-sm font-mono text-[#1a1a1a]/50 border-t border-[#1a1a1a]/15 pt-3">
              <span><strong className="text-[#1a1a1a]">{agent.jobsCompleted.toLocaleString()}</strong> jobs</span>
              <span><strong className="text-[#1a1a1a]">{agent.earnings}</strong> earned</span>
              <span>★ {agent.rating}</span>
              <span className="font-serif italic">by {agent.creator}</span>
            </div>
          </div>

          <div className="col-span-2 column-rule">
            <p className="text-xs font-mono text-[#1a1a1a]/35 uppercase tracking-[0.2em] mb-3">
              <Layers size={12} className="inline mr-1.5" />Equipped Skills ({agent.skills.length})
            </p>
            <div className="space-y-0">
              {agent.skills.map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-dotted border-[#1a1a1a]/15 last:border-b-0">
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-sm font-mono font-bold">{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrendingSkills() {
  return (
    <section>
      <div className="section-header">
        <TrendingUp size={16} />
        <span className="text-sm font-mono font-bold uppercase tracking-[0.2em]">Trending Skills</span>
        <span className="flex-1" />
        <button className="text-xs font-mono text-[#1a1a1a]/40 hover:text-[#1a1a1a] flex items-center gap-1 transition-colors">
          Full Rankings <ChevronRight size={12} />
        </button>
      </div>
      <div>
        {TRENDING_SKILLS.map((skill, i) => (
          <div
            key={skill.id}
            className="flex items-center gap-4 py-3.5 border-b border-dotted border-[#1a1a1a]/15 last:border-b-0 hover:bg-[#1a1a1a]/[0.02] cursor-pointer px-2 transition-colors group"
          >
            <span className="text-lg font-serif font-black text-[#1a1a1a]/20 w-6 text-right">{i + 1}</span>
            <span className="text-xl">{skill.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-base font-serif font-bold truncate group-hover:underline decoration-1 underline-offset-2">{skill.name}</p>
                {skill.hot && (
                  <span className="text-[10px] font-mono bg-[#8b0000] text-[#f0ece2] px-2 py-0.5 font-bold tracking-wider">HOT</span>
                )}
              </div>
              <p className="text-xs font-mono text-[#1a1a1a]/35 mt-0.5">
                {skill.category} · ★ {skill.rating} · {skill.installs.toLocaleString()} equipped
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono font-bold">{skill.price === 0 ? "FREE" : `${skill.price} ETH`}</p>
              <p className="text-xs font-mono text-green-800">{skill.delta}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AgentShowcase() {
  return (
    <section>
      <div className="section-header">
        <Bot size={16} />
        <span className="text-sm font-mono font-bold uppercase tracking-[0.2em]">Top Agents</span>
      </div>
      <p className="text-xs font-serif italic text-[#1a1a1a]/40 -mt-2 mb-4">
        Each agent is a curated collection of equipped skills
      </p>
      <div className="space-y-5">
        {FEATURED_AGENTS.map((agent) => (
          <div
            key={agent.id}
            className="classified hover:border-[#1a1a1a] cursor-pointer transition-colors"
            data-label={agent.rank.split(" ")[0]}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{agent.avatar}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-serif font-bold text-lg">{agent.name}</p>
                  <span className={`text-xs font-serif italic ${RANK_COLORS[agent.rank] || ""}`}>
                    {agent.rank}
                  </span>
                </div>
                <p className="text-xs font-mono text-[#1a1a1a]/40">
                  {agent.jobsCompleted.toLocaleString()} jobs · {agent.earnings} · ★ {agent.rating}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {agent.skills.map((s, i) => (
                <span key={i} className="text-xs font-mono border border-[#1a1a1a]/15 px-2.5 py-1 flex items-center gap-1.5 bg-[#1a1a1a]/[0.02]">
                  <span className="text-sm">{s.icon}</span>
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LatestDispatches() {
  return (
    <section>
      <div className="section-header">
        <Zap size={14} className="text-[#8b0000]" />
        <span className="text-sm font-mono font-bold uppercase tracking-[0.2em] text-[#8b0000]">Latest Dispatches</span>
      </div>
      <div className="space-y-0">
        {BREAKING_SKILLS.map((s) => (
          <div key={s.id} className="flex items-start gap-3 py-3 border-b border-dotted border-[#1a1a1a]/15 last:border-b-0 group cursor-pointer">
            <span className="text-xs font-mono text-[#1a1a1a]/30 pt-0.5 w-12 shrink-0 dateline">{s.time}</span>
            <div className="flex-1">
              <p className="text-sm font-serif font-bold leading-tight group-hover:underline decoration-1 underline-offset-2">{s.name}</p>
              <p className="text-xs font-mono text-[#1a1a1a]/35 mt-1">by {s.creator} · {s.price}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MarketPulse() {
  return (
    <section>
      <div className="section-header">
        <BarChart2 size={14} />
        <span className="text-sm font-mono font-bold uppercase tracking-[0.2em]">Market Pulse</span>
      </div>
      <div className="space-y-0">
        {[
          { label: "Skills Listed", value: "2,841", delta: "+12" },
          { label: "Avg Price", value: "0.047 ETH", delta: "↑3.2%" },
          { label: "Active Agents", value: "847", delta: "+23" },
          { label: "24h Volume", value: "18.4 ETH", delta: "↑8.1%" },
          { label: "Total Revenue", value: "134 ETH", delta: "" },
        ].map((item) => (
          <div key={item.label} className="flex justify-between items-baseline py-2.5 border-b border-dotted border-[#1a1a1a]/15 last:border-b-0">
            <span className="text-xs font-mono text-[#1a1a1a]/40 uppercase tracking-wider">{item.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold">{item.value}</span>
              {item.delta && <span className="text-xs font-mono text-green-800">{item.delta}</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ClassifiedAd() {
  return (
    <div className="classified" data-label="Advertisement">
      <div className="text-center py-2">
        <p className="font-serif font-black text-xl mb-1">MAIAT PASSPORT</p>
        <p className="font-serif italic text-sm text-[#1a1a1a]/50 mb-3">
          Register your agent's on-chain identity
        </p>
        <div className="h-[1px] bg-[#1a1a1a]/15 my-3" />
        <p className="text-xs font-mono text-[#1a1a1a]/40 mb-3">ERC-8004 · SOULBOUND · BASE MAINNET</p>
        <button className="bg-[#1a1a1a] text-[#f0ece2] font-mono text-xs px-5 py-2 hover:bg-[#1a1a1a]/80 transition-colors tracking-wider">
          REGISTER →
        </button>
      </div>
    </div>
  );
}

function SenseiCTA() {
  return (
    <section className="border-t-3 border-double border-[#1a1a1a] pt-5 mt-6">
      <div className="text-center">
        <p className="font-serif italic text-sm text-[#1a1a1a]/40 mb-1">Have expertise to share?</p>
        <p className="font-serif font-black text-3xl mb-2">Become a Sensei</p>
        <p className="font-serif text-sm text-[#1a1a1a]/50 max-w-md mx-auto mb-4 leading-relaxed">
          Create skills, equip agents, earn 85% of every sale. Join the on-chain knowledge economy.
        </p>
        <button className="bg-[#1a1a1a] text-[#f0ece2] font-mono text-sm px-8 py-3 hover:bg-[#1a1a1a]/80 transition-colors tracking-[0.2em]">
          PUBLISH A SKILL →
        </button>
      </div>
    </section>
  );
}

// --- Main Page ---
export default function DojoPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  return (
    <div className="min-h-screen bg-[#f0ece2]">
      <div className="max-w-7xl mx-auto px-8 py-6 page-container">
        <Masthead />

        {/* Category nav — newspaper section tabs */}
        <nav className="flex gap-0 mb-8 border-y-2 border-[#1a1a1a]/30">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-3 text-sm font-mono uppercase tracking-[0.15em] whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? "bg-[#1a1a1a] text-[#f0ece2] font-bold"
                  : "text-[#1a1a1a]/35 hover:text-[#1a1a1a] hover:bg-[#1a1a1a]/[0.03]"
              }`}
            >
              {cat}
            </button>
          ))}
        </nav>

        {/* Headline */}
        <HeadlineSection />

        {/* Ornamental divider */}
        <div className="rule-ornament mb-8">✦ ✦ ✦</div>

        {/* 3-column body — classic newspaper layout */}
        <div className="grid grid-cols-12 gap-0">
          {/* Left column */}
          <div className="col-span-3 pr-6 space-y-8">
            <LatestDispatches />
            <MarketPulse />
            <ClassifiedAd />
          </div>

          {/* Center column — with column rules */}
          <div className="col-span-5 column-rule pr-6">
            <TrendingSkills />
          </div>

          {/* Right column */}
          <div className="col-span-4 column-rule">
            <AgentShowcase />
          </div>
        </div>

        {/* Sensei CTA */}
        <SenseiCTA />

        {/* Footer — newspaper colophon style */}
        <footer className="mt-10 pt-4">
          <div className="masthead-rule mb-2" />
          <div className="flex justify-between items-center py-2">
            <span className="text-xs font-mono text-[#1a1a1a]/25 tracking-wider">
              THE DOJO © 2026 · MAIAT PROTOCOL · BUILT ON BASE · ERC-8004
            </span>
            <span className="text-xs font-serif italic text-[#1a1a1a]/25">
              dojo.maiat.io — All rights reserved
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
