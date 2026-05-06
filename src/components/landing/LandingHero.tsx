"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  GitFork,
  Play,
  Rocket,
  Search,
  ShieldCheck,
} from "lucide-react";
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

function WorkflowCard({ skill, featured = false }: { skill: SkillRankItem; featured?: boolean }) {
  const key = workflowKey(skill);
  const runs = skill.workflowRunCount ?? skill.callCount ?? 0;
  const forks = skill.workflowForkCount ?? 0;
  const trust = trustValue(skill);
  const creator =
    skill.creator?.displayName ??
    skill.creator?.id?.slice(0, 8) ??
    "dojo creator";

  return (
    <article className={`dojo-card group flex min-h-[246px] flex-col p-4 ${featured ? "dojo-card-featured" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            {featured && <span className="dojo-chip">start here</span>}
            <span className="dojo-chip">workflow asset</span>
            <span className="dojo-chip">{skill.category ?? "workflow"}</span>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">
              v{skill.workflowVersion?.version ?? 1}
            </span>
          </div>
          <Link href={`/workflow/${key}/run`}>
            <h3 className="line-clamp-2 text-[17px] font-semibold leading-tight tracking-[-0.01em] text-[var(--text)] transition-colors hover:text-[var(--text-secondary)]">
              {skill.name}
            </h3>
          </Link>
          {skill.description && (
            <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              {skill.description}
            </p>
          )}
        </div>
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
        <div className="rounded-[6px] border border-[var(--border-light)] px-2.5 py-1.5 text-right">
          <div className="font-mono text-[12px] font-bold text-[var(--text)]">
            {Math.round(trust * 100)}%
          </div>
          <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
            pass
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Metric label="Runs" value={compactNumber(runs)} />
        <Metric label="Price" value={priceLabel(skill.pricePerCall)} />
        <Metric label="Forks" value={compactNumber(forks)} />
      </div>

      <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 pt-4">
        <Link href={`/workflow/${key}/run`} className="dojo-action dojo-action-primary">
          <Play className="h-3.5 w-3.5 fill-current" />
          Run workflow
        </Link>
        <Link href={`/workflow/${key}/fork`} className="dojo-action">
          <GitFork className="h-3.5 w-3.5" />
          Fork
        </Link>
      </div>
    </article>
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

  return (
    <section className="dojo-marketplace">
      <div className="dojo-marketplace-head">
        <div>
          <div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            <span className="live-dot bg-[var(--dojo-red)]" />
            Start with one workflow
          </div>
          <h2 className="font-serif text-[34px] font-black leading-[1.02] tracking-[0] text-[var(--text)] md:text-[42px]">
            Run an agent workflow.
            <br />
            <span className="font-normal text-[var(--text-secondary)]">Get a receipt if it works.</span>
          </h2>
          <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-[var(--text-secondary)]">
            Dojo is a small marketplace for executable agent workflows. Pick one,
            run it through escrow and evaluation, then get a receipt that updates
            the workflow&apos;s reputation.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <a href="#workflows" className="dojo-action dojo-action-primary">
              <Play className="h-3.5 w-3.5 fill-current" />
              Browse workflows
            </a>
            <Link href="/create" className="dojo-action">
              <Rocket className="h-3.5 w-3.5" />
              Publish a workflow
            </Link>
          </div>
        </div>
        <div className="dojo-start-panel">
          <div className="label-sm">How to start</div>
          <ol className="mt-4 space-y-3">
            {[
              ["Pick", "Choose a workflow that matches the task."],
              ["Run", "Pay for one execution and see the output."],
              ["Trust", "A receipt records result, score, and settlement."],
            ].map(([title, body], index) => (
              <li key={title} className="dojo-start-step">
                <span>{index + 1}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="dojo-stat-grid">
            <Metric label="Workflows" value={skillCount || "—"} />
            <Metric label="Receipts" value={compactNumber(totalRuns)} />
            <Metric label="Anchor" value="BSC testnet" />
          </div>
        </div>
      </div>

      <div id="workflows" className="dojo-filter-row">
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
      </div>

      {filtered === null ? (
        <div className="dojo-empty">Loading workflows...</div>
      ) : filtered.length === 0 ? (
        <div className="dojo-empty">No workflows found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((skill, index) => (
            <WorkflowCard key={skill.id} skill={skill} featured={index === 0} />
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {[
          ["For users", "Run a workflow online and inspect the receipt before trusting it again."],
          ["For creators", "Publish a repeatable workflow, then earn from successful executions and forks."],
          ["For agents", "Call the same workflow through the API when you need a paid capability."],
        ].map(([title, body]) => (
          <div key={title} className="dojo-mini-panel">
            <ShieldCheck className="h-4 w-4 text-[var(--text-secondary)]" />
            <div>
              <div className="text-[13px] font-semibold text-[var(--text)]">{title}</div>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">{body}</p>
              {title === "For creators" && (
                <Link href="/create" className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--text)]">
                  Publish <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default LandingHero;
