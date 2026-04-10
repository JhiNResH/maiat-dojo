'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Wallet, Activity, DollarSign, ShieldCheck } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { useDarkMode } from '@/app/DarkModeContext';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { BackgroundEffect } from '@/components/landing/BackgroundEffect';

interface SessionRow {
  id: string;
  status: string;
  budgetTotal: number;
  budgetRemaining: number;
  callCount: number;
  pricePerCall: number;
  settledAt: string | null;
  basAttestationUid: string | null;
  openedAt: string;
  agent?: { name: string; walletAddress: string | null; trustScore: number | null };
  skill?: { name: string; gatewaySlug: string | null };
}

interface DashboardData {
  user: {
    displayName: string | null;
    walletAddress: string;
    erc8004TokenId: string | null;
    kyaLevel: number;
  };
  role: 'creator' | 'agent';
  creator: {
    skillCount: number;
    totalEarnings: number;
    sessionCount: number;
    callCount: number;
    skills: { id: string; name: string; slug: string | null; pricePerCall: number | null; sessionCount: number }[];
    recentSessions: SessionRow[];
  };
  agent: {
    agents: { id: string; name: string; walletAddress: string | null; trustScore: number | null; sessionCount: number }[];
    totalSpent: number;
    sessionCount: number;
    callCount: number;
    recentSessions: SessionRow[];
  };
}

export default function DashboardPage() {
  const { isDark } = useDarkMode();
  const { ready, authenticated, user, getAccessToken } = usePrivy();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !authenticated || !user) {
      setLoading(false);
      return;
    }
    getAccessToken()
      .then((token) => {
        if (!token) {
          setLoading(false);
          return;
        }
        return fetch(`/api/dashboard/stats?privyId=${encodeURIComponent(user.id)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => {
            if (!r.ok) throw new Error(`${r.status}`);
            return r.json();
          })
          .then(setData);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [ready, authenticated, user, getAccessToken]);

  const glassCard = isDark
    ? 'border-white/[0.06] bg-white/[0.03]'
    : 'border-black/[0.06] bg-white/60';

  const glassStyle = {
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
  } as const;

  return (
    <div
      className="min-h-screen atmosphere transition-colors duration-700"
      style={{
        background: isDark ? '#0A0A0A' : '#fafaf7',
        color: isDark ? '#ededed' : '#0a0a0a',
      }}
    >
      <BackgroundEffect />
      <Navbar />

      <main className="relative pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <div
              className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-3 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              Dashboard
            </div>
            <h1
              className={`font-sans font-semibold text-4xl md:text-6xl tracking-[-0.03em] leading-[0.95] ${
                isDark ? 'text-white' : 'text-black'
              }`}
            >
              Your sessions,
              <br />
              <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                on-chain.
              </span>
            </h1>
          </div>

          {!ready ? null : !authenticated ? (
            <div
              className={`rounded-3xl p-16 text-center border ${glassCard}`}
              style={glassStyle}
            >
              <Wallet
                className={`w-12 h-12 mx-auto mb-5 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}
              />
              <p
                className={`text-base mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Connect your wallet to view your dashboard.
              </p>
              <p
                className={`text-xs ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                Use the Connect button in the top-right corner.
              </p>
            </div>
          ) : loading ? (
            <div
              className={`text-center py-20 text-sm font-mono animate-pulse ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              Loading dashboard…
            </div>
          ) : error ? (
            <div
              className={`rounded-3xl p-16 text-center border ${glassCard}`}
              style={glassStyle}
            >
              <p
                className={`text-base ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                {error === '404' ? 'No data found for this wallet.' : `Error: ${error}`}
              </p>
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Summary stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  isDark={isDark}
                  icon={ShieldCheck}
                  label="Identity"
                  value={data.user.erc8004TokenId ? `#${data.user.erc8004TokenId}` : 'Not minted'}
                />
                <StatCard
                  isDark={isDark}
                  icon={Wallet}
                  label="KYA Level"
                  value={String(data.user.kyaLevel)}
                />
                <StatCard
                  isDark={isDark}
                  icon={DollarSign}
                  label={data.role === 'creator' ? 'Earnings' : 'Spent'}
                  value={`$${(data.role === 'creator' ? data.creator.totalEarnings : data.agent.totalSpent).toFixed(2)}`}
                />
                <StatCard
                  isDark={isDark}
                  icon={Activity}
                  label="Total calls"
                  value={String(data.role === 'creator' ? data.creator.callCount : data.agent.callCount)}
                />
              </div>

              {/* Creator skills */}
              {data.creator.skillCount > 0 && (
                <section
                  className={`rounded-3xl p-8 border transition-colors duration-700 ${glassCard}`}
                  style={glassStyle}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`text-[10px] font-bold uppercase tracking-[0.3em] ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}
                    >
                      Your skills · {data.creator.skillCount} created
                    </div>
                    <Link
                      href="/create"
                      className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] hover:opacity-70 transition-opacity ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      List new
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {data.creator.skills.map((skill) => (
                      <Link
                        key={skill.id}
                        href={`/skill/${skill.id}`}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all hover:opacity-80 ${
                          isDark
                            ? 'border-white/[0.04] bg-white/[0.02]'
                            : 'border-black/[0.04] bg-black/[0.02]'
                        }`}
                      >
                        <div className="flex items-baseline gap-3 min-w-0">
                          <span
                            className={`font-sans font-semibold text-base truncate ${
                              isDark ? 'text-white' : 'text-black'
                            }`}
                          >
                            {skill.name}
                          </span>
                          {skill.slug && (
                            <span
                              className={`font-mono text-[10px] tabular-nums ${
                                isDark ? 'text-gray-500' : 'text-gray-400'
                              }`}
                            >
                              /{skill.slug}
                            </span>
                          )}
                        </div>
                        <div
                          className={`font-mono text-xs tabular-nums shrink-0 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          {skill.sessionCount} sessions · ${skill.pricePerCall?.toFixed(2) ?? 'FREE'}/call
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Agents */}
              {data.agent.agents.length > 0 && (
                <section
                  className={`rounded-3xl p-8 border transition-colors duration-700 ${glassCard}`}
                  style={glassStyle}
                >
                  <div
                    className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-6 ${
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}
                  >
                    Your agents · {data.agent.agents.length} owned
                  </div>
                  <div className="space-y-2">
                    {data.agent.agents.map((agent) => (
                      <Link
                        key={agent.id}
                        href={`/agent/${agent.id}`}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all hover:opacity-80 ${
                          isDark
                            ? 'border-white/[0.04] bg-white/[0.02]'
                            : 'border-black/[0.04] bg-black/[0.02]'
                        }`}
                      >
                        <span
                          className={`font-sans font-semibold text-base ${
                            isDark ? 'text-white' : 'text-black'
                          }`}
                        >
                          {agent.name}
                        </span>
                        <div
                          className={`font-mono text-xs tabular-nums ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          Trust {agent.trustScore ?? '–'} · {agent.sessionCount} sessions
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Sessions */}
              <section
                className={`rounded-3xl p-8 border transition-colors duration-700 ${glassCard}`}
                style={glassStyle}
              >
                <div
                  className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-6 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}
                >
                  Recent sessions
                </div>
                <SessionTable
                  sessions={data.role === 'creator' ? data.creator.recentSessions : data.agent.recentSessions}
                  viewAs={data.role}
                  isDark={isDark}
                />
              </section>
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function StatCard({
  isDark,
  icon: Icon,
  label,
  value,
}: {
  isDark: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`rounded-2xl p-5 border transition-colors duration-700 ${
        isDark
          ? 'border-white/[0.06] bg-white/[0.03]'
          : 'border-black/[0.06] bg-white/60'
      }`}
      style={{
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon
          className={`w-4 h-4 ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}
        />
        <span
          className={`text-[9px] font-bold uppercase tracking-[0.2em] ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}
        >
          {label}
        </span>
      </div>
      <div
        className={`font-mono text-xl md:text-2xl font-bold tabular-nums ${
          isDark ? 'text-white' : 'text-black'
        }`}
      >
        {value}
      </div>
    </motion.div>
  );
}

function SessionTable({
  sessions,
  viewAs,
  isDark,
}: {
  sessions: SessionRow[];
  viewAs: 'creator' | 'agent';
  isDark: boolean;
}) {
  if (sessions.length === 0) {
    return (
      <p
        className={`text-sm text-center py-10 ${
          isDark ? 'text-gray-500' : 'text-gray-400'
        }`}
      >
        No sessions yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full font-mono text-xs">
        <thead>
          <tr
            className={`border-b ${
              isDark ? 'border-white/10' : 'border-black/10'
            }`}
          >
            <th
              className={`text-left py-3 px-3 font-semibold uppercase tracking-wider text-[10px] ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              Date
            </th>
            <th
              className={`text-left py-3 px-3 font-semibold uppercase tracking-wider text-[10px] ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              {viewAs === 'creator' ? 'Agent' : 'Skill'}
            </th>
            <th
              className={`text-right py-3 px-3 font-semibold uppercase tracking-wider text-[10px] ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              Calls
            </th>
            <th
              className={`text-right py-3 px-3 font-semibold uppercase tracking-wider text-[10px] ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              Budget
            </th>
            <th
              className={`text-right py-3 px-3 font-semibold uppercase tracking-wider text-[10px] ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              Spent
            </th>
            <th
              className={`text-left py-3 px-3 font-semibold uppercase tracking-wider text-[10px] ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              Status
            </th>
            <th
              className={`text-left py-3 px-3 font-semibold uppercase tracking-wider text-[10px] ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              Attestation
            </th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr
              key={s.id}
              className={`border-b ${
                isDark ? 'border-white/[0.04]' : 'border-black/[0.04]'
              }`}
            >
              <td
                className={`py-3 px-3 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                {new Date(s.openedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </td>
              <td
                className={`py-3 px-3 ${
                  isDark ? 'text-white' : 'text-black'
                }`}
              >
                {viewAs === 'creator' ? s.agent?.name ?? '–' : s.skill?.name ?? '–'}
              </td>
              <td
                className={`py-3 px-3 text-right tabular-nums ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                {s.callCount}
              </td>
              <td
                className={`py-3 px-3 text-right tabular-nums ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                ${s.budgetTotal.toFixed(2)}
              </td>
              <td
                className={`py-3 px-3 text-right tabular-nums ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                ${(s.budgetTotal - s.budgetRemaining).toFixed(2)}
              </td>
              <td className="py-3 px-3">
                <StatusPill status={s.status} isDark={isDark} />
              </td>
              <td
                className={`py-3 px-3 truncate max-w-[120px] ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                {s.basAttestationUid ? s.basAttestationUid.slice(0, 10) + '…' : '–'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusPill({ status, isDark }: { status: string; isDark: boolean }) {
  const styles: Record<string, { dot: string; text: string }> = {
    settled: { dot: 'bg-emerald-500', text: 'text-emerald-500' },
    refunded: { dot: 'bg-red-500', text: 'text-red-500' },
    active: { dot: 'bg-blue-500', text: 'text-blue-500' },
    funded: { dot: 'bg-amber-500', text: 'text-amber-500' },
  };
  const style = styles[status] ?? {
    dot: isDark ? 'bg-white/30' : 'bg-black/30',
    text: isDark ? 'text-gray-400' : 'text-gray-500',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${style.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}
