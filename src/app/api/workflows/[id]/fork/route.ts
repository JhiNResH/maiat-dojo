import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const forkInput = z.object({
  name: z.string().min(1).max(120).optional(),
  slug: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().min(1).max(1000).optional(),
});

function defaultForkSlug(parentSlug: string) {
  return `${parentSlug}-fork-${Date.now().toString(36)}`;
}

/**
 * POST /api/workflows/[id]/fork
 *
 * Creates fork metadata. It does not deploy execution infra yet; that is the
 * next step after the creator edits prompts/tools/API keys.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing Authorization: Bearer <api_key>' },
      { status: 401 },
    );
  }

  const apiKey = auth.slice(7).trim();
  const user = await prisma.user.findUnique({ where: { apiKey } });
  if (!user) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const raw = await req.json().catch(() => ({}));
  const parsed = forkInput.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid fork body' }, { status: 400 });
  }

  const parent = await prisma.workflow.findFirst({
    where: {
      OR: [{ id: params.id }, { slug: params.id }],
    },
    include: {
      versions: {
        orderBy: { version: 'desc' },
        take: 1,
      },
    },
  });
  if (!parent) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }

  const latest = parent.versions[0];
  if (!latest) {
    return NextResponse.json({ error: 'Workflow has no version to fork' }, { status: 409 });
  }

  const childSlug = parsed.data.slug ?? defaultForkSlug(parent.slug);
  try {
    const result = await prisma.$transaction(async (tx) => {
      const child = await tx.workflow.create({
        data: {
          slug: childSlug,
          name: parsed.data.name ?? `${parent.name} Fork`,
          description: parsed.data.description ?? parent.description,
          category: parent.category,
          icon: parent.icon,
          status: 'draft',
          pricePerRun: parent.pricePerRun,
          royaltyBps: parent.royaltyBps,
          creatorId: user.id,
        },
      });

      const version = await tx.workflowVersion.create({
        data: {
          workflowId: child.id,
          version: 1,
          title: child.name,
          summary: latest.summary,
          inputSchema: latest.inputSchema,
          outputSchema: latest.outputSchema,
          stepGraph: latest.stepGraph,
          evaluatorPolicy: latest.evaluatorPolicy,
          slaMs: latest.slaMs,
        },
      });

      const fork = await tx.workflowFork.create({
        data: {
          parentWorkflowId: parent.id,
          childWorkflowId: child.id,
          creatorId: user.id,
          royaltyBps: parent.royaltyBps,
        },
      });

      await tx.workflow.update({
        where: { id: parent.id },
        data: { forkCount: { increment: 1 } },
      });

      return { child, version, fork };
    });

    return NextResponse.json(
      {
        workflow: result.child,
        version: result.version,
        fork: result.fork,
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Fork failed';
    if (message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Workflow slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
