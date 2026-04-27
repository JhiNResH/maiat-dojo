"use client";

/**
 * LandingHero — workflow marketplace grid.
 *
 * Layout (matching app.maiat.io):
 *   - Product status row (3 stat-cards)
 *   - Category filter pills
 *   - Full-width workflow grid (3-col desktop, 2-col tablet, 1-col mobile)
 *
 * No sidebars. No editorial hierarchy. Just a workflow marketplace grid.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { type SkillRankItem } from "./SkillRankList";

export interface LandingHeroProps {
  pending?: boolean;
  onSubmit?: (text: string) => void;
}

/* ══════════════════════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════════════════════ */
export function LandingHero(_props: LandingHeroProps) {
  const [skills, setSkills] = useState<SkillRankItem[] | null>(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

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

  const skillCount = skills?.length ?? 0;
  const totalRuns =
    skills?.reduce((sum, skill) => sum + (skill.workflowRunCount ?? skill.callCount ?? 0), 0) ?? 0;
  const totalForks =
    skills?.reduce((sum, skill) => sum + (skill.workflowForkCount ?? 0), 0) ?? 0;

  /* Derive categories from loaded skills */
  const categories = skills
    ? ["all", ...Array.from(new Set(skills.map((s) => s.category ?? "misc")))]
    : ["all"];

  const q = query.trim().toLowerCase();
  const filtered =
    skills === null
      ? null
      : skills.filter((s) => {
          const matchCat = filter === "all" || (s.category ?? "misc") === filter;
          const matchQ =
            !q ||
            s.name.toLowerCase().includes(q) ||
            (s.description ?? "").toLowerCase().includes(q);
          return matchCat && matchQ;
        });

  return (
    <div className="flex w-full flex-col gap-12">
      {/* ═══ PRODUCT STATUS ═══ */}
      <div className="animate-fade-in-up grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="stat-card glass-shimmer">
          <span className="text-[32px] font-bold leading-none text-[var(--text)]">
            {skillCount || "\u2014"}
          </span>
          <span className="label-sm mt-2">Executable workflows</span>
        </div>
        <div className="stat-card glass-shimmer">
          <span className="text-[32px] font-bold leading-none text-[var(--text)]">
            {totalRuns}
          </span>
          <span className="label-sm mt-2">Recorded runs</span>
        </div>
        <div className="stat-card glass-shimmer">
          <span className="text-[32px] font-bold leading-none text-[var(--text)]">
            {totalForks}
          </span>
          <span className="label-sm mt-2">Workflow forks</span>
        </div>
      </div>

      <div className="grid gap-3 border-y border-[var(--border)] py-4 md:grid-cols-3">
        {[
          ["01", "Run", "Try a published workflow through sandbox before spending credits."],
          ["02", "Fork", "Copy the workflow into a draft with lineage attached."],
          ["03", "Deploy", "Attach your endpoint and publish the variant as your own service."],
        ].map(([step, title, body]) => (
          <div key={step} className="flex gap-3">
            <span className="font-mono text-[11px] font-semibold text-[var(--text-muted)]">
              {step}
            </span>
            <div>
              <div className="text-[13px] font-semibold text-[var(--text)]">{title}</div>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">{body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ SEARCH BAR ═══ */}
      <div className="relative">
        <svg
          width="14"
          height="14"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          fill="none" stroke="currentColor" strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx={11} cy={11} r={8} />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search workflows..."
          className="w-full rounded-full border border-[var(--border)] bg-[var(--card-bg)] py-2.5 pl-9 pr-4 font-mono text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--text)] transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* ═══ CATEGORY FILTER PILLS ═══ */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`filter-pill ${filter === cat ? "filter-pill-active" : ""}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ═══ WORKFLOW GRID — full width, no sidebar ═══ */}
      {filtered === null ? (
        <p className="text-center text-[14px] text-[var(--text-muted)]">
          Loading&hellip;
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-[14px] text-[var(--text-muted)]">
          No workflows found.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => {
            const workflowKey = s.workflowId ?? s.workflowSlug ?? s.id;
            return (
            <div
              key={s.id}
              className="glass-card group flex min-h-[220px] flex-col p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <Link href={`/workflow/${workflowKey}/run`} className="min-w-0">
                  <h3 className="text-[15px] font-semibold leading-snug text-[var(--text)] transition-colors hover:text-[var(--text-secondary)]">
                    {s.name}
                  </h3>
                </Link>
                <span className="shrink-0 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[var(--text-secondary)] backdrop-blur-sm">
                  {s.pricePerCall != null && s.pricePerCall > 0
                    ? `$${s.pricePerCall.toFixed(3)}`
                    : "Free"}
                </span>
              </div>
              {s.description && (
                <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-[var(--text-muted)]">
                  {s.description}
                </p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] backdrop-blur-sm">
                  {s.category ?? "misc"}
                </span>
                {s.trustScore != null && s.trustScore > 0 && (
                  <span className="trust-badge trust-badge-verified">
                    {Math.round(s.trustScore)}\u2605
                  </span>
                )}
                <span className="ml-auto font-mono text-[10px] text-[var(--text-muted)]">
                  {s.workflowRunCount ?? s.callCount ?? 0} runs · {s.workflowForkCount ?? 0} forks
                </span>
              </div>
              <div className="mt-auto grid grid-cols-3 gap-2 pt-5">
                <Link
                  href={`/workflow/${workflowKey}/run`}
                  className="rounded-full bg-[var(--text)] px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-[var(--bg)] transition-opacity hover:opacity-80"
                >
                  Run
                </Link>
                <Link
                  href={`/workflow/${workflowKey}/fork`}
                  className="rounded-full border border-[var(--border)] px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]"
                >
                  Fork
                </Link>
                <Link
                  href={`/workflow/${workflowKey}/deploy`}
                  className="rounded-full border border-[var(--border)] px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]"
                >
                  Deploy
                </Link>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LandingHero;
