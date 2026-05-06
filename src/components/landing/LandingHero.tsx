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

function statusLabel(runs: number, success: number) {
  if (runs === 0) return "Ready";
  if (success >= 90) return "Cleared";
  if (success >= 70) return "Observed";
  return "Watch";
}

function WorkflowCatalogRow({ skill, featured = false }: { skill: SkillRankItem; featured?: boolean }) {
  const key = workflowKey(skill);
  const runs = skill.workflowRunCount ?? skill.callCount ?? 0;
  const trust = trustValue(skill);
  const success = Math.round(trust * 100);
  const category = skill.category ?? "AI workflow";

  return (
    <article className={`dojo-catalog-row group ${featured ? "dojo-catalog-row-featured" : ""}`}>
      <div className="dojo-catalog-workflow">
        <Link href={`/workflow/${key}/run`} className="dojo-catalog-mark" aria-label={`Open ${skill.name}`}>
          <Image
            src="/brand/dojo-mantis-logo.png"
            alt=""
            width={44}
            height={44}
            className="h-full w-full object-cover"
          />
        </Link>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/workflow/${key}/run`}>
              <h3 className="text-[14px] font-bold leading-tight text-[var(--text)] transition-colors hover:text-[var(--text-secondary)]">
                {skill.name}
              </h3>
            </Link>
            {featured && <span className="dojo-catalog-badge">Featured</span>}
          </div>
          <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
            {listingDescription(skill.description)}
          </p>
        </div>
      </div>

      <div className="dojo-catalog-cell" data-label="Category">
        <span className="dojo-catalog-pill">{category}</span>
      </div>

      <div className="dojo-catalog-cell" data-label="Price">
        <strong>{priceLabel(skill.pricePerCall)}</strong>
      </div>

      <div className="dojo-catalog-cell" data-label="Runs">
        <strong>{compactNumber(runs)}</strong>
      </div>

      <div className="dojo-catalog-cell" data-label="Success">
        <strong>{success}%</strong>
      </div>

      <div className="dojo-catalog-cell" data-label="Status">
        <span className="dojo-catalog-status">{statusLabel(runs, success)}</span>
      </div>

      <div className="dojo-catalog-actions">
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
    </article>
  );
}

function WorkflowSkeletonRow() {
  return (
    <div className="dojo-catalog-row dojo-skeleton-card" aria-hidden="true">
      <div className="dojo-catalog-workflow">
        <div className="dojo-skeleton-mark" />
        <div className="min-w-0 flex-1">
          <div className="dojo-skeleton-line w-1/2" />
          <div className="mt-3 dojo-skeleton-line w-full" />
        </div>
      </div>
      <div className="dojo-skeleton-line" />
      <div className="dojo-skeleton-line" />
      <div className="dojo-skeleton-line" />
      <div className="dojo-skeleton-line" />
      <div className="dojo-skeleton-line" />
      <div className="dojo-skeleton-button" />
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
            Browse useful AI workflows. Run one instantly, get the output, and keep a receipt-backed record.
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
        <div className="dojo-catalog-table">
          <div className="dojo-catalog-head">
            <span>Workflow</span>
            <span>Category</span>
            <span>Price</span>
            <span>Runs</span>
            <span>Success</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {[0, 1, 2, 3].map((item) => (
            <WorkflowSkeletonRow key={item} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="dojo-empty">
          No workflows found. Try another keyword or publish your own.
        </div>
      ) : (
        <div className="dojo-catalog-table">
          <div className="dojo-catalog-head">
            <span>Workflow</span>
            <span>Category</span>
            <span>Price</span>
            <span>Runs</span>
            <span>Success</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {filtered.map((skill, index) => (
            <WorkflowCatalogRow key={skill.id} skill={skill} featured={index === 0} />
          ))}
        </div>
      )}
    </section>
  );
}

export default LandingHero;
