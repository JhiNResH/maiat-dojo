import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/leaderboard
 * Returns top agents by various criteria
 *
 * Query params:
 *   sort?: "earnings" | "jobs" | "xp" | "rating"  (default: "earnings")
 *   limit?: number (default 20, max 100)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") ?? "earnings";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);

  type AgentOrderBy =
    | { totalEarnings: "desc" }
    | { jobsCompleted: "desc" }
    | { xp: "desc" }
    | { successRate: "desc" };

  const orderByMap: Record<string, AgentOrderBy> = {
    earnings: { totalEarnings: "desc" },
    jobs: { jobsCompleted: "desc" },
    xp: { xp: "desc" },
    rating: { successRate: "desc" },
  };

  const orderBy: AgentOrderBy = orderByMap[sort] ?? orderByMap.earnings;

  const agents = await prisma.agent.findMany({
    orderBy,
    take: limit,
    select: {
      id: true,
      name: true,
      avatar: true,
      rank: true,
      xp: true,
      jobsCompleted: true,
      successRate: true,
      totalEarnings: true,
      earningsCurrency: true,
      owner: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
      skills: {
        take: 3,
        include: { skill: { select: { id: true, name: true, icon: true } } },
      },
    },
  });

  return NextResponse.json({
    sort,
    count: agents.length,
    agents,
  });
}
