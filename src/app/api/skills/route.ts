import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/skills
 * List + search skills
 *
 * Query params:
 *   q?: string          full-text search (name, description, tags)
 *   category?: string
 *   sort?: "popular" | "newest" | "price_asc" | "price_desc" | "rating"
 *   free?: "true"       filter free skills only
 *   limit?: number      (default 20, max 100)
 *   offset?: number     (default 0)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const sort = searchParams.get("sort") ?? "popular";
  const freeOnly = searchParams.get("free") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  type SkillOrderBy =
    | { installs: "desc" }
    | { createdAt: "desc" }
    | { price: "asc" }
    | { price: "desc" }
    | { rating: "desc" }
    | { evaluationScore: "desc" };

  // `trust` — sort by on-chain-backed evaluationScore DESC. Nulls sink to the
  // bottom via Prisma's default null ordering (fine for "top N").
  const orderByMap: Record<string, SkillOrderBy> = {
    popular: { installs: "desc" },
    newest: { createdAt: "desc" },
    price_asc: { price: "asc" },
    price_desc: { price: "desc" },
    rating: { rating: "desc" },
    trust: { evaluationScore: "desc" },
  };
  const orderBy: SkillOrderBy = orderByMap[sort] ?? orderByMap.popular;

  const where = {
    ...(category && { category }),
    ...(freeOnly && { price: 0 }),
    ...(q && {
      OR: [
        { name: { contains: q } },
        { description: { contains: q } },
        { tags: { contains: q } },
      ],
    }),
  };

  const [skills, total] = await Promise.all([
    prisma.skill.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
      include: {
        creator: { select: { id: true, displayName: true, avatarUrl: true } },
        _count: { select: { reviews: true, purchases: true, sessions: true } },
        workflow: {
          select: {
            id: true,
            slug: true,
            pricePerRun: true,
            runCount: true,
            forkCount: true,
            trustScore: true,
            royaltyBps: true,
            versions: {
              orderBy: { version: "desc" },
              take: 1,
              select: {
                id: true,
                version: true,
                summary: true,
                slaMs: true,
              },
            },
          },
        },
      },
    }),
    prisma.skill.count({ where }),
  ]);

  const mapped = skills.map((s) => ({
    ...s,
    callCount: s._count.sessions,
    trustScore: s.workflow?.trustScore ?? s.evaluationScore ?? 0,
    workflowId: s.workflow?.id ?? null,
    workflowSlug: s.workflow?.slug ?? null,
    workflowRunCount: s.workflow?.runCount ?? s._count.sessions,
    workflowForkCount: s.workflow?.forkCount ?? 0,
    royaltyBps: s.workflow?.royaltyBps ?? null,
    workflowVersion: s.workflow?.versions[0] ?? null,
  }));

  return NextResponse.json({ total, skills: mapped });
}
