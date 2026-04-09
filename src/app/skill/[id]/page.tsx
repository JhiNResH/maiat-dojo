import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import PurchaseCard from "@/components/PurchaseCard";

export const dynamic = "force-dynamic";

function truncateAddress(address: string | null | undefined): string {
  if (!address) return "—";
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
      sessions: {
        where: { status: { in: ["settled", "refunded"] } },
        select: { callCount: true, status: true },
      },
    },
  });

  if (!skill) notFound();

  // Real stats from DB
  const totalCalls = skill.sessions.reduce((sum, s) => sum + s.callCount, 0);
  const totalSessions = skill.sessions.length;
  const passedSessions = skill.sessions.filter((s) => s.status === "settled").length;
  const passRate = totalSessions > 0 ? Math.round((passedSessions / totalSessions) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#f0ece2]">
      <div className="max-w-3xl mx-auto px-6 py-8 page-container">
        {/* ═══ BACK ═══ */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#1a1a1a]/40 hover:text-[#1a1a1a] transition-colors mb-8"
        >
          <ArrowLeft size={12} />
          The Dojo
        </Link>

        {/* ═══ MASTHEAD ═══ */}
        <div className="masthead-rule mb-1" />
        <div className="h-[1px] bg-[#1a1a1a]/20 mb-1" />
        <div className="masthead-rule mb-6" />

        {/* ═══ HEADLINE ═══ */}
        <header className="mb-8">
          {skill.category && (
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#1a1a1a]/40 block mb-3">
              {skill.category}
            </span>
          )}
          <h1 className="font-serif font-black text-5xl text-[#1a1a1a] leading-[0.95] mb-4">
            {skill.name}
          </h1>
          <p className="font-serif italic text-sm text-[#1a1a1a]/50">
            by {skill.creator.displayName || truncateAddress(skill.creator.walletAddress)} &middot; Listed {formatDate(skill.createdAt)}
          </p>
        </header>

        {/* ═══ STATS BAR ═══ */}
        <div className="flex divide-x divide-[#1a1a1a]/15 border-y border-[#1a1a1a]/15 mb-8">
          <div className="flex-1 text-center py-4">
            <span className="font-serif font-black text-2xl text-[#1a1a1a] block leading-none">
              {skill.pricePerCall ? `$${skill.pricePerCall.toFixed(2)}` : "FREE"}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#1a1a1a]/40 block mt-1">
              Per Call
            </span>
          </div>
          <div className="flex-1 text-center py-4">
            <span className="font-serif font-black text-2xl text-[#1a1a1a] block leading-none">
              {totalCalls.toLocaleString()}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#1a1a1a]/40 block mt-1">
              Total Calls
            </span>
          </div>
          <div className="flex-1 text-center py-4">
            <span className="font-serif font-black text-2xl text-[#1a1a1a] block leading-none">
              {totalSessions}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#1a1a1a]/40 block mt-1">
              Sessions
            </span>
          </div>
          <div className="flex-1 text-center py-4">
            <span className="font-serif font-black text-2xl text-[#1a1a1a] block leading-none">
              <TrustBar score={skill.evaluationScore ?? 0} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#1a1a1a]/40 block mt-1">
              Trust Score
            </span>
          </div>
        </div>

        {/* ═══ TWO-COLUMN ═══ */}
        <div className="grid md:grid-cols-[1fr_260px] gap-8">
          {/* ─── LEFT ─── */}
          <div>
            {/* Description */}
            <section className="mb-8">
              <div className="section-header mb-4">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#1a1a1a]/60">
                  About This Skill
                </span>
              </div>
              <div className="font-serif text-base text-[#1a1a1a]/80 leading-relaxed">
                {(skill.longDescription || skill.description || "No description provided.")
                  .split("\n\n")
                  .map((p, i) => (
                    <p key={i} className={`mb-4 ${i === 0 ? "drop-cap" : ""}`}>
                      {p}
                    </p>
                  ))}
              </div>
            </section>

            {/* Session History */}
            {totalSessions > 0 && (
              <section className="mb-8">
                <div className="section-header mb-4">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#1a1a1a]/60">
                    Session History
                  </span>
                </div>
                <div className="classified" data-label="Stats">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-mono text-[10px] text-[#1a1a1a]/40 uppercase tracking-wider block mb-1">
                        Pass Rate
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-[#1a1a1a]/10 overflow-hidden">
                          <div
                            className="h-full bg-[#1a1a1a]"
                            style={{ width: `${passRate}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs font-bold text-[#1a1a1a]">{passRate}%</span>
                      </div>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] text-[#1a1a1a]/40 uppercase tracking-wider block mb-1">
                        Avg Calls / Session
                      </span>
                      <span className="font-mono text-sm font-bold text-[#1a1a1a]">
                        {totalSessions > 0 ? (totalCalls / totalSessions).toFixed(1) : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* ─── RIGHT SIDEBAR ─── */}
          <aside className="flex flex-col gap-5">
            {/* Purchase / Fund card — client component */}
            <PurchaseCard
              skill={{
                id: skill.id,
                name: skill.name,
                skillType: skill.skillType,
                price: skill.price,
                pricePerCall: skill.pricePerCall,
                gatewaySlug: skill.gatewaySlug,
                fileContent: skill.fileContent,
              }}
            />

            {/* Specification */}
            <div className="classified" data-label="Specification">
              <div className="space-y-0">
                {[
                  { label: "Network", value: "BNB Smart Chain" },
                  { label: "Settlement", value: "ERC-8183 Escrow" },
                  { label: "Payment", value: "USDC per call" },
                  { label: "Category", value: skill.category || "—" },
                  { label: "Listed", value: formatDate(skill.createdAt) },
                  { label: "Updated", value: formatDate(skill.updatedAt) },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex justify-between items-center py-2 border-b border-dotted border-[#1a1a1a]/15 last:border-b-0"
                  >
                    <span className="font-mono text-[10px] text-[#1a1a1a]/40 uppercase tracking-wider">
                      {label}
                    </span>
                    <span className="font-mono text-[10px] text-[#1a1a1a] font-bold">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Creator */}
            <div className="classified" data-label="Creator">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-[#f0ece2] shrink-0"
                  style={{
                    backgroundColor: `hsl(${((skill.creator.id?.charCodeAt(0) ?? 0) * 37) % 360}, 30%, 40%)`,
                  }}
                >
                  {(skill.creator.displayName || "?")[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-serif font-bold text-sm text-[#1a1a1a]">
                    {skill.creator.displayName || "Anonymous"}
                  </div>
                  <div className="font-mono text-[10px] text-[#1a1a1a]/40">
                    {truncateAddress(skill.creator.walletAddress)}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* ═══ FOOTER ═══ */}
        <footer className="mt-10">
          <div className="masthead-rule mb-1" />
          <div className="h-[1px] bg-[#1a1a1a]/20 mb-1" />
          <div className="masthead-rule mb-3" />
          <div className="flex justify-between items-center py-2">
            <span className="font-mono text-[10px] text-[#1a1a1a]/25 tracking-wider uppercase">
              The Dojo &copy; 2026 &middot; Maiat Protocol &middot; BSC
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

// --- Trust Score Bar ---

function TrustBar({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  const filled = Math.round(clamped / 10);

  return (
    <div className="flex items-center gap-1.5 justify-center">
      <div className="flex gap-[2px]">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`w-[5px] h-3 ${
              i < filled ? "bg-[#1a1a1a]" : "bg-[#1a1a1a]/10"
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-mono text-[#1a1a1a]/50">{clamped}</span>
    </div>
  );
}
