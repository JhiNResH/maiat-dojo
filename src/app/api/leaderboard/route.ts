import { NextRequest, NextResponse } from "next/server";
import { DEMO_WORKFLOWS } from "@/lib/demo-catalog";
import { prisma } from "@/lib/prisma";
import { publicWorkflowWhere } from "@/lib/public-workflow-filter";
import { buildWorkflowSpiritProfile } from "@/lib/workflow-spirit";

export const dynamic = "force-dynamic";

function demoSpiritRows(limit: number, excludeSlugs = new Set<string>()) {
  return DEMO_WORKFLOWS
    .filter((workflow) => !excludeSlugs.has(workflow.slug))
    .slice(0, limit)
    .map((workflow) => {
      const spirit = buildWorkflowSpiritProfile({
        workflowId: workflow.id,
        slug: workflow.slug,
        name: workflow.name,
        category: workflow.category,
        creatorId: workflow.creator.id,
        creatorName: workflow.creator.displayName,
        runCount: workflow.runs,
        forkCount: workflow.forks,
        trustScore: workflow.trust_score,
        royaltyBps: workflow.royalty_bps,
      });
      return {
        id: workflow.id,
        slug: workflow.slug,
        name: workflow.name,
        category: workflow.category,
        creator: workflow.creator,
        runs: workflow.runs,
        forks: workflow.forks,
        trust_score: workflow.trust_score,
        price_per_run: workflow.price_per_run,
        royalty_bps: workflow.royalty_bps,
        spirit,
      };
    });
}

/**
 * GET /api/leaderboard
 * Returns top agents or creators by various criteria
 *
 * Query params:
 *   type?: "spirits" | "agents" | "creators"  (default: "spirits")
 *   sort?: "earnings" | "jobs" | "xp" | "rating"  (default: "earnings") - for agents
 *   limit?: number (default 20, max 100)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "spirits";
  const sort = searchParams.get("sort") ?? "earnings";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);

  if (type === "spirits") {
    try {
      const workflows = await prisma.workflow.findMany({
        where: publicWorkflowWhere(),
        orderBy: [{ trustScore: "desc" }, { runCount: "desc" }, { forkCount: "desc" }],
        take: limit,
        select: {
          id: true,
          slug: true,
          name: true,
          category: true,
          runCount: true,
          forkCount: true,
          trustScore: true,
          royaltyBps: true,
          pricePerRun: true,
          creator: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      const mapped = workflows.map((workflow) => {
        const spirit = buildWorkflowSpiritProfile({
          workflowId: workflow.id,
          slug: workflow.slug,
          name: workflow.name,
          category: workflow.category,
          creatorId: workflow.creator.id,
          creatorName: workflow.creator.displayName,
          runCount: workflow.runCount,
          forkCount: workflow.forkCount,
          trustScore: workflow.trustScore,
          royaltyBps: workflow.royaltyBps,
        });
        return {
          id: workflow.id,
          slug: workflow.slug,
          name: workflow.name,
          category: workflow.category,
          creator: workflow.creator,
          runs: workflow.runCount,
          forks: workflow.forkCount,
          trust_score: workflow.trustScore,
          price_per_run: workflow.pricePerRun,
          royalty_bps: workflow.royaltyBps,
          spirit,
        };
      });
      const realSlugs = new Set(mapped.map((workflow) => workflow.slug));
      const withDemo = [
        ...mapped,
        ...demoSpiritRows(Math.max(0, limit - mapped.length), realSlugs),
      ].slice(0, limit);

      return NextResponse.json({
        type: "spirits",
        count: withDemo.length,
        spirits: withDemo,
        fallback: mapped.length === 0 && withDemo.length > 0 ? "demo_catalog" : undefined,
      });
    } catch (error) {
      console.error("[GET /api/leaderboard?type=spirits] failed:", error);
      const spirits = demoSpiritRows(limit);
      return NextResponse.json({
        type: "spirits",
        count: spirits.length,
        spirits,
        fallback: "demo_catalog",
      });
    }
  }

  // Handle creators leaderboard
  if (type === "creators") {
    // Get all creators with their skills and purchase data
    const creators = await prisma.user.findMany({
      where: {
        createdSkills: {
          some: {},
        },
      },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
        createdSkills: {
          select: {
            id: true,
            name: true,
            icon: true,
            price: true,
            rating: true,
            installs: true,
            purchases: {
              where: { status: "completed" },
              select: { amount: true },
            },
          },
        },
      },
    });

    // Calculate aggregate stats for each creator
    const creatorsWithStats = creators.map((creator) => {
      const totalSales = creator.createdSkills.reduce(
        (sum, skill) => sum + skill.installs,
        0
      );
      const totalRevenue = creator.createdSkills.reduce(
        (sum, skill) =>
          sum + skill.purchases.reduce((pSum, p) => pSum + p.amount, 0),
        0
      );
      const allRatings = creator.createdSkills
        .filter((s) => s.rating > 0)
        .map((s) => s.rating);
      const avgRating =
        allRatings.length > 0
          ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
          : 0;

      return {
        id: creator.id,
        displayName: creator.displayName,
        avatarUrl: creator.avatarUrl,
        totalSales,
        totalRevenue,
        avgRating,
        skillCount: creator.createdSkills.length,
      };
    });

    // Sort by total revenue (descending)
    creatorsWithStats.sort((a, b) => b.totalRevenue - a.totalRevenue);

    return NextResponse.json({
      type: "creators",
      count: Math.min(creatorsWithStats.length, limit),
      creators: creatorsWithStats.slice(0, limit),
    });
  }

  // Default: agents leaderboard
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
    type: "agents",
    sort,
    count: agents.length,
    agents,
  });
}
