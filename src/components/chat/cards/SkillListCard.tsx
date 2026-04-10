"use client";

/**
 * SkillListCard — chat-embedded mini browse view.
 *
 * Spec: specs/2026-04-09-chat-first-ui.md (buyer intent: list / show skills)
 *
 * Each row is clickable in two ways:
 *   - "run" → opens the SkillExecutor inline as a new chat message
 *   - title → links out to /skill/[id] (chat ↔ URL duality, invariant #2)
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
      <div className="border border-dashed border-[#1a1a1a]/30 bg-[#f8f5ef] p-3 font-mono text-[10px] text-[#1a1a1a]/40">
        No skills listed yet.
      </div>
    );
  }

  return (
    <div
      className="border bg-[#f8f5ef] p-3"
      style={{
        borderColor: "#b8a990",
        borderLeftWidth: "3px",
        borderLeftColor: "#1a1a1a",
      }}
    >
      <div className="mb-2 flex items-baseline justify-between border-b border-dotted border-[#1a1a1a]/20 pb-1">
        <span className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/50">
          Skills
        </span>
        <span className="font-mono text-[9px] text-[#1a1a1a]/30">
          {skills.length} listed
        </span>
      </div>

      <ul className="divide-y divide-dotted divide-[#1a1a1a]/15">
        {skills.map((skill, i) => (
          <li
            key={skill.id}
            className="flex items-baseline gap-3 py-2 first:pt-1 last:pb-1"
          >
            <span className="font-serif text-base font-black text-[#1a1a1a]/15 leading-none">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 min-w-0">
              <Link
                href={`/skill/${skill.id}`}
                className="font-serif text-sm font-bold text-[#1a1a1a] hover:underline"
              >
                {skill.name}
              </Link>
              {skill.description && (
                <p className="mt-0.5 line-clamp-1 font-serif text-xs text-[#1a1a1a]/50">
                  {skill.description}
                </p>
              )}
              <div className="mt-0.5 flex items-center gap-3 font-mono text-[9px] text-[#1a1a1a]/40">
                {skill.category && (
                  <span className="uppercase tracking-wider">
                    {skill.category}
                  </span>
                )}
                {typeof skill.callCount === "number" && (
                  <span>{skill.callCount} calls</span>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-[11px] font-bold text-[#1a1a1a]">
                {skill.pricePerCall != null && skill.pricePerCall > 0
                  ? `$${skill.pricePerCall.toFixed(3)}`
                  : "FREE"}
              </div>
              {onRun && (
                <button
                  onClick={() => onRun(skill)}
                  className="mt-1 border border-[#1a1a1a] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#f0ece2] transition"
                >
                  Run
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-2 border-t border-dotted border-[#1a1a1a]/20 pt-1 text-right font-mono text-[9px] text-[#1a1a1a]/30">
        type <span className="text-[#1a1a1a]/60">call &lt;name&gt;</span> to
        sandbox a skill
      </div>
    </div>
  );
}

export default SkillListCard;
