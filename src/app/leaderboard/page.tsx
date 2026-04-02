"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, TrendingUp, Users, ChevronLeft } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"skills" | "creators">("skills");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === "skills") {
          const res = await fetch("/api/skills?sort=popular&limit=50");
          const data = await res.json();
          setSkills(data.skills || []);
        } else {
          const res = await fetch("/api/leaderboard?type=creators&limit=50");
          const data = await res.json();
          setCreators(data.creators || []);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard data:", err);
      }
      setLoading(false);
    };
    fetchData();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#f0ece2]">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-[#8b0000] hover:text-[#1a1a1a] transition-colors mb-8"
        >
          <ChevronLeft size={14} />
          The Dojo
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy size={28} className="text-[#8b0000]" />
            <h1 className="font-serif font-black text-5xl text-[#1a1a1a] tracking-tight">
              Leaderboard
            </h1>
          </div>
          <p className="font-serif italic text-[#1a1a1a]/50">
            Real ones rise. No paid rankings — sorted purely by data.
          </p>
        </header>

        {/* Tabs */}
        <div className="flex gap-0 mb-8 border-y-2 border-[#1a1a1a]/30">
          <button
            onClick={() => setActiveTab("skills")}
            className={`flex items-center gap-2 px-6 py-3 font-mono text-sm uppercase tracking-widest transition-colors ${
              activeTab === "skills"
                ? "bg-[#1a1a1a] text-[#f0ece2] font-bold"
                : "text-[#1a1a1a]/35 hover:text-[#1a1a1a] hover:bg-[#1a1a1a]/[0.03]"
            }`}
          >
            <TrendingUp size={14} />
            Skills
          </button>
          <button
            onClick={() => setActiveTab("creators")}
            className={`flex items-center gap-2 px-6 py-3 font-mono text-sm uppercase tracking-widest transition-colors ${
              activeTab === "creators"
                ? "bg-[#1a1a1a] text-[#f0ece2] font-bold"
                : "text-[#1a1a1a]/35 hover:text-[#1a1a1a] hover:bg-[#1a1a1a]/[0.03]"
            }`}
          >
            <Users size={14} />
            Creators
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <p className="font-mono text-sm text-[#1a1a1a]/40 animate-pulse">
              Loading rankings...
            </p>
          </div>
        )}

        {/* Skills Tab */}
        {!loading && activeTab === "skills" && (
          <div>
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b-2 border-[#1a1a1a]/30 font-mono text-[10px] uppercase tracking-widest text-[#1a1a1a]/40">
              <div className="col-span-1 text-right">Rank</div>
              <div className="col-span-4">Skill</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2 text-right">Installs</div>
              <div className="col-span-1 text-right">Rating</div>
              <div className="col-span-2 text-right">Price</div>
            </div>

            {/* Skills list */}
            {skills.length === 0 ? (
              <p className="text-center py-8 font-mono text-sm text-[#1a1a1a]/40">
                No skills found.
              </p>
            ) : (
              <div>
                {skills.map((skill, index) => (
                  <Link
                    key={skill.id}
                    href={`/skill/${skill.id}`}
                    className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-dotted border-[#1a1a1a]/15 hover:bg-[#1a1a1a]/[0.02] transition-colors group items-center"
                  >
                    <div className="col-span-1 text-right">
                      <span
                        className={`font-serif font-black text-lg ${
                          index < 3 ? "text-[#8b0000]" : "text-[#1a1a1a]/25"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </div>
                    <div className="col-span-4 flex items-center gap-3">
                      <span className="text-2xl">{skill.icon}</span>
                      <div>
                        <p className="font-serif font-bold text-[#1a1a1a] group-hover:text-[#8b0000] transition-colors">
                          {skill.name}
                        </p>
                        <p className="font-mono text-[10px] text-[#1a1a1a]/40">
                          by {skill.creator?.displayName || "Unknown"}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="font-mono text-xs text-[#1a1a1a]/60 uppercase tracking-wider">
                        {skill.category}
                      </span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="font-mono text-sm font-bold text-[#1a1a1a]">
                        {skill.installs.toLocaleString()}
                      </span>
                    </div>
                    <div className="col-span-1 text-right">
                      <span className="font-mono text-sm text-[#1a1a1a]/70">
                        {skill.rating.toFixed(1)}
                      </span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="font-mono text-sm font-bold">
                        {skill.price === 0 ? (
                          <span className="text-green-800">FREE</span>
                        ) : (
                          `$${skill.price.toFixed(2)}`
                        )}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Creators Tab */}
        {!loading && activeTab === "creators" && (
          <div>
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b-2 border-[#1a1a1a]/30 font-mono text-[10px] uppercase tracking-widest text-[#1a1a1a]/40">
              <div className="col-span-1 text-right">Rank</div>
              <div className="col-span-4">Creator</div>
              <div className="col-span-2 text-right">Total Sales</div>
              <div className="col-span-2 text-right">Revenue</div>
              <div className="col-span-1 text-right">Avg Rating</div>
              <div className="col-span-2 text-right">Skills</div>
            </div>

            {/* Creators list */}
            {creators.length === 0 ? (
              <p className="text-center py-8 font-mono text-sm text-[#1a1a1a]/40">
                No creators found.
              </p>
            ) : (
              <div>
                {creators.map((creator, index) => (
                  <Link
                    key={creator.id}
                    href={`/creator/${creator.id}`}
                    className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-dotted border-[#1a1a1a]/15 hover:bg-[#1a1a1a]/[0.02] transition-colors group items-center"
                  >
                    <div className="col-span-1 text-right">
                      <span
                        className={`font-serif font-black text-lg ${
                          index < 3 ? "text-[#8b0000]" : "text-[#1a1a1a]/25"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </div>
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1a1a1a]/10 flex items-center justify-center font-serif font-bold text-[#1a1a1a]/50">
                        {creator.displayName?.[0]?.toUpperCase() || "?"}
                      </div>
                      <p className="font-serif font-bold text-[#1a1a1a] group-hover:text-[#8b0000] transition-colors">
                        {creator.displayName || "Anonymous"}
                      </p>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="font-mono text-sm font-bold text-[#1a1a1a]">
                        {creator.totalSales.toLocaleString()}
                      </span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="font-mono text-sm font-bold text-green-800">
                        ${creator.totalRevenue.toFixed(2)}
                      </span>
                    </div>
                    <div className="col-span-1 text-right">
                      <span className="font-mono text-sm text-[#1a1a1a]/70">
                        {creator.avgRating.toFixed(1)}
                      </span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="font-mono text-sm text-[#1a1a1a]/60">
                        {creator.skillCount}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer note */}
        <div className="mt-8 pt-6 border-t-2 border-double border-[#1a1a1a]/30">
          <p className="font-mono text-[10px] text-[#1a1a1a]/30 text-center uppercase tracking-widest">
            Rankings updated in real-time — No pay-to-play
          </p>
        </div>
      </div>
    </div>
  );
}
