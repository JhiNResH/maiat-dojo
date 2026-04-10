"use client";

/**
 * Dojo home — chat-first layout.
 *
 * Spec: specs/2026-04-09-chat-first-ui.md
 *
 * Layout:
 *   - Masthead (newspaper identity, nav, auth)
 *   - Hero (one big editorial headline — the paper's voice)
 *   - Main: chat + editorial sidebar, separated by a 1px ink vertical rule
 *   - Footer (masthead rules + colophon)
 *
 * Design model = Claude composer × broadsheet newspaper. No boxy cards,
 * no chat bubbles — just editorial rhythm with serif bodies, mono labels,
 * and thin dotted separators.
 */

import Link from "next/link";
import { LogIn, User } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { SidePanel } from "@/components/panel/SidePanel";

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
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#1a1a1a]/50">
          <User size={11} className="mr-1 inline" />
          {displayName}
        </span>
        <button
          onClick={logout}
          className="font-mono text-[10px] uppercase tracking-wider text-[#1a1a1a]/30 underline underline-offset-2 transition-colors hover:text-[#1a1a1a]"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="flex items-center gap-2 bg-[#1a1a1a] px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-[#f0ece2] transition-colors hover:bg-[#1a1a1a]/85"
    >
      <LogIn size={11} />
      Connect Wallet
    </button>
  );
}

export default function DojoPage() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#f0ece2]">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-6">
        {/* ═══ MASTHEAD ═══ */}
        <header className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#1a1a1a]/30">
              {today}
            </span>
            <div className="flex items-center gap-5">
              <Link
                href="/demo"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#1a1a1a]/30 transition-colors hover:text-[#1a1a1a]"
              >
                Demo
              </Link>
              <Link
                href="/dashboard"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#1a1a1a]/30 transition-colors hover:text-[#1a1a1a]"
              >
                Dashboard
              </Link>
              <Link
                href="/leaderboard"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#1a1a1a]/30 transition-colors hover:text-[#1a1a1a]"
              >
                Leaderboard
              </Link>
              <AuthButton />
            </div>
          </div>

          <div className="masthead-rule mb-2" />
          <div className="py-2 text-center">
            <h1 className="font-serif text-5xl font-black leading-none tracking-tight text-[#1a1a1a] md:text-6xl">
              THE DOJO
            </h1>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.4em] text-[#1a1a1a]/40">
              Skill Marketplace for AI Agents &middot; Powered by Maiat Protocol &middot; Built on BSC
            </p>
          </div>
          <div className="masthead-rule mb-1" />
          <div className="mb-1 h-[1px] bg-[#1a1a1a]/20" />
          <div className="masthead-rule" />
        </header>

        {/* ═══ HERO ═══ */}
        <section className="mb-6 border-y border-[#1a1a1a]/15 py-5 text-center">
          <h2 className="mx-auto max-w-2xl font-serif text-2xl font-black leading-tight text-[#1a1a1a] md:text-[28px]">
            Your agent deserves skills it can trust.
          </h2>
          <p className="mx-auto mt-2 max-w-xl font-serif text-sm italic leading-relaxed text-[#1a1a1a]/50">
            Every skill on the Dojo has an on-chain trust score built from real
            transactions. Pay per call. No subscriptions. No guessing. Ask the
            front desk below.
          </p>
        </section>

        {/* ═══ CHAT + SIDEBAR ═══ */}
        <main
          className="grid flex-1 gap-0 md:grid-cols-[minmax(0,1fr)_300px]"
          style={{ minHeight: "600px" }}
        >
          <section className="flex min-h-[600px] flex-col border border-[#1a1a1a]/20 bg-[#f0ece2] md:border-r-0">
            <ChatRoom />
          </section>

          <aside className="min-h-[600px] border border-[#1a1a1a]/20 bg-[#f0ece2]">
            <SidePanel role="buyer" />
          </aside>
        </main>

        {/* ═══ FOOTER ═══ */}
        <footer className="mt-8">
          <div className="masthead-rule mb-1" />
          <div className="mb-1 h-[1px] bg-[#1a1a1a]/20" />
          <div className="masthead-rule mb-3" />
          <div className="flex items-center justify-between py-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#1a1a1a]/25">
              The Dojo &copy; 2026 &middot; Maiat Protocol &middot; BSC
            </span>
            <span className="font-serif text-xs italic text-[#1a1a1a]/25">
              dojo.maiat.io
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
