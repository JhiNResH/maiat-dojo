import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateRegisteredWorkflowSlug } from "@/lib/swap-router";

export const dynamic = "force-dynamic";

/**
 * GET /api/skills/trending
 *
 * Top skills by raw session volume over the last N days. "Trending" =
 * motion-over-time, distinct from `sort=trust` which is cumulative quality.
 *
 * Query params:
 *   limit?: number  (default 5, max 50)
 *   days?: number   (default 7, max 30)
 *
 * Response: `{ skills: Array<SkillSummary & { recentSessions, recentCalls }> }`
 *
 * Implementation:
 *   1. groupBy sessions opened in window → sum(callCount), count(sessions)
 *   2. fetch those skills in one round-trip, preserving groupBy order
 *   3. zero-state: if the window is empty, fall back to freshest listings
 *
 * Spec: specs/2026-04-09-chat-first-ui.md (landing hero §Leaderboard+Trending)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "5"), 50);
  const days = Math.min(parseInt(searchParams.get("days") ?? "7"), 30);

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  let grouped;
  try {
    grouped = await prisma.session.groupBy({
      by: ["skillId"],
      where: { openedAt: { gte: since } },
      _sum: { callCount: true },
      _count: { _all: true },
      orderBy: { _count: { skillId: "desc" } },
      take: limit,
    });
  } catch (error) {
    console.error("[GET /api/skills/trending] failed:", error);
    return NextResponse.json({ error: "Failed to load trending skills" }, { status: 500 });
  }

  // Zero-state: no sessions in window → fall back to newest listings so the
  // landing surface is never empty on a fresh seed.
  if (grouped.length === 0) {
    const rows = await prisma.skill.findMany({
      where: {
        skillType: "active",
        endpointUrl: { not: null },
        gatewaySlug: { not: null },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        creator: { select: { id: true, displayName: true, avatarUrl: true } },
        workflow: {
          select: {
            id: true,
            slug: true,
            runCount: true,
            forkCount: true,
            trustScore: true,
            royaltyBps: true,
          },
        },
      },
    });

    const onchainReady: typeof rows = [];
    for (const skill of rows) {
      if (!skill.gatewaySlug) continue;
      const registry = await validateRegisteredWorkflowSlug(skill.gatewaySlug);
      if (registry.ok) {
        onchainReady.push(skill);
        continue;
      }
      if (registry.status === 503) {
        return NextResponse.json(
          {
            error: registry.error,
            code: registry.code,
            registry: registry.registry,
            reason: registry.reason,
          },
          { status: 503 },
        );
      }
    }

    return NextResponse.json({
      window: { days, since: since.toISOString() },
      zeroState: true,
      skills: onchainReady.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        category: s.category,
        pricePerCall: s.pricePerCall,
        gatewaySlug: s.gatewaySlug,
        trustScore: s.workflow?.trustScore ?? s.evaluationScore ?? 0,
        callCount: 0,
        workflowId: s.workflow?.id ?? null,
        workflowSlug: s.workflow?.slug ?? null,
        workflowRunCount: s.workflow?.runCount ?? 0,
        workflowForkCount: s.workflow?.forkCount ?? 0,
        royaltyBps: s.workflow?.royaltyBps ?? null,
        recentSessions: 0,
        recentCalls: 0,
      })),
    });
  }

  const ids = grouped.map((g) => g.skillId);
  const rows = await prisma.skill.findMany({
    where: { id: { in: ids } },
    include: {
      creator: { select: { id: true, displayName: true, avatarUrl: true } },
      _count: { select: { sessions: true } },
      workflow: {
        select: {
          id: true,
          slug: true,
          runCount: true,
          forkCount: true,
          trustScore: true,
          royaltyBps: true,
        },
      },
    },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));

  const skills = [];
  for (const g of grouped) {
      const s = byId.get(g.skillId);
      if (!s?.gatewaySlug) continue;
      const registry = await validateRegisteredWorkflowSlug(s.gatewaySlug);
      if (!registry.ok) {
        if (registry.status === 503) {
          return NextResponse.json(
            {
              error: registry.error,
              code: registry.code,
              registry: registry.registry,
              reason: registry.reason,
            },
            { status: 503 },
          );
        }
        continue;
      }
      skills.push({
        id: s.id,
        name: s.name,
        description: s.description,
        category: s.category,
        pricePerCall: s.pricePerCall,
        gatewaySlug: s.gatewaySlug,
        trustScore: s.workflow?.trustScore ?? s.evaluationScore ?? 0,
        callCount: s._count.sessions,
        workflowId: s.workflow?.id ?? null,
        workflowSlug: s.workflow?.slug ?? null,
        workflowRunCount: s.workflow?.runCount ?? s._count.sessions,
        workflowForkCount: s.workflow?.forkCount ?? 0,
        royaltyBps: s.workflow?.royaltyBps ?? null,
        recentSessions: g._count._all,
        recentCalls: g._sum.callCount ?? 0,
      });
    }

  return NextResponse.json({
    window: { days, since: since.toISOString() },
    zeroState: false,
    skills,
  });
}
