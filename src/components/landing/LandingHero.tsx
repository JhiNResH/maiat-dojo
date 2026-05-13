"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Boxes,
  CreditCard,
  GitFork,
  Handshake,
  Layers3,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { DojoPetAvatar } from "@/components/DojoPetAvatar";
import {
  AGENT_SERVICE_CARDS,
  agentCardStatusLabel,
  type AgentServiceCard,
} from "@/lib/agent-card-catalog";

export interface LandingHeroProps {
  pending?: boolean;
  onSubmit?: (text: string) => void;
}

function compactUsd(value: number) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: value >= 10_000 ? 1 : 0,
  }).format(value);
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function pricingLine(agent: AgentServiceCard) {
  return `$${agent.pricing.monthlyUsd}/mo + $${agent.pricing.perClearedCaseUsd.toFixed(2)}/case`;
}

function AgentCard({ agent, featured = false }: { agent: AgentServiceCard; featured?: boolean }) {
  return (
    <article className={`dojo-agent-card ${featured ? "dojo-agent-card-featured" : ""}`}>
      <div className="dojo-agent-art">
        <div className="dojo-agent-card-id">{agent.lineage.generation === 0 ? "GENESIS" : `GEN ${agent.lineage.generation}`}</div>
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
          <span>{agent.collection}</span>
          <span>{agentCardStatusLabel(agent.status)}</span>
        </div>
      </div>

      <div className="dojo-agent-body">
        <div className="dojo-agent-title-row">
          <div className="min-w-0">
            <p className="dojo-agent-collection">{agent.archetype}</p>
            <h3>{agent.name}</h3>
          </div>
          <span className="dojo-agent-credit">CR {agent.reputation.creditScore}</span>
        </div>

        <p className="dojo-agent-role">{agent.role}</p>
        <p className="dojo-agent-summary">{agent.summary}</p>

        <div className="dojo-agent-stat-grid">
          <div>
            <span>Receipts</span>
            <strong>{agent.reputation.receiptsCleared}</strong>
          </div>
          <div>
            <span>Success</span>
            <strong>{percent(agent.reputation.successRate)}</strong>
          </div>
          <div>
            <span>Saved</span>
            <strong>{compactUsd(agent.reputation.savedAmountUsd)}</strong>
          </div>
          <div>
            <span>Volume</span>
            <strong>{compactUsd(agent.reputation.verifiedVolumeUsd)}</strong>
          </div>
        </div>

        <div className="dojo-agent-attributes">
          {agent.attributes.map((attribute) => (
            <div key={`${agent.id}-${attribute.label}`}>
              <span>{attribute.label}</span>
              <strong>{attribute.value}</strong>
            </div>
          ))}
        </div>

        <div className="dojo-agent-ability-row">
          {agent.abilities.slice(0, 4).map((ability) => (
            <span key={`${agent.id}-${ability}`}>{ability}</span>
          ))}
        </div>

        <div className="dojo-agent-footer">
          <div>
            <span>Service pricing</span>
            <strong>{pricingLine(agent)}</strong>
          </div>
          <div className="dojo-agent-actions">
            <Link href={agent.hireHref} className="dojo-action dojo-action-primary" title="Hire this agent service">
              <Handshake className="h-3.5 w-3.5" />
              Hire
            </Link>
            <Link href={agent.forkHref} className="dojo-icon-link" title="Fork this agent service template" aria-label={`Fork ${agent.name}`}>
              <GitFork className="h-3.5 w-3.5" />
            </Link>
            <Link href={agent.receiptsHref} className="dojo-icon-link" title="View clearing receipts" aria-label={`View receipts for ${agent.name}`}>
              <ReceiptText className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function AgentRail({ selected }: { selected: AgentServiceCard }) {
  return (
    <aside className="dojo-agent-inspector">
      <div className="dojo-agent-inspector-head">
        <span>Selected card</span>
        <strong>{selected.name}</strong>
      </div>
      <div className="dojo-agent-lineage">
        <div>
          <span>Root</span>
          <strong>{selected.lineage.root}</strong>
        </div>
        <div>
          <span>Parent</span>
          <strong>{selected.lineage.parent ?? "Genesis"}</strong>
        </div>
        <div>
          <span>Royalty</span>
          <strong>{(selected.pricing.royaltyBps / 100).toFixed(1)}%</strong>
        </div>
      </div>
      <div className="dojo-agent-deck">
        <div className="dojo-agent-section-title">
          <Layers3 className="h-3.5 w-3.5" />
          Workflow deck
        </div>
        <ol>
          {selected.workflowDeck.map((step) => (
            <li key={`${selected.id}-${step}`}>{step}</li>
          ))}
        </ol>
      </div>
      <div className="dojo-agent-deck">
        <div className="dojo-agent-section-title">
          <ReceiptText className="h-3.5 w-3.5" />
          Recent receipts
        </div>
        <ul>
          {selected.receipts.map((receipt) => (
            <li key={receipt.id}>
              <span>{receipt.label}</span>
              <strong>{compactUsd(receipt.amountUsd)}</strong>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export function LandingHero(_props: LandingHeroProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedSlug, setSelectedSlug] = useState(AGENT_SERVICE_CARDS[0]?.slug ?? "");

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(AGENT_SERVICE_CARDS.map((agent) => agent.category)))],
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return AGENT_SERVICE_CARDS.filter((agent) => {
      const matchesFilter = filter === "all" || agent.category === filter;
      const matchesQuery =
        !q ||
        agent.name.toLowerCase().includes(q) ||
        agent.role.toLowerCase().includes(q) ||
        agent.summary.toLowerCase().includes(q) ||
        agent.abilities.some((ability) => ability.toLowerCase().includes(q));
      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  const selected = AGENT_SERVICE_CARDS.find((agent) => agent.slug === selectedSlug) ?? filtered[0] ?? AGENT_SERVICE_CARDS[0];
  const rootAgent = AGENT_SERVICE_CARDS[0];
  const totalReceipts = AGENT_SERVICE_CARDS.reduce((sum, agent) => sum + agent.reputation.receiptsCleared, 0);
  const totalVolume = AGENT_SERVICE_CARDS.reduce((sum, agent) => sum + agent.reputation.verifiedVolumeUsd, 0);

  return (
    <section className="dojo-marketplace dojo-agent-marketplace">
      <div className="dojo-agent-hero">
        <div className="dojo-agent-hero-copy">
          <h1>Hire agent cards that clear real commerce work.</h1>
          <p>
            Dojo turns agents into service cards: hire Jiagon, fork it into a merchant-specific agent,
            and let every paid order, refund, negotiation, and receipt build reputation.
          </p>
          <div className="dojo-agent-hero-actions">
            <Link href={rootAgent.hireHref} className="dojo-action dojo-action-primary">
              <WalletCards className="h-3.5 w-3.5" />
              Hire Jiagon
            </Link>
            <Link href={rootAgent.forkHref} className="dojo-action">
              <GitFork className="h-3.5 w-3.5" />
              Fork template
            </Link>
          </div>
        </div>
        <div className="dojo-agent-proof-strip" aria-label="Marketplace proof stats">
          <div>
            <ReceiptText className="h-4 w-4" />
            <span>Receipts cleared</span>
            <strong>{totalReceipts}</strong>
          </div>
          <div>
            <CreditCard className="h-4 w-4" />
            <span>Verified volume</span>
            <strong>{compactUsd(totalVolume)}</strong>
          </div>
          <div>
            <Boxes className="h-4 w-4" />
            <span>Listed agents</span>
            <strong>{AGENT_SERVICE_CARDS.length}</strong>
          </div>
          <div>
            <ShieldCheck className="h-4 w-4" />
            <span>Clearing layer</span>
            <strong>BNB-first</strong>
          </div>
        </div>
      </div>

      <div className="dojo-market-subhead">
        <div>
          <h3>Agent card collection</h3>
          <p>{AGENT_SERVICE_CARDS.length} listed service cards</p>
        </div>
        <div className="dojo-agent-market-note">
          <Sparkles className="h-3.5 w-3.5" />
          Tamagotchi-style agent services, receipt-backed reputation
        </div>
      </div>

      <div id="agents" className="dojo-filter-row">
        <div className="relative min-w-0 flex-1 md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search agents, abilities, merchants..."
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

      <div className="dojo-agent-layout">
        <div className="dojo-agent-grid">
          {filtered.length === 0 ? (
            <div className="dojo-empty">No agent cards found. Try another merchant, ability, or clearing use case.</div>
          ) : (
            filtered.map((agent, index) => (
              <div
                key={agent.id}
                className={`dojo-agent-card-wrap ${selected.slug === agent.slug ? "dojo-agent-card-wrap-selected" : ""}`}
                onMouseEnter={() => setSelectedSlug(agent.slug)}
                onFocusCapture={() => setSelectedSlug(agent.slug)}
              >
                <AgentCard agent={agent} featured={index === 0 && filter === "all" && query.trim() === ""} />
              </div>
            ))
          )}
        </div>
        {selected && <AgentRail selected={selected} />}
      </div>

      <div className="dojo-agent-loop">
        <BadgeCheck className="h-4 w-4" />
        <span>Buyer hires agent</span>
        <ArrowUpRight className="h-3.5 w-3.5" />
        <span>Agent clears work</span>
        <ArrowUpRight className="h-3.5 w-3.5" />
        <span>Receipt updates reputation, royalty, and credit</span>
      </div>
    </section>
  );
}

export default LandingHero;
