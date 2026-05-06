import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { publicWorkflowWhere } from '@/lib/public-workflow-filter';
import { validateRegisteredWorkflowSlug } from '@/lib/swap-router';
import { buildWorkflowSpiritProfile } from '@/lib/workflow-spirit';

export const dynamic = 'force-dynamic';

function safeJsonParse(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * GET /api/v1/skills
 *
 * List all active (pay-per-use) skills available for calling via /api/v1/run.
 * No auth required — this is a public catalog.
 */
export async function GET() {
  let skills;
  try {
    skills = await prisma.skill.findMany({
      where: {
        skillType: 'active',
        endpointUrl: { not: null },
        gatewaySlug: { not: null },
        workflow: { is: publicWorkflowWhere() },
      },
      select: {
        name: true,
        description: true,
        gatewaySlug: true,
        pricePerCall: true,
        category: true,
        tags: true,
        icon: true,
        estLatencyMs: true,
        inputShape: true,
        outputShape: true,
        exampleInput: true,
        exampleOutput: true,
        workflow: {
          select: {
            id: true,
            slug: true,
            name: true,
            category: true,
            runCount: true,
            forkCount: true,
            trustScore: true,
            royaltyBps: true,
            creatorId: true,
            versions: {
              orderBy: { version: 'desc' },
              take: 1,
              select: { version: true, summary: true, slaMs: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('[GET /api/v1/skills] failed:', error);
    return NextResponse.json({ error: 'Failed to load skills' }, { status: 500 });
  }

  const registryBySlug = new Map<string, Awaited<ReturnType<typeof validateRegisteredWorkflowSlug>>>();
  for (const skill of skills) {
    if (!skill.gatewaySlug) continue;
    const registry = await validateRegisteredWorkflowSlug(skill.gatewaySlug);
    registryBySlug.set(skill.gatewaySlug, registry);
  }

  const result = skills.map((s) => {
    const registry = s.gatewaySlug ? registryBySlug.get(s.gatewaySlug) : null;
    return {
      skill: s.gatewaySlug,
      name: s.name,
      description: s.description,
      price_per_call: s.pricePerCall ?? 0,
      category: s.category,
      tags: s.tags ? s.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      icon: s.icon,
      latency_ms: s.estLatencyMs,
      input_shape: s.inputShape,
      output_shape: s.outputShape,
      example_input: safeJsonParse(s.exampleInput),
      example_output: safeJsonParse(s.exampleOutput),
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
      workflow: s.workflow
        ? {
            id: s.workflow.id,
            slug: s.workflow.slug,
            runs: s.workflow.runCount,
            forks: s.workflow.forkCount,
            royalty_bps: s.workflow.royaltyBps,
            version: s.workflow.versions[0] ?? null,
            spirit: buildWorkflowSpiritProfile({
              workflowId: s.workflow.id,
              slug: s.workflow.slug,
              name: s.workflow.name,
              category: s.workflow.category,
              creatorId: s.workflow.creatorId,
              runCount: s.workflow.runCount,
              forkCount: s.workflow.forkCount,
              trustScore: s.workflow.trustScore,
              royaltyBps: s.workflow.royaltyBps,
            }),
          }
        : null,
    };
  });

  return NextResponse.json({ skills: result, count: result.length });
}
