'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, DollarSign, ShieldCheck, Star, TrendingUp } from 'lucide-react';
import { useDarkMode } from '@/app/DarkModeContext';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { BackgroundEffect } from '@/components/landing/BackgroundEffect';

interface SkillSummary {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  icon: string | null;
  price: number;
  rating: number;
  installs: number;
}

interface Props {
  creator: {
    id: string;
    displayName: string | null;
    walletAddress: string | null;
    memberSince: string;
    skills: SkillSummary[];
  };
  totalSales: number;
  avgRating: number;
  totalRevenue: number;
  refundRate: number;
}

function truncateAddress(address: string | null | undefined): string {
  if (!address) return '—';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function CreatorPageClient({
  creator,
  totalSales,
  avgRating,
  totalRevenue,
  refundRate,
}: Props) {
  const { isDark } = useDarkMode();

  const glassCard = isDark
    ? 'border-white/[0.06] bg-white/[0.03]'
    : 'border-black/[0.06] bg-white/60';

  const glassStyle = {
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
  } as const;

  const stats = [
    { label: 'Total sales', value: totalSales.toLocaleString(), icon: TrendingUp },
    { label: 'Avg rating', value: avgRating > 0 ? avgRating.toFixed(1) : '—', icon: Star },
    { label: 'Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign },
    { label: 'Refund rate', value: `${refundRate.toFixed(1)}%`, icon: ShieldCheck },
  ];

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
          <header className="flex items-start gap-6 mb-12">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
              style={{
                backgroundColor: `hsl(${
                  ((creator.id?.charCodeAt(0) ?? 0) * 37) % 360
                }, 60%, 50%)`,
              }}
            >
              {(creator.displayName || '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <span
                className={`inline-block text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border mb-3 ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-gray-400'
                    : 'border-black/10 bg-white/60 text-gray-500'
                }`}
              >
                Creator profile
              </span>
              <h1
                className={`font-sans font-semibold text-4xl md:text-6xl tracking-[-0.03em] leading-[0.95] mb-3 ${
                  isDark ? 'text-white' : 'text-black'
                }`}
              >
                {creator.displayName || 'Anonymous'}
              </h1>
              <div
                className={`flex items-center gap-3 text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                <span className="font-mono tabular-nums">
                  {truncateAddress(creator.walletAddress)}
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Since {creator.memberSince}
                </span>
              </div>
            </div>
          </header>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className={`rounded-2xl p-5 border ${glassCard}`}
                  style={glassStyle}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}
                    />
                  </div>
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
                </motion.div>
              );
            })}
          </div>

          {/* Skills section */}
          <section
            className={`rounded-3xl p-8 border ${glassCard}`}
            style={glassStyle}
          >
            <div className="flex items-center justify-between mb-6">
              <div
                className={`text-[10px] font-bold uppercase tracking-[0.3em] ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                Published skills
              </div>
              <div
                className={`font-mono text-xs tabular-nums ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                {creator.skills.length}
              </div>
            </div>

            {creator.skills.length === 0 ? (
              <p
                className={`text-sm italic ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                No skills published yet.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {creator.skills.map((skill, i) => (
                  <motion.div
                    key={skill.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.03 }}
                  >
                    <Link
                      href={`/skill/${skill.id}`}
                      className={`group block rounded-2xl p-5 border transition-all hover:scale-[1.01] ${
                        isDark
                          ? 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                          : 'border-black/[0.06] bg-white/40 hover:bg-white/70'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-2xl">{skill.icon || '⚡'}</span>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`font-sans font-semibold text-sm truncate ${
                              isDark ? 'text-white' : 'text-black'
                            }`}
                          >
                            {skill.name}
                          </div>
                          <div
                            className={`text-[9px] font-bold uppercase tracking-[0.15em] mt-0.5 ${
                              isDark ? 'text-gray-500' : 'text-gray-400'
                            }`}
                          >
                            {skill.category || 'Uncategorized'}
                          </div>
                        </div>
                      </div>
                      <p
                        className={`text-xs leading-relaxed line-clamp-2 mb-4 ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        {skill.description || '—'}
                      </p>
                      <div
                        className={`flex items-center justify-between pt-3 border-t ${
                          isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
                        }`}
                      >
                        <div
                          className={`font-mono text-[10px] tabular-nums ${
                            isDark ? 'text-gray-500' : 'text-gray-400'
                          }`}
                        >
                          {skill.installs.toLocaleString()} installs
                        </div>
                        <div
                          className={`font-mono text-xs font-bold tabular-nums ${
                            skill.price === 0
                              ? 'text-emerald-500'
                              : isDark
                              ? 'text-white'
                              : 'text-black'
                          }`}
                        >
                          {skill.price === 0 ? 'FREE' : `$${skill.price.toFixed(2)}`}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
