"use client";

import { useState } from "react";
import { TrendingUp, Zap, Shield, BarChart2, Search, ChevronRight, Layers, Bot } from "lucide-react";

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
    description: "Autonomous DeFi strategist. Scans 12 protocols, optimizes yield, shields from MEV.",
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
  "Kozo 小僧": "text-[#0a0a0a]/50",
  "Senpai 先輩": "text-blue-700",
  "Tatsujin 達人": "text-purple-700",
  "Sensei 師範": "text-amber-700",
};

// --- Components ---

function DojoHeader() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <header className="mb-6">
      <div className="flex items-center justify-between text-xs font-mono text-[#0a0a0a]/50 mb-2 px-1">
        <span>VOL. 1 — NO. {Math.floor(Date.now() / 86400000) - 19900}</span>
        <span>{today.toUpperCase()}</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse inline-block" />
          LIVE
        </span>
      </div>

      <div className="border-t-[5px] border-double border-[#0a0a0a]" />
      <div className="text-center py-6">
        <h1 className="text-8xl font-serif font-black tracking-tight text-[#0a0a0a] leading-none">
          THE DOJO
        </h1>
        <p className="text-sm font-mono text-[#0a0a0a]/40 mt-2 tracking-[0.25em]">
          MAIAT SKILL MARKETPLACE — EQUIP YOUR AGENT · EARN ON-CHAIN
        </p>
      </div>
      <div className="border-b-[3px] border-[#0a0a0a]" />

      <div className="flex items-center justify-between pt-3 px-1">
        <div className="flex gap-8 text-xs font-mono text-[#0a0a0a]/50">
          <span><strong className="text-[#0a0a0a] text-base">2,841</strong> SKILLS</span>
          <span><strong className="text-[#0a0a0a] text-base">847</strong> AGENTS</span>
          <span><strong className="text-[#0a0a0a] text-base">134 ETH</strong> VOLUME</span>
        </div>
        <div className="flex items-center gap-2 border-2 border-[#0a0a0a]/30 px-4 py-2 text-sm font-mono rounded-none">
          <Search size={14} className="text-[#0a0a0a]/40" />
          <input
            placeholder="Search skills or agents..."
            className="bg-transparent outline-none w-48 placeholder:text-[#0a0a0a]/30"
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
    <div className="border-t-2 border-[#0a0a0a] p-6 mb-6">
      {/* Headline skill */}
      <div className="mb-6 pb-6 border-b-2 border-[#0a0a0a]/20">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono font-bold bg-[#0a0a0a] text-[#f5f2eb] px-3 py-1">
            🔥 SKILL OF THE DAY
          </span>
        </div>
        <h2 className="text-6xl font-serif font-black leading-[0.95] text-[#0a0a0a] mb-3">
          {skill.name}
        </h2>
        <p className="font-serif italic text-lg text-[#0a0a0a]/60 mb-4 max-w-2xl leading-relaxed">
          "Scans 12 protocols, finds the highest risk-adjusted APY in under 3 seconds. {skill.installs.toLocaleString()} agents already equipped."
        </p>
        <div className="flex items-center gap-4">
          <button className="bg-[#0a0a0a] text-[#f5f2eb] font-mono text-sm px-6 py-3 hover:bg-[#0a0a0a]/80 transition-colors">
            EQUIP — {skill.price} ETH
          </button>
          <span className="text-sm font-mono text-green-700 font-bold">{skill.delta}</span>
          <span className="text-sm font-mono text-[#0a0a0a]/40">★ {skill.rating}</span>
        </div>
      </div>

      {/* Featured agent */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Bot size={14} />
          <span className="text-xs font-mono font-bold uppercase tracking-widest">FEATURED AGENT — SKILL COLLECTION</span>
        </div>

        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3">
            <div className="flex items-center gap-4 mb-3">
              <span className="text-4xl">{agent.avatar}</span>
              <div>
                <h3 className="font-serif font-black text-3xl leading-none">{agent.name}</h3>
                <span className={`text-sm font-mono font-bold ${RANK_COLORS[agent.rank] || "text-[#0a0a0a]/50"}`}>
                  {agent.rank}
                </span>
              </div>
            </div>
            <p className="text-base text-[#0a0a0a]/60 font-serif leading-relaxed mb-4">
              {agent.description}
            </p>
            <div className="flex gap-4 text-sm font-mono text-[#0a0a0a]/50">
              <span><strong className="text-[#0a0a0a]">{agent.jobsCompleted}</strong> jobs</span>
              <span><strong className="text-[#0a0a0a]">{agent.earnings}</strong> earned</span>
              <span>★ {agent.rating}</span>
              <span>by {agent.creator}</span>
            </div>
          </div>

          <div className="col-span-2 border-l-2 border-[#0a0a0a]/20 pl-6">
            <p className="text-xs font-mono text-[#0a0a0a]/40 uppercase tracking-widest mb-3">
              <Layers size={12} className="inline mr-1" />EQUIPPED SKILLS ({agent.skills.length})
            </p>
            <div className="space-y-2">
              {agent.skills.map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-[#0a0a0a]/10">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-sm font-mono font-bold">{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrendingSkills() {
  return (
    <div className="border-t-2 border-[#0a0a0a] p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-[#0a0a0a]">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} />
          <h3 className="text-sm font-mono font-bold uppercase tracking-widest">TRENDING SKILLS</h3>
        </div>
        <button className="text-xs font-mono text-[#0a0a0a]/50 hover:text-[#0a0a0a] flex items-center gap-1 transition-colors">
          VIEW ALL <ChevronRight size={12} />
        </button>
      </div>
      <div className="space-y-0">
        {TRENDING_SKILLS.map((skill, i) => (
          <div
            key={skill.id}
            className="flex items-center gap-4 py-3 border-b border-[#0a0a0a]/10 last:border-b-0 hover:bg-[#0a0a0a]/[0.03] cursor-pointer px-2 transition-colors group"
          >
            <span className="text-sm font-mono text-[#0a0a0a]/30 w-5 text-right font-bold">{i + 1}</span>
            <span className="text-xl">{skill.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-base font-mono font-bold truncate group-hover:underline">{skill.name}</p>
                {skill.hot && (
                  <span className="text-[10px] font-mono bg-red-100 text-red-700 px-2 py-0.5 font-bold">HOT</span>
                )}
              </div>
              <p className="text-xs font-mono text-[#0a0a0a]/40 mt-0.5">{skill.category} · ★ {skill.rating} · {skill.installs.toLocaleString()} installs</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono font-bold">{skill.price === 0 ? "FREE" : `${skill.price} ETH`}</p>
              <p className="text-xs font-mono text-green-700">{skill.delta}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentShowcase() {
  return (
    <div className="border-t-2 border-[#0a0a0a] p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-[#0a0a0a]">
        <div className="flex items-center gap-2">
          <Bot size={16} />
          <h3 className="text-sm font-mono font-bold uppercase tracking-widest">TOP AGENTS</h3>
        </div>
        <span className="text-xs font-mono text-[#0a0a0a]/40">AGENT = SKILL COLLECTION</span>
      </div>
      <div className="space-y-4">
        {FEATURED_AGENTS.map((agent) => (
          <div
            key={agent.id}
            className="border-2 border-[#0a0a0a]/15 p-4 hover:border-[#0a0a0a]/50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{agent.avatar}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-serif font-bold text-lg">{agent.name}</p>
                  <span className={`text-xs font-mono font-bold ${RANK_COLORS[agent.rank] || ""}`}>
                    {agent.rank.split(" ")[0]}
                  </span>
                </div>
                <p className="text-xs font-mono text-[#0a0a0a]/40">
                  {agent.jobsCompleted} jobs · {agent.earnings} · ★ {agent.rating}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {agent.skills.map((s, i) => (
                <span key={i} className="text-xs font-mono bg-[#f5f2eb] border border-[#0a0a0a]/10 px-2.5 py-1 flex items-center gap-1.5">
                  <span className="text-sm">{s.icon}</span>
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BreakingNews() {
  return (
    <div className="border-t-2 border-[#0a0a0a] p-5">
      <div className="flex items-center gap-2 mb-3 pb-3 border-b-2 border-[#0a0a0a]">
        <Zap size={14} className="text-red-600" />
        <span className="text-sm font-mono font-bold uppercase tracking-widest text-red-700">NEW ARRIVALS</span>
      </div>
      <div className="space-y-3">
        {BREAKING_SKILLS.map((s) => (
          <div key={s.id} className="flex items-start gap-3 group cursor-pointer py-1">
            <span className="text-xs font-mono text-[#0a0a0a]/35 pt-0.5 w-12 shrink-0">{s.time}</span>
            <div className="flex-1">
              <p className="text-sm font-mono font-bold leading-tight group-hover:underline">{s.name}</p>
              <p className="text-xs font-mono text-[#0a0a0a]/40 mt-0.5">by {s.creator} · {s.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarketPulse() {
  return (
    <div className="border-t-2 border-[#0a0a0a] p-5">
      <div className="flex items-center gap-2 mb-3 pb-3 border-b-2 border-[#0a0a0a]">
        <BarChart2 size={14} />
        <span className="text-sm font-mono font-bold uppercase tracking-widest">MARKET PULSE</span>
      </div>
      <div className="space-y-3">
        {[
          { label: "Skills Listed", value: "2,841", delta: "+12" },
          { label: "Avg Price", value: "0.047 ETH", delta: "↑3.2%" },
          { label: "Active Agents", value: "847", delta: "+23" },
          { label: "24h Volume", value: "18.4 ETH", delta: "↑8.1%" },
          { label: "Total Revenue", value: "134 ETH", delta: "" },
        ].map((item) => (
          <div key={item.label} className="flex justify-between items-baseline border-b border-dotted border-[#0a0a0a]/15 pb-2">
            <span className="text-xs font-mono text-[#0a0a0a]/50 uppercase">{item.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold">{item.value}</span>
              {item.delta && <span className="text-xs font-mono text-green-700">{item.delta}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SenseiCTA() {
  return (
    <div className="bg-[#0a0a0a] text-[#f5f2eb] p-6">
      <p className="font-serif font-bold text-xl leading-tight mb-2">
        Become a Sensei
      </p>
      <p className="text-sm font-mono text-[#f5f2eb]/60 mb-4 leading-relaxed">
        Create skills, equip agents, earn 85% of every sale. Join the on-chain knowledge economy.
      </p>
      <button className="w-full bg-white text-[#0a0a0a] font-mono text-sm py-3 hover:bg-white/90 transition-colors tracking-widest font-bold">
        PUBLISH A SKILL →
      </button>
    </div>
  );
}

// --- Main Page ---
export default function DojoPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  return (
    <div className="min-h-screen bg-[#f5f2eb]">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <DojoHeader />

        {/* Category nav */}
        <nav className="flex gap-0 mb-6 overflow-x-auto border-t-2 border-[#0a0a0a]">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-3 text-sm font-mono uppercase tracking-widest whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? "bg-[#0a0a0a] text-[#f5f2eb] font-bold"
                  : "text-[#0a0a0a]/40 hover:text-[#0a0a0a] hover:bg-[#0a0a0a]/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </nav>

        {/* Headline */}
        <HeadlineSection />

        {/* 3-column body */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left — Breaking + Market */}
          <div className="col-span-3 space-y-6">
            <BreakingNews />
            <MarketPulse />
            <SenseiCTA />
          </div>

          {/* Center — Trending Skills */}
          <div className="col-span-5">
            <TrendingSkills />
          </div>

          {/* Right — Agent Showcase */}
          <div className="col-span-4">
            <AgentShowcase />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-10 border-t-[3px] border-double border-[#0a0a0a] pt-4 flex justify-between items-center">
          <span className="text-xs font-mono text-[#0a0a0a]/30">
            THE DOJO © 2026 — MAIAT PROTOCOL · BUILT ON BASE · ERC-8004
          </span>
          <span className="text-xs font-mono text-[#0a0a0a]/30">
            dojo.maiat.io
          </span>
        </footer>
      </div>
    </div>
  );
}
