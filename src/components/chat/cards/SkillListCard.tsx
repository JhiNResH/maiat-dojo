"use client";

/**
 * SkillListCard — chat-embedded mini workflow browse view.
 *
 * Spec: specs/2026-04-09-chat-first-ui.md (buyer intent: list / show skills)
 *
 * Two-line rhythm per row:
 *   ── 01 ─────────────────────── $0.005 ──
 *   Token Price Oracle                  [Run]
 *   Real-time BNB, ETH, BTC price feed…
 *   ORACLE · 142 calls
 *
 * - Title links to `/skill/[id]` (chat ↔ URL duality, invariant #2).
 * - "Run" opens the SkillExecutor inline as a new chat message.
 */

import Link from "next/link";
import type { ChatSkillSummary } from "../types";

export interface SkillListCardProps {
  skills: ChatSkillSummary[];
  onRun?: (skill: ChatSkillSummary) => void;
}

export function SkillListCard({ skills, onRun }: SkillListCardProps) {
  if (skills.length === 0) {
    return (
      <div
        className="border border-dashed bg-[var(--paper-bg-muted)] px-4 py-6 text-center font-serif text-sm italic text-[var(--paper-ink-40)]"
        style={{ borderColor: "var(--paper-border-strong)" }}
      >
            No workflows listed yet.
      </div>
    );
  }

  return (
    <figure className="my-1">
      <figcaption className="mb-2 flex items-baseline justify-between border-b-[3px] border-double border-[var(--paper-ink-60)] pb-1">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--paper-ink-70)]">
          Workflow Listings
        </span>
        <span className="font-mono text-[9px] text-[var(--paper-ink-30)]">
          {skills.length} on offer
        </span>
      </figcaption>

      <ul>
        {skills.map((skill, i) => (
          <li
            key={skill.id}
            className="border-b border-dotted border-[var(--paper-ink-20)] py-3 last:border-b-0"
          >
            <div className="flex items-start gap-4">
              <span className="w-6 shrink-0 pt-1 text-right font-serif text-[22px] font-black leading-none text-[var(--paper-ink-15)]">
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-baseline justify-between gap-3">
                  <Link
                    href={`/skill/${skill.id}`}
                    className="truncate font-serif text-[17px] font-bold leading-snug text-[var(--paper-ink)] hover:underline"
                  >
                    {skill.name}
                  </Link>
                  <span className="shrink-0 font-mono text-[11px] font-bold text-[var(--paper-ink)]">
                    {skill.pricePerCall != null && skill.pricePerCall > 0
                      ? `$${skill.pricePerCall.toFixed(3)}`
                      : "FREE"}
                    <span className="ml-0.5 font-normal text-[var(--paper-ink-30)]">
                      /call
                    </span>
                  </span>
                </div>

                {skill.description && (
                  <p className="mb-1.5 font-serif text-[13px] leading-snug text-[var(--paper-ink-55)] line-clamp-2">
                    {skill.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-wider text-[var(--paper-ink-40)]">
                    {skill.category && <span>{skill.category}</span>}
                    {typeof skill.callCount === "number" && (
                      <>
                        {skill.category && <span className="text-[var(--paper-ink-15)]">·</span>}
                        <span>{skill.callCount} calls</span>
                      </>
                    )}
                  </div>
                  {onRun && (
                    <button
                      onClick={() => onRun(skill)}
                      className="border border-[var(--paper-ink)] bg-transparent px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--paper-ink)] transition hover:bg-[var(--paper-ink)] hover:text-[var(--paper-bg)]"
                    >
                      Run →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-2 text-right font-mono text-[9px] text-[var(--paper-ink-30)]">
        or type{" "}
        <span className="text-[var(--paper-accent)]">call &lt;name&gt;</span> to sandbox
      </div>
    </figure>
  );
}

export default SkillListCard;
