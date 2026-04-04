"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { ArrowLeft, Share2, Layers, LogIn } from "lucide-react";
import { SkillCard, type SkillCardData } from "@/components/SkillCard";
import { CATEGORY_COLORS } from "@/lib/rarity";

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
  const { ready, authenticated, login, getAccessToken } = usePrivy();
  const [skills, setSkills] = useState<PurchasedSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  // Fetch purchased skills
  useEffect(() => {
    async function fetchPurchases() {
      if (!ready || !authenticated) {
        setLoading(false);
        return;
      }

      try {
        const token = await getAccessToken();
        const res = await fetch("/api/user/purchases", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch purchases");
        }

        const data = await res.json();
        setSkills(data.skills);
      } catch (err) {
        console.error("Failed to fetch deck:", err);
        setError(err instanceof Error ? err.message : "Failed to load deck");
      } finally {
        setLoading(false);
      }
    }

    fetchPurchases();
  }, [ready, authenticated, getAccessToken]);

  // Group skills by category
  const groupedSkills: GroupedSkills = skills.reduce((acc, skill) => {
    const category = skill.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {} as GroupedSkills);

  // Sort categories by size
  const sortedCategories = Object.keys(groupedSkills).sort(
    (a, b) => groupedSkills[b].length - groupedSkills[a].length
  );

  // Share deck handler
  const handleShareDeck = async () => {
    setCopying(true);
    try {
      // Generate share URL with skill IDs
      const skillIds = skills.map((s) => s.id).join(",");
      const url = `${window.location.origin}/deck/shared?skills=${encodeURIComponent(skillIds)}`;

      await navigator.clipboard.writeText(url);
      setShareUrl(url);

      // Reset after 3 seconds
      setTimeout(() => {
        setShareUrl(null);
      }, 3000);
    } catch (err) {
      console.error("Failed to copy share URL:", err);
    } finally {
      setCopying(false);
    }
  };

  // Convert to SkillCardData
  const toCardData = (skill: PurchasedSkill): SkillCardData => ({
    id: skill.id,
    name: skill.name,
    icon: skill.icon,
    category: skill.category,
    rating: skill.rating,
    installs: skill.installs,
    price: skill.price,
  });

  // Not authenticated
  if (ready && !authenticated) {
    return (
      <main className="min-h-screen bg-[#f0ece2]">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#8b0000] hover:underline mb-8"
          >
            <ArrowLeft size={14} />
            The Dojo
          </Link>

          <div className="text-center py-16">
            <Layers size={48} className="mx-auto text-[#1a1a1a]/20 mb-4" />
            <h1 className="font-serif font-black text-4xl text-[#1a1a1a] mb-4">
              MY DECK
            </h1>
            <p className="font-serif text-lg text-[#1a1a1a]/60 mb-8 max-w-md mx-auto">
              Sign in to view your collection of skill cards.
            </p>
            <button
              onClick={login}
              className="inline-flex items-center gap-2 bg-[#1a1a1a] text-[#f0ece2] font-mono text-sm px-6 py-3 hover:bg-[#1a1a1a]/80 transition-colors tracking-wider"
            >
              <LogIn size={16} />
              SIGN IN TO VIEW DECK
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f0ece2]">
      <div className="max-w-5xl mx-auto px-6 py-8 page-container">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#8b0000] hover:underline mb-6"
        >
          <ArrowLeft size={14} />
          The Dojo
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif font-black text-5xl text-[#1a1a1a] mb-2">
              MY DECK
            </h1>
            <p className="font-mono text-sm text-[#1a1a1a]/50">
              {skills.length} skill{skills.length !== 1 ? "s" : ""} collected
            </p>
          </div>

          {/* Share button */}
          {skills.length > 0 && (
            <button
              onClick={handleShareDeck}
              disabled={copying}
              className="inline-flex items-center gap-2 bg-[#1a1a1a] text-[#f0ece2] font-mono text-xs px-4 py-2 hover:bg-[#1a1a1a]/80 transition-colors tracking-wider disabled:opacity-50"
            >
              <Share2 size={14} />
              {shareUrl ? "LINK COPIED!" : "SHARE MY DECK"}
            </button>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-16">
            <p className="font-mono text-sm text-[#1a1a1a]/40 animate-pulse">
              Loading your deck...
            </p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-16">
            <p className="font-mono text-sm text-[#8b0000]">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && skills.length === 0 && (
          <div className="text-center py-16">
            <Layers size={48} className="mx-auto text-[#1a1a1a]/20 mb-4" />
            <h2 className="font-serif font-bold text-2xl text-[#1a1a1a] mb-2">
              Your deck is empty
            </h2>
            <p className="font-serif text-[#1a1a1a]/60 mb-6 max-w-md mx-auto">
              Browse the marketplace to acquire your first skill cards.
            </p>
            <Link
              href="/"
              className="inline-block bg-[#1a1a1a] text-[#f0ece2] font-mono text-sm px-6 py-3 hover:bg-[#1a1a1a]/80 transition-colors tracking-wider"
            >
              BROWSE SKILLS
            </Link>
          </div>
        )}

        {/* Skills by category */}
        {!loading && !error && skills.length > 0 && (
          <div className="space-y-10">
            {sortedCategories.map((category) => (
              <section key={category}>
                {/* Category header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-4 h-4"
                    style={{
                      backgroundColor: CATEGORY_COLORS[category] ?? "#3a3a3a",
                    }}
                  />
                  <h2 className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-[#1a1a1a]">
                    {category}
                  </h2>
                  <span className="font-mono text-xs text-[#1a1a1a]/40">
                    ({groupedSkills[category].length})
                  </span>
                  <div className="flex-1 border-b border-dotted border-[#1a1a1a]/20" />
                </div>

                {/* Skills grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {groupedSkills[category].map((skill) => (
                    <SkillCard
                      key={skill.id}
                      skill={toCardData(skill)}
                      size="md"
                      showPrice={false}
                      href={`/skill/${skill.id}`}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-4">
          <div className="masthead-rule mb-2" />
          <div className="flex justify-between items-center py-2">
            <span className="font-mono text-xs text-[#1a1a1a]/25 tracking-wider">
              THE DOJO © 2026 · MAIAT PROTOCOL · BUILT ON BASE
            </span>
            <span className="font-serif italic text-xs text-[#1a1a1a]/25">
              dojo.maiat.io
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}
