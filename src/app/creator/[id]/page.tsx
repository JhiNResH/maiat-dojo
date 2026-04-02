import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CreatorPage({
  params,
}: {
  params: { id: string };
}) {
  const creator = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      walletAddress: true,
      createdAt: true,
      createdSkills: {
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          icon: true,
          price: true,
          currency: true,
          rating: true,
          installs: true,
          createdAt: true,
          purchases: {
            select: {
              amount: true,
              status: true,
            },
          },
        },
        orderBy: { installs: "desc" },
      },
    },
  });

  if (!creator) notFound();

  // Calculate aggregate stats
  const totalSales = creator.createdSkills.reduce(
    (sum, skill) => sum + skill.installs,
    0
  );

  const allRatings = creator.createdSkills
    .filter((s) => s.rating > 0)
    .map((s) => s.rating);
  const avgRating =
    allRatings.length > 0
      ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
      : 0;

  // Calculate total revenue from completed purchases
  let totalRevenue = 0;
  let completedPurchases = 0;
  let refundedPurchases = 0;

  creator.createdSkills.forEach((skill) => {
    skill.purchases.forEach((purchase) => {
      if (purchase.status === "completed") {
        totalRevenue += purchase.amount;
        completedPurchases++;
      } else if (purchase.status === "refunded") {
        refundedPurchases++;
      }
    });
  });

  const totalPurchases = completedPurchases + refundedPurchases;
  const refundRate =
    totalPurchases > 0 ? (refundedPurchases / totalPurchases) * 100 : 0;

  const memberSince = new Date(creator.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <main className="min-h-screen bg-[#f0ece2]">
      {/* Paper texture */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{
          backgroundImage:
            "url('data:image/svg+xml,%3Csvg width=\"200\" height=\"200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noise\"%3E%3CfeTurbulence baseFrequency=\"0.9\" numOctaves=\"4\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noise)\" opacity=\"0.4\"/%3E%3C/svg%3E')",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        {/* Back */}
        <Link
          href="/"
          className="inline-block font-mono text-xs uppercase tracking-widest text-[#8b0000] hover:text-[#1a1a1a] transition-colors mb-8"
        >
          &larr; The Dojo
        </Link>

        {/* Creator header */}
        <div className="flex items-start gap-5 mb-2">
          <div className="w-20 h-20 rounded-full bg-[#1a1a1a]/10 flex items-center justify-center font-serif font-black text-3xl text-[#1a1a1a]/40">
            {creator.displayName?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <span className="inline-block font-mono text-[10px] uppercase tracking-widest text-[#1a1a1a]/40 mb-1">
              Creator Profile
            </span>
            <h1 className="font-serif font-black text-5xl md:text-6xl text-[#1a1a1a] leading-[1.05] tracking-tight">
              {creator.displayName || "Anonymous"}
            </h1>
            {creator.walletAddress && (
              <p className="font-mono text-xs text-[#1a1a1a]/40 mt-2">
                {creator.walletAddress.slice(0, 6)}...
                {creator.walletAddress.slice(-4)}
              </p>
            )}
          </div>
        </div>

        {/* Stats bar - proof over promise, numbers only */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8 mb-8">
          {[
            { label: "Total Sales", value: totalSales.toLocaleString() },
            { label: "Avg Rating", value: `${avgRating.toFixed(1)}` },
            {
              label: "Revenue",
              value: `$${totalRevenue.toFixed(2)}`,
            },
            {
              label: "Refund Rate",
              value: `${refundRate.toFixed(1)}%`,
            },
            {
              label: "Member Since",
              value: memberSince,
            },
          ].map(({ label, value }) => (
            <div key={label} className="border border-[#1a1a1a]/15 p-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#1a1a1a]/40 mb-1">
                {label}
              </div>
              <div className="font-serif font-black text-xl text-[#1a1a1a]">
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t-2 border-double border-[#1a1a1a]/30 mb-6" />

        {/* Skills Grid */}
        <h2 className="font-mono text-xs uppercase tracking-widest text-[#1a1a1a]/50 mb-4">
          Published Skills ({creator.createdSkills.length})
        </h2>

        {creator.createdSkills.length === 0 ? (
          <p className="font-mono text-sm text-[#1a1a1a]/40 italic">
            No skills published yet.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {creator.createdSkills.map((skill) => (
              <Link
                key={skill.id}
                href={`/skill/${skill.id}`}
                className="group border border-[#1a1a1a]/15 p-4 hover:border-[#8b0000]/30 transition-colors bg-[#f0ece2]"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl">{skill.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif font-bold text-[#1a1a1a] group-hover:text-[#8b0000] transition-colors truncate">
                      {skill.name}
                    </p>
                    <p className="font-mono text-[10px] text-[#1a1a1a]/40 uppercase tracking-wider">
                      {skill.category}
                    </p>
                  </div>
                </div>

                <p className="font-serif text-sm text-[#1a1a1a]/60 line-clamp-2 mb-3">
                  {skill.description}
                </p>

                <div className="flex items-center justify-between border-t border-dotted border-[#1a1a1a]/15 pt-3">
                  <div className="font-mono text-xs text-[#1a1a1a]/50">
                    <span className="text-[#1a1a1a]">
                      {skill.installs.toLocaleString()}
                    </span>{" "}
                    installs
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#1a1a1a]/50">
                      {skill.rating.toFixed(1)}
                    </span>
                    <span className="font-mono text-sm font-bold">
                      {skill.price === 0 ? (
                        <span className="text-green-800">FREE</span>
                      ) : (
                        `$${skill.price.toFixed(2)}`
                      )}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Footer note */}
        <div className="mt-8 pt-6 border-t-2 border-double border-[#1a1a1a]/30">
          <p className="font-mono text-[10px] text-[#1a1a1a]/30 text-center uppercase tracking-widest">
            Proof over promise — Numbers speak louder than words
          </p>
        </div>
      </div>
    </main>
  );
}
