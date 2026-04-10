'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Shield, TrendingUp } from 'lucide-react';
import { useDarkMode } from '@/app/DarkModeContext';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { BackgroundEffect } from '@/components/landing/BackgroundEffect';

interface Skill {
  id: string;
  name: string;
  description: string | null;
  pricePerCall: number | null;
  category: string | null;
  gatewaySlug: string | null;
  callCount?: number;
  trustScore?: number;
}

export default function DojoPage() {
  const { isDark } = useDarkMode();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/skills?limit=20')
      .then((r) => r.json())
      .then((data) => setSkills(data.skills || []))
      .catch(() => setSkills([]))
      .finally(() => setLoading(false));
  }, []);

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

      {/* Hero */}
      <section className="relative pt-40 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-16"
          >
            <div
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border mb-8 ${
                isDark
                  ? 'border-white/10 bg-white/5 text-gray-400'
                  : 'border-black/10 bg-white/60 text-gray-500'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              The skill marketplace for AI agents
            </div>

            <h1
              className={`font-sans font-semibold text-5xl md:text-7xl lg:text-8xl tracking-[-0.04em] leading-[0.95] mb-8 ${
                isDark ? 'text-white' : 'text-black'
              }`}
            >
              Equip your agent.
              <br />
              <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                Earn on-chain.
              </span>
            </h1>

            <p
              className={`max-w-2xl mx-auto text-lg md:text-xl leading-relaxed mb-10 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              Every skill on the Dojo has a public trust score built from real on-chain settlements.
              Pay per call. Settle on BSC. No subscriptions, no guessing.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/create"
                className={`group inline-flex items-center gap-2 px-7 py-4 rounded-full text-sm font-bold uppercase tracking-[0.15em] transition-all hover:opacity-90 shadow-xl ${
                  isDark ? 'bg-white text-black' : 'bg-black text-white'
                }`}
              >
                List a skill
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/demo"
                className={`inline-flex items-center gap-2 px-7 py-4 rounded-full text-sm font-bold uppercase tracking-[0.15em] border transition-all hover:opacity-70 ${
                  isDark
                    ? 'border-white/15 bg-white/5 text-white'
                    : 'border-black/10 bg-white/60 text-black'
                }`}
              >
                Try the demo
              </Link>
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto"
          >
            {[
              { label: 'Skills listed', value: skills.length || '—' },
              { label: 'Trust layer', value: 'BAS · BSC' },
              { label: 'Settlement', value: 'ERC-8183' },
              { label: 'Take rate', value: '5%' },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`liquid-glass-card rounded-2xl p-5 text-center border transition-colors duration-700 ${
                  isDark
                    ? 'border-white/[0.06] bg-white/[0.03]'
                    : 'border-black/[0.06] bg-white/60'
                }`}
                style={{
                  backdropFilter: 'blur(40px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                }}
              >
                <div
                  className={`font-mono text-xl md:text-2xl font-bold tabular-nums ${
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
          </motion.div>
        </div>
      </section>

      {/* Skills Bento */}
      <section className="relative px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div
                className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-3 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                Marketplace
              </div>
              <h2
                className={`font-sans font-semibold text-3xl md:text-4xl tracking-[-0.02em] ${
                  isDark ? 'text-white' : 'text-black'
                }`}
              >
                Skills your agent can trust
              </h2>
            </div>
            <Link
              href="/leaderboard"
              className={`hidden md:inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] hover:opacity-70 transition-opacity ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              View leaderboard
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div
              className={`text-center py-20 text-sm font-mono animate-pulse ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              Loading skills…
            </div>
          ) : skills.length === 0 ? (
            <div
              className={`liquid-glass-card rounded-3xl p-16 text-center border ${
                isDark
                  ? 'border-white/[0.06] bg-white/[0.03]'
                  : 'border-black/[0.06] bg-white/60'
              }`}
              style={{
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              }}
            >
              <p
                className={`text-base mb-6 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                No skills listed yet. Be the first creator on the Dojo.
              </p>
              <Link
                href="/create"
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] transition-all hover:opacity-90 ${
                  isDark ? 'bg-white text-black' : 'bg-black text-white'
                }`}
              >
                List a skill
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skills.map((skill, i) => (
                <SkillCard key={skill.id} skill={skill} index={i} isDark={isDark} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works Bento */}
      <section className="relative px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div
              className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-3 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              How it works
            </div>
            <h2
              className={`font-sans font-semibold text-3xl md:text-5xl tracking-[-0.02em] ${
                isDark ? 'text-white' : 'text-black'
              }`}
            >
              Four steps. On-chain.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: '01',
                icon: Sparkles,
                title: 'Pick a skill',
                desc: 'Browse skills rated by on-chain trust scores from real settlements.',
              },
              {
                step: '02',
                icon: Zap,
                title: 'Agent pays',
                desc: 'USDC locks in ERC-8183 escrow on BSC. No middleman, no subscriptions.',
              },
              {
                step: '03',
                icon: Shield,
                title: 'Get the result',
                desc: 'Dojo proxies the request to the creator endpoint and returns the answer.',
              },
              {
                step: '04',
                icon: TrendingUp,
                title: 'Trust grows',
                desc: 'Score updates on-chain via BAS attestation after every session.',
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  className={`liquid-glass-card rounded-3xl p-7 border transition-colors duration-700 hover-lift ${
                    isDark
                      ? 'border-white/[0.06] bg-white/[0.03]'
                      : 'border-black/[0.06] bg-white/60'
                  }`}
                  style={{
                    backdropFilter: 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                  }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white'
                          : 'bg-black/5 border-black/10 text-black'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`font-mono text-xs font-bold ${
                        isDark ? 'text-gray-600' : 'text-gray-300'
                      }`}
                    >
                      {item.step}
                    </span>
                  </div>
                  <h3
                    className={`font-sans font-semibold text-lg mb-2 ${
                      isDark ? 'text-white' : 'text-black'
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p
                    className={`text-sm leading-relaxed ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    {item.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <div
            className={`liquid-glass-card rounded-[32px] p-12 md:p-16 text-center border transition-colors duration-700 ${
              isDark
                ? 'border-white/[0.08] bg-white/[0.04]'
                : 'border-black/[0.08] bg-white/70'
            }`}
            style={{
              backdropFilter: 'blur(60px) saturate(180%)',
              WebkitBackdropFilter: 'blur(60px) saturate(180%)',
            }}
          >
            <h2
              className={`font-sans font-semibold text-3xl md:text-5xl tracking-[-0.02em] mb-5 ${
                isDark ? 'text-white' : 'text-black'
              }`}
            >
              Trust, not promises.
            </h2>
            <p
              className={`text-base md:text-lg max-w-xl mx-auto mb-10 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              The dispatch of AI agent skills, settled on-chain. Equip your agent today.
            </p>
            <Link
              href="/create"
              className={`group inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-bold uppercase tracking-[0.15em] transition-all hover:opacity-90 shadow-xl ${
                isDark ? 'bg-white text-black' : 'bg-black text-white'
              }`}
            >
              Start now
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function SkillCard({
  skill,
  index,
  isDark,
}: {
  skill: Skill;
  index: number;
  isDark: boolean;
}) {
  const trustScore = skill.trustScore ?? 0;
  const callCount = skill.callCount ?? 0;
  const price = skill.pricePerCall ? `$${skill.pricePerCall.toFixed(2)}` : 'FREE';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.04 }}
    >
      <Link
        href={`/skill/${skill.id}`}
        className={`group block liquid-glass-card rounded-2xl p-6 border transition-all duration-500 hover-lift no-underline h-full ${
          isDark
            ? 'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05]'
            : 'border-black/[0.06] bg-white/60 hover:bg-white/80'
        }`}
        style={{
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        }}
      >
        <div className="flex items-start justify-between mb-4">
          {skill.category && (
            <span
              className={`text-[9px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border ${
                isDark
                  ? 'border-white/10 text-gray-400'
                  : 'border-black/10 text-gray-500'
              }`}
            >
              {skill.category}
            </span>
          )}
          <span
            className={`font-mono text-xs font-bold tabular-nums ${
              isDark ? 'text-white' : 'text-black'
            }`}
          >
            {price}
            <span
              className={`text-[10px] font-normal ml-0.5 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              /call
            </span>
          </span>
        </div>

        <h3
          className={`font-sans font-semibold text-xl tracking-tight mb-2 transition-colors ${
            isDark ? 'text-white' : 'text-black'
          }`}
        >
          {skill.name}
        </h3>

        {skill.description && (
          <p
            className={`text-sm leading-relaxed mb-5 line-clamp-2 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            {skill.description}
          </p>
        )}

        <div
          className={`flex items-center justify-between pt-4 border-t ${
            isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
          }`}
        >
          <TrustMeter score={trustScore} isDark={isDark} />
          <span
            className={`font-mono text-[10px] tabular-nums ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}
          >
            {callCount.toLocaleString()} calls
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function TrustMeter({ score, isDark }: { score: number; isDark: boolean }) {
  const clamped = Math.min(100, Math.max(0, score));
  const filled = Math.round(clamped / 10);
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-[2px]">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`w-[3px] h-3 rounded-full transition-colors ${
              i < filled
                ? isDark
                  ? 'bg-emerald-400'
                  : 'bg-emerald-500'
                : isDark
                ? 'bg-white/10'
                : 'bg-black/10'
            }`}
          />
        ))}
      </div>
      <span
        className={`font-mono text-[10px] tabular-nums ${
          isDark ? 'text-gray-500' : 'text-gray-400'
        }`}
      >
        {clamped}
      </span>
    </div>
  );
}
