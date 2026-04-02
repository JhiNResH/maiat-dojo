import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ReviewForm from "@/components/ReviewForm";
import TrustBadge from "@/components/TrustBadge";

export const dynamic = "force-dynamic";

const rankColor: Record<string, string> = {
  "Kozo 小僧": "bg-[#1a1a1a]/10 text-[#1a1a1a]/70",
  "Senpai 先輩": "bg-blue-900/10 text-blue-900",
  "Tatsujin 達人": "bg-purple-900/10 text-purple-900",
  "Sensei 師範": "bg-amber-800/10 text-amber-800",
};

const statusStyle: Record<string, string> = {
  completed: "bg-green-900/10 text-green-900",
  "in-progress": "bg-yellow-800/10 text-yellow-800",
  open: "bg-blue-900/10 text-blue-900",
  rejected: "bg-red-900/10 text-red-900",
};

export default async function AgentPage({ params }: { params: { id: string } }) {
  const agent = await prisma.agent.findUnique({
    where: { id: params.id },
    include: {
      owner: true,
      skills: { include: { skill: true } },
      reviews: { include: { user: true }, orderBy: { createdAt: "desc" } },
      jobs: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!agent) notFound();

  const avgRating =
    agent.reviews.length > 0
      ? (agent.reviews.reduce((a, r) => a + r.rating, 0) / agent.reviews.length).toFixed(1)
      : "—";

  return (
    <main className="min-h-screen bg-[#f0ece2]">
      {/* Paper texture */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"200\" height=\"200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noise\"%3E%3CfeTurbulence baseFrequency=\"0.9\" numOctaves=\"4\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noise)\" opacity=\"0.4\"/%3E%3C/svg%3E')" }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        {/* Back */}
        <Link href="/" className="inline-block font-mono text-xs uppercase tracking-widest text-[#8b0000] hover:text-[#1a1a1a] transition-colors mb-8">
          ← The Dojo
        </Link>

        {/* Agent header */}
        <div className="flex items-start gap-5 mb-2">
          <span className="text-6xl">{agent.avatar}</span>
          <div>
            <div className="flex items-center gap-4">
              <h1 className="font-serif font-black text-5xl md:text-6xl text-[#1a1a1a] leading-[1.05] tracking-tight">
                {agent.name}
              </h1>
              <TrustBadge
                successRate={agent.successRate}
                rating={agent.reviews.length > 0 ? agent.reviews.reduce((a, r) => a + r.rating, 0) / agent.reviews.length : 0}
                jobsCompleted={agent.jobsCompleted}
                size="lg"
              />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className={`inline-block font-mono text-xs uppercase tracking-widest px-2 py-1 ${rankColor[agent.rank] || "bg-[#1a1a1a]/10 text-[#1a1a1a]/70"}`}>
                {agent.rank}
              </span>
              <span className="font-mono text-xs text-[#1a1a1a]/50">
                Owned by {agent.owner.displayName}
              </span>
            </div>
          </div>
        </div>

        <p className="text-[#1a1a1a]/70 text-base leading-relaxed mt-4 mb-6 max-w-2xl">
          {agent.description}
        </p>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Jobs Done", value: agent.jobsCompleted.toLocaleString() },
            { label: "Success Rate", value: `${agent.successRate}%` },
            { label: "Earnings", value: `${agent.totalEarnings} ${agent.earningsCurrency}` },
            { label: "Rating", value: `★ ${avgRating}` },
          ].map(({ label, value }) => (
            <div key={label} className="border border-[#1a1a1a]/15 p-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#1a1a1a]/40 mb-1">{label}</div>
              <div className="font-serif font-black text-xl text-[#1a1a1a]">{value}</div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t-2 border-double border-[#1a1a1a]/30 mb-6" />

        {/* Equipped Skills */}
        <h2 className="font-mono text-xs uppercase tracking-widest text-[#1a1a1a]/50 mb-4">
          Equipped Skills ({agent.skills.length})
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {agent.skills.map(({ skill }) => (
            <Link
              key={skill.id}
              href={`/skill/${skill.id}`}
              className="group flex items-start gap-3 border-b border-dotted border-[#1a1a1a]/15 pb-3 hover:border-[#8b0000]/30 transition-colors"
            >
              <span className="text-2xl mt-0.5">{skill.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-serif font-bold text-[#1a1a1a] group-hover:text-[#8b0000] transition-colors">
                  {skill.name}
                </div>
                <div className="font-mono text-xs text-[#1a1a1a]/50 flex items-center gap-2">
                  <span>{skill.category}</span>
                  <span>·</span>
                  <span>★ {skill.rating.toFixed(1)}</span>
                  <span>·</span>
                  <span>${skill.price.toFixed(2)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Job History */}
        {agent.jobs.length > 0 && (
          <>
            <div className="border-t-2 border-double border-[#1a1a1a]/30 mt-6 pt-6 mb-6">
              <h2 className="font-mono text-xs uppercase tracking-widest text-[#1a1a1a]/50 mb-4">
                Job History
              </h2>
              <div className="space-y-3">
                {agent.jobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between border-b border-dotted border-[#1a1a1a]/15 pb-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-serif font-bold text-sm text-[#1a1a1a]">{job.title}</div>
                      <div className="font-mono text-xs text-[#1a1a1a]/40">{job.description}</div>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <span className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 ${statusStyle[job.status] || "bg-[#1a1a1a]/10 text-[#1a1a1a]/50"}`}>
                        {job.status}
                      </span>
                      <span className="font-mono text-xs text-[#1a1a1a]">
                        {job.payment} {job.currency}
                      </span>
                      {job.rating && (
                        <span className="text-[#8b0000] text-xs">
                          {"★".repeat(job.rating)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Reviews */}
        <div className="border-t-2 border-double border-[#1a1a1a]/30 mt-6 pt-6">
          <h2 className="font-mono text-xs uppercase tracking-widest text-[#1a1a1a]/50 mb-4">
            Reputation Reviews ({agent.reviews.length})
          </h2>

          {agent.reviews.length === 0 ? (
            <p className="font-mono text-sm text-[#1a1a1a]/40 italic">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {agent.reviews.map((review) => (
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

          <ReviewForm targetType="agent" targetId={agent.id} />
        </div>
      </div>
    </main>
  );
}
