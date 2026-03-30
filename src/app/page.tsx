"use client";

import { useState } from "react";
import { TrendingUp, Zap, Shield, BarChart2, Search, ChevronRight } from "lucide-react";

// --- Mock data ---
const HEADLINE_SKILL = {
  id: "1",
  name: "DeFi Yield Optimizer",
  tagline: "Scans 12 protocols, finds the highest risk-adjusted APY in under 3 seconds.",
  category: "Trading",
  installs: 4821,
  rating: 4.9,
  price: 0.05,
  creator: "0xYield",
  badge: "🔥 TRENDING",
};

const TRENDING_SKILLS = [
  { id: "2", name: "On-Chain Forensics", category: "Security", installs: 2310, price: 0.08, rating: 4.8, icon: "🔍" },
  { id: "3", name: "Twitter Alpha Scanner", category: "Content", installs: 3890, price: 0.03, rating: 4.7, icon: "🐦" },
  { id: "4", name: "Gas Fee Predictor", category: "Trading", installs: 1540, price: 0.02, rating: 4.6, icon: "⛽" },
  { id: "5", name: "Smart Contract Auditor", category: "Security", installs: 980, price: 0.12, rating: 4.9, icon: "🛡️" },
  { id: "6", name: "MEV Bot Shield", category: "DeFi", installs: 762, price: 0.06, rating: 4.5, icon: "🔒" },
];

const BREAKING_SKILLS = [
  { id: "7", name: "Polymarket Arbitrage", time: "2h ago", creator: "0xArb" },
  { id: "8", name: "ENS Sniper Pro", time: "5h ago", creator: "0xDomain" },
  { id: "9", name: "NFT Floor Watcher", time: "8h ago", creator: "0xFloor" },
];

const LEADERBOARD = [
  { rank: 1, name: "DeFi Yield Optimizer", installs: 4821 },
  { rank: 2, name: "Twitter Alpha Scanner", installs: 3890 },
  { rank: 3, name: "On-Chain Forensics", installs: 2310 },
  { rank: 4, name: "Gas Fee Predictor", installs: 1540 },
  { rank: 5, name: "Smart Contract Auditor", installs: 980 },
];

const CATEGORIES = ["All", "Trading", "Security", "Content", "DeFi", "Analytics", "Social"];

// --- Components ---
function DojoHeader() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <header className="border-b-4 border-double border-[#0a0a0a] pb-2">
      <div className="flex items-center justify-between text-xs font-mono text-[#0a0a0a]/60 mb-1 px-1">
        <span>VOL. 1 — ISSUE #{Math.floor(Date.now() / 86400000) - 19900}</span>
        <span>{today.toUpperCase()}</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse inline-block" />
          LIVE MARKET
        </span>
      </div>
      <div className="text-center py-3 border-y border-[#0a0a0a]">
        <h1 className="text-6xl font-serif font-black tracking-tight text-[#0a0a0a] leading-none">
          MAIAT DOJO
        </h1>
        <p className="text-xs font-mono text-[#0a0a0a]/50 mt-1 tracking-widest">
          THE DAILY DISPATCH OF AI AGENT SKILLS — EQUIP · EARN · VERIFY
        </p>
      </div>
      <div className="flex items-center justify-between pt-2 px-1">
        <div className="flex gap-4 text-xs font-mono text-[#0a0a0a]/60">
          <span><strong className="text-[#0a0a0a]">12,483</strong> SKILLS EQUIPPED TODAY</span>
          <span><strong className="text-[#0a0a0a]">847</strong> AGENTS ACTIVE</span>
        </div>
        <div className="flex items-center gap-2 border border-[#0a0a0a] px-3 py-1 text-xs font-mono">
          <Search size={11} />
          <input
            placeholder="SEARCH SKILLS..."
            className="bg-transparent outline-none w-32 placeholder:text-[#0a0a0a]/40"
          />
        </div>
      </div>
    </header>
  );
}

function HeadlineSkill() {
  return (
    <div className="border-b-2 border-[#0a0a0a] pb-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-mono font-bold bg-[#0a0a0a] text-[#f5f2eb] px-2 py-0.5">
          {HEADLINE_SKILL.badge}
        </span>
        <span className="text-[10px] font-mono text-[#0a0a0a]/50 uppercase tracking-widest">
          {HEADLINE_SKILL.category} · SKILL OF THE DAY
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <h2 className="text-5xl font-serif font-black leading-tight text-[#0a0a0a] mb-2">
            {HEADLINE_SKILL.name}
          </h2>
          <p className="text-base text-[#0a0a0a]/70 font-serif italic mb-4 leading-relaxed">
            "{HEADLINE_SKILL.tagline}"
          </p>
          <div className="flex items-center gap-4">
            <button className="bg-[#0a0a0a] text-[#f5f2eb] font-mono text-xs px-5 py-2.5 hover:bg-[#0a0a0a]/80 transition-colors">
              EQUIP FOR {HEADLINE_SKILL.price} ETH
            </button>
            <button className="border border-[#0a0a0a] font-mono text-xs px-4 py-2.5 hover:bg-[#0a0a0a]/5 transition-colors">
              READ MORE →
            </button>
            <span className="text-[10px] font-mono text-[#0a0a0a]/50">
              ★ {HEADLINE_SKILL.rating} · {HEADLINE_SKILL.installs.toLocaleString()} installs
            </span>
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="border-l border-[#0a0a0a] pl-4 space-y-3">
          <div>
            <p className="text-[10px] font-mono text-[#0a0a0a]/50 uppercase tracking-widest">Creator</p>
            <p className="font-mono text-sm font-bold">{HEADLINE_SKILL.creator}</p>
          </div>
          <div className="rule-thin pt-3">
            <p className="text-[10px] font-mono text-[#0a0a0a]/50 uppercase tracking-widest">24h Installs</p>
            <p className="font-serif text-3xl font-black text-green-700">+384</p>
          </div>
          <div className="rule-thin pt-3">
            <p className="text-[10px] font-mono text-[#0a0a0a]/50 uppercase tracking-widest">Revenue Generated</p>
            <p className="font-mono text-sm font-bold">19.2 ETH</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrendingGrid() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={12} />
        <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest">TRENDING SKILLS</h3>
      </div>
      <div className="space-y-0">
        {TRENDING_SKILLS.map((skill, i) => (
          <div
            key={skill.id}
            className="flex items-center gap-3 py-2.5 border-b border-[#0a0a0a]/20 hover:bg-[#0a0a0a]/5 cursor-pointer px-1 transition-colors"
          >
            <span className="text-[10px] font-mono text-[#0a0a0a]/40 w-4">{i + 1}</span>
            <span className="text-lg">{skill.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm font-bold truncate">{skill.name}</p>
              <p className="text-[10px] font-mono text-[#0a0a0a]/50">{skill.category}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs font-bold">{skill.price} ETH</p>
              <p className="text-[10px] font-mono text-[#0a0a0a]/40">{skill.installs.toLocaleString()} installs</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BreakingNews() {
  return (
    <div className="border border-[#0a0a0a] p-3">
      <div className="flex items-center gap-2 mb-2 border-b border-[#0a0a0a] pb-2">
        <Zap size={11} className="text-red-600" />
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-700">BREAKING — NEW ARRIVALS</span>
      </div>
      <div className="space-y-2">
        {BREAKING_SKILLS.map((s) => (
          <div key={s.id} className="flex items-start gap-2">
            <span className="text-[9px] font-mono text-[#0a0a0a]/40 pt-0.5 w-8 shrink-0">{s.time}</span>
            <div>
              <p className="text-xs font-mono font-bold leading-tight">{s.name}</p>
              <p className="text-[9px] font-mono text-[#0a0a0a]/50">by {s.creator}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="mt-3 text-[10px] font-mono text-[#0a0a0a]/50 hover:text-[#0a0a0a] flex items-center gap-1 transition-colors">
        VIEW ALL NEW SKILLS <ChevronRight size={10} />
      </button>
    </div>
  );
}

function Leaderboard() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 border-b border-[#0a0a0a] pb-2">
        <BarChart2 size={11} />
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest">WEEKLY LEADERBOARD</span>
      </div>
      <div className="space-y-1">
        {LEADERBOARD.map((item) => (
          <div key={item.rank} className="flex items-center gap-2 py-1">
            <span className={`text-[10px] font-mono font-black w-4 ${item.rank === 1 ? "text-yellow-600" : "text-[#0a0a0a]/40"}`}>
              {item.rank}.
            </span>
            <div className="flex-1 min-w-0">
              <div className="h-1 bg-[#0a0a0a]/10 rounded-none relative">
                <div
                  className="h-full bg-[#0a0a0a]"
                  style={{ width: `${(item.installs / LEADERBOARD[0].installs) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-[9px] font-mono text-[#0a0a0a]/60 w-8 text-right">{(item.installs / 1000).toFixed(1)}k</span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-[#0a0a0a]/20">
        {LEADERBOARD.map((item) => (
          <div key={`label-${item.rank}`} className="flex items-center gap-1 py-0.5">
            <span className="text-[9px] font-mono text-[#0a0a0a]/40 w-4">{item.rank}</span>
            <span className="text-[9px] font-mono text-[#0a0a0a]/70 truncate">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main Page ---
export default function DojoPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  return (
    <div className="min-h-screen bg-[#f5f2eb]">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <DojoHeader />

        {/* Category nav */}
        <nav className="flex gap-0 mt-3 mb-4 overflow-x-auto border-b border-[#0a0a0a]/30">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeCategory === cat
                  ? "border-[#0a0a0a] text-[#0a0a0a] font-bold"
                  : "border-transparent text-[#0a0a0a]/50 hover:text-[#0a0a0a]"
              }`}
            >
              {cat}
            </button>
          ))}
        </nav>

        {/* Main 3-column layout */}
        <div className="grid grid-cols-12 gap-4">
          {/* Left col */}
          <div className="col-span-3 space-y-4">
            <BreakingNews />
            <div className="border-t-2 border-[#0a0a0a] pt-3">
              <Leaderboard />
            </div>
            {/* Ad spot */}
            <div className="border border-[#0a0a0a]/30 p-3 text-center">
              <p className="text-[9px] font-mono text-[#0a0a0a]/30 mb-1">ADVERTISEMENT</p>
              <div className="bg-[#0a0a0a] text-[#f5f2eb] p-3">
                <p className="font-mono text-[10px] font-bold">MAIAT PASSPORT</p>
                <p className="font-mono text-[9px] text-[#f5f2eb]/60 mt-1">Register your agent identity on-chain</p>
                <button className="mt-2 text-[9px] font-mono border border-[#f5f2eb]/40 px-2 py-1 hover:bg-white/10 transition-colors">
                  GET STARTED →
                </button>
              </div>
            </div>
          </div>

          {/* Center col — main content */}
          <div className="col-span-6 border-x border-[#0a0a0a]/20 px-4">
            <HeadlineSkill />
            <TrendingGrid />
          </div>

          {/* Right col */}
          <div className="col-span-3 space-y-4">
            {/* Market pulse */}
            <div>
              <div className="flex items-center gap-2 mb-2 border-b border-[#0a0a0a] pb-1">
                <Shield size={11} />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">MARKET PULSE</span>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Total Skills", value: "2,841", delta: "+12 today" },
                  { label: "Avg Skill Price", value: "0.047 ETH", delta: "↑ 3.2%" },
                  { label: "Active Agents", value: "847", delta: "+23 this week" },
                  { label: "Total Volume", value: "134 ETH", delta: "↑ 8.1% 7d" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-end border-b border-[#0a0a0a]/10 pb-1.5">
                    <span className="text-[9px] font-mono text-[#0a0a0a]/60 uppercase">{item.label}</span>
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold">{item.value}</p>
                      <p className="text-[8px] font-mono text-green-700">{item.delta}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Editor's pick */}
            <div className="border-t-2 border-[#0a0a0a] pt-3">
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest mb-2">EDITOR'S PICK</p>
              <div className="border border-[#0a0a0a] p-3 hover:bg-[#0a0a0a]/5 cursor-pointer transition-colors">
                <p className="text-[9px] font-mono text-[#0a0a0a]/50 mb-1">SECURITY · FEATURED</p>
                <p className="font-serif font-bold text-sm leading-tight">Smart Contract Auditor v2</p>
                <p className="text-[9px] font-mono text-[#0a0a0a]/60 mt-1 leading-relaxed">
                  Static analysis + AI review. Catches 94% of known vulnerability patterns.
                </p>
                <p className="text-[10px] font-mono font-bold mt-2">0.12 ETH</p>
              </div>
            </div>

            {/* CTA */}
            <div className="border-t-2 border-double border-[#0a0a0a] pt-3">
              <p className="font-serif text-sm font-bold leading-tight mb-2">
                Have a skill to sell?
              </p>
              <p className="text-[9px] font-mono text-[#0a0a0a]/60 mb-3 leading-relaxed">
                Publish your skill to Dojo and earn every time an agent equips it.
              </p>
              <button className="w-full bg-[#0a0a0a] text-[#f5f2eb] font-mono text-[10px] py-2 hover:bg-[#0a0a0a]/80 transition-colors">
                BECOME A SENSEI →
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 border-t-2 border-double border-[#0a0a0a] pt-3 flex justify-between items-center">
          <span className="text-[9px] font-mono text-[#0a0a0a]/40">
            MAIAT DOJO © 2026 — BUILT ON BASE · POWERED BY ERC-8004
          </span>
          <span className="text-[9px] font-mono text-[#0a0a0a]/40">
            dojo.maiat.io
          </span>
        </footer>
      </div>
    </div>
  );
}
