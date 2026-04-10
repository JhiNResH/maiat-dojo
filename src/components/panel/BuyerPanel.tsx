"use client";

/**
 * BuyerPanel — side rail for a buyer-mode session.
 *
 * Spec: specs/2026-04-09-chat-first-ui.md (panel = chat-adjacent state)
 *
 * Layout:
 *   1. Wallet status (Privy)
 *   2. Top skills (fetched once, links to /skill/[id])
 *   3. Recent sessions (Phase 2 stub)
 *
 * The chat room is still the source of truth for actions — this panel is
 * a passive HUD. Clicking a skill here deep-links to the canonical URL
 * (invariant #2, chat ↔ URL duality).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { User, Wallet } from "lucide-react";
import type { ChatSkillSummary } from "../chat/types";

export function BuyerPanel() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const [top, setTop] = useState<ChatSkillSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/skills?limit=5")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setTop(data.skills ?? []);
      })
      .catch(() => {
        if (!cancelled) setTop([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = user
    ? user.email?.address?.split("@")[0] ||
      user.google?.name ||
      (user.wallet?.address
        ? `${user.wallet.address.slice(0, 6)}…${user.wallet.address.slice(-4)}`
        : "Agent")
    : null;

  return (
    <aside className="flex h-full flex-col gap-4 overflow-y-auto px-4 py-4">
      {/* Wallet card */}
      <section
        className="border bg-[#f8f5ef] p-3"
        style={{
          borderColor: "#b8a990",
          borderLeftWidth: "3px",
          borderLeftColor: "#1a1a1a",
        }}
      >
        <div className="mb-2 flex items-center justify-between border-b border-dotted border-[#1a1a1a]/20 pb-1">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/50">
            Agent
          </span>
          <span className="font-mono text-[9px] text-[#1a1a1a]/30">
            {ready ? (authenticated ? "connected" : "offline") : "…"}
          </span>
        </div>
        {!ready ? (
          <p className="font-mono text-[10px] text-[#1a1a1a]/30">
            Booting wallet…
          </p>
        ) : authenticated && user ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 font-serif text-sm font-bold text-[#1a1a1a]">
              <User size={12} className="text-[#1a1a1a]/60" />
              {displayName}
            </div>
            {user.wallet?.address && (
              <div className="flex items-center gap-2 font-mono text-[9px] text-[#1a1a1a]/40">
                <Wallet size={10} />
                <span className="truncate">{user.wallet.address}</span>
              </div>
            )}
            <button
              onClick={logout}
              className="self-start font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/40 underline underline-offset-2 hover:text-[#1a1a1a]"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={login}
            className="mt-1 flex w-full items-center justify-center gap-2 border border-[#1a1a1a] bg-[#1a1a1a] px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#f0ece2] transition hover:bg-[#1a1a1a]/90"
          >
            <Wallet size={12} />
            Connect Wallet
          </button>
        )}
      </section>

      {/* Top skills card */}
      <section
        className="border bg-[#f8f5ef] p-3"
        style={{
          borderColor: "#b8a990",
          borderLeftWidth: "3px",
          borderLeftColor: "#1a1a1a",
        }}
      >
        <div className="mb-2 flex items-baseline justify-between border-b border-dotted border-[#1a1a1a]/20 pb-1">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/50">
            Top Skills
          </span>
          <span className="font-mono text-[9px] text-[#1a1a1a]/30">
            {top?.length ?? "…"}
          </span>
        </div>
        {top === null ? (
          <p className="font-mono text-[10px] text-[#1a1a1a]/30">Loading…</p>
        ) : top.length === 0 ? (
          <p className="font-mono text-[10px] text-[#1a1a1a]/30">
            No skills listed yet.
          </p>
        ) : (
          <ul className="divide-y divide-dotted divide-[#1a1a1a]/15">
            {top.map((s, i) => (
              <li key={s.id} className="flex items-baseline gap-2 py-1.5">
                <span className="font-serif text-sm font-black leading-none text-[#1a1a1a]/15">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/skill/${s.id}`}
                    className="block truncate font-serif text-xs font-bold text-[#1a1a1a] hover:underline"
                  >
                    {s.name}
                  </Link>
                  {s.category && (
                    <div className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/35">
                      {s.category}
                    </div>
                  )}
                </div>
                <span className="shrink-0 font-mono text-[9px] font-bold text-[#1a1a1a]">
                  {s.pricePerCall != null && s.pricePerCall > 0
                    ? `$${s.pricePerCall.toFixed(3)}`
                    : "FREE"}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 border-t border-dotted border-[#1a1a1a]/20 pt-1 text-right font-mono text-[9px] text-[#1a1a1a]/30">
          say <span className="text-[#1a1a1a]/60">list skills</span> in chat
        </div>
      </section>

      {/* Sessions stub */}
      <section
        className="border border-dashed bg-[#f8f5ef]/50 p-3"
        style={{ borderColor: "#b8a990" }}
      >
        <div className="mb-1 font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/40">
          Recent Sessions
        </div>
        <p className="font-serif text-xs italic text-[#1a1a1a]/30">
          Ships in Phase 2 — session history &amp; close flow.
        </p>
      </section>
    </aside>
  );
}

export default BuyerPanel;
