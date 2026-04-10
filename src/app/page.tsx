"use client";

/**
 * Dojo home — chat-first, zero-sidebar layout.
 *
 * Spec: specs/2026-04-09-chat-first-ui.md (landing hero §Zero state)
 *
 * Layout:
 *   - Masthead (date, nav, wallet pill, THE DOJO wordmark)
 *   - Main: ChatRoom (which owns landing vs chat mode toggle internally)
 *   - Footer (masthead rules + colophon)
 *
 * Design principle — "injection mold": ONE primary surface (the composer),
 * everything else is in-chat. No more 70/30 sidebar. The BuyerPanel is dead.
 * Leaderboard + Trending live inside LandingHero, so they only show when the
 * user hasn't started a conversation yet.
 */

import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { ChatRoom } from "@/components/chat/ChatRoom";

function WalletPill() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  if (!ready) return null;

  if (authenticated && user) {
    const displayName =
      user.email?.address?.split("@")[0] ||
      user.google?.name ||
      (user.wallet?.address
        ? `${user.wallet.address.slice(0, 6)}…${user.wallet.address.slice(-4)}`
        : "Agent");

    return (
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-2 border border-[#1a1a1a]/25 px-3 py-1 font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/70">
          <span className="h-1.5 w-1.5 rounded-full bg-[#1a1a1a]" />
          {displayName}
        </span>
        <button
          onClick={logout}
          className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/30 underline underline-offset-2 transition-colors hover:text-[#8b0000]"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="border border-[#1a1a1a] bg-[#1a1a1a] px-3 py-1 font-mono text-[9px] uppercase tracking-wider text-[#f0ece2] transition-colors hover:bg-[#1a1a1a]/85"
    >
      Connect Wallet →
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
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-6">
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
              <WalletPill />
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

        {/* ═══ CHAT (owns landing vs chat toggle) ═══ */}
        <main className="flex min-h-[640px] flex-1 flex-col">
          <ChatRoom />
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
