import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  getDemoSkillByWorkflowId,
  toPublicSkill,
} from "@/lib/demo-catalog";
import {
  WorkflowActionClient,
  type WorkflowActionData,
} from "./WorkflowActionClient";

export const dynamic = "force-dynamic";

type WorkflowAction = "run" | "fork" | "deploy";

function isWorkflowAction(value: string): value is WorkflowAction {
  return value === "run" || value === "fork" || value === "deploy";
}

function demoWorkflowData(id: string): WorkflowActionData | null {
  const demoSkill = getDemoSkillByWorkflowId(id);
  if (!demoSkill) return null;
  const publicSkill = toPublicSkill(demoSkill);

  return {
    id: demoSkill.workflowId,
    slug: demoSkill.workflowSlug,
    name: demoSkill.name,
    description: demoSkill.description,
    category: demoSkill.category,
    pricePerRun: demoSkill.pricePerCall,
    royaltyBps: demoSkill.royaltyBps,
    runs: demoSkill.workflowRunCount,
    forks: demoSkill.workflowForkCount,
    trustScore: demoSkill.trustScore,
    creatorName: "Maiat Dojo",
    skill: {
      id: demoSkill.id,
      name: demoSkill.name,
      gatewaySlug: demoSkill.gatewaySlug,
      inputSchema: publicSkill.inputSchema,
      exampleInput: publicSkill.exampleInput,
    },
    version: {
      version: 1,
      summary: `${demoSkill.name} demo workflow`,
      slaMs: demoSkill.estLatencyMs,
    },
  };
}

async function loadWorkflow(id: string): Promise<WorkflowActionData | null> {
  try {
    const workflow = await prisma.workflow.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        creator: { select: { displayName: true, walletAddress: true } },
        skill: {
          select: {
            id: true,
            name: true,
            gatewaySlug: true,
            inputSchema: true,
            exampleInput: true,
            pricePerCall: true,
          },
        },
        versions: {
          orderBy: { version: "desc" },
          take: 1,
          select: { version: true, summary: true, slaMs: true },
        },
      },
    });

    if (!workflow) {
      return demoWorkflowData(id);
    }

    const latest = workflow.versions[0] ?? null;
    return {
      id: workflow.id,
      slug: workflow.slug,
      name: workflow.name,
      description: workflow.description,
      category: workflow.category,
      pricePerRun: workflow.pricePerRun,
      royaltyBps: workflow.royaltyBps,
      runs: workflow.runCount,
      forks: workflow.forkCount,
      trustScore: workflow.trustScore,
      creatorName:
        workflow.creator.displayName ??
        workflow.creator.walletAddress ??
        "Unknown creator",
      skill: {
        id: workflow.skill?.id ?? workflow.id,
        name: workflow.skill?.name ?? workflow.name,
        gatewaySlug: workflow.skill?.gatewaySlug ?? workflow.slug,
        inputSchema: workflow.skill?.inputSchema ?? null,
        exampleInput: workflow.skill?.exampleInput ?? null,
      },
      version: latest,
    };
  } catch (error) {
    console.warn("[GET /workflow/[id]/[action]] falling back to demo catalog:", error);
    return demoWorkflowData(id);
  }
}

export default async function WorkflowActionPage({
  params,
}: {
  params: { id: string; action: string };
}) {
  if (!isWorkflowAction(params.action)) {
    notFound();
  }

  const workflow = await loadWorkflow(params.id);
  if (!workflow) {
    notFound();
  }

  return <WorkflowActionClient action={params.action} workflow={workflow} />;
}
