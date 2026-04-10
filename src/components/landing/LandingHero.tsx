"use client";

/**
 * LandingHero — the zero-message state of the chat surface.
 *
 * Spec: specs/2026-04-09-chat-first-ui.md (landing hero §Zero state)
 *
 * Claude-search-bar idea × broadsheet editorial:
 *   - Big centered composer (variant="hero")
 *   - 3 suggestion chips that fire as if the user typed them
 *   - Leaderboard | Trending two-column beneath, newspaper classifieds style
 *   - Footer hint line pointing to "help"
 *
 * This component is STATELESS — it doesn't know about messages or intent
 * parsing. It calls `onSubmit(text)` and lets ChatRoom own the dispatch.
 * That keeps the landing-vs-chat toggle a single boolean in ChatRoom.
 */

import { ChatInput } from "../chat/ChatInput";
import { Leaderboard } from "./Leaderboard";
import { Trending } from "./Trending";

const SUGGESTIONS = [
  "list skills",
  "price of BTC",
  "help",
];

export interface LandingHeroProps {
  pending?: boolean;
  onSubmit: (text: string) => void;
}

export function LandingHero({ pending = false, onSubmit }: LandingHeroProps) {
  return (
    <div className="flex h-full w-full flex-col overflow-y-auto px-6 py-10">
      <div className="mx-auto w-full max-w-2xl">
        {/* ─── TAGLINE ─── */}
        <div className="mb-6 text-center">
          <h2 className="font-serif text-[28px] font-black leading-tight text-[#1a1a1a] md:text-[32px]">
            Your agent deserves skills it can trust.
          </h2>
          <p className="mx-auto mt-2 max-w-xl font-serif text-[14px] italic leading-relaxed text-[#1a1a1a]/50">
            Every skill on the Dojo has an on-chain trust score built from real
            transactions. Ask the front desk — sandbox-run anything before you
            fund a session.
          </p>
        </div>

        {/* ─── BIG COMPOSER ─── */}
        <ChatInput
          variant="hero"
          pending={pending}
          placeholder='Ask the dojo… "list skills", "price of BTC", "help"'
          onSubmit={onSubmit}
        />

        {/* ─── SUGGESTION CHIPS ─── */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#1a1a1a]/30">
            Try
          </span>
          {SUGGESTIONS.map((text) => (
            <button
              key={text}
              type="button"
              disabled={pending}
              onClick={() => onSubmit(text)}
              className="border border-[#1a1a1a]/30 bg-transparent px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#1a1a1a]/70 transition hover:border-[#1a1a1a] hover:text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-30"
            >
              {text}
            </button>
          ))}
        </div>

        {/* ─── LEADERBOARD + TRENDING ─── */}
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <Leaderboard limit={5} />
          <Trending limit={5} />
        </div>

        {/* ─── HINT ─── */}
        <div className="mt-10 text-center font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/30">
          say <span className="text-[#8b0000]/70">help</span> in the composer
          for the full command list
        </div>
      </div>
    </div>
  );
}

export default LandingHero;
