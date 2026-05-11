import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { publicWorkflowWhere } from '@/lib/public-workflow-filter';
import { validateRegisteredWorkflowSlug } from '@/lib/swap-router';
import { buildWorkflowSpiritProfile } from '@/lib/workflow-spirit';
import {
  computeMaturityEvidenceFromReceipts,
  computeSkillMaturity,
  groupMaturityReceiptsByWorkflowId,
} from '@/lib/skill-maturity';

export const dynamic = 'force-dynamic';

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
    return NextResponse.json({ error: 'Failed to load workflows' }, { status: 500 });
  }

  const workflowIds = workflows.map((workflow) => workflow.id);
  const receiptRows = workflowIds.length > 0
    ? await prisma.workflowRunReceipt.findMany({
        where: { workflowId: { in: workflowIds } },
        orderBy: { createdAt: 'desc' },
        take: Math.min(1000, Math.max(100, workflowIds.length * 20)),
        select: {
          workflowId: true,
          settlementStatus: true,
          score: true,
          skillVersion: true,
          contextRefs: true,
          artifactRefs: true,
          evaluatorEvidence: true,
          lineageDepth: true,
        },
      })
    : [];
  const receiptsByWorkflowId = groupMaturityReceiptsByWorkflowId(receiptRows);

  const registryBySlug = new Map<string, Awaited<ReturnType<typeof validateRegisteredWorkflowSlug>>>();
  for (const workflow of workflows) {
    const slug = workflow.skill?.gatewaySlug ?? workflow.slug;
    const registry = await validateRegisteredWorkflowSlug(slug);
    registryBySlug.set(slug, registry);
  }

  return NextResponse.json({
    workflows: workflows.map((workflow) => {
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
    }),
  });
}
