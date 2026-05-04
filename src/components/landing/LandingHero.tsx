"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  Filter,
  GitFork,
  Play,
  Rocket,
  Search,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { DojoSpirit } from "@/components/DojoSpirit";
import { type SkillRankItem } from "./SkillRankList";

export interface LandingHeroProps {
  pending?: boolean;
  onSubmit?: (text: string) => void;
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function priceLabel(value?: number | null) {
  if (value == null || value <= 0) return "Free";
  return `$${value.toFixed(3)}`;
}

function workflowKey(skill: SkillRankItem) {
  return skill.workflowId ?? skill.workflowSlug ?? skill.id;
}

function trustValue(skill: SkillRankItem) {
  const raw = skill.trustScore ?? 0;
  if (raw > 1) return Math.min(raw / 100, 1);
  return Math.min(raw, 1);
}

function TrustRing({ value }: { value: number }) {
  const radius = 11;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" className="-rotate-90">
      <circle
        cx="14"
        cy="14"
        r={radius}
        fill="none"
        stroke="var(--border-light)"
        strokeWidth="3"
      />
      <circle
        cx="14"
        cy="14"
        r={radius}
        fill="none"
        stroke="var(--signal)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${circumference * value} ${circumference}`}
      />
    </svg>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[6px] border border-[var(--border-light)] bg-[var(--bg-secondary)] px-2.5 py-2">
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
        {label}
      </div>
      <div className="mt-1 font-mono text-[12px] font-semibold text-[var(--text)]">
        {value}
      </div>
    </div>
  );
}

function WorkflowCard({ skill }: { skill: SkillRankItem }) {
  const key = workflowKey(skill);
  const runs = skill.workflowRunCount ?? skill.callCount ?? 0;
  const forks = skill.workflowForkCount ?? 0;
  const trust = trustValue(skill);
  const creator =
    skill.creator?.displayName ??
    skill.creator?.id?.slice(0, 8) ??
    "dojo creator";

  return (
    <article className="dojo-card group flex min-h-[292px] flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="dojo-chip">workflow asset</span>
            <span className="dojo-chip">{skill.category ?? "workflow"}</span>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">
              v{skill.workflowVersion?.version ?? 1}
            </span>
            {runs > 5_000 && (
              <span className="ml-auto inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--signal)]">
                <Zap className="h-3 w-3 fill-current" />
                hot
              </span>
            )}
          </div>
          <Link href={`/workflow/${key}/run`}>
            <h3 className="line-clamp-1 text-[15px] font-semibold leading-tight tracking-[-0.01em] text-[var(--text)] transition-colors hover:text-[var(--text-secondary)]">
              {skill.name}
            </h3>
          </Link>
          {skill.description && (
            <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-[var(--text-secondary)]">
              {skill.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <DojoSpirit
          compact
          name={skill.name}
          receipts={runs}
          passRate={trust}
          forks={forks}
          status={`${skill.royaltyBps ?? 0} bps creator royalty`}
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--border-light)] pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="h-6 w-6 shrink-0 rounded-[6px] border border-[var(--border)] bg-[var(--bg-secondary)]" />
          <div className="min-w-0">
            <div className="truncate text-[12px] font-medium text-[var(--text)]">
              {creator}
            </div>
            <div className="font-mono text-[10px] text-[var(--text-muted)]">
              KYA pending
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrustRing value={trust} />
          <div>
            <div className="font-mono text-[12px] font-bold text-[var(--text)]">
              {trust.toFixed(2)}
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
              trust
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Metric label="Runs" value={compactNumber(runs)} />
        <Metric label="Pass rate" value={`${Math.round(trust * 100)}%`} />
        <Metric label="Royalty" value={`${((skill.royaltyBps ?? 0) / 100).toFixed(1)}%`} />
      </div>

      <div className="mt-auto grid grid-cols-[1fr_auto_auto] gap-2 pt-4">
        <Link href={`/workflow/${key}/run`} className="dojo-action dojo-action-primary">
          <Play className="h-3.5 w-3.5 fill-current" />
          Run · {priceLabel(skill.pricePerCall)}
        </Link>
        <Link href={`/workflow/${key}/fork`} className="dojo-action">
          <GitFork className="h-3.5 w-3.5" />
          Fork
        </Link>
        <Link href={`/workflow/${key}/deploy`} className="dojo-action">
          <Rocket className="h-3.5 w-3.5" />
          Deploy
        </Link>
      </div>
    </article>
  );
}

function ReceiptTicker() {
  const items = [
    ["16:10:45", "agent-repo-analyst", "PASS", "Lv.5", "fed"],
    ["16:10:44", "gbrain", "ROYALTY", "5.0%", "creator"],
    ["16:10:43", "receipt", "SETTLED", "$0.003", "ledger"],
  ];

  return (
    <div className="dojo-ticker">
      <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
        <span className="live-dot bg-[var(--signal)]" />
        Spirit feed
      </div>
      <div className="ticker-scroll flex-1">
        <div className="ticker-track">
          {[...items, ...items].map(([time, name, status, score, latency], index) => (
            <div key={`${name}-${index}`} className="flex shrink-0 items-center gap-2 px-4 font-mono text-[10.5px]">
              <span className="text-[var(--text-muted)]">{time}</span>
              <span className="text-[var(--text)]">{name}</span>
              <span className={status === "FAIL" ? "text-[var(--error)]" : "text-[var(--signal)]"}>
                {status}
              </span>
              <span className="text-[var(--text-secondary)]">{score}</span>
              <span className="text-[var(--text-muted)]">{latency}</span>
            </div>
          ))}
        </div>
      </div>
      <span className="hidden font-mono text-[10px] text-[var(--text-muted)] md:block">
        0xC159...8c04
      </span>
    </div>
  );
}

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

  const categories = useMemo(
    () => (skills ? ["all", ...Array.from(new Set(skills.map((s) => s.category ?? "misc")))] : ["all"]),
    [skills],
  );

  const filtered = useMemo(() => {
    if (skills === null) return null;
    const q = query.trim().toLowerCase();
    return skills.filter((skill) => {
      const matchCat = filter === "all" || (skill.category ?? "misc") === filter;
      const matchQ =
        !q ||
        skill.name.toLowerCase().includes(q) ||
        (skill.description ?? "").toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [filter, query, skills]);

  const skillCount = skills?.length ?? 0;
  const totalRuns =
    skills?.reduce((sum, skill) => sum + (skill.workflowRunCount ?? skill.callCount ?? 0), 0) ?? 0;
  const totalForks = skills?.reduce((sum, skill) => sum + (skill.workflowForkCount ?? 0), 0) ?? 0;

  return (
    <section className="dojo-marketplace">
      <div className="dojo-marketplace-head">
        <div>
          <div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            <span className="live-dot bg-[var(--dojo-red)]" />
            Live · dojo training mat
          </div>
          <h2 className="font-serif text-[34px] font-black leading-[1.02] tracking-[0] text-[var(--text)] md:text-[42px]">
            Train, fork, and clear
            <br />
            <span className="font-normal text-[var(--text-secondary)]">living agent workflows.</span>
          </h2>
          <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-[var(--text-secondary)]">
            Dojo is a training hall for agent workflows. Each asset has lineage,
            creator royalties, and a spirit that levels up only when paid runs
            clear with receipts, evaluator scores, and BSC testnet anchors.
          </p>
        </div>
        <div className="dojo-spirit-hero">
          <DojoSpirit
            name="Registry Spirit"
            receipts={totalRuns}
            passRate={skillCount > 0 ? 1 : 0}
            forks={totalForks}
            status="rank grows from cleared kata"
          />
          <div className="dojo-stat-grid">
            <Metric label="Assets" value={skillCount || "—"} />
            <Metric label="Receipts" value={compactNumber(totalRuns)} />
            <Metric label="Forks" value={compactNumber(totalForks)} />
            <Metric label="Anchor" value="BSC testnet" />
          </div>
        </div>
      </div>

      <div className="dojo-filter-row">
        <div className="relative min-w-0 flex-1 md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search workflow assets..."
            className="dojo-input pl-9"
          />
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`dojo-filter ${filter === cat ? "dojo-filter-active" : ""}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          <button className="dojo-action">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </button>
          <button className="dojo-action">
            <ArrowUpDown className="h-3.5 w-3.5" />
            Cleared quality
          </button>
        </div>
      </div>

      {filtered === null ? (
        <div className="dojo-empty">Loading workflows...</div>
      ) : filtered.length === 0 ? (
        <div className="dojo-empty">No workflows found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((skill) => (
            <WorkflowCard key={skill.id} skill={skill} />
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {[
          ["Enroll", "Collect a workflow asset, inspect its lineage, and see the creator royalty before running it."],
          ["Train", "Every successful execution feeds the workflow spirit with receipt-backed reputation."],
          ["Promote", "PASS/FAIL receipts act like rank tests: quality advances, failures stay recorded."],
        ].map(([title, body]) => (
          <div key={title} className="dojo-mini-panel">
            <ShieldCheck className="h-4 w-4 text-[var(--text-secondary)]" />
            <div>
              <div className="text-[13px] font-semibold text-[var(--text)]">{title}</div>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <ReceiptTicker />
    </section>
  );
}

export default LandingHero;
