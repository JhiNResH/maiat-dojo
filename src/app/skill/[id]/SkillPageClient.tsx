'use client';

import Link from 'next/link';
import { ArrowLeft, Calendar, Network, ShieldCheck, Tag, Wallet, Zap } from 'lucide-react';
import { useDarkMode } from '@/app/DarkModeContext';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { BackgroundEffect } from '@/components/landing/BackgroundEffect';
import PurchaseCard from '@/components/PurchaseCard';
import TrustCard from '@/components/TrustCard';

interface SkillData {
  id: string;
  name: string;
  description: string | null;
  longDescription: string | null;
  category: string | null;
  pricePerCall: number | null;
  price: number;
  skillType: string;
  gatewaySlug: string | null;
  fileContent: string | null;
  evaluationScore: number | null;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    displayName: string | null;
    walletAddress: string | null;
    erc8004TokenId: string | null;
  };
}

interface Attestation {
  sessionId: string;
  status: 'settled' | 'refunded';
  uid: string;
  settledAt: string | null;
}

interface HeatmapBucket {
  date: string;
  count: number;
}

interface Props {
  skill: SkillData;
  totalCalls: number;
  totalSessions: number;
  passRate: number;
  passedSessions: number;
  failedSessions: number;
  sparkline: number[];
  medianLatencyMs: number | null;
  heatmap: HeatmapBucket[];
  attestations: Attestation[];
}

function truncateAddress(address: string | null | undefined): string {
  if (!address) return '—';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export default function SkillPageClient({
  skill,
  totalCalls,
  totalSessions,
  passedSessions,
  failedSessions,
  sparkline,
  medianLatencyMs,
  heatmap,
  attestations,
}: Props) {
  const { isDark } = useDarkMode();
  const trustScore = skill.evaluationScore ?? 0;

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
          <Link
            href="/"
            className={`inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] mb-10 transition-opacity hover:opacity-70 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            <ArrowLeft className="w-3 h-3" />
            Back to marketplace
          </Link>

          {/* Header */}
          <header className="mb-12">
            {skill.category && (
              <span
                className={`inline-block text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border mb-5 ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-gray-400'
                    : 'border-black/10 bg-white/60 text-gray-500'
                }`}
              >
                {skill.category}
              </span>
            )}
            <h1
              className={`font-sans font-semibold text-4xl md:text-6xl tracking-[-0.03em] leading-[0.95] mb-5 ${
                isDark ? 'text-white' : 'text-black'
              }`}
            >
              {skill.name}
            </h1>
            <div
              className={`flex items-center gap-2 text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              <span>by</span>
              <span className={isDark ? 'text-white' : 'text-black'}>
                {skill.creator.displayName || truncateAddress(skill.creator.walletAddress)}
              </span>
              <span>·</span>
              <span>Listed {formatDate(skill.createdAt)}</span>
            </div>
          </header>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
            {[
              {
                label: 'Per call',
                value: skill.pricePerCall ? `$${skill.pricePerCall.toFixed(2)}` : 'FREE',
              },
              { label: 'Total calls', value: totalCalls.toLocaleString() },
              { label: 'Sessions', value: totalSessions.toLocaleString() },
              { label: 'Trust score', value: trustScore.toString() },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`rounded-2xl p-5 border transition-colors duration-700 ${glassCard}`}
                style={glassStyle}
              >
                <div
                  className={`font-mono text-2xl font-bold tabular-nums ${
                    isDark ? 'text-white' : 'text-black'
                  }`}
                >
                  {stat.value}
                </div>
                <div
                  className={`text-[9px] font-bold uppercase tracking-[0.2em] mt-1 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
            {/* Left column */}
            <div className="space-y-6">
              <section
                className={`rounded-3xl p-8 border transition-colors duration-700 ${glassCard}`}
                style={glassStyle}
              >
                <div
                  className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-5 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}
                >
                  About this skill
                </div>
                <div
                  className={`text-base leading-relaxed space-y-4 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {(skill.longDescription || skill.description || 'No description provided.')
                    .split('\n\n')
                    .map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                </div>
              </section>

              {/* Flagship: trust dossier */}
              <TrustCard
                trustScore={trustScore}
                passedSessions={passedSessions}
                failedSessions={failedSessions}
                totalSessions={totalSessions}
                medianLatencyMs={medianLatencyMs}
                sparkline={sparkline}
                heatmap={heatmap}
                attestations={attestations}
                creator={{
                  displayName: skill.creator.displayName,
                  walletAddress: skill.creator.walletAddress,
                  erc8004TokenId: skill.creator.erc8004TokenId,
                }}
              />
            </div>

            {/* Right sidebar */}
            <aside className="space-y-6">
              <PurchaseCard
                skill={{
                  id: skill.id,
                  name: skill.name,
                  skillType: skill.skillType,
                  price: skill.price,
                  pricePerCall: skill.pricePerCall,
                  gatewaySlug: skill.gatewaySlug,
                  fileContent: skill.fileContent,
                }}
              />

              <div
                className={`rounded-3xl p-7 border transition-colors duration-700 ${glassCard}`}
                style={glassStyle}
              >
                <div
                  className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-5 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}
                >
                  Specification
                </div>
                <div className="space-y-3">
                  {[
                    { icon: Network, label: 'Network', value: 'BNB Smart Chain' },
                    { icon: ShieldCheck, label: 'Settlement', value: 'ERC-8183' },
                    { icon: Wallet, label: 'Payment', value: 'USDC per call' },
                    { icon: Tag, label: 'Category', value: skill.category || '—' },
                    { icon: Calendar, label: 'Listed', value: formatDate(skill.createdAt) },
                    { icon: Zap, label: 'Updated', value: formatDate(skill.updatedAt) },
                  ].map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between"
                    >
                      <div
                        className={`flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider ${
                          isDark ? 'text-gray-500' : 'text-gray-400'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {label}
                      </div>
                      <span
                        className={`font-mono text-xs font-semibold tabular-nums ${
                          isDark ? 'text-white' : 'text-black'
                        }`}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className={`rounded-3xl p-7 border transition-colors duration-700 ${glassCard}`}
                style={glassStyle}
              >
                <div
                  className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-5 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}
                >
                  Creator
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{
                      backgroundColor: `hsl(${
                        ((skill.creator.id?.charCodeAt(0) ?? 0) * 37) % 360
                      }, 60%, 50%)`,
                    }}
                  >
                    {(skill.creator.displayName || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div
                      className={`font-sans font-semibold text-sm truncate ${
                        isDark ? 'text-white' : 'text-black'
                      }`}
                    >
                      {skill.creator.displayName || 'Anonymous'}
                    </div>
                    <div
                      className={`font-mono text-[10px] tabular-nums ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}
                    >
                      {truncateAddress(skill.creator.walletAddress)}
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
