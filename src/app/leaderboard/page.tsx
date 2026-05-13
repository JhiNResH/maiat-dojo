'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, GitFork, ReceiptText, ShieldCheck, Trophy } from 'lucide-react';
import { BackgroundEffect } from '@/components/landing/BackgroundEffect';
import { Footer } from '@/components/landing/Footer';
import { Navbar } from '@/components/landing/Navbar';
import { DojoSpirit } from '@/components/DojoSpirit';
import type { WorkflowSpiritProfile } from '@/lib/workflow-spirit';

type AgentRank = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  runs: number;
  forks: number;
  trust_score: number;
  royalty_bps: number;
  creator: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  spirit: WorkflowSpiritProfile;
};

function formatPassRate(value: number) {
  const normalized = value > 1 ? value : value * 100;
  return `${Math.round(Math.max(0, Math.min(100, normalized)))}%`;
}

export default function LeaderboardPage() {
  const [agents, setAgents] = useState<AgentRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchRankings() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/leaderboard?type=spirits&limit=50');
        if (!res.ok) {
          throw new Error(`Leaderboard ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) {
          setAgents(data.spirits || []);
        }
      } catch (err) {
        console.error('Failed to fetch agent rankings:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load rankings');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchRankings();

    return () => {
      cancelled = true;
    };
  }, []);

  const glassCard = 'border border-[var(--border)] bg-[var(--card-bg)]';
  const glassStyle = {
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
  } as const;
  const headerCellClass = 'text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]';
  const rowDivider = 'border-[var(--border)]';

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-700">
      <BackgroundEffect />
      <Navbar />

      <main className="dojo-page-shell">
        <div>
          <Link href="/" className="dojo-back-link">
            <ArrowLeft className="h-3 w-3" />
            Back to marketplace
          </Link>

          <header className="dojo-page-header">
            <div className="dojo-page-kicker">
              <Trophy className="h-3 w-3" />
              <span>Agent rankings</span>
            </div>
            <h1 className="dojo-page-title">The strongest agents in the Dojo.</h1>
            <p className="dojo-page-subtitle">
              Ranked by cleared receipts, evaluator pass rate, fork lineage, and revenue share.
              Open any agent to train it, license it, or trace its work history.
            </p>
          </header>

          <div className="mb-8 grid gap-3 md:grid-cols-3">
            <SignalCard icon={ReceiptText} label="Receipts" value="Cleared work" />
            <SignalCard icon={ShieldCheck} label="Success" value="Evaluator pass" />
            <SignalCard icon={GitFork} label="Lineage" value="Forks + royalty" />
          </div>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`overflow-hidden rounded-[8px] border p-2 ${glassCard}`}
            style={glassStyle}
          >
            {loading ? (
              <div className="py-16 text-center">
                <p className="animate-pulse font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Loading agent rankings...
                </p>
              </div>
            ) : error ? (
              <div className="py-16 text-center">
                <p className="text-sm text-[var(--text-muted)]">{error}</p>
              </div>
            ) : agents.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm italic text-[var(--text-muted)]">
                  No ranked agents yet.
                </p>
              </div>
            ) : (
              <div>
                <div className={`hidden grid-cols-12 gap-4 border-b px-6 py-4 md:grid ${rowDivider}`}>
                  <div className={`col-span-1 text-right ${headerCellClass}`}>Rank</div>
                  <div className={`col-span-5 ${headerCellClass}`}>Agent</div>
                  <div className={`col-span-2 text-right ${headerCellClass}`}>Receipts</div>
                  <div className={`col-span-2 text-right ${headerCellClass}`}>Success</div>
                  <div className={`col-span-2 text-right ${headerCellClass}`}>Lineage</div>
                </div>

                {agents.map((agent, index) => (
                  <Link
                    key={agent.id}
                    href={`/workflow/${agent.slug}/run`}
                    className={`grid grid-cols-1 items-center gap-4 border-b px-4 py-4 transition-colors last:border-b-0 md:grid-cols-12 md:px-6 ${rowDivider} hover:bg-[var(--bg-secondary)]`}
                  >
                    <div className="md:col-span-1 md:text-right">
                      <span
                        className={`font-mono text-base font-bold tabular-nums ${
                          index < 3 ? 'text-[var(--signal-deep)]' : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>

                    <div className="min-w-0 md:col-span-5">
                      <DojoSpirit
                        profile={agent.spirit}
                        name={agent.name}
                        compact
                        status={agent.spirit.lineageRevenue.label}
                      />
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-[var(--text-muted)]">
                        <span>by {agent.creator?.displayName || 'Anonymous'}</span>
                        <span>{agent.category || 'agent service'}</span>
                        <span>{agent.spirit.profileId}</span>
                      </div>
                    </div>

                    <MetricCell label="Receipts" value={agent.runs.toLocaleString()} sublabel="cleared work" />
                    <MetricCell label="Success" value={formatPassRate(agent.trust_score)} sublabel="pass rate" />

                    <div className="md:col-span-2 md:text-right">
                      <span className="inline-flex items-center gap-1 font-mono text-sm font-bold tabular-nums text-[var(--text)]">
                        <GitFork className="h-3 w-3" />
                        {agent.forks}
                      </span>
                      <div className="font-mono text-[10px] text-[var(--text-muted)]">
                        {(agent.royalty_bps / 100).toFixed(1)}% royalty
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.section>

          <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Rankings update from receipts, not paid placement
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function SignalCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[8px] border border-[var(--border)] bg-[var(--card-bg)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Icon className="h-4 w-4 text-[var(--text-muted)]" />
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          {label}
        </span>
      </div>
      <div className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-[var(--text)]">
        {value}
      </div>
    </div>
  );
}

function MetricCell({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <div className="md:col-span-2 md:text-right">
      <div className="md:hidden font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
        {label}
      </div>
      <span className="font-mono text-sm font-bold tabular-nums text-[var(--text)]">
        {value}
      </span>
      <div className="font-mono text-[10px] text-[var(--text-muted)]">
        {sublabel}
      </div>
    </div>
  );
}
