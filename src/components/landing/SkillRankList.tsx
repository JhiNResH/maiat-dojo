"use client";

/**
 * SkillRankList — shared presentational list for Leaderboard / Trending.
 *
 * Spec: specs/2026-04-09-chat-first-ui.md (landing hero §Leaderboard+Trending)
 *
 * Newspaper classifieds column: double-rule section header, dotted dividers,
 * padded rank numbers in ghost serif, right-aligned metric. Zero cards, zero
 * shadows, zero radius — same language as BuyerPanel.
 *
 * Metric is whatever the parent wants to show (trust score, recent calls,
 * pricePerCall). Keeps the component generic so we don't duplicate rendering
 * between the two landing sections.
 */

import Link from "next/link";
import type { ChatSkillSummary } from "../chat/types";

export interface SkillRankItem extends ChatSkillSummary {
  recentSessions?: number;
  recentCalls?: number;
}

export interface SkillRankListProps {
  label: string;
  meta?: string;
  skills: SkillRankItem[] | null; // null = loading, [] = empty
  emptyCopy: string;
  /** pull metric for the right column off the row (e.g. trust score, calls) */
  metric: (s: SkillRankItem) => string;
}

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

export function SkillRankList({
  label,
  meta,
  skills,
  emptyCopy,
  metric,
}: SkillRankListProps) {
  return (
    <section>
      <SectionHeader label={label} meta={meta} />
      {skills === null ? (
        <p className="font-serif text-[13px] italic text-[#1a1a1a]/30">
          Loading…
        </p>
      ) : skills.length === 0 ? (
        <p className="font-serif text-[13px] italic text-[#1a1a1a]/30">
          {emptyCopy}
        </p>
      ) : (
        <ul>
          {skills.map((s, i) => (
            <li
              key={s.id}
              className="reveal-row border-b border-dotted border-[#1a1a1a]/15 py-2 last:border-b-0"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start gap-2.5">
                <span className="w-5 shrink-0 pt-0.5 text-right font-serif text-[14px] font-black leading-none text-[#1a1a1a]/15">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/skill/${s.id}`}
                    className="ink-underline inline-block max-w-full truncate align-top font-serif text-[13px] font-bold leading-tight text-[#1a1a1a]"
                  >
                    {s.name}
                  </Link>
                  <div className="mt-0.5 flex items-baseline justify-between gap-2">
                    <span className="truncate font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/35">
                      {s.category ?? "misc"}
                    </span>
                    <span className="shrink-0 font-mono text-[9px] font-bold text-[#1a1a1a]">
                      {metric(s)}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default SkillRankList;
