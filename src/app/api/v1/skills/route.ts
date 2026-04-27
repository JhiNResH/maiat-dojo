import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEMO_SKILLS, toV1Skill } from '@/lib/demo-catalog';

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
  const fallback = () => {
    const skills = DEMO_SKILLS.map(toV1Skill);
    return NextResponse.json({ skills, count: skills.length, demo: true });
  };

  let skills;
  try {
    skills = await prisma.skill.findMany({
      where: {
        skillType: 'active',
        endpointUrl: { not: null },
        gatewaySlug: { not: null },
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
            runCount: true,
            forkCount: true,
            royaltyBps: true,
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
    console.warn('[GET /api/v1/skills] falling back to demo catalog:', error);
    return fallback();
  }

  if (skills.length === 0) {
    return fallback();
  }

  const result = skills.map((s) => ({
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
    workflow: s.workflow
      ? {
          id: s.workflow.id,
          slug: s.workflow.slug,
          runs: s.workflow.runCount,
          forks: s.workflow.forkCount,
          royalty_bps: s.workflow.royaltyBps,
          version: s.workflow.versions[0] ?? null,
        }
      : null,
  }));

  return NextResponse.json({ skills: result, count: result.length });
}
