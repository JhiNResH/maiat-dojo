'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Copy,
  DollarSign,
  Layers,
  Star,
  TrendingUp,
} from 'lucide-react';
import { useDarkMode } from '@/app/DarkModeContext';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { BackgroundEffect } from '@/components/landing/BackgroundEffect';
import CopyBuildModal from '@/components/CopyBuildModal';
import ReviewForm from '@/components/ReviewForm';

interface SkillData {
  id: string;
  name: string;
  icon: string;
  category: string;
  rating: number;
  installs: number;
  price: number;
}

interface JobData {
  id: string;
  title: string;
  description: string;
  status: string;
  payment: number;
  currency: string;
  rating: number | null;
}

interface ReviewData {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { displayName: string | null };
}

interface AgentData {
  id: string;
  name: string;
  avatar: string;
  description: string;
  rank: string;
  successRate: number;
  jobsCompleted: number;
  totalEarnings: number;
  earningsCurrency: string;
  owner: { displayName: string | null };
}

interface Props {
  agent: AgentData;
  skills: SkillData[];
  jobs: JobData[];
  reviews: ReviewData[];
  avgRating: number;
}

const STATUS_COLORS: Record<string, { dot: string; label: string }> = {
  completed: { dot: 'bg-emerald-500', label: 'text-emerald-500' },
  'in-progress': { dot: 'bg-amber-500', label: 'text-amber-500' },
  open: { dot: 'bg-blue-500', label: 'text-blue-500' },
  rejected: { dot: 'bg-red-500', label: 'text-red-500' },
};

export default function AgentPageClient({
  agent,
  skills,
  jobs,
  reviews,
  avgRating,
}: Props) {
  const { isDark } = useDarkMode();
  const [showCopyModal, setShowCopyModal] = useState(false);

  const glassCard = isDark
    ? 'border-white/[0.06] bg-white/[0.03]'
    : 'border-black/[0.06] bg-white/60';

  const glassStyle = {
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
  } as const;

  const stats = [
    { label: 'Jobs done', value: agent.jobsCompleted.toLocaleString(), icon: CheckCircle2 },
    { label: 'Success rate', value: `${agent.successRate}%`, icon: TrendingUp },
    {
      label: 'Earnings',
      value: `${agent.totalEarnings} ${agent.earningsCurrency}`,
      icon: DollarSign,
    },
    { label: 'Rating', value: avgRating > 0 ? avgRating.toFixed(1) : '—', icon: Star },
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
          <header className="flex items-start gap-6 mb-8">
            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl border ${
                isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white/60'
              }`}
              style={glassStyle}
            >
              {agent.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <span
                className={`inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border mb-3 ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-gray-400'
                    : 'border-black/10 bg-white/60 text-gray-500'
                }`}
              >
                <Award className="w-3 h-3" />
                {agent.rank}
              </span>
              <h1
                className={`font-sans font-semibold text-4xl md:text-6xl tracking-[-0.03em] leading-[0.95] mb-3 ${
                  isDark ? 'text-white' : 'text-black'
                }`}
              >
                {agent.name}
              </h1>
              <p
                className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                Owned by{' '}
                <span className={isDark ? 'text-white' : 'text-black'}>
                  {agent.owner.displayName || 'Anonymous'}
                </span>
              </p>
            </div>
          </header>

          {agent.description && (
            <p
              className={`text-base leading-relaxed max-w-2xl mb-12 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {agent.description}
            </p>
          )}

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
                  <Icon
                    className={`w-3.5 h-3.5 mb-3 ${
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}
                  />
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

          {/* Equipped build */}
          <section
            className={`rounded-3xl p-8 border mb-6 ${glassCard}`}
            style={glassStyle}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Layers
                  className={`w-3.5 h-3.5 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}
                />
                <div
                  className={`text-[10px] font-bold uppercase tracking-[0.3em] ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}
                >
                  Equipped build · {skills.length}
                </div>
              </div>

              {skills.length > 0 && (
                <button
                  onClick={() => setShowCopyModal(true)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] transition-all hover:scale-[1.02] ${
                    isDark ? 'bg-white text-black' : 'bg-black text-white'
                  }`}
                >
                  <Copy className="w-3 h-3" />
                  Copy build
                </button>
              )}
            </div>

            {skills.length === 0 ? (
              <p
                className={`text-sm italic ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                No skills equipped yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {skills.map((skill, i) => (
                  <motion.div
                    key={skill.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.03 }}
                  >
                    <Link
                      href={`/skill/${skill.id}`}
                      className={`block rounded-2xl p-4 border transition-all hover:scale-[1.02] ${
                        isDark
                          ? 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                          : 'border-black/[0.06] bg-white/40 hover:bg-white/70'
                      }`}
                    >
                      <div className="text-2xl mb-2">{skill.icon}</div>
                      <div
                        className={`font-sans font-semibold text-xs truncate ${
                          isDark ? 'text-white' : 'text-black'
                        }`}
                      >
                        {skill.name}
                      </div>
                      <div
                        className={`text-[9px] font-bold uppercase tracking-[0.15em] mt-1 ${
                          isDark ? 'text-gray-500' : 'text-gray-400'
                        }`}
                      >
                        {skill.category}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Job history */}
          {jobs.length > 0 && (
            <section
              className={`rounded-3xl p-8 border mb-6 ${glassCard}`}
              style={glassStyle}
            >
              <div
                className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-6 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                Job history
              </div>
              <div className="space-y-3">
                {jobs.map((job) => {
                  const status = STATUS_COLORS[job.status] || {
                    dot: 'bg-gray-400',
                    label: 'text-gray-400',
                  };
                  return (
                    <div
                      key={job.id}
                      className={`flex items-center justify-between gap-4 py-3 border-b last:border-b-0 ${
                        isDark ? 'border-white/[0.04]' : 'border-black/[0.04]'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-sans font-semibold text-sm truncate ${
                            isDark ? 'text-white' : 'text-black'
                          }`}
                        >
                          {job.title}
                        </div>
                        <div
                          className={`text-xs truncate mt-0.5 ${
                            isDark ? 'text-gray-500' : 'text-gray-400'
                          }`}
                        >
                          {job.description}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          <span
                            className={`text-[10px] font-bold uppercase tracking-[0.15em] ${status.label}`}
                          >
                            {job.status}
                          </span>
                        </div>
                        <div
                          className={`font-mono text-xs tabular-nums ${
                            isDark ? 'text-white' : 'text-black'
                          }`}
                        >
                          {job.payment} {job.currency}
                        </div>
                        {job.rating && (
                          <div className="text-amber-500 text-xs font-mono tabular-nums">
                            {'★'.repeat(job.rating)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Reviews */}
          <section
            className={`rounded-3xl p-8 border ${glassCard}`}
            style={glassStyle}
          >
            <div
              className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-6 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              Reputation reviews · {reviews.length}
            </div>

            {reviews.length === 0 ? (
              <p
                className={`text-sm italic ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                No reviews yet.
              </p>
            ) : (
              <div className="space-y-5">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className={`pb-5 border-b last:border-b-0 ${
                      isDark ? 'border-white/[0.04]' : 'border-black/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-amber-500 text-xs font-mono">
                          {'★'.repeat(review.rating)}
                          <span className={isDark ? 'text-gray-700' : 'text-gray-300'}>
                            {'★'.repeat(5 - review.rating)}
                          </span>
                        </span>
                        <span
                          className={`text-xs ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          {review.user.displayName || 'Anonymous'}
                        </span>
                      </div>
                      <span
                        className={`font-mono text-[10px] tabular-nums ${
                          isDark ? 'text-gray-600' : 'text-gray-400'
                        }`}
                      >
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p
                      className={`text-sm leading-relaxed ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6">
              <ReviewForm targetType="agent" targetId={agent.id} />
            </div>
          </section>
        </div>
      </main>

      <Footer />

      {showCopyModal && (
        <CopyBuildModal
          agentName={agent.name}
          skills={skills}
          onClose={() => setShowCopyModal(false)}
        />
      )}
    </div>
  );
}
