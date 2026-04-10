import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

/**
 * <TrustCard /> — Phase 1 flagship component #1 (PR #18).
 *
 * A newspaper-style trust dossier for `/skill/[id]`. Hand-milled in Dojo's
 * newspaper tokens (cream #f0ece2, ink #1a1a1a, Playfair Display + JetBrains
 * Mono, zero border-radius, no shadows). No Shadcn, no new dependencies.
 *
 * See:
 *   - brain/wiki/decisions/2026-04-09-genui-boundary-dojo.md (mold vs CNC)
 *   - brain/wiki/decisions/2026-04-newspaper-aesthetic.md
 *
 * Presentational only. All aggregation happens in the caller (page.tsx) so
 * the Prisma query and the derived math live next to each other.
 */
export interface TrustCardProps {
  skillName: string;
  category: string | null;
  /** 0-100 trust score. Rendered as a 0.00-1.00 decimal. */
  trustScore: number;
  /** Up to 10 session-level scores (0-100), oldest → newest. */
  sparkline: number[];
  totalSessions: number;
  totalCalls: number;
  creatorLabel: string;
  creatorAddress: string | null;
  creatorVerified: boolean;
  /** Sessions with a BAS attestation that landed in `settled`. */
  basPassCount: number;
  /** Sessions with a BAS attestation that landed in `refunded`. */
  basFailCount: number;
  medianLatencyMs: number | null;
  /** 7 booleans, oldest → newest. Each true = ≥1 session that day. */
  last7Days: boolean[];
  uniqueAgentsThisWeek: number;
}

export default function TrustCard(props: TrustCardProps) {
  const {
    skillName,
    category,
    trustScore,
    sparkline,
    totalSessions,
    totalCalls,
    creatorLabel,
    creatorAddress,
    creatorVerified,
    basPassCount,
    basFailCount,
    medianLatencyMs,
    last7Days,
    uniqueAgentsThisWeek,
  } = props;

  const clampedScore = Math.max(0, Math.min(100, trustScore));
  const trustDecimal = (clampedScore / 100).toFixed(2);

  return (
    <section
      className="relative border-2 border-[#1a1a1a] bg-[#f0ece2] mb-8"
      aria-label="Trust dossier"
    >
      {/* ─── Classified-style label ribbon ─── */}
      <span className="absolute -top-[0.6rem] left-4 bg-[#f0ece2] px-2 font-mono text-[9px] uppercase tracking-[0.22em] text-[#1a1a1a]/55">
        Trust Dossier
      </span>

      {/* ─── Masthead row ─── */}
      <div className="flex items-baseline justify-between gap-4 px-5 pt-5 pb-3">
        <h2 className="font-serif font-black text-lg tracking-tight text-[#1a1a1a] uppercase leading-none">
          {skillName}
        </h2>
        {category && (
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#1a1a1a]/45 shrink-0">
            {category}
          </span>
        )}
      </div>

      {/* Double rule */}
      <div className="mx-5 border-b-[3px] border-double border-[#1a1a1a]/70" />

      {/* ─── Hero row: trust score + sparkline + sessions/calls ─── */}
      <div className="grid grid-cols-[auto_1fr_auto] gap-5 items-end px-5 py-6">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#1a1a1a]/50 mb-1">
            Trust Score
          </div>
          <div className="font-serif font-black text-5xl text-[#1a1a1a] leading-none tabular-nums">
            {trustDecimal}
          </div>
        </div>

        <Sparkline values={sparkline} />

        <div className="text-right">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#1a1a1a]/50 mb-1">
            Sessions
          </div>
          <div className="font-mono font-bold text-xl text-[#1a1a1a] tabular-nums leading-none">
            {totalSessions.toLocaleString()}
          </div>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#1a1a1a]/40 mt-1">
            {totalCalls.toLocaleString()} calls
          </div>
        </div>
      </div>

      {/* Thin divider */}
      <div className="mx-5 border-b border-[#1a1a1a]/20" />

      {/* ─── Metadata rows ─── */}
      <div className="px-5 py-4 space-y-0">
        <DossierRow
          label="Creator"
          value={
            <span className="inline-flex items-center gap-2">
              <span>{creatorLabel}</span>
              {creatorAddress && creatorAddress !== creatorLabel && (
                <span className="font-normal text-[#1a1a1a]/40 tabular-nums">
                  {shortAddr(creatorAddress)}
                </span>
              )}
              {creatorVerified && (
                <span
                  className="inline-flex items-center gap-0.5 text-[#1a1a1a]/70"
                  title="ERC-8004 verified identity"
                >
                  <CheckCircle2 size={11} />
                  <span className="text-[9px] uppercase tracking-[0.15em] font-normal">
                    verified
                  </span>
                </span>
              )}
            </span>
          }
        />
        <DossierRow
          label="BAS Attestations"
          value={
            <span className="tabular-nums">
              <span className="text-[#1a1a1a]">{basPassCount} PASS</span>
              <span className="text-[#1a1a1a]/30 mx-1.5">/</span>
              <span className="text-[#1a1a1a]/55">{basFailCount} FAIL</span>
            </span>
          }
        />
        <DossierRow
          label="Median Latency"
          value={
            medianLatencyMs == null ? (
              <span className="text-[#1a1a1a]/35">—</span>
            ) : (
              <span className="tabular-nums">{medianLatencyMs}ms</span>
            )
          }
        />
        <DossierRow label="Last 7 Days" value={<HeatmapDots days={last7Days} />} />
      </div>

      {/* Bottom rule + pull quote */}
      <div className="mx-5 border-b border-[#1a1a1a]/20" />
      <div className="px-5 py-4">
        <p className="font-serif italic text-sm text-[#1a1a1a]/65 text-center leading-snug">
          {uniqueAgentsThisWeek > 0
            ? `“Used by ${uniqueAgentsThisWeek} agent${
                uniqueAgentsThisWeek === 1 ? "" : "s"
              } this week.”`
            : `“No sessions this week — first mover awaits.”`}
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// Sub-components — hand-milled, no framework deps

function DossierRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-dotted border-[#1a1a1a]/15 last:border-b-0">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#1a1a1a]/45">
        {label}
      </span>
      <span className="font-mono text-[11px] font-bold text-[#1a1a1a]">
        {value}
      </span>
    </div>
  );
}

/**
 * Ten-bar sparkline. Oldest on the left, newest on the right. Empty slots
 * render as faint stubs so a fresh skill reads as "awaiting first session"
 * rather than a broken chart.
 */
function Sparkline({ values }: { values: number[] }) {
  const BARS = 10;
  const MAX_H = 40;
  const padded = Array.from({ length: BARS }, (_, i) => {
    const idx = values.length - BARS + i;
    return idx >= 0 ? values[idx] : -1;
  });

  return (
    <div
      className="flex items-end justify-center gap-[3px]"
      style={{ height: `${MAX_H}px` }}
      aria-label="Recent session scores"
    >
      {padded.map((v, i) => {
        const isEmpty = v < 0;
        const clamped = Math.max(0, Math.min(100, v));
        const h = isEmpty ? 4 : Math.max(6, Math.round((clamped / 100) * MAX_H));
        return (
          <div
            key={i}
            className={isEmpty ? "w-[5px] bg-[#1a1a1a]/12" : "w-[5px] bg-[#1a1a1a]"}
            style={{ height: `${h}px` }}
          />
        );
      })}
    </div>
  );
}

/**
 * 7-day activity strip. Filled square = ≥1 session that day, hollow square
 * = idle. Squared (not rounded) to match Dojo's zero-border-radius rule.
 */
function HeatmapDots({ days }: { days: boolean[] }) {
  const padded =
    days.length === 7
      ? days
      : Array.from({ length: 7 }, (_, i) => days[days.length - 7 + i] ?? false);
  return (
    <span className="inline-flex gap-[3px]" aria-label="Last 7 days activity">
      {padded.map((on, i) => (
        <span
          key={i}
          className={
            on
              ? "inline-block w-[7px] h-[7px] bg-[#1a1a1a]"
              : "inline-block w-[7px] h-[7px] border border-[#1a1a1a]/35"
          }
          aria-label={on ? "active" : "idle"}
        />
      ))}
    </span>
  );
}

function shortAddr(addr: string): string {
  if (!addr) return "";
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
