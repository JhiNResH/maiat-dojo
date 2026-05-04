'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, GitFork, Sparkles, Trophy, TrendingUp, Users } from 'lucide-react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { BackgroundEffect } from '@/components/landing/BackgroundEffect';
import { DojoSpirit } from '@/components/DojoSpirit';
import type { WorkflowSpiritProfile } from '@/lib/workflow-spirit';

type Skill = {
  id: string;
  name: string;
  icon: string;
  category: string;
  installs: number;
  rating: number;
  price: number;
  creator: {
    id: string;
    displayName: string | null;
  };
};

type SpiritRank = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  runs: number;
  forks: number;
  trust_score: number;
  price_per_run: number;
  royalty_bps: number;
  creator: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  spirit: WorkflowSpiritProfile;
};

type Creator = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalSales: number;
  totalRevenue: number;
  avgRating: number;
  skillCount: number;
};

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'spirits' | 'skills' | 'creators'>('spirits');
  const [spirits, setSpirits] = useState<SpiritRank[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'spirits') {
          const res = await fetch('/api/leaderboard?type=spirits&limit=50');
          const data = await res.json();
          setSpirits(data.spirits || []);
        } else if (activeTab === 'skills') {
          const res = await fetch('/api/skills?sort=popular&limit=50');
          const data = await res.json();
          setSkills(data.skills || []);
        } else {
          const res = await fetch('/api/leaderboard?type=creators&limit=50');
          const data = await res.json();
          setCreators(data.creators || []);
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard data:', err);
      }
      setLoading(false);
    };
    fetchData();
  }, [activeTab]);

  const glassCard = 'border border-[var(--border)] bg-[var(--card-bg)]';

  const glassStyle = {
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
  } as const;

  const headerCellClass = 'text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]';

  const rowDivider = 'border-[var(--border)]';

  const formatPassRate = (value: number) => {
    const normalized = value > 1 ? value : value * 100;
    return `${Math.round(Math.max(0, Math.min(100, normalized)))}%`;
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-700">
      <BackgroundEffect />
      <Navbar />

      <main className="dojo-page-shell">
        <div>
          <Link
            href="/"
            className="dojo-back-link"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to marketplace
          </Link>

          {/* Header */}
          <header className="dojo-page-header">
            <div className="dojo-page-kicker">
              <Trophy className="w-3 h-3" />
              <span>Leaderboard</span>
            </div>
            <h1 className="dojo-page-title">
              Spirits earn rank.
            </h1>
            <p className="dojo-page-subtitle">
              Workflow spirits rank by cleared receipts, evaluator pass rate, fork lineage,
              and creator revenue share.
            </p>
          </header>

          {/* Tabs */}
          <div
            className={`inline-flex items-center gap-1 p-1 rounded-full border mb-8 ${glassCard}`}
            style={glassStyle}
          >
            <button
              onClick={() => setActiveTab('spirits')}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] transition-all ${
                activeTab === 'spirits'
                  ? 'bg-[var(--text)] text-[var(--bg)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Spirits
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] transition-all ${
                activeTab === 'skills'
                  ? 'bg-[var(--text)] text-[var(--bg)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              Skills
            </button>
            <button
              onClick={() => setActiveTab('creators')}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] transition-all ${
                activeTab === 'creators'
                  ? 'bg-[var(--text)] text-[var(--bg)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Users className="w-3 h-3" />
              Creators
            </button>
          </div>

          {/* Table card */}
          <motion.section
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`rounded-[8px] p-2 border overflow-hidden ${glassCard}`}
            style={glassStyle}
          >
            {loading ? (
              <div className="text-center py-16">
                <p className="font-mono text-xs uppercase tracking-[0.2em] animate-pulse text-[var(--text-muted)]">
                  Loading rankings…
                </p>
              </div>
            ) : activeTab === 'spirits' ? (
              <div>
                <div className={`hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b ${rowDivider}`}>
                  <div className={`col-span-1 text-right ${headerCellClass}`}>Rank</div>
                  <div className={`col-span-4 ${headerCellClass}`}>Dojo Spirit</div>
                  <div className={`col-span-2 ${headerCellClass}`}>Category</div>
                  <div className={`col-span-2 text-right ${headerCellClass}`}>Receipts</div>
                  <div className={`col-span-1 text-right ${headerCellClass}`}>Pass</div>
                  <div className={`col-span-2 text-right ${headerCellClass}`}>Lineage</div>
                </div>

                {spirits.length === 0 ? (
                  <p className="text-center py-12 text-sm italic text-[var(--text-muted)]">
                    No workflow spirits found.
                  </p>
                ) : (
                  spirits.map((workflow, index) => (
                    <Link
                      key={workflow.id}
                      href={`/workflow/${workflow.slug}/run`}
                      className={`grid grid-cols-1 md:grid-cols-12 gap-4 px-4 md:px-6 py-4 border-b last:border-b-0 transition-colors items-center group ${rowDivider} hover:bg-[var(--bg-secondary)]`}
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
                      <div className="md:col-span-4 min-w-0">
                        <DojoSpirit
                          profile={workflow.spirit}
                          name={workflow.name}
                          compact
                          status={workflow.spirit.lineageRevenue.label}
                        />
                        <div className="mt-2 font-mono text-[10px] truncate text-[var(--text-muted)]">
                          by {workflow.creator?.displayName || 'Anonymous'} · {workflow.spirit.profileId}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
                          {workflow.category || 'workflow'}
                        </span>
                      </div>
                      <div className="md:col-span-2 md:text-right">
                        <span className="font-mono text-sm font-bold tabular-nums text-[var(--text)]">
                          {workflow.runs.toLocaleString()}
                        </span>
                        <div className="font-mono text-[10px] text-[var(--text-muted)]">
                          feeding events
                        </div>
                      </div>
                      <div className="md:col-span-1 md:text-right">
                        <span className="font-mono text-sm tabular-nums text-[var(--text-secondary)]">
                          {formatPassRate(workflow.trust_score)}
                        </span>
                      </div>
                      <div className="md:col-span-2 md:text-right">
                        <span className="inline-flex items-center gap-1 font-mono text-sm font-bold tabular-nums text-[var(--text)]">
                          <GitFork className="h-3 w-3" />
                          {workflow.forks}
                        </span>
                        <div className="font-mono text-[10px] text-[var(--text-muted)]">
                          {(workflow.royalty_bps / 100).toFixed(1)}% revenue
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            ) : activeTab === 'skills' ? (
              <div>
                <div className={`grid grid-cols-12 gap-4 px-6 py-4 border-b ${rowDivider}`}>
                  <div className={`col-span-1 text-right ${headerCellClass}`}>Rank</div>
                  <div className={`col-span-4 ${headerCellClass}`}>Skill</div>
                  <div className={`col-span-2 ${headerCellClass}`}>Category</div>
                  <div className={`col-span-2 text-right ${headerCellClass}`}>Installs</div>
                  <div className={`col-span-1 text-right ${headerCellClass}`}>Rating</div>
                  <div className={`col-span-2 text-right ${headerCellClass}`}>Price</div>
                </div>

                {skills.length === 0 ? (
                  <p className="text-center py-12 text-sm italic text-[var(--text-muted)]">
                    No skills found.
                  </p>
                ) : (
                  skills.map((skill, index) => (
                    <Link
                      key={skill.id}
                      href={`/skill/${skill.id}`}
                      className={`grid grid-cols-12 gap-4 px-6 py-4 border-b last:border-b-0 transition-colors items-center group ${rowDivider} hover:bg-[var(--bg-secondary)]`}
                    >
                      <div className="col-span-1 text-right">
                        <span
                          className={`font-mono text-base font-bold tabular-nums ${
                            index < 3 ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'
                          }`}
                        >
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="col-span-4 flex items-center gap-3 min-w-0">
                        <span className="text-xl shrink-0">{skill.icon}</span>
                        <div className="min-w-0">
                          <div className="font-sans font-semibold text-sm truncate text-[var(--text)]">
                            {skill.name}
                          </div>
                          <div className="font-mono text-[10px] truncate text-[var(--text-muted)]">
                            by {skill.creator?.displayName || 'Unknown'}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
                          {skill.category}
                        </span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="font-mono text-sm font-bold tabular-nums text-[var(--text)]">
                          {skill.installs.toLocaleString()}
                        </span>
                      </div>
                      <div className="col-span-1 text-right">
                        <span className="font-mono text-sm tabular-nums text-[var(--text-secondary)]">
                          {skill.rating.toFixed(1)}
                        </span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="font-mono text-sm font-bold tabular-nums text-[var(--text)]">
                          {skill.price === 0 ? 'FREE' : `$${skill.price.toFixed(2)}`}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            ) : (
              <div>
                <div className={`grid grid-cols-12 gap-4 px-6 py-4 border-b ${rowDivider}`}>
                  <div className={`col-span-1 text-right ${headerCellClass}`}>Rank</div>
                  <div className={`col-span-4 ${headerCellClass}`}>Creator</div>
                  <div className={`col-span-2 text-right ${headerCellClass}`}>Sales</div>
                  <div className={`col-span-2 text-right ${headerCellClass}`}>Revenue</div>
                  <div className={`col-span-1 text-right ${headerCellClass}`}>Rating</div>
                  <div className={`col-span-2 text-right ${headerCellClass}`}>Skills</div>
                </div>

                {creators.length === 0 ? (
                  <p className="text-center py-12 text-sm italic text-[var(--text-muted)]">
                    No creators found.
                  </p>
                ) : (
                  creators.map((creator, index) => (
                    <Link
                      key={creator.id}
                      href={`/creator/${creator.id}`}
                      className={`grid grid-cols-12 gap-4 px-6 py-4 border-b last:border-b-0 transition-colors items-center group ${rowDivider} hover:bg-[var(--bg-secondary)]`}
                    >
                      <div className="col-span-1 text-right">
                        <span
                          className={`font-mono text-base font-bold tabular-nums ${
                            index < 3 ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'
                          }`}
                        >
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="col-span-4 flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-[var(--bg-secondary)] text-[var(--text)]">
                          {(creator.displayName || '?')[0].toUpperCase()}
                        </div>
                        <div className="font-sans font-semibold text-sm truncate text-[var(--text)]">
                          {creator.displayName || 'Anonymous'}
                        </div>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="font-mono text-sm font-bold tabular-nums text-[var(--text)]">
                          {creator.totalSales.toLocaleString()}
                        </span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="font-mono text-sm font-bold tabular-nums text-[var(--text)]">
                          ${creator.totalRevenue.toFixed(2)}
                        </span>
                      </div>
                      <div className="col-span-1 text-right">
                        <span className="font-mono text-sm tabular-nums text-[var(--text-secondary)]">
                          {creator.avgRating.toFixed(1)}
                        </span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="font-mono text-sm tabular-nums text-[var(--text-muted)]">
                          {creator.skillCount}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </motion.section>

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-center mt-6 text-[var(--text-muted)]">
            Rankings updated in real time · No pay-to-play
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
