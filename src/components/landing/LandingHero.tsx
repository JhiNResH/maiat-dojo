"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  GitFork,
  Layers3,
  Play,
  ReceiptText,
  Repeat2,
  Search,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { DojoPetAvatar } from "@/components/DojoPetAvatar";
import {
  AGENT_FAMILIES,
  AGENT_SERVICE_CARDS,
  agentProofLevelLabel,
  agentCardStatusLabel,
  type AgentServiceCard,
} from "@/lib/agent-card-catalog";

export interface LandingHeroProps {
  pending?: boolean;
  onSubmit?: (text: string) => void;
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function AgentCard({ agent, featured = false }: { agent: AgentServiceCard; featured?: boolean }) {
  return (
    <div className={`dojo-agent-card ${featured ? "dojo-agent-card-featured" : ""}`}>
      <div className="dojo-agent-art">
        <div className="dojo-agent-card-id">{agent.nfaId}</div>
        <div className="dojo-agent-pet-frame">
          <DojoPetAvatar
            name={agent.name}
            workflowId={agent.avatarSeed}
            slug={agent.slug}
            category={agent.category}
            creatorId={agent.lineage.parent ?? agent.lineage.root}
            receipts={agent.reputation.receiptsCleared}
            passRate={agent.reputation.successRate}
            forks={agent.lineage.generation}
            royaltyBps={agent.pricing.royaltyBps}
            size="lg"
          />
        </div>
        <div className="dojo-agent-rail">
          <span>{agent.familyCode} family</span>
          <span>{agentProofLevelLabel(agent.proofLevel)} proof</span>
        </div>
      </div>

      <div className="dojo-agent-body">
        <div className="dojo-agent-title-row">
          <div className="min-w-0">
            <p className="dojo-agent-collection">{agent.collection}</p>
            <h3>{agent.name}</h3>
          </div>
        </div>

        <p className="dojo-agent-role">{agent.role}</p>
        <div className="dojo-agent-card-meta" aria-label={`${agent.name} quick stats`}>
          <span>{agent.familyName}</span>
          <span>CR {agent.reputation.creditScore}</span>
          <span>{percent(agent.reputation.successRate)} success</span>
        </div>
        <Link
          href={agent.detailHref}
          className="dojo-agent-open-cta"
          onClick={(event) => event.stopPropagation()}
        >
          Open card
        </Link>
      </div>
    </div>
  );
}

function AgentRail({ selected }: { selected: AgentServiceCard }) {
  return (
    <aside className="dojo-agent-inspector">
      <div className="dojo-agent-dex-hero">
        <div className="dojo-agent-dex-avatar">
          <DojoPetAvatar
            name={selected.name}
            workflowId={selected.avatarSeed}
            slug={selected.slug}
            category={selected.category}
            creatorId={selected.lineage.parent ?? selected.lineage.root}
            receipts={selected.reputation.receiptsCleared}
            passRate={selected.reputation.successRate}
            forks={selected.lineage.generation}
            royaltyBps={selected.pricing.royaltyBps}
            size="lg"
          />
        </div>
        <div className="dojo-agent-dex-copy">
          <span>{selected.familyCode} family · {selected.nfaId}</span>
          <strong>{selected.name}</strong>
          <p>{selected.role}</p>
        </div>
      </div>

      <div className="dojo-agent-nfa-strip">
        <div>
          <span>AgentID</span>
          <strong>{selected.agentId}</strong>
        </div>
        <div>
          <span>Owner</span>
          <strong>{selected.ownerIdentity}</strong>
        </div>
        <div>
          <span>Proof</span>
          <strong>{agentProofLevelLabel(selected.proofLevel)}</strong>
        </div>
      </div>

      <div className="dojo-agent-dex-stats" aria-label={`${selected.name} reputation stats`}>
        <div>
          <span>Credit</span>
          <strong>CR {selected.reputation.creditScore}</strong>
        </div>
        <div>
          <span>Success</span>
          <strong>{percent(selected.reputation.successRate)}</strong>
        </div>
        <div>
          <span>Receipts</span>
          <strong>{selected.reputation.receiptsCleared}</strong>
        </div>
      </div>

      <div className="dojo-agent-detail-actions">
        <Link href={selected.runHref} className="dojo-action dojo-action-primary" title="Run once for a specific task">
          <Play className="h-3.5 w-3.5 fill-current" />
          Run
        </Link>
        <Link href={selected.subscribeHref} className="dojo-action" title="Subscribe to this ongoing agent service">
          <Repeat2 className="h-3.5 w-3.5" />
          Subscribe
        </Link>
        <Link href={selected.forkHref} className="dojo-action" title="Fork or license this agent service">
          <GitFork className="h-3.5 w-3.5" />
          Fork
        </Link>
      </div>

      <div className="dojo-agent-dex-section dojo-agent-dex-section-primary">
        <div className="dojo-agent-section-title">
          <WalletCards className="h-3.5 w-3.5" />
          Abilities
        </div>
        <div className="dojo-agent-move-list">
          {selected.abilities.map((ability, index) => (
            <div key={`${selected.id}-${ability}`} className="dojo-agent-move">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{ability}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="dojo-agent-dex-section">
        <div className="dojo-agent-section-title">
          <Layers3 className="h-3.5 w-3.5" />
          Service deck
        </div>
        <ol className="dojo-agent-quest-list">
          {selected.workflowDeck.map((step) => (
            <li key={`${selected.id}-${step}`}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="dojo-agent-dex-section">
        <div className="dojo-agent-section-title">
          <ReceiptText className="h-3.5 w-3.5" />
          Receipts
        </div>
        <div className="dojo-agent-receipt-stamps">
          {selected.receipts.slice(0, 3).map((receipt) => (
            <div key={receipt.id}>
              <span>{receipt.status}</span>
              <strong>{receipt.label}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="dojo-agent-dex-lineage">
        <div>
          <span>Root</span>
          <strong>{selected.lineage.root}</strong>
        </div>
        <div>
          <span>Parent</span>
          <strong>{selected.lineage.parent ?? "Genesis"}</strong>
        </div>
        <div>
          <span>Children</span>
          <strong>{selected.lineage.forks?.join(", ") ?? "None"}</strong>
        </div>
      </div>

      <div className="dojo-agent-dex-note">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>{selected.proofSummary} {(selected.pricing.royaltyBps / 100).toFixed(1)}% lineage royalty.</span>
      </div>
    </aside>
  );
}

export function LandingHero(_props: LandingHeroProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedSlug, setSelectedSlug] = useState(AGENT_SERVICE_CARDS[0]?.slug ?? "");

  const families = useMemo(() => ["all", ...AGENT_FAMILIES.map((family) => family.code)], []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return AGENT_SERVICE_CARDS.filter((agent) => {
      const matchesFilter = filter === "all" || agent.familyCode === filter;
      const matchesQuery =
        !q ||
        agent.name.toLowerCase().includes(q) ||
        agent.role.toLowerCase().includes(q) ||
        agent.summary.toLowerCase().includes(q) ||
        agent.familyCode.toLowerCase().includes(q) ||
        agent.familyName.toLowerCase().includes(q) ||
        agent.ownerIdentity.toLowerCase().includes(q) ||
        agent.agentId.toLowerCase().includes(q) ||
        agent.proofSummary.toLowerCase().includes(q) ||
        agent.abilities.some((ability) => ability.toLowerCase().includes(q));
      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  const selected = AGENT_SERVICE_CARDS.find((agent) => agent.slug === selectedSlug) ?? filtered[0] ?? AGENT_SERVICE_CARDS[0];

  return (
    <section className="dojo-marketplace dojo-agent-marketplace">
      <div className="dojo-agent-hero">
        <div className="dojo-agent-hero-copy">
          <h1>Hire non-fungible agents.</h1>
          <p>
            Dojo is an NFA marketplace: each agent card carries identity,
            abilities, service endpoints, proof history, receipts, and fork lineage.
            Start with the family, then open the card before you run, subscribe, or license it.
          </p>
        </div>
      </div>

      <div className="dojo-market-subhead">
        <div>
          <h3>NFA marketplace</h3>
          <p>{AGENT_SERVICE_CARDS.length} listed agents · {AGENT_FAMILIES.length} families</p>
        </div>
      </div>

      <div id="agents" className="dojo-filter-row">
        <div className="relative min-w-0 flex-1 md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search agents, families, abilities..."
            className="dojo-input pl-9"
          />
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {families.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`dojo-filter ${filter === cat ? "dojo-filter-active" : ""}`}
              title={
                cat === "all"
                  ? "All NFA families"
                  : AGENT_FAMILIES.find((family) => family.code === cat)?.role
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="dojo-agent-layout">
        <div className="dojo-agent-grid">
          {filtered.length === 0 ? (
            <div className="dojo-empty">No NFA cards found. Try another family, ability, or clearing use case.</div>
          ) : (
            filtered.map((agent, index) => (
              <div
                key={agent.id}
                role="button"
                tabIndex={0}
                className={`dojo-agent-card-wrap ${selected.slug === agent.slug ? "dojo-agent-card-wrap-selected" : ""}`}
                onClick={() => setSelectedSlug(agent.slug)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedSlug(agent.slug);
                  }
                }}
                aria-current={selected.slug === agent.slug}
                aria-label={`Open ${agent.name} agent card`}
              >
                <AgentCard agent={agent} featured={index === 0 && filter === "all" && query.trim() === ""} />
              </div>
            ))
          )}
        </div>
        {selected && <AgentRail selected={selected} />}
      </div>
    </section>
  );
}

export default LandingHero;
