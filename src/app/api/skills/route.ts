import { NextRequest, NextResponse } from "next/server";
import { filterDemoSkills, toPublicSkill } from "@/lib/demo-catalog";
import { isLegacyWorkflowSlug } from "@/lib/legacy-workflow-slugs";
import { prisma } from "@/lib/prisma";
import { fetchLatestMaturityReceiptsByWorkflowId } from "@/lib/maturity-receipts";
import { publicWorkflowWhere } from "@/lib/public-workflow-filter";
import { validateRegisteredWorkflowSlug } from "@/lib/swap-router";
import { buildWorkflowSpiritProfile } from "@/lib/workflow-spirit";
import {
  computeMaturityEvidenceFromReceipts,
  computeSkillMaturity,
  groupMaturityReceiptsByWorkflowId,
} from "@/lib/skill-maturity";

export const dynamic = "force-dynamic";

function demoSkillCatalogItems({
  q,
  category,
  freeOnly,
  limit,
  offset = 0,
  excludeGatewaySlugs = new Set<string>(),
}: {
  q?: string;
  category?: string;
  freeOnly?: boolean;
  limit: number;
  offset?: number;
  excludeGatewaySlugs?: Set<string>;
}) {
  const demo = filterDemoSkills({ q, category, freeOnly, limit, offset });
  const skills = demo.skills
    .filter((skill) => !excludeGatewaySlugs.has(skill.gatewaySlug))
    .map((skill) => {
      const publicSkill = toPublicSkill(skill);
      const maturity = computeSkillMaturity({
        evaluationPassed: publicSkill.evaluationPassed,
        evaluationScore: publicSkill.evaluationScore,
        version: publicSkill.workflowVersion.version,
      });

      return {
        ...publicSkill,
        callCount: skill.callCount,
        trustScore: skill.trustScore,
        workflowId: skill.workflowId,
        workflowSlug: skill.workflowSlug,
        workflowRunCount: skill.workflowRunCount,
        workflowForkCount: skill.workflowForkCount,
        royaltyBps: skill.royaltyBps,
        maturity,
        registryStatus: null,
        spirit: buildWorkflowSpiritProfile({
          workflowId: skill.workflowId,
          slug: skill.workflowSlug,
          name: skill.name,
          category: skill.category,
          creatorId: publicSkill.creator.id,
          creatorName: publicSkill.creator.displayName,
          runCount: skill.workflowRunCount,
          forkCount: skill.workflowForkCount,
          trustScore: skill.trustScore,
          royaltyBps: skill.royaltyBps,
        }),
      };
    });

  return { total: demo.total, skills };
}

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
    skillType: "active",
    endpointUrl: { not: null },
    gatewaySlug: { not: null },
    workflow: { is: publicWorkflowWhere() },
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

  let skills;
  try {
    skills = await prisma.skill.findMany({
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
            name: true,
            category: true,
            pricePerRun: true,
            runCount: true,
            forkCount: true,
            trustScore: true,
            royaltyBps: true,
            creatorId: true,
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
    });
  } catch (error) {
    console.error("[GET /api/skills] failed:", error);
    const demo = demoSkillCatalogItems({ q, category, freeOnly, limit, offset });
    return NextResponse.json({ total: demo.total, skills: demo.skills, fallback: "demo_catalog" });
  }

  const visibleSkills = skills.filter(
    (skill) => !isLegacyWorkflowSlug(skill.gatewaySlug) && !isLegacyWorkflowSlug(skill.workflow?.slug),
  );

  const workflowIds = visibleSkills
    .map((skill) => skill.workflow?.id)
    .filter((id): id is string => Boolean(id));
  const receiptRows = await fetchLatestMaturityReceiptsByWorkflowId(workflowIds);
  const receiptsByWorkflowId = groupMaturityReceiptsByWorkflowId(receiptRows);

  const registryBySlug = new Map<string, Awaited<ReturnType<typeof validateRegisteredWorkflowSlug>>>();
  for (const skill of visibleSkills) {
    if (!skill.gatewaySlug) continue;
    const registry = await validateRegisteredWorkflowSlug(skill.gatewaySlug);
    registryBySlug.set(skill.gatewaySlug, registry);
  }

  const mapped = visibleSkills.map((s) => {
    const registry = s.gatewaySlug ? registryBySlug.get(s.gatewaySlug) : null;
    const workflowVersion = s.workflow?.versions[0] ?? null;
    const maturity = computeSkillMaturity(computeMaturityEvidenceFromReceipts(
      s.workflow ? receiptsByWorkflowId.get(s.workflow.id) ?? [] : [],
      {
        evaluationPassed: s.evaluationPassed,
        evaluationScore: s.evaluationScore,
        version: workflowVersion?.version ?? null,
      },
    ));
    return {
      ...s,
      callCount: s._count.sessions,
      trustScore: s.workflow?.trustScore ?? s.evaluationScore ?? 0,
      workflowId: s.workflow?.id ?? null,
      workflowSlug: s.workflow?.slug ?? null,
      workflowRunCount: s.workflow?.runCount ?? s._count.sessions,
      workflowForkCount: s.workflow?.forkCount ?? 0,
      royaltyBps: s.workflow?.royaltyBps ?? null,
      workflowVersion,
      maturity,
      registryStatus: registry
        ? {
            ok: registry.ok,
            status: registry.status,
            code: registry.code ?? null,
            reason: registry.reason ?? null,
            skillId: registry.skillId,
            registry: registry.registry,
          }
        : null,
      spirit: s.workflow
        ? buildWorkflowSpiritProfile({
            workflowId: s.workflow.id,
            slug: s.workflow.slug,
            name: s.workflow.name,
            category: s.workflow.category,
            creatorId: s.workflow.creatorId,
            creatorName: s.creator.displayName,
            runCount: s.workflow.runCount,
            forkCount: s.workflow.forkCount,
            trustScore: s.workflow.trustScore,
            royaltyBps: s.workflow.royaltyBps,
          })
        : null,
    };
  });

  const realGatewaySlugs = new Set(
    mapped.map((skill) => skill.gatewaySlug).filter((slug): slug is string => Boolean(slug)),
  );
  const demo =
    mapped.length < limit
      ? demoSkillCatalogItems({
          q,
          category,
          freeOnly,
          limit: limit - mapped.length,
          excludeGatewaySlugs: realGatewaySlugs,
        })
      : { total: 0, skills: [] };
  const result = [...mapped, ...demo.skills].slice(0, limit);

  return NextResponse.json({
    total: visibleSkills.length + demo.skills.length,
    skills: result,
    fallback: visibleSkills.length === 0 && demo.skills.length > 0 ? "demo_catalog" : undefined,
  });
}
