import { NextResponse } from 'next/server';
import { DEMO_SKILLS, toV1Skill } from '@/lib/demo-catalog';
import { prisma } from '@/lib/prisma';
import { fetchLatestMaturityReceiptsByWorkflowId } from '@/lib/maturity-receipts';
import { isLegacyWorkflowSlug } from '@/lib/legacy-workflow-slugs';
import { publicWorkflowWhere } from '@/lib/public-workflow-filter';
import { validateRegisteredWorkflowSlug } from '@/lib/swap-router';
import { buildWorkflowSpiritProfile } from '@/lib/workflow-spirit';
import {
  computeMaturityEvidenceFromReceipts,
  computeSkillMaturity,
  groupMaturityReceiptsByWorkflowId,
} from '@/lib/skill-maturity';

export const dynamic = 'force-dynamic';

function safeJsonParse(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function demoV1Skills(excludeSlugs = new Set<string>()) {
  return DEMO_SKILLS
    .filter((skill) => !excludeSlugs.has(skill.gatewaySlug))
    .map((skill) => {
      const maturity = computeSkillMaturity({
        evaluationPassed: skill.trustScore >= 80,
        evaluationScore: skill.trustScore,
        version: 1,
      });
      const row = toV1Skill(skill);
      return {
        ...row,
        maturity,
        registry_status: null,
        workflow: {
          ...row.workflow,
          maturity,
          spirit: buildWorkflowSpiritProfile({
            workflowId: skill.workflowId,
            slug: skill.workflowSlug,
            name: skill.name,
            category: skill.category,
            creatorId: 'demo-creator-maiat-dojo',
            runCount: skill.workflowRunCount,
            forkCount: skill.workflowForkCount,
            trustScore: skill.trustScore,
            royaltyBps: skill.royaltyBps,
          }),
        },
      };
    });
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
        evaluationScore: true,
        evaluationPassed: true,
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
    const result = demoV1Skills();
    return NextResponse.json({ skills: result, count: result.length, fallback: 'demo_catalog' });
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

  const result = visibleSkills.map((s) => {
    const registry = s.gatewaySlug ? registryBySlug.get(s.gatewaySlug) : null;
    const version = s.workflow?.versions[0] ?? null;
    const maturity = computeSkillMaturity(computeMaturityEvidenceFromReceipts(
      s.workflow ? receiptsByWorkflowId.get(s.workflow.id) ?? [] : [],
      {
        evaluationPassed: s.evaluationPassed,
        evaluationScore: s.evaluationScore,
        version: version?.version ?? null,
      },
    ));
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
      workflow: s.workflow
        ? {
            id: s.workflow.id,
            slug: s.workflow.slug,
            runs: s.workflow.runCount,
            forks: s.workflow.forkCount,
            royalty_bps: s.workflow.royaltyBps,
            maturity,
            version,
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

  const realSlugs = new Set(
    result.map((skill) => skill.skill).filter((slug): slug is string => Boolean(slug)),
  );
  const withDemo = [...result, ...demoV1Skills(realSlugs)];

  return NextResponse.json({
    skills: withDemo,
    count: withDemo.length,
    fallback: result.length === 0 && withDemo.length > 0 ? 'demo_catalog' : undefined,
  });
}
