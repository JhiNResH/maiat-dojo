"use client";

/**
 * BuyerPanel — editorial sidebar for a buyer-mode session.
 *
 * Spec: specs/2026-04-09-chat-first-ui.md (panel = chat-adjacent state)
 *
 * Styled as a newspaper classifieds column:
 *   - "Agent" section (wallet status, Privy)
 *   - "Headlines" section (top 5 skills, deep-link to /skill/[id])
 *   - "Classifieds" stub (Phase 2 — sessions)
 *
 * No boxy cards. Each section is introduced with a double-rule header
 * and rows are separated by dotted dividers. The chat room is still the
 * source of truth for actions; this panel is a passive editorial HUD.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import type { ChatSkillSummary } from "../chat/types";

function SectionHeader({ label, meta }: { label: string; meta?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between border-b-[3px] border-double border-[#1a1a1a]/60 pb-1">
      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#1a1a1a]/70">
        {label}
      </span>
      {meta && (
        <span className="font-mono text-[9px] text-[#1a1a1a]/30">{meta}</span>
      )}
    </div>
  );
}

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
    <aside className="flex h-full flex-col gap-8 overflow-y-auto px-5 py-6">
      {/* ─── AGENT ─── */}
      <section>
        <SectionHeader
          label="Agent"
          meta={ready ? (authenticated ? "online" : "offline") : "…"}
        />
        {!ready ? (
          <p className="font-serif text-[13px] italic text-[#1a1a1a]/30">
            Booting wallet…
          </p>
        ) : authenticated && user ? (
          <div className="space-y-2">
            <div className="font-serif text-[15px] font-bold leading-tight text-[#1a1a1a]">
              {displayName}
            </div>
            {user.wallet?.address && (
              <div className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/40">
                <span className="text-[#1a1a1a]/25">wallet</span>{" "}
                {user.wallet.address.slice(0, 10)}…
                {user.wallet.address.slice(-6)}
              </div>
            )}
            <button
              onClick={logout}
              className="pt-1 font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/35 underline underline-offset-2 transition hover:text-[#8b0000]"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="font-serif text-[13px] italic leading-snug text-[#1a1a1a]/50">
              Connect a wallet to open sessions &amp; track trust scores.
            </p>
            <button
              onClick={login}
              className="mt-1 w-full border border-[#1a1a1a] bg-[#1a1a1a] px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#f0ece2] transition hover:bg-[#1a1a1a]/85"
            >
              Connect Wallet →
            </button>
          </div>
        )}
      </section>

      {/* ─── HEADLINES ─── */}
      <section>
        <SectionHeader
          label="Headlines"
          meta={top?.length ? `top ${top.length}` : undefined}
        />
        {top === null ? (
          <p className="font-serif text-[13px] italic text-[#1a1a1a]/30">
            Loading…
          </p>
        ) : top.length === 0 ? (
          <p className="font-serif text-[13px] italic text-[#1a1a1a]/30">
            No skills listed yet.
          </p>
        ) : (
          <ul>
            {top.map((s, i) => (
              <li
                key={s.id}
                className="border-b border-dotted border-[#1a1a1a]/15 py-2 last:border-b-0"
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-5 shrink-0 pt-0.5 text-right font-serif text-[14px] font-black leading-none text-[#1a1a1a]/15">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/skill/${s.id}`}
                      className="block truncate font-serif text-[13px] font-bold leading-tight text-[#1a1a1a] hover:underline"
                    >
                      {s.name}
                    </Link>
                    <div className="mt-0.5 flex items-baseline justify-between gap-2">
                      <span className="truncate font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/35">
                        {s.category ?? "misc"}
                      </span>
                      <span className="shrink-0 font-mono text-[9px] font-bold text-[#1a1a1a]">
                        {s.pricePerCall != null && s.pricePerCall > 0
                          ? `$${s.pricePerCall.toFixed(3)}`
                          : "FREE"}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 text-right font-mono text-[9px] text-[#1a1a1a]/30">
          say{" "}
          <span className="text-[#8b0000]/70">list skills</span> in chat for
          the full catalogue
        </div>
      </section>

      {/* ─── CLASSIFIEDS (phase 2 stub) ─── */}
      <section>
        <SectionHeader label="Classifieds" meta="phase 2" />
        <p className="font-serif text-[13px] italic leading-snug text-[#1a1a1a]/35">
          Session history &amp; close flow ships in Phase 2. Until then,
          every run is sandboxed.
        </p>
      </section>
    </aside>
  );
}

export default BuyerPanel;
