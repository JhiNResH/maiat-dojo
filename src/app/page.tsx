"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LogIn, User } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

// --- Auth ---

function AuthButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  if (!ready) return null;

  if (authenticated && user) {
    const displayName =
      user.email?.address?.split("@")[0] ||
      user.google?.name ||
      (user.wallet?.address
        ? user.wallet.address.slice(0, 6) + "..." + user.wallet.address.slice(-4)
        : "Agent");

    return (
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-[#1a1a1a]/50">
          <User size={12} className="inline mr-1" />
          {displayName}
        </span>
        <button
          onClick={logout}
          className="text-xs font-mono text-[#1a1a1a]/30 hover:text-[#1a1a1a] transition-colors underline underline-offset-2"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="flex items-center gap-2 bg-[#1a1a1a] text-[#f0ece2] font-mono text-xs px-4 py-2 hover:bg-[#1a1a1a]/80 transition-colors tracking-wider"
    >
      <LogIn size={12} />
      CONNECT WALLET
    </button>
  );
}

// --- Types ---

interface Skill {
  id: string;
  name: string;
  description: string | null;
  pricePerCall: number | null;
  category: string | null;
  gatewaySlug: string | null;
  callCount?: number;
  trustScore?: number;
}

// --- Main Page ---

export default function DojoPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/skills?limit=20")
      .then((r) => r.json())
      .then((data) => setSkills(data.skills || []))
      .catch(() => setSkills([]))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#f0ece2]">
      <div className="max-w-4xl mx-auto px-6 py-8 page-container">
        {/* ═══ MASTHEAD ═══ */}
        <header className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#1a1a1a]/30">
              {today}
            </span>
            <AuthButton />
          </div>

          <div className="masthead-rule mb-2" />
          <div className="text-center py-3">
            <h1 className="font-serif font-black text-6xl md:text-7xl tracking-tight text-[#1a1a1a] leading-none">
              THE DOJO
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#1a1a1a]/40 mt-2">
              Skill Marketplace for AI Agents &middot; Powered by Maiat Protocol &middot; Built on BSC
            </p>
          </div>
          <div className="masthead-rule mb-1" />
          <div className="h-[1px] bg-[#1a1a1a]/20 mb-1" />
          <div className="masthead-rule" />
        </header>

        {/* ═══ HEADLINE ═══ */}
        <section className="mb-10 text-center">
          <h2 className="font-serif font-black text-3xl md:text-4xl text-[#1a1a1a] leading-tight mb-3">
            Your agent deserves skills it can trust.
          </h2>
          <p className="font-serif text-base text-[#1a1a1a]/50 max-w-lg mx-auto leading-relaxed">
            Every skill on Dojo has an on-chain trust score built from real
            transactions. Pay per call. No subscriptions. No guessing.
          </p>
        </section>

        {/* ═══ SKILLS SECTION ═══ */}
        <section className="mb-12">
          <div className="section-header">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#1a1a1a]/60">
              Skills
            </span>
            <span className="font-mono text-[10px] text-[#1a1a1a]/30">
              {skills.length} listed
            </span>
          </div>

          {loading ? (
            <p className="font-mono text-xs text-[#1a1a1a]/40 text-center py-12 animate-pulse">
              Loading skills...
            </p>
          ) : skills.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-serif italic text-lg text-[#1a1a1a]/30 mb-2">
                No skills listed yet.
              </p>
              <p className="font-mono text-xs text-[#1a1a1a]/30">
                Be the first creator to list a skill on the Dojo.
              </p>
            </div>
          ) : (
            <div>
              {skills.map((skill, i) => (
                <Link
                  key={skill.id}
                  href={`/skill/${skill.id}`}
                  className="block py-5 border-b border-dotted border-[#1a1a1a]/15 hover:bg-[#1a1a1a]/[0.02] -mx-3 px-3 transition-colors"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-3 mb-1">
                        <span className="font-serif font-black text-2xl text-[#1a1a1a]/10 leading-none">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <h3 className="font-serif font-bold text-xl text-[#1a1a1a]">
                          {skill.name}
                        </h3>
                      </div>
                      {skill.description && (
                        <p className="font-serif text-sm text-[#1a1a1a]/50 leading-relaxed mb-2 ml-10">
                          {skill.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs font-mono text-[#1a1a1a]/40 ml-10">
                        {skill.category && (
                          <span className="uppercase tracking-wider">{skill.category}</span>
                        )}
                        <span>{(skill.callCount ?? 0).toLocaleString()} calls</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pt-1">
                      <div className="font-mono text-sm font-bold text-[#1a1a1a] mb-1.5">
                        {skill.pricePerCall
                          ? `$${skill.pricePerCall.toFixed(2)}`
                          : "FREE"}
                        <span className="text-xs font-normal text-[#1a1a1a]/40 ml-0.5">
                          /call
                        </span>
                      </div>
                      <TrustBar score={skill.trustScore ?? 0} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section className="mb-12">
          <div className="section-header">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#1a1a1a]/60">
              How It Works
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-6 mt-4">
            {[
              { step: "I", title: "Pick a skill", desc: "Browse skills rated by on-chain trust scores from real transactions." },
              { step: "II", title: "Agent pays USDC", desc: "Funds lock in on-chain escrow via ERC-8183. No middleman." },
              { step: "III", title: "Get the result", desc: "Dojo forwards your request to the creator, returns the result." },
              { step: "IV", title: "Trust grows", desc: "Score updates on-chain after every session for everyone to see." },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <span className="font-serif font-black text-3xl text-[#1a1a1a]/10 leading-none shrink-0 w-10 text-right">
                  {item.step}
                </span>
                <div>
                  <p className="font-serif font-bold text-sm text-[#1a1a1a] mb-0.5">{item.title}</p>
                  <p className="font-serif text-sm text-[#1a1a1a]/50 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ PULL QUOTE ═══ */}
        <div className="pull-quote mb-12">
          &ldquo;Trust, not promises.&rdquo;
        </div>

        {/* ═══ FOOTER ═══ */}
        <footer>
          <div className="masthead-rule mb-1" />
          <div className="h-[1px] bg-[#1a1a1a]/20 mb-1" />
          <div className="masthead-rule mb-3" />
          <div className="flex justify-between items-center py-2">
            <span className="font-mono text-[10px] text-[#1a1a1a]/25 tracking-wider uppercase">
              The Dojo &copy; 2026 &middot; Maiat Protocol &middot; BSC
            </span>
            <span className="font-serif italic text-xs text-[#1a1a1a]/25">
              dojo.maiat.io
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

// --- Trust Score Bar ---

function TrustBar({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  const filled = Math.round(clamped / 10);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-[2px]">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`w-[5px] h-3 ${
              i < filled ? "bg-[#1a1a1a]" : "bg-[#1a1a1a]/10"
            }`}
          />
        ))}
      </div>
      <span className="text-[10px] font-mono text-[#1a1a1a]/40">{clamped}</span>
    </div>
  );
}
