"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
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

function listingDescription(description?: string | null) {
  const value = description?.trim();
  if (!value) return "Ready-to-run AI workflow with receipt-backed execution history.";

  const sentenceEnd = value.search(/[.!?]\s/);
  if (sentenceEnd > 32) return value.slice(0, sentenceEnd + 1);
  if (value.length <= 132) return value;
  return `${value.slice(0, 129).trim()}...`;
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
  const success = Math.round(trust * 100);

  return (
    <article className={`dojo-card dojo-asset-card group ${featured ? "dojo-card-featured" : ""}`}>
      <Link href={`/workflow/${key}/run`} className="dojo-asset-preview" aria-label={`Open ${skill.name}`}>
        <div className="dojo-asset-mark">
          <Image
            src="/brand/dojo-mantis-logo.png"
            alt=""
            width={82}
            height={82}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="dojo-asset-preview-meta">
          {featured && <span>Featured</span>}
          <span>{skill.category ?? "AI workflow"}</span>
        </div>
      </Link>

      <div className="flex min-h-[180px] flex-col p-4">
        <div className="min-w-0">
          <Link href={`/workflow/${key}/run`}>
            <h3 className="line-clamp-2 text-[16px] font-semibold leading-tight text-[var(--text)] transition-colors hover:text-[var(--text-secondary)]">
              {skill.name}
            </h3>
          </Link>
          <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-[var(--text-secondary)]">
            {listingDescription(skill.description)}
          </p>
        </div>

        <div className="dojo-collection-meta mt-4">
          <div>
            <span>Price</span>
            <strong>{priceLabel(skill.pricePerCall)}</strong>
          </div>
          <div>
            <span>Runs</span>
            <strong>{compactNumber(runs)}</strong>
          </div>
          <div>
            <span>Success</span>
            <strong>{success}%</strong>
          </div>
        </div>

        <div className="mt-4 flex min-w-0 items-center justify-between gap-3 border-t border-[var(--border-light)] pt-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="h-6 w-6 shrink-0 rounded-[6px] border border-[var(--border)] bg-[var(--bg-secondary)]" />
            <div className="min-w-0">
              <div className="truncate text-[12px] font-medium text-[var(--text)]">
                {creator}
              </div>
              <div className="dojo-card-meta-line">
                v{skill.workflowVersion?.version ?? 1} · {compactNumber(forks)} forks
              </div>
            </div>
          </div>
          <span
            className="dojo-verify-badge"
            title="Creator verification has not been completed yet."
          >
            <ShieldCheck className="h-3 w-3" />
            Pending
          </span>
        </div>

        <div className="dojo-card-actions mt-auto grid grid-cols-[1fr_auto_auto] gap-2 pt-4">
          <Link
            href={`/workflow/${key}/run`}
            className="dojo-action dojo-action-primary"
            title="Run once, get a result, and receive an execution receipt."
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Run
          </Link>
          <Link
            href={`/skill/${skill.id}`}
            className="dojo-icon-link"
            title="View details"
            aria-label={`View details for ${skill.name}`}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/workflow/${key}/fork`}
            className="dojo-icon-link"
            title="Create your own version of this workflow to customize or monetize it."
            aria-label={`Fork ${skill.name}`}
          >
            <GitFork className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function WorkflowSkeletonCard() {
  return (
    <div className="dojo-card dojo-asset-card dojo-skeleton-card" aria-hidden="true">
      <div className="dojo-asset-preview">
        <div className="dojo-skeleton-mark" />
      </div>
      <div className="flex min-h-[220px] flex-col p-4">
        <div className="dojo-skeleton-line w-3/4" />
        <div className="mt-3 dojo-skeleton-line w-full" />
        <div className="mt-2 dojo-skeleton-line w-2/3" />
        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="dojo-skeleton-box" />
          <div className="dojo-skeleton-box" />
          <div className="dojo-skeleton-box" />
        </div>
        <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 pt-4">
          <div className="dojo-skeleton-button" />
          <div className="dojo-skeleton-button w-24" />
        </div>
      </div>
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

  return (
    <section className="dojo-marketplace">
      <div className="dojo-market-header">
        <div className="min-w-0">
          <div className="label-sm">Marketplace</div>
          <h2 className="mt-2 font-serif text-[30px] font-black leading-none text-[var(--text)] md:text-[40px]">
            AI workflows
          </h2>
          <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
            Discover workflow assets. Run one, get a result, and leave a receipt.
          </p>
        </div>
        <Link
          href="/create"
          className="dojo-action dojo-action-primary"
          title="Publish your AI workflow and earn when other users run it."
        >
          <Rocket className="h-3.5 w-3.5" />
          Publish
        </Link>
      </div>

      <div className="dojo-market-subhead">
        <div>
          <h3>Featured workflows</h3>
          <p>{skillCount || "—"} listed</p>
        </div>
      </div>

      <div id="workflows" className="dojo-filter-row">
        <div className="relative min-w-0 flex-1 md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search AI workflows..."
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <WorkflowSkeletonCard key={item} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="dojo-empty">
          No workflows found. Try another keyword or publish your own.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((skill, index) => (
            <WorkflowCard key={skill.id} skill={skill} featured={index === 0} />
          ))}
        </div>
      )}
    </section>
  );
}

export default LandingHero;
