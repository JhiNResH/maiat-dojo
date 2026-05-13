import { NextRequest, NextResponse } from 'next/server';
import { filterDemoWorkflows } from '@/lib/demo-catalog';
import { prisma } from '@/lib/prisma';
import { fetchLatestMaturityReceiptsByWorkflowId } from '@/lib/maturity-receipts';
import { publicWorkflowWhere } from '@/lib/public-workflow-filter';
import { validateRegisteredWorkflowSlug } from '@/lib/swap-router';
import { buildWorkflowSpiritProfile } from '@/lib/workflow-spirit';
import {
  computeMaturityEvidenceFromReceipts,
  computeSkillMaturity,
  groupMaturityReceiptsByWorkflowId,
} from '@/lib/skill-maturity';

export const dynamic = 'force-dynamic';

function demoWorkflowCatalogItems({
  q,
  category,
  limit,
  excludeSlugs = new Set<string>(),
}: {
  q?: string;
  category?: string;
  limit: number;
  excludeSlugs?: Set<string>;
}) {
  return filterDemoWorkflows({ q, category, limit })
    .filter((workflow) => !excludeSlugs.has(workflow.slug))
    .map((workflow) => {
      const maturity = computeSkillMaturity({
        evaluationPassed: workflow.trust_score >= 80,
        evaluationScore: workflow.trust_score,
        version: workflow.version.version,
      });
      return {
        ...workflow,
        maturity,
        registry_status: null,
        spirit: buildWorkflowSpiritProfile({
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
        }),
      };
    });
}

/**
 * GET /api/workflows
 *
 * Public workflow catalog. Skills remain the execution target for v1, but
 * workflows are the product object: run, fork, deploy, and reputation history.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  const category = searchParams.get('category')?.trim();
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '24', 10), 100);

  let workflows;
  try {
    workflows = await prisma.workflow.findMany({
      where: {
        ...publicWorkflowWhere(),
        ...(category && { category }),
        ...(q && {
          OR: [
            { name: { contains: q } },
            { description: { contains: q } },
            { slug: { contains: q } },
          ],
        }),
      },
      orderBy: [{ trustScore: 'desc' }, { runCount: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      include: {
        creator: { select: { id: true, displayName: true, avatarUrl: true } },
        skill: {
          select: {
            id: true,
            gatewaySlug: true,
            pricePerCall: true,
            evaluationPassed: true,
            evaluationScore: true,
          },
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
          select: { id: true, version: true, summary: true, slaMs: true },
        },
      },
    });
  } catch (error) {
    console.error('[GET /api/workflows] failed:', error);
    return NextResponse.json({
      workflows: demoWorkflowCatalogItems({ q, category, limit }),
      fallback: 'demo_catalog',
    });
  }

  const workflowIds = workflows.map((workflow) => workflow.id);
  const receiptRows = await fetchLatestMaturityReceiptsByWorkflowId(workflowIds);
  const receiptsByWorkflowId = groupMaturityReceiptsByWorkflowId(receiptRows);

  const registryBySlug = new Map<string, Awaited<ReturnType<typeof validateRegisteredWorkflowSlug>>>();
  for (const workflow of workflows) {
    const slug = workflow.skill?.gatewaySlug ?? workflow.slug;
    const registry = await validateRegisteredWorkflowSlug(slug);
    registryBySlug.set(slug, registry);
  }

  const mapped = workflows.map((workflow) => {
      const slug = workflow.skill?.gatewaySlug ?? workflow.slug;
      const registry = registryBySlug.get(slug);
      const version = workflow.versions[0] ?? null;
      const maturity = computeSkillMaturity(computeMaturityEvidenceFromReceipts(
        receiptsByWorkflowId.get(workflow.id) ?? [],
        {
          evaluationPassed: workflow.skill?.evaluationPassed,
          evaluationScore: workflow.skill?.evaluationScore,
          version: version?.version ?? null,
        },
      ));
      return {
        id: workflow.id,
        slug: workflow.slug,
        name: workflow.name,
        description: workflow.description,
        category: workflow.category,
        icon: workflow.icon,
        price_per_run: workflow.pricePerRun,
        royalty_bps: workflow.royaltyBps,
        runs: workflow.runCount,
        forks: workflow.forkCount,
        trust_score: workflow.trustScore,
        maturity,
        registry_status: registry
          ? {
              ok: registry.ok,
              status: registry.status,
              code: registry.code ?? null,
              reason: registry.reason ?? null,
              skill_id: registry.skillId,
              registry: registry.registry,
            }
          : null,
        spirit: buildWorkflowSpiritProfile({
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
        }),
        creator: workflow.creator,
        executable_skill: workflow.skill,
        version,
      };
    });
  const realSlugs = new Set(mapped.map((workflow) => workflow.slug));
  const withDemo = [
    ...mapped,
    ...demoWorkflowCatalogItems({
      q,
      category,
      limit: Math.max(0, limit - mapped.length),
      excludeSlugs: realSlugs,
    }),
  ].slice(0, limit);

  return NextResponse.json({
    workflows: withDemo,
    fallback: mapped.length === 0 && withDemo.length > 0 ? 'demo_catalog' : undefined,
  });
}
