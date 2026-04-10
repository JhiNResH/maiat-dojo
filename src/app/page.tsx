"use client";

/**
 * Dojo home — chat-first layout.
 *
 * Spec: specs/2026-04-09-chat-first-ui.md
 *
 * Layout:
 *   - Masthead (newspaper identity, nav, auth)
 *   - Main: 70/30 grid — <ChatRoom> left, <SidePanel> right
 *   - Below md breakpoint the panel collapses under the chat
 *
 * The old newspaper browse list has moved into <SkillListCard> (rendered
 * inside the chat) and <BuyerPanel> (top 5 in the right rail). The canonical
 * `/skill/[id]` detail page still exists — chat and URLs are duals.
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
        <span className="font-mono text-xs text-[#1a1a1a]/50">
          <User size={12} className="mr-1 inline" />
          {displayName}
        </span>
        <button
          onClick={logout}
          className="font-mono text-xs text-[#1a1a1a]/30 underline underline-offset-2 transition-colors hover:text-[#1a1a1a]"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="flex items-center gap-2 bg-[#1a1a1a] px-4 py-2 font-mono text-xs tracking-wider text-[#f0ece2] transition-colors hover:bg-[#1a1a1a]/80"
    >
      <LogIn size={12} />
      CONNECT WALLET
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
        <header className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#1a1a1a]/30">
              {today}
            </span>
            <div className="flex items-center gap-4">
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

        {/* ═══ CHAT + PANEL ═══ */}
        <main
          className="grid flex-1 gap-4 md:grid-cols-[minmax(0,1fr)_320px]"
          style={{ minHeight: "calc(100vh - 280px)" }}
        >
          <section
            className="flex min-h-[560px] flex-col border bg-[#f8f5ef]"
            style={{
              borderColor: "#b8a990",
              borderLeftWidth: "3px",
              borderLeftColor: "#1a1a1a",
            }}
          >
            <div className="flex items-baseline justify-between border-b border-dotted border-[#1a1a1a]/20 px-4 py-2">
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/50">
                Front Desk
              </span>
              <span className="font-mono text-[9px] text-[#1a1a1a]/30">
                buyer mode
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatRoom />
            </div>
          </section>

          <aside
            className="min-h-[560px] border bg-[#f0ece2]"
            style={{ borderColor: "#b8a990" }}
          >
            <SidePanel role="buyer" />
          </aside>
        </main>

        {/* ═══ FOOTER ═══ */}
        <footer className="mt-6">
          <div className="masthead-rule mb-1" />
          <div className="mb-1 h-[1px] bg-[#1a1a1a]/20" />
          <div className="masthead-rule mb-2" />
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
