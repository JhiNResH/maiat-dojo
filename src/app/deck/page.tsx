'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePrivy } from '@privy-io/react-auth';
import { ArrowLeft, Layers, LogIn, Share2 } from 'lucide-react';
import { useDarkMode } from '@/app/DarkModeContext';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { BackgroundEffect } from '@/components/landing/BackgroundEffect';

interface PurchasedSkill {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  price: number;
  rating: number;
  installs: number;
  purchasedAt: string;
}

interface GroupedSkills {
  [category: string]: PurchasedSkill[];
}

export default function DeckPage() {
  const { isDark } = useDarkMode();
  const { ready, authenticated, login, getAccessToken } = usePrivy();
  const [skills, setSkills] = useState<PurchasedSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    async function fetchPurchases() {
      if (!ready || !authenticated) {
        setLoading(false);
        return;
      }
      try {
        const token = await getAccessToken();
        const res = await fetch('/api/user/purchases', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to fetch purchases');
        }
        const data = await res.json();
        setSkills(data.skills);
      } catch (err) {
        console.error('Failed to fetch deck:', err);
        setError(err instanceof Error ? err.message : 'Failed to load deck');
      } finally {
        setLoading(false);
      }
    }
    fetchPurchases();
  }, [ready, authenticated, getAccessToken]);

  const groupedSkills: GroupedSkills = skills.reduce((acc, skill) => {
    const category = skill.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {} as GroupedSkills);

  const sortedCategories = Object.keys(groupedSkills).sort(
    (a, b) => groupedSkills[b].length - groupedSkills[a].length
  );

  const handleShareDeck = async () => {
    setCopying(true);
    try {
      const skillIds = skills.map((s) => s.id).join(',');
      const url = `${window.location.origin}/deck/shared?skills=${encodeURIComponent(
        skillIds
      )}`;
      await navigator.clipboard.writeText(url);
      setShareUrl(url);
      setTimeout(() => setShareUrl(null), 3000);
    } catch (err) {
      console.error('Failed to copy share URL:', err);
    } finally {
      setCopying(false);
    }
  };

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

          {ready && !authenticated ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className={`rounded-3xl p-12 border text-center max-w-xl mx-auto ${glassCard}`}
              style={glassStyle}
            >
              <div
                className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6 border ${
                  isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white/60'
                }`}
              >
                <Layers className="w-5 h-5" />
              </div>
              <h1
                className={`font-sans font-semibold text-4xl md:text-5xl tracking-[-0.03em] leading-[0.95] mb-4 ${
                  isDark ? 'text-white' : 'text-black'
                }`}
              >
                Your deck, locked.
              </h1>
              <p
                className={`text-sm leading-relaxed mb-8 max-w-sm mx-auto ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                Sign in to view the skills you&apos;ve collected and share your build
                with other agents.
              </p>
              <button
                onClick={login}
                className={`inline-flex items-center gap-2 px-7 py-4 rounded-full text-xs font-bold uppercase tracking-[0.15em] transition-all hover:scale-[1.02] ${
                  isDark ? 'bg-white text-black' : 'bg-black text-white'
                }`}
              >
                <LogIn className="w-3 h-3" />
                Sign in to view deck
              </button>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <header className="flex items-start justify-between gap-6 mb-12">
                <div>
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-5 ${
                      isDark
                        ? 'border-white/10 bg-white/5'
                        : 'border-black/10 bg-white/60'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em]">
                      My deck
                    </span>
                  </div>
                  <h1
                    className={`font-sans font-semibold text-4xl md:text-6xl tracking-[-0.03em] leading-[0.95] mb-3 ${
                      isDark ? 'text-white' : 'text-black'
                    }`}
                  >
                    Your collection.
                  </h1>
                  <p
                    className={`font-mono text-xs tabular-nums ${
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}
                  >
                    {skills.length} skill{skills.length !== 1 ? 's' : ''} collected
                  </p>
                </div>

                {skills.length > 0 && (
                  <button
                    onClick={handleShareDeck}
                    disabled={copying}
                    className={`shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] transition-all hover:scale-[1.02] disabled:opacity-50 ${
                      isDark ? 'bg-white text-black' : 'bg-black text-white'
                    }`}
                  >
                    <Share2 className="w-3 h-3" />
                    {shareUrl ? 'Link copied' : 'Share deck'}
                  </button>
                )}
              </header>

              {loading && (
                <div className="text-center py-24">
                  <p
                    className={`font-mono text-xs uppercase tracking-[0.2em] animate-pulse ${
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}
                  >
                    Loading your deck…
                  </p>
                </div>
              )}

              {error && (
                <div
                  className={`rounded-3xl p-8 border text-center ${glassCard}`}
                  style={glassStyle}
                >
                  <p className="font-mono text-xs text-red-500">{error}</p>
                </div>
              )}

              {!loading && !error && skills.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className={`rounded-3xl p-16 border text-center max-w-xl mx-auto ${glassCard}`}
                  style={glassStyle}
                >
                  <div
                    className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6 border ${
                      isDark
                        ? 'border-white/10 bg-white/5'
                        : 'border-black/10 bg-white/60'
                    }`}
                  >
                    <Layers className="w-5 h-5" />
                  </div>
                  <h2
                    className={`font-sans font-semibold text-2xl mb-3 ${
                      isDark ? 'text-white' : 'text-black'
                    }`}
                  >
                    Your deck is empty
                  </h2>
                  <p
                    className={`text-sm mb-8 max-w-sm mx-auto ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Browse the marketplace to acquire your first skill cards.
                  </p>
                  <Link
                    href="/"
                    className={`inline-flex items-center gap-2 px-7 py-4 rounded-full text-xs font-bold uppercase tracking-[0.15em] transition-all hover:scale-[1.02] ${
                      isDark ? 'bg-white text-black' : 'bg-black text-white'
                    }`}
                  >
                    Browse skills
                  </Link>
                </motion.div>
              )}

              {!loading && !error && skills.length > 0 && (
                <div className="space-y-12">
                  {sortedCategories.map((category, ci) => (
                    <motion.section
                      key={category}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: ci * 0.05 }}
                    >
                      <div className="flex items-center gap-3 mb-5">
                        <div
                          className={`text-[10px] font-bold uppercase tracking-[0.3em] ${
                            isDark ? 'text-gray-500' : 'text-gray-400'
                          }`}
                        >
                          {category}
                        </div>
                        <div
                          className={`font-mono text-[10px] tabular-nums ${
                            isDark ? 'text-gray-600' : 'text-gray-500'
                          }`}
                        >
                          {groupedSkills[category].length}
                        </div>
                        <div
                          className={`flex-1 border-b ${
                            isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
                          }`}
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {groupedSkills[category].map((skill, i) => (
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
                              <div className="text-2xl mb-3">{skill.icon}</div>
                              <div
                                className={`font-sans font-semibold text-xs truncate ${
                                  isDark ? 'text-white' : 'text-black'
                                }`}
                              >
                                {skill.name}
                              </div>
                              <div
                                className={`font-mono text-[9px] uppercase tracking-[0.15em] mt-1 ${
                                  isDark ? 'text-gray-500' : 'text-gray-400'
                                }`}
                              >
                                {skill.category}
                              </div>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </motion.section>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
