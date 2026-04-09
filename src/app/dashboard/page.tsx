"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";

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
  role: "creator" | "agent";
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
  const { ready, authenticated, user } = usePrivy();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !authenticated || !user?.wallet?.address) {
      setLoading(false);
      return;
    }
    fetch(`/api/dashboard/stats?walletAddress=${user.wallet.address}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ready, authenticated, user]);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-[#f0ece2]">
      <div className="max-w-4xl mx-auto px-6 py-8 page-container">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#1a1a1a]/30 hover:text-[#1a1a1a] transition-colors">
              &larr; Back to Dojo
            </Link>
          </div>
          <div className="masthead-rule mb-2" />
          <div className="text-center py-3">
            <h1 className="font-serif font-black text-5xl tracking-tight text-[#1a1a1a] leading-none">
              DASHBOARD
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#1a1a1a]/40 mt-2">
              Session History &middot; Earnings &middot; Trust
            </p>
          </div>
          <div className="masthead-rule" />
        </header>

        {!authenticated ? (
          <div className="text-center py-16">
            <p className="font-serif italic text-lg text-[#1a1a1a]/30">
              Connect your wallet to view your dashboard.
            </p>
          </div>
        ) : loading ? (
          <p className="font-mono text-xs text-[#1a1a1a]/40 text-center py-12 animate-pulse">
            Loading dashboard...
          </p>
        ) : error ? (
          <div className="text-center py-16">
            <p className="font-serif italic text-lg text-[#1a1a1a]/30">
              {error === "404" ? "No data found for this wallet." : `Error: ${error}`}
            </p>
          </div>
        ) : data ? (
          <>
            {/* Summary Stats */}
            <section className="mb-10">
              <div className="section-header">
                <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#1a1a1a]/60">
                  Summary
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
                <StatCard label="Identity" value={data.user.erc8004TokenId ? `#${data.user.erc8004TokenId}` : "Not minted"} />
                <StatCard label="KYA Level" value={String(data.user.kyaLevel)} />
                <StatCard
                  label={data.role === "creator" ? "Earnings" : "Spent"}
                  value={`$${(data.role === "creator" ? data.creator.totalEarnings : data.agent.totalSpent).toFixed(2)}`}
                />
                <StatCard
                  label="Total Calls"
                  value={String(data.role === "creator" ? data.creator.callCount : data.agent.callCount)}
                />
              </div>
            </section>

            {/* Creator View */}
            {data.creator.skillCount > 0 && (
              <section className="mb-10">
                <div className="section-header">
                  <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#1a1a1a]/60">
                    Your Skills
                  </span>
                  <span className="font-mono text-[10px] text-[#1a1a1a]/30">
                    {data.creator.skillCount} created
                  </span>
                </div>
                <div className="mt-2">
                  {data.creator.skills.map((skill) => (
                    <div key={skill.id} className="flex justify-between py-2 border-b border-dotted border-[#1a1a1a]/15">
                      <div>
                        <span className="font-serif font-bold text-sm">{skill.name}</span>
                        {skill.slug && (
                          <span className="font-mono text-[10px] text-[#1a1a1a]/30 ml-2">/{skill.slug}</span>
                        )}
                      </div>
                      <div className="font-mono text-xs text-[#1a1a1a]/50">
                        {skill.sessionCount} sessions &middot; ${skill.pricePerCall?.toFixed(2) ?? "FREE"}/call
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Agent View */}
            {data.agent.agents.length > 0 && (
              <section className="mb-10">
                <div className="section-header">
                  <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#1a1a1a]/60">
                    Your Agents
                  </span>
                  <span className="font-mono text-[10px] text-[#1a1a1a]/30">
                    {data.agent.agents.length} owned
                  </span>
                </div>
                <div className="mt-2">
                  {data.agent.agents.map((agent) => (
                    <div key={agent.id} className="flex justify-between py-2 border-b border-dotted border-[#1a1a1a]/15">
                      <Link href={`/agent/${agent.id}`} className="font-serif font-bold text-sm hover:underline">
                        {agent.name}
                      </Link>
                      <div className="font-mono text-xs text-[#1a1a1a]/50">
                        Trust: {agent.trustScore ?? "–"} &middot; {agent.sessionCount} sessions
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Sessions Table */}
            <section className="mb-10">
              <div className="section-header">
                <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#1a1a1a]/60">
                  Recent Sessions
                </span>
              </div>
              <SessionTable
                sessions={data.role === "creator" ? data.creator.recentSessions : data.agent.recentSessions}
                viewAs={data.role}
              />
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="classified" data-label={label}>
      <p className="font-mono text-lg font-bold text-[#1a1a1a] mt-1">{value}</p>
    </div>
  );
}

function SessionTable({ sessions, viewAs }: { sessions: SessionRow[]; viewAs: "creator" | "agent" }) {
  if (sessions.length === 0) {
    return (
      <p className="font-serif italic text-sm text-[#1a1a1a]/30 text-center py-8">
        No sessions yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto mt-3">
      <table className="w-full font-mono text-xs">
        <thead>
          <tr className="border-b-2 border-[#1a1a1a]">
            <th className="text-left py-2 pr-3">Date</th>
            <th className="text-left py-2 pr-3">{viewAs === "creator" ? "Agent" : "Skill"}</th>
            <th className="text-right py-2 pr-3">Calls</th>
            <th className="text-right py-2 pr-3">Budget</th>
            <th className="text-right py-2 pr-3">Spent</th>
            <th className="text-left py-2 pr-3">Status</th>
            <th className="text-left py-2">Attestation</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id} className="border-b border-dotted border-[#1a1a1a]/15">
              <td className="py-2 pr-3 text-[#1a1a1a]/50">
                {new Date(s.openedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </td>
              <td className="py-2 pr-3">
                {viewAs === "creator" ? s.agent?.name ?? "–" : s.skill?.name ?? "–"}
              </td>
              <td className="py-2 pr-3 text-right">{s.callCount}</td>
              <td className="py-2 pr-3 text-right">${s.budgetTotal.toFixed(2)}</td>
              <td className="py-2 pr-3 text-right">${(s.budgetTotal - s.budgetRemaining).toFixed(2)}</td>
              <td className="py-2 pr-3">
                <StatusBadge status={s.status} />
              </td>
              <td className="py-2 text-[#1a1a1a]/30 truncate max-w-[100px]">
                {s.basAttestationUid ? s.basAttestationUid.slice(0, 10) + "..." : "–"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    settled: "text-green-800 bg-green-100",
    refunded: "text-red-800 bg-red-100",
    active: "text-blue-800 bg-blue-100",
    funded: "text-yellow-800 bg-yellow-100",
  };
  return (
    <span className={`px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${colors[status] ?? "text-[#1a1a1a]/50 bg-[#1a1a1a]/5"}`}>
      {status}
    </span>
  );
}
