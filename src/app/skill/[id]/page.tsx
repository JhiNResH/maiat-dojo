import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ReviewForm from "@/components/ReviewForm";
import BuySkillButton from "@/components/BuySkillButton";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

const rankColor: Record<string, string> = {
  "Kozo 小僧": "bg-[#1a1a1a]/10 text-[#1a1a1a]/70",
  "Senpai 先輩": "bg-blue-900/10 text-blue-900",
  "Tatsujin 達人": "bg-purple-900/10 text-purple-900",
  "Sensei 師範": "bg-amber-800/10 text-amber-800",
};

const rankBadgeText: Record<string, string> = {
  "Kozo 小僧": "Apprentice",
  "Senpai 先輩": "Senpai",
  "Tatsujin 達人": "Master",
  "Sensei 師範": "Sensei · Top Creator",
};

function getInitials(name: string | null | undefined): string {
  if (!name) return "??";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function truncateAddress(address: string | null | undefined): string {
  if (!address) return "0x...—";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function SkillPage({ params }: { params: { id: string } }) {
  const skill = await prisma.skill.findUnique({
    where: { id: params.id },
    include: {
      creator: true,
      reviews: { include: { user: true }, orderBy: { createdAt: "desc" } },
      equippedBy: { include: { agent: true } },
      purchases: true,
    },
  });

  if (!skill) notFound();

  const tags = skill.tags ? skill.tags.split(",").filter(Boolean) : [];
  const avgRating =
    skill.reviews.length > 0
      ? skill.reviews.reduce((a, r) => a + r.rating, 0) / skill.reviews.length
      : skill.rating;

  // Calculate rating distribution
  const ratingCounts = [0, 0, 0, 0, 0]; // 1-5 stars
  skill.reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) {
      ratingCounts[r.rating - 1]++;
    }
  });

  // Default features if tags are empty
  const defaultFeatures = [
    { icon: "🔍", title: "Core Functionality", desc: "Full feature set included" },
    { icon: "📋", title: "Structured Output", desc: "Clean, formatted responses" },
    { icon: "⛓️", title: "On-chain Attestation", desc: "Verifiable on Base network" },
    { icon: "🔌", title: "Universal Compatibility", desc: "Works with any ERC-1155 runtime" },
  ];

  const features =
    tags.length >= 4
      ? tags.slice(0, 6).map((tag, i) => ({
          icon: ["🔍", "📋", "⛓️", "🔌", "🧪", "🔄"][i % 6],
          title: tag,
          desc: "Included in this skill",
        }))
      : defaultFeatures;

  return (
    <main className="min-h-screen bg-[#f0ece2]">
      <div className="max-w-[1100px] mx-auto px-6 py-6 page-container">
        {/* ═══════════════════════════════════════════════════════════════════
            BACK LINK
        ═══════════════════════════════════════════════════════════════════ */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#8b0000] hover:underline mb-6"
        >
          <ArrowLeft size={14} />
          The Dojo
        </Link>

        {/* ═══════════════════════════════════════════════════════════════════
            TITLE SECTION
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-6">
          {/* Category badge */}
          <span className="inline-block font-mono text-xs uppercase tracking-[0.2em] text-[#c9a84c] mb-3">
            ⬡ {skill.category}
          </span>

          {/* Skill title */}
          <h1 className="font-serif font-black text-5xl md:text-6xl text-[#1a1a1a] leading-[0.95] mb-4">
            {skill.name}
          </h1>

          {/* Byline */}
          <p className="font-serif italic text-base text-[#1a1a1a]/50">
            by {skill.creator.displayName || "Anonymous"} · {skill.category} · {skill.installs.toLocaleString()} installs · ★ {avgRating.toFixed(1)}
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TRUST BAR
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex divide-x divide-[#1a1a1a]/10 border border-[#1a1a1a]/20 bg-[#1a1a1a]/[0.02] mb-8">
          {/* Rating */}
          <div className="flex-1 text-center py-4 px-4">
            <span className="font-serif font-black text-3xl text-[#1a1a1a] block leading-none">
              {avgRating.toFixed(1)}
            </span>
            <span className="text-[#8b0000] text-base tracking-wider block mt-1">
              {"★".repeat(Math.round(avgRating))}
              {"☆".repeat(5 - Math.round(avgRating))}
            </span>
            <span className="font-mono text-xs uppercase tracking-wider text-[#1a1a1a]/40 block mt-1">
              Rating
            </span>
          </div>
          {/* Verified Buyers */}
          <div className="flex-1 text-center py-4 px-4">
            <span className="font-serif font-black text-3xl text-[#1a1a1a] block leading-none">
              {skill.installs.toLocaleString()}
            </span>
            <span className="font-mono text-xs uppercase tracking-wider text-[#1a1a1a]/40 block mt-2">
              Verified Buyers
            </span>
          </div>
          {/* Disputes */}
          <div className="flex-1 text-center py-4 px-4">
            <span className="font-serif font-black text-3xl text-[#1a1a1a] block leading-none">
              0
            </span>
            <span className="font-mono text-xs uppercase tracking-wider text-[#1a1a1a]/40 block mt-2">
              Disputes
            </span>
          </div>
          {/* Version */}
          <div className="flex-1 text-center py-4 px-4">
            <span className="font-serif font-black text-3xl text-[#1a1a1a] block leading-none">
              v1.0
            </span>
            <span className="font-mono text-xs uppercase tracking-wider text-[#1a1a1a]/40 block mt-2">
              Version
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TWO-COLUMN LAYOUT
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid md:grid-cols-[1fr_280px] gap-8">
          {/* ─────────────────── LEFT MAIN COLUMN ─────────────────── */}
          <div>
            {/* LONG DESCRIPTION */}
            <section className="mb-8">
              <div className="font-serif text-base text-[#1a1a1a]/80 leading-relaxed">
                {(skill.longDescription || skill.description)
                  .split("\n\n")
                  .map((p, i) => (
                    <p
                      key={i}
                      className={`mb-4 ${i === 0 ? "drop-cap" : ""}`}
                    >
                      {p}
                    </p>
                  ))}
              </div>
            </section>

            {/* WHAT'S INCLUDED */}
            <section className="mb-8">
              <div className="rule-ornament mb-4">WHAT&apos;S INCLUDED</div>
              <div className="grid sm:grid-cols-2 gap-3">
                {features.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-3 px-3 border border-[#1a1a1a]/10 bg-[#1a1a1a]/[0.02]"
                  >
                    <span className="text-xl flex-shrink-0">{f.icon}</span>
                    <div>
                      <strong className="block text-sm font-mono font-bold text-[#1a1a1a] mb-0.5">
                        {f.title}
                      </strong>
                      <span className="text-xs text-[#1a1a1a]/50">{f.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* VERIFIED REVIEWS */}
            <section className="mb-8">
              <div className="rule-ornament mb-4">VERIFIED REVIEWS</div>

              {/* Review Summary Card */}
              <div className="classified mb-6" data-label="Reviews">
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  {/* Big Score */}
                  <div className="text-center flex-shrink-0">
                    <div className="font-serif font-black text-6xl leading-none text-[#1a1a1a]">
                      {avgRating.toFixed(1)}
                    </div>
                    <div className="text-[#8b0000] text-lg tracking-wider mt-1">
                      {"★".repeat(Math.round(avgRating))}
                      {"☆".repeat(5 - Math.round(avgRating))}
                    </div>
                    <div className="font-mono text-xs text-[#1a1a1a]/40 mt-1">
                      {skill.reviews.length} reviews
                    </div>
                  </div>

                  {/* Rating Bars */}
                  <div className="flex-1 w-full">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = ratingCounts[star - 1];
                      const pct = skill.reviews.length > 0 ? (count / skill.reviews.length) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 mb-1.5">
                          <span className="font-mono text-xs text-[#1a1a1a]/40 w-8 text-right flex-shrink-0">
                            {star} ★
                          </span>
                          <div className="flex-1 h-2 bg-[#1a1a1a]/10 overflow-hidden">
                            <div
                              className="h-full bg-[#c9a84c]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs text-[#1a1a1a]/40 w-5">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Review Cards */}
              {skill.reviews.length === 0 ? (
                <p className="font-mono text-sm text-[#1a1a1a]/40 italic">
                  No reviews yet. Be the first.
                </p>
              ) : (
                <div className="space-y-4">
                  {skill.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-dotted border-[#1a1a1a]/15 pb-4"
                    >
                      {/* Header */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-[#f0ece2] flex-shrink-0"
                            style={{
                              backgroundColor: `hsl(${(review.user.id.charCodeAt(0) * 37) % 360}, 35%, 45%)`,
                            }}
                          >
                            {getInitials(review.user.displayName)}
                          </div>
                          <div>
                            <div className="text-sm font-serif font-bold text-[#1a1a1a]">
                              {review.user.displayName || "Anonymous"}
                            </div>
                            <div className="font-mono text-xs text-[#1a1a1a]/40">
                              {formatDate(review.createdAt)}
                            </div>
                          </div>
                        </div>
                        <div className="text-[#8b0000] text-sm">
                          {"★".repeat(review.rating)}
                          {"☆".repeat(5 - review.rating)}
                        </div>
                      </div>

                      {/* Review text */}
                      <p className="font-serif text-sm text-[#1a1a1a]/70 leading-relaxed mb-3">
                        {review.comment}
                      </p>

                      {/* Footer */}
                      <div className="flex justify-between items-center">
                        {/* On-chain verify badge */}
                        <div className="text-xs font-mono text-green-800 bg-green-800/10 border-l-2 border-green-800 px-2 py-1">
                          ✓ Verified purchase · {truncateAddress(review.user.walletAddress)}
                        </div>
                        <button className="font-mono text-xs text-[#1a1a1a]/40 hover:text-[#1a1a1a] transition-colors">
                          Helpful
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Review Form */}
              <div className="mt-6">
                <ReviewForm targetType="skill" targetId={skill.id} />
              </div>
            </section>

            {/* AGENTS USING THIS SKILL */}
            {skill.equippedBy.length > 0 && (
              <section className="mb-8">
                <div className="rule-ornament mb-4">AGENTS USING THIS SKILL</div>
                <div className="space-y-0">
                  {skill.equippedBy.map(({ agent }) => (
                    <Link
                      key={agent.id}
                      href={`/agent/${agent.id}`}
                      className="flex items-center gap-3 py-3 border-b border-dotted border-[#1a1a1a]/15 last:border-b-0 hover:bg-[#1a1a1a]/[0.02] transition-colors"
                    >
                      <span className="text-2xl">{agent.avatar}</span>
                      <div className="flex-1">
                        <div className="font-serif font-bold text-[#1a1a1a]">{agent.name}</div>
                        <span
                          className={`inline-block font-mono text-[10px] uppercase tracking-widest px-1.5 py-0.5 ${rankColor[agent.rank] || "bg-[#1a1a1a]/10 text-[#1a1a1a]/70"}`}
                        >
                          {agent.rank}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ─────────────────── RIGHT SIDEBAR ─────────────────── */}
          <aside className="flex flex-col gap-5">
            {/* PURCHASE CARD */}
            <div className="classified" data-label="Acquire">
              {/* Price */}
              <div className="mb-1">
                <span className="font-serif font-black text-4xl text-[#1a1a1a]">
                  ${skill.price.toFixed(0)}
                </span>
                <span className="font-mono text-xs text-[#1a1a1a]/40 ml-2">/ lifetime</span>
              </div>
              <p className="font-mono text-xs text-[#1a1a1a]/50 mb-4 pb-3 border-b border-dotted border-[#1a1a1a]/15">
                or <strong className="text-[#1a1a1a]">$0.05</strong> per call via x402
              </p>

              {/* Trust bullet points */}
              <ul className="space-y-2 mb-4 font-mono text-sm text-[#1a1a1a]/70">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0">🔒</span>
                  <span>ERC-1155 NFT — transferable license</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0">⚡</span>
                  <span>Instant activation · works in any agent</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0">🔄</span>
                  <span>Free updates for 12 months</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0">🛡️</span>
                  <span>{skill.installs} verified buyers · 0 disputes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0">↩️</span>
                  <span>7-day refund if unused</span>
                </li>
              </ul>

              {/* Buy Button */}
              <BuySkillButton
                skillId={skill.onChainId?.toString() ?? ""}
                price={skill.price}
                skillName={skill.name}
              />

              {/* Try Demo Button */}
              <button className="w-full mt-2 bg-[#c9a84c] text-[#1a1a1a] font-mono text-xs uppercase tracking-wider py-3 hover:bg-[#b8962a] transition-colors">
                ▶ TRY FREE DEMO
              </button>

              {/* On-chain badge */}
              <div className="text-xs font-mono text-green-800 bg-green-800/10 border-l-2 border-green-800 px-2 py-1 mt-3">
                ✓ Purchase recorded on Base Mainnet · ERC-8183
              </div>
            </div>

            {/* CREATOR CARD */}
            <div className="classified" data-label="Creator">
              <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full bg-[#1a1a1a] text-[#f0ece2] flex items-center justify-center text-xl font-bold mb-2">
                  {getInitials(skill.creator.displayName)}
                </div>
                <div className="font-serif font-bold text-base text-[#1a1a1a]">
                  {skill.creator.displayName || "Anonymous"}
                </div>
                <div className="font-serif italic text-xs text-[#1a1a1a]/50 mb-3">
                  {rankBadgeText[skill.equippedBy[0]?.agent?.rank ?? "Kozo 小僧"] || "Creator"}
                </div>

                {/* 2x2 stats grid */}
                <div className="grid grid-cols-2 gap-2 w-full">
                  <div className="border border-[#1a1a1a]/10 p-2 text-center">
                    <div className="font-serif font-bold text-lg text-[#1a1a1a]">—</div>
                    <div className="font-mono text-[10px] text-[#1a1a1a]/40 uppercase tracking-wider">Skills</div>
                  </div>
                  <div className="border border-[#1a1a1a]/10 p-2 text-center">
                    <div className="font-serif font-bold text-lg text-[#1a1a1a]">—</div>
                    <div className="font-mono text-[10px] text-[#1a1a1a]/40 uppercase tracking-wider">Avg Rating</div>
                  </div>
                  <div className="border border-[#1a1a1a]/10 p-2 text-center">
                    <div className="font-serif font-bold text-lg text-[#1a1a1a]">{skill.installs}</div>
                    <div className="font-mono text-[10px] text-[#1a1a1a]/40 uppercase tracking-wider">Buyers</div>
                  </div>
                  <div className="border border-[#1a1a1a]/10 p-2 text-center">
                    <div className="font-serif font-bold text-lg text-[#1a1a1a]">98%</div>
                    <div className="font-mono text-[10px] text-[#1a1a1a]/40 uppercase tracking-wider">Response</div>
                  </div>
                </div>
              </div>
            </div>

            {/* SPECIFICATION */}
            <div className="classified" data-label="Specification">
              <div className="space-y-0">
                {[
                  { label: "Standard", value: "ERC-1155" },
                  { label: "Network", value: "Base Mainnet" },
                  { label: "License", value: "Lifetime · 1 Agent" },
                  { label: "Runtimes", value: "OpenClaw, Eliza, GAME" },
                  { label: "Category", value: skill.category },
                  { label: "Updated", value: formatDate(skill.updatedAt) },
                  {
                    label: "Token ID",
                    value: skill.onChainId ? `#${String(skill.onChainId).padStart(5, "0")}` : "—",
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex justify-between items-center py-2 border-b border-dotted border-[#1a1a1a]/15 last:border-b-0"
                  >
                    <span className="font-mono text-xs text-[#1a1a1a]/40 uppercase tracking-wider">{label}</span>
                    <span className="font-mono text-xs text-[#1a1a1a] font-bold">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ON-CHAIN PROOF */}
            <div className="classified" data-label="On-Chain Proof">
              <div className="space-y-0">
                <div className="py-2 border-b border-dotted border-[#1a1a1a]/15">
                  <span className="font-mono text-xs text-[#1a1a1a]/40 uppercase tracking-wider block mb-1">
                    Skill Contract
                  </span>
                  <span className="font-mono text-xs text-[#8b0000] break-all">
                    0x3f7a8c2d...c4d2
                  </span>
                </div>
                <div className="py-2 border-b border-dotted border-[#1a1a1a]/15">
                  <span className="font-mono text-xs text-[#1a1a1a]/40 uppercase tracking-wider block mb-1">
                    Creator Attestation
                  </span>
                  <span className="font-mono text-xs text-[#8b0000] break-all">
                    {truncateAddress(skill.creator.walletAddress)}
                  </span>
                </div>
                <div className="py-2">
                  <span className="font-mono text-xs text-[#1a1a1a]/40 uppercase tracking-wider block mb-1">
                    Dojo Safety Audit
                  </span>
                  <span className="font-mono text-xs text-[#8b0000]">
                    {skill.evaluationPassed ? "✓ Passed" : "Pending"}
                  </span>
                </div>
              </div>
            </div>

            {/* YOU MAY ALSO NEED */}
            <div className="classified" data-label="You May Also Need">
              <div className="space-y-0">
                {[
                  { icon: "⚡", name: "Foundry Test Writer", stars: "★★★★★", buyers: 412, price: "$18" },
                  { icon: "🐍", name: "Slither Deep Analyzer", stars: "★★★★☆", buyers: 203, price: "$16" },
                  { icon: "🔐", name: "Access Control Checker", stars: "★★★★★", buyers: 189, price: "$12" },
                ].map((related) => (
                  <div
                    key={related.name}
                    className="flex items-center gap-3 py-2.5 border-b border-dotted border-[#1a1a1a]/15 last:border-b-0 cursor-pointer hover:bg-[#1a1a1a]/[0.02] transition-colors"
                  >
                    <span className="text-xl flex-shrink-0">{related.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-serif text-sm font-bold text-[#1a1a1a] truncate">{related.name}</div>
                      <div className="font-mono text-[10px] text-[#1a1a1a]/40">
                        {related.stars} · {related.buyers} buyers
                      </div>
                    </div>
                    <span className="font-mono text-sm font-bold text-[#8b0000]">{related.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            FOOTER
        ═══════════════════════════════════════════════════════════════════ */}
        <footer className="mt-10 pt-4">
          <div className="masthead-rule mb-2" />
          <div className="flex justify-between items-center py-2">
            <span className="font-mono text-xs text-[#1a1a1a]/25 tracking-wider">
              THE DOJO © 2026 · MAIAT PROTOCOL · BUILT ON BASE · ERC-8004
            </span>
            <span className="font-serif italic text-xs text-[#1a1a1a]/25">
              dojo.maiat.io — All rights reserved
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}
