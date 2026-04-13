"use client";

/**
 * LandingHero — anti-template broadsheet layout.
 *
 * Three-column newspaper:
 *   Left sidebar:  Market Wire (calls + settlements) + Trending
 *   Center:        Headline skill (lead story) + Skills directory grid + CTA
 *   Right sidebar: Trust Ledger (attestations + new listings)
 *
 * Protocol stats span full width above the columns like a masthead ticker.
 * Mock events drip in every ~12s. Replace with `/api/activity` in production.
 *
 */

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { type SkillRankItem } from "./SkillRankList";
import { Trending } from "./Trending";

export interface LandingHeroProps {
  pending?: boolean;
  onSubmit?: (text: string) => void;
}

/* ── Activity event types ── */
type ActivityEvent = {
  id: string;
  type: "call" | "settle" | "attest" | "list";
  agent?: string;
  skill?: string;
  amount?: string;
  trust?: number;
  verdict?: "PASS" | "FAIL";
  ts: number;
};

/* ── Mock data ── */
const SEED_EVENTS: ActivityEvent[] = [
  { id: "e01", type: "call", agent: "0x4f2...c8a", skill: "Token Price Oracle", ts: Date.now() - 4000 },
  { id: "e02", type: "settle", agent: "0xb91...2d7", skill: "Echo Test", amount: "0.015", ts: Date.now() - 9000 },
  { id: "e03", type: "attest", agent: "0x7d1...3f2", trust: 87, verdict: "PASS", ts: Date.now() - 18000 },
  { id: "e04", type: "call", agent: "0xe33...a01", skill: "Sentiment Analyzer", ts: Date.now() - 26000 },
  { id: "e05", type: "settle", agent: "0x4f2...c8a", skill: "Token Price Oracle", amount: "0.008", ts: Date.now() - 35000 },
  { id: "e06", type: "attest", agent: "0xb91...2d7", trust: 92, verdict: "PASS", ts: Date.now() - 48000 },
  { id: "e07", type: "list", skill: "Code Review Agent", ts: Date.now() - 65000 },
  { id: "e08", type: "call", agent: "0x1a8...f90", skill: "Echo Test", ts: Date.now() - 80000 },
  { id: "e09", type: "settle", agent: "0xe33...a01", skill: "Sentiment Analyzer", amount: "0.022", ts: Date.now() - 95000 },
  { id: "e10", type: "attest", agent: "0x1a8...f90", trust: 64, verdict: "PASS", ts: Date.now() - 130000 },
];

const DRIP_POOL: Omit<ActivityEvent, "id" | "ts">[] = [
  { type: "call", agent: "0xc77...e12", skill: "Token Price Oracle" },
  { type: "settle", agent: "0x4f2...c8a", skill: "Echo Test", amount: "0.012" },
  { type: "attest", agent: "0xc77...e12", trust: 71, verdict: "PASS" },
  { type: "call", agent: "0xb91...2d7", skill: "Sentiment Analyzer" },
  { type: "settle", agent: "0xe33...a01", skill: "Token Price Oracle", amount: "0.009" },
  { type: "list", skill: "Data Aggregator v2" },
  { type: "call", agent: "0x1a8...f90", skill: "Code Review Agent" },
  { type: "attest", agent: "0x4f2...c8a", trust: 95, verdict: "PASS" },
];

/* ── Helpers ── */
function formatAge(ts: number, now: number) {
  const sec = Math.floor((now - ts) / 1000);
  if (sec < 5) return "now";
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  return `${Math.floor(sec / 3600)}h`;
}

function sidebarDesc(event: ActivityEvent): string {
  switch (event.type) {
    case "call":
      return `${event.agent} \u2192 ${event.skill}`;
    case "settle":
      return `${event.agent} \u00b7 ${event.amount} USDC`;
    case "attest":
      return `${event.agent} \u00b7 ${event.verdict} \u00b7 trust ${event.trust}`;
    case "list":
      return `${event.skill}`;
  }
}

function sidebarLabel(type: ActivityEvent["type"]): { label: string; accent: boolean } {
  switch (type) {
    case "call":
      return { label: "CALL", accent: false };
    case "settle":
      return { label: "SETTLE", accent: true };
    case "attest":
      return { label: "ATTEST", accent: false };
    case "list":
      return { label: "NEW", accent: true };
  }
}

/* ── Sidebar wire event (single-line stock ticker) ── */
function SidebarEvent({ event, now }: { event: ActivityEvent; now: number }) {
  const { label, accent } = sidebarLabel(event.type);
  return (
    <div className="wire-ticker-row unfold-down">
      <span className={`wire-sidebar-type ${accent ? "wire-sidebar-type-accent" : ""}`}>
        {label}
      </span>
      <span className="wire-ticker-desc">{sidebarDesc(event)}</span>
      <span className="wire-sidebar-time">{formatAge(event.ts, now)}</span>
    </div>
  );
}

/* ── Sidebar section ── */
function WireSidebar({
  title,
  meta,
  events,
  now,
}: {
  title: string;
  meta?: string;
  events: ActivityEvent[];
  now: number;
}) {
  return (
    <div>
      <div className="mb-2 border-b-[2px] border-double border-[#1a1a1a]/50 pb-1">
        <span className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-[#1a1a1a]/60">
          {title}
        </span>
        {meta && (
          <span className="ml-2 font-mono text-[8px] text-[#1a1a1a]/25">{meta}</span>
        )}
      </div>
      {events.map((e) => (
        <SidebarEvent key={e.id} event={e} now={now} />
      ))}
    </div>
  );
}

/* ── Protocol stats bar ── */
function ProtocolStats({ skillCount }: { skillCount: number }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="protocol-stat">
        <span className="protocol-stat-value">{skillCount || "\u2014"}</span>
        <span className="protocol-stat-label">Skills Listed</span>
      </div>
      <div className="protocol-stat">
        <span className="protocol-stat-value">0.142</span>
        <span className="protocol-stat-label">USDC Settled</span>
      </div>
      <div className="protocol-stat">
        <span className="protocol-stat-value">139</span>
        <span className="protocol-stat-label">BAS Attestations</span>
      </div>
    </div>
  );
}

/* ── Trust bar ── */
function TrustBar({ score, accent }: { score: number; accent?: boolean }) {
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div>
      <div className="trust-bar">
        <div
          className={accent ? "trust-bar-fill-accent" : "trust-bar-fill"}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex items-baseline justify-between">
        <span className="font-mono text-[8px] uppercase tracking-wider text-[#1a1a1a]/25">
          Trust
        </span>
        <span className="font-mono text-[9px] font-bold text-[#1a1a1a]/45">
          {score > 0 ? `${Math.round(score)}\u2605` : "\u2014"}
        </span>
      </div>
    </div>
  );
}

/* ── Price pill ── */
function PricePill({ price }: { price?: number | null }) {
  return (
    <span className="price-pill">
      {price != null && price > 0 ? `$${price.toFixed(3)}` : "Free"}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════════════════════ */
export function LandingHero(_props: LandingHeroProps) {
  const [skills, setSkills] = useState<SkillRankItem[] | null>(null);
  const [events, setEvents] = useState<ActivityEvent[]>(SEED_EVENTS);
  const [now, setNow] = useState(Date.now());
  const dripIndex = useRef(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/skills?sort=trust&limit=50")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setSkills(data.skills ?? []);
      })
      .catch(() => {
        if (!cancelled) setSkills([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const drip = () => {
      const idx = dripIndex.current % DRIP_POOL.length;
      const evt: ActivityEvent = {
        ...DRIP_POOL[idx],
        id: `d${Date.now()}`,
        ts: Date.now(),
      };
      dripIndex.current++;
      setEvents((prev) => [evt, ...prev].slice(0, 15));
      timeout = setTimeout(drip, 10000 + Math.random() * 5000);
    };
    timeout = setTimeout(drip, 12000);
    return () => clearTimeout(timeout);
  }, []);

  const featured = skills && skills.length > 0 ? skills[0] : null;
  const rest = skills ? skills.slice(1) : [];
  const skillCount = skills?.length ?? 0;

  /* Split events by column */
  const marketEvents = events.filter((e) => e.type === "call" || e.type === "settle");
  const trustEvents = events.filter((e) => e.type === "attest" || e.type === "list");

  return (
    <div className="flex w-full flex-col py-6">
      {/* ═══ LIVE INDICATOR ═══ */}
      <div
        className="unfold-down mb-5 flex items-center gap-2 border-b border-[#1a1a1a]/10 pb-3"
        style={{ animationDelay: "100ms" }}
      >
        <span className="live-dot" />
        <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#1a1a1a]/40">
          Protocol Activity
        </span>
        <span className="ml-auto font-mono text-[9px] tracking-wider text-[#1a1a1a]/20">
          BSC Testnet &middot; ERC-8183 &middot; BAS
        </span>
      </div>

      {/* ═══ PROTOCOL STATS (full width) ═══ */}
      <div
        className="unfold-down mb-8"
        style={{ animationDelay: "200ms" }}
      >
        <ProtocolStats skillCount={skillCount} />
      </div>

      {/* ═══ LEAD STORY (full-width, above the fold) ═══ */}
      {featured && (
        <Link
          href={`/skill/${featured.id}`}
          className="skill-card unfold-down group mb-8 block border-l-[4px] border-l-[#b08d57] p-5 md:p-6"
          style={{ animationDelay: "300ms" }}
        >
          <div className="flex items-baseline justify-between gap-4">
            <span className="section-bracket">Lead Story</span>
            <PricePill price={featured.pricePerCall} />
          </div>
          <h2 className="mt-3 font-serif text-[32px] font-black leading-[0.92] text-[#1a1a1a] transition-colors group-hover:text-[#b08d57] md:text-[42px]">
            {featured.name}
          </h2>
          {featured.description && (
            <p className="mt-3 max-w-2xl font-serif text-[15px] italic leading-relaxed text-[#1a1a1a]/45">
              {featured.description}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-2">
            <div className="w-full max-w-[220px]">
              <TrustBar score={featured.trustScore ?? 0} accent />
            </div>
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/30">
              {featured.category ?? "misc"}
            </span>
            <span className="ml-auto font-mono text-[10px] font-bold uppercase tracking-wider text-[#b08d57]/50 transition-colors group-hover:text-[#b08d57]">
              View Skill &rarr;
            </span>
          </div>
        </Link>
      )}

      <div className="newspaper-fold mb-6" />

      {/* ═══ THREE-COLUMN BROADSHEET ═══ */}
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[240px_1fr_240px]">

        {/* ── LEFT SIDEBAR: Market Wire + Trending ── */}
        <div className="col-rule-right order-2 md:order-1">
          <WireSidebar
            title="Market Wire"
            meta="calls & settlements"
            events={marketEvents}
            now={now}
          />

          {/* Trending below the wire */}
          <div className="mt-6">
            <div className="newspaper-fold mb-4" />
            <Trending limit={5} />
          </div>
        </div>

        {/* ── CENTER: Skills Grid + CTA ── */}
        <div className="order-1 md:order-2">
          {/* Skills directory header */}
          <div className="mb-4 flex items-baseline justify-between border-b-[3px] border-double border-[#1a1a1a]/60 pb-1">
            <span className="border-l-[3px] border-[#1a1a1a] pl-3 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#1a1a1a]/70">
              All Skills
            </span>
            <span className="font-mono text-[9px] text-[#1a1a1a]/30">
              by trust
            </span>
          </div>

          {/* Skills classified listing */}
          {skills === null ? (
            <p className="font-serif text-[13px] italic text-[#1a1a1a]/30">
              Loading&hellip;
            </p>
          ) : rest.length === 0 ? (
            <p className="font-serif text-[13px] italic text-[#1a1a1a]/30">
              No other skills listed yet.
            </p>
          ) : (
            <div className="columns-1 gap-x-8 sm:columns-2">
              {rest.map((s, i) => (
                <Link
                  key={s.id}
                  href={`/skill/${s.id}`}
                  className="unfold-down group block break-inside-avoid border-b border-dotted border-[#1a1a1a]/15 py-3 last:border-b-0"
                  style={{ animationDelay: `${450 + i * 60}ms` }}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="w-4 shrink-0 text-right font-serif text-[16px] font-black leading-none text-[#1a1a1a]/12">
                      {String(i + 2).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="ink-underline truncate font-serif text-[14px] font-bold leading-tight text-[#1a1a1a]">
                          {s.name}
                        </h3>
                        <PricePill price={s.pricePerCall} />
                      </div>
                      <div className="mt-1 flex items-baseline justify-between gap-2">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/30">
                          {s.category ?? "misc"}
                        </span>
                        <span className="font-mono text-[9px] font-bold text-[#1a1a1a]/40">
                          {s.trustScore != null && s.trustScore > 0
                            ? `${Math.round(s.trustScore)}\u2605`
                            : "\u2014"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>

        {/* ── RIGHT SIDEBAR: Trust Ledger ── */}
        <div className="col-rule-left order-3">
          <WireSidebar
            title="Trust Ledger"
            meta="attestations"
            events={trustEvents}
            now={now}
          />
        </div>
      </div>
    </div>
  );
}

export default LandingHero;
