import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import PurchaseCard from "@/components/PurchaseCard";
import TrustCard from "@/components/skill/TrustCard";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

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
        orderBy: { openedAt: "desc" },
        select: {
          status: true,
          callCount: true,
          basAttestationUid: true,
          openedAt: true,
          payerAgentId: true,
          calls: { select: { latencyMs: true } },
        },
      },
    },
  });

  if (!skill) notFound();

  // ─── TrustCard stats ────────────────────────────────────────────
  // (Computed next to the query so Prisma + math stay colocated.)
  const totalSessions = skill.sessions.length;
  const totalCalls = skill.sessions.reduce((sum, s) => sum + s.callCount, 0);
  const passedSessions = skill.sessions.filter((s) => s.status === "settled").length;
  const passRate = totalSessions > 0 ? Math.round((passedSessions / totalSessions) * 100) : 0;

  // Prefer evaluator-assigned score; fall back to DB-derived pass rate.
  const trustScore = skill.evaluationScore ?? passRate;

  // BAS attestation split: only sessions that emitted a uid count.
  const basPassCount = skill.sessions.filter(
    (s) => s.basAttestationUid && s.status === "settled",
  ).length;
  const basFailCount = skill.sessions.filter(
    (s) => s.basAttestationUid && s.status === "refunded",
  ).length;

  // Median latency across every SkillCall (ignores null/zero).
  const latencies = skill.sessions
    .flatMap((s) => s.calls)
    .map((c) => c.latencyMs)
    .filter((n): n is number => typeof n === "number" && n > 0)
    .sort((a, b) => a - b);
  const medianLatencyMs = latencies.length
    ? latencies[Math.floor(latencies.length / 2)]
    : null;

  // Sparkline: last 10 sessions, oldest → newest, mapped to a 0-100 score.
  // settled = 100, refunded = 20, anything in-flight = 60 (interim).
  const sparkline = [...skill.sessions]
    .slice(0, 10)
    .reverse()
    .map((s) => (s.status === "settled" ? 100 : s.status === "refunded" ? 20 : 60));

  // 7-day activity heatmap: one bucket per day, oldest on the left.
  const now = Date.now();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const dayStart = now - (6 - i) * DAY_MS;
    const dayEnd = dayStart + DAY_MS;
    return skill.sessions.some((s) => {
      const t = s.openedAt.getTime();
      return t >= dayStart && t < dayEnd;
    });
  });

  // Unique agents in the last 7 days.
  const weekAgo = now - 7 * DAY_MS;
  const uniqueAgentsThisWeek = new Set(
    skill.sessions
      .filter((s) => s.openedAt.getTime() >= weekAgo)
      .map((s) => s.payerAgentId),
  ).size;

  const creatorVerified = skill.creator.erc8004TokenId != null;
  const creatorLabel =
    skill.creator.displayName || truncateAddress(skill.creator.walletAddress);

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

        {/* ═══ TRUST DOSSIER (flagship #1, PR #18) ═══ */}
        <TrustCard
          skillName={skill.name}
          category={skill.category}
          trustScore={trustScore}
          sparkline={sparkline}
          totalSessions={totalSessions}
          totalCalls={totalCalls}
          creatorLabel={creatorLabel}
          creatorAddress={skill.creator.walletAddress}
          creatorVerified={creatorVerified}
          basPassCount={basPassCount}
          basFailCount={basFailCount}
          medianLatencyMs={medianLatencyMs}
          last7Days={last7Days}
          uniqueAgentsThisWeek={uniqueAgentsThisWeek}
        />

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
                  { label: "Payment", value: "USD per call" },
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

