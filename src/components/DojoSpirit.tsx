import type { CSSProperties } from "react";
import {
  buildWorkflowSpiritProfile,
  type WorkflowSpiritProfile,
} from "@/lib/workflow-spirit";
import { DojoPetAvatar } from "./DojoPetAvatar";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function levelFrom(receipts: number, passRate: number) {
  const trustBoost = Math.round(clamp(passRate, 0, 1) * 4);
  return clamp(Math.max(1, Math.floor(receipts / 3) + trustBoost), 1, 99);
}

export function DojoSpirit({
  profile,
  name = "Dojo Spirit",
  workflowId,
  slug,
  category,
  creatorId,
  receipts = 0,
  passRate = 1,
  forks = 0,
  royaltyBps = 0,
  status = "fed by cleared receipts",
  compact = false,
}: {
  profile?: WorkflowSpiritProfile;
  name?: string;
  workflowId?: string;
  slug?: string;
  category?: string | null;
  creatorId?: string | null;
  receipts?: number;
  passRate?: number;
  forks?: number;
  royaltyBps?: number | null;
  status?: string;
  compact?: boolean;
}) {
  const spirit = profile ?? buildWorkflowSpiritProfile({
    workflowId: workflowId ?? slug ?? name,
    slug: slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    category: category ?? null,
    creatorId,
    runCount: receipts,
    forkCount: forks,
    trustScore: passRate,
    royaltyBps,
  });
  const level = spirit.level || levelFrom(receipts, passRate);
  const mood = spirit.mood;
  const sync = clamp(Math.round(spirit.stats.passRate * 100), 0, 100);
  const style = {
    "--spirit-accent": spirit.palette.accent,
    "--spirit-mat": spirit.palette.mat,
    "--spirit-ink": spirit.palette.ink,
  } as CSSProperties;

  return (
    <div
      className={`dojo-spirit dojo-spirit-${spirit.pattern} dojo-spirit-aura-${spirit.aura} ${compact ? "dojo-spirit-compact" : ""}`}
      style={style}
      data-belt={spirit.belt}
    >
      <div className="dojo-spirit-screen">
        <div className="dojo-spirit-scanline" />
        <div className="dojo-spirit-avatar">
          <DojoPetAvatar profile={spirit} name={name} size={compact ? "sm" : "md"} />
        </div>
        <div className="dojo-spirit-shadow" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              {spirit.discipline}
            </div>
            <div className="mt-1 truncate text-[14px] font-semibold text-[var(--text)]">
              {name}
            </div>
          </div>
          <div className="dojo-spirit-level">Lv.{level}</div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <div className="dojo-spirit-stat">
            <span>Receipts</span>
            <strong>{spirit.stats.receipts}</strong>
          </div>
          <div className="dojo-spirit-stat">
            <span>Pass</span>
            <strong>{sync}%</strong>
          </div>
          <div className="dojo-spirit-stat">
            <span>Lineage</span>
            <strong>{spirit.stats.lineage}</strong>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 font-mono text-[10px] text-[var(--text-muted)]">
          <span className="min-w-0 truncate">{status || spirit.lineageRevenue.label}</span>
          <span className="font-semibold text-[var(--signal-deep)]">{mood}</span>
        </div>
        {!compact && (
          <div className="mt-2 flex items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            <span>{spirit.archetype}</span>
            <span>{spirit.belt}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default DojoSpirit;
