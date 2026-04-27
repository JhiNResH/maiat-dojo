import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { filterDemoWorkflows } from '@/lib/demo-catalog';

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

  const fallback = () =>
    NextResponse.json({
      workflows: filterDemoWorkflows({ q, category, limit }),
      demo: true,
    });

  let workflows;
  try {
    workflows = await prisma.workflow.findMany({
      where: {
        status: 'published',
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
        skill: { select: { id: true, gatewaySlug: true, pricePerCall: true } },
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
          select: { id: true, version: true, summary: true, slaMs: true },
        },
      },
    });
  } catch (error) {
    console.warn('[GET /api/workflows] falling back to demo catalog:', error);
    return fallback();
  }

  if (workflows.length === 0) {
    return fallback();
  }

  return NextResponse.json({
    workflows: workflows.map((workflow) => ({
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
      creator: workflow.creator,
      executable_skill: workflow.skill,
      version: workflow.versions[0] ?? null,
    })),
  });
}
