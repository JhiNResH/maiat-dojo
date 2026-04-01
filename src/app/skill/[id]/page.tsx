import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ReviewForm from "@/components/ReviewForm";
import BuySkillButton from "@/components/BuySkillButton";

export const dynamic = "force-dynamic";

const rankColor: Record<string, string> = {
  "Kozo 小僧": "bg-[#1a1a1a]/10 text-[#1a1a1a]/70",
  "Senpai 先輩": "bg-blue-900/10 text-blue-900",
  "Tatsujin 達人": "bg-purple-900/10 text-purple-900",
  "Sensei 師範": "bg-amber-800/10 text-amber-800",
};

export default async function SkillPage({ params }: { params: { id: string } }) {
  const skill = await prisma.skill.findUnique({
    where: { id: params.id },
    include: {
      creator: true,
      reviews: { include: { user: true }, orderBy: { createdAt: "desc" } },
      equippedBy: { include: { agent: true } },
    },
  });

  if (!skill) notFound();

  const tags = skill.tags ? skill.tags.split(",").filter(Boolean) : [];
  const avgRating =
    skill.reviews.length > 0
      ? (skill.reviews.reduce((a, r) => a + r.rating, 0) / skill.reviews.length).toFixed(1)
      : skill.rating.toFixed(1);

  return (
    <main className="min-h-screen bg-[#f0ece2]">
      {/* Paper texture overlay */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"200\" height=\"200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noise\"%3E%3CfeTurbulence baseFrequency=\"0.9\" numOctaves=\"4\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noise)\" opacity=\"0.4\"/%3E%3C/svg%3E')" }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        {/* Back link */}
        <Link href="/" className="inline-block font-mono text-xs uppercase tracking-widest text-[#8b0000] hover:text-[#1a1a1a] transition-colors mb-8">
          ← The Dojo
        </Link>

        {/* Category + Icon */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{skill.icon}</span>
          <span className="font-mono text-xs uppercase tracking-widest text-[#1a1a1a]/50 border border-[#1a1a1a]/20 px-2 py-0.5">
            {skill.category}
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-serif font-black text-5xl md:text-6xl text-[#1a1a1a] leading-[1.05] mb-4 tracking-tight">
          {skill.name}
        </h1>

        {/* Byline */}
        <p className="font-mono text-sm text-[#1a1a1a]/60 mb-6">
          By <span className="text-[#1a1a1a]">{skill.creator.displayName}</span>
          {" · "}{skill.category}
          {" · "}{skill.installs.toLocaleString()} equipped
          {" · "}★ {avgRating}
        </p>

        {/* Divider */}
        <div className="border-t-2 border-double border-[#1a1a1a]/30 mb-8" />

        {/* Main content grid */}
        <div className="grid md:grid-cols-[1fr_280px] gap-8">
          {/* Left: Description */}
          <div>
            <div className="text-[#1a1a1a] text-base leading-relaxed">
              {(skill.longDescription || skill.description).split("\n\n").map((p, i) => (
                <p key={i} className={`mb-4 ${i === 0 ? "first-letter:text-5xl first-letter:font-serif first-letter:font-black first-letter:float-left first-letter:mr-2 first-letter:leading-none first-letter:text-[#8b0000]" : ""}`}>
                  {p}
                </p>
              ))}
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6 mb-8">
                {tags.map((tag) => (
                  <span key={tag} className="font-mono text-xs text-[#1a1a1a]/50 border border-[#1a1a1a]/15 px-2 py-0.5">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div>
            {/* Price card */}
            <div className="border-2 border-[#1a1a1a] p-5 mb-6">
              <div className="font-serif font-black text-3xl text-[#1a1a1a] mb-1">
                ${skill.price.toFixed(2)}
              </div>
              <p className="font-mono text-xs text-[#1a1a1a]/50 uppercase mb-4">
                one-time purchase
              </p>
              <BuySkillButton skillId={skill.id} price={skill.price} skillName={skill.name} />
            </div>

            {/* Stats */}
            <div className="space-y-3 mb-6">
              {[
                { label: "Rating", value: `★ ${avgRating}` },
                { label: "Installs", value: skill.installs.toLocaleString() },
                { label: "Price", value: `$${skill.price.toFixed(2)}` },
                { label: "Category", value: skill.category },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between border-b border-dotted border-[#1a1a1a]/15 pb-2">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#1a1a1a]/50">{label}</span>
                  <span className="font-mono text-sm text-[#1a1a1a]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Agents section */}
        {skill.equippedBy.length > 0 && (
          <>
            <div className="border-t-2 border-double border-[#1a1a1a]/30 mt-8 pt-6">
              <h2 className="font-mono text-xs uppercase tracking-widest text-[#1a1a1a]/50 mb-4">
                Agents Using This Skill
              </h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {skill.equippedBy.map(({ agent }) => (
                  <Link
                    key={agent.id}
                    href={`/agent/${agent.id}`}
                    className="flex items-center gap-3 border-b border-dotted border-[#1a1a1a]/15 pb-3 hover:border-[#8b0000]/30 transition-colors"
                  >
                    <span className="text-2xl">{agent.avatar}</span>
                    <div>
                      <div className="font-serif font-bold text-[#1a1a1a]">{agent.name}</div>
                      <span className={`inline-block font-mono text-[10px] uppercase tracking-widest px-1.5 py-0.5 ${rankColor[agent.rank] || "bg-[#1a1a1a]/10 text-[#1a1a1a]/70"}`}>
                        {agent.rank}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Reviews section */}
        <div className="border-t-2 border-double border-[#1a1a1a]/30 mt-8 pt-6">
          <h2 className="font-mono text-xs uppercase tracking-widest text-[#1a1a1a]/50 mb-4">
            Reader Reviews ({skill.reviews.length})
          </h2>

          {skill.reviews.length === 0 ? (
            <p className="font-mono text-sm text-[#1a1a1a]/40 italic">No reviews yet. Be the first.</p>
          ) : (
            <div className="space-y-4">
              {skill.reviews.map((review) => (
                <div key={review.id} className="border-b border-dotted border-[#1a1a1a]/15 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[#8b0000] text-sm">
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </span>
                      <span className="font-mono text-xs text-[#1a1a1a]/50">
                        {review.user.displayName || "Anonymous"}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-[#1a1a1a]/30">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-[#1a1a1a]/80 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          )}

          <ReviewForm targetType="skill" targetId={skill.id} />
        </div>
      </div>
    </main>
  );
}
