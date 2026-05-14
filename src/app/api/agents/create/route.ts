import { NextRequest, NextResponse } from "next/server";
import { Prisma, type AgentFamilyCode } from "@prisma/client";
import { defaultAgentFamilyName, normalizeAgentFamilyCode } from "@/lib/agent-family";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function isValidRoyaltyBps(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function prismaUniqueConflictFields(error: Prisma.PrismaClientKnownRequestError): string[] {
  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.filter((field): field is string => typeof field === "string");
  }
  return typeof target === "string" ? [target] : [];
}

/**
 * POST /api/agents/create
 * Create a new agent + upsert user from Privy
 *
 * Body: {
 *   privyId: string;        // from Privy session
 *   email?: string;
 *   walletAddress?: string;
 *   displayName?: string;
 *   avatarUrl?: string;
 *   agent: {
 *     name: string;
 *     description: string;
 *     avatar?: string;      // emoji or image URL
 *     familyCode?: string;  // R8 | SLR | BYR | NEG | VFY (SLL-R aliases to SLR)
 *     familyName?: string;
 *     nfaId?: string;
 *     agentIdentity?: string;
 *     proofLevel?: string;
 *     serviceEndpoint?: string;
 *     royaltyBps?: number;
 *     lineageRoot?: string;
 *     lineageParent?: string;
 *     skillIds?: string[];  // pre-selected skills to equip
 *   }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { privyId, email, walletAddress, displayName, avatarUrl, agent } = body;

    if (!privyId || !agent?.name || !agent?.description) {
      return NextResponse.json(
        { error: "Missing required fields: privyId, agent.name, agent.description" },
        { status: 400 }
      );
    }

    let familyCode: AgentFamilyCode;
    try {
      familyCode = normalizeAgentFamilyCode(agent.familyCode);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid agent family code";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const royaltyBps = agent.royaltyBps ?? 0;
    if (!isValidRoyaltyBps(royaltyBps)) {
      return NextResponse.json(
        { error: "agent.royaltyBps must be a non-negative integer" },
        { status: 400 }
      );
    }

    // Upsert user from Privy identity
    const user = await prisma.user.upsert({
      where: { privyId },
      update: {
        ...(email && { email }),
        ...(walletAddress && { walletAddress }),
        ...(displayName && { displayName }),
        ...(avatarUrl && { avatarUrl }),
      },
      create: {
        privyId,
        email: email ?? null,
        walletAddress: walletAddress ?? null,
        displayName: displayName ?? null,
        avatarUrl: avatarUrl ?? null,
      },
    });

    // Create the agent
    const newAgent = await prisma.agent.create({
      data: {
        name: agent.name,
        description: agent.description,
        avatar: agent.avatar ?? "🤖",
        familyCode,
        familyName: agent.familyName ?? defaultAgentFamilyName(familyCode),
        nfaId: agent.nfaId ?? null,
        agentIdentity: agent.agentIdentity ?? null,
        proofLevel: agent.proofLevel ?? "identity",
        serviceEndpoint: agent.serviceEndpoint ?? null,
        royaltyBps,
        lineageRoot: agent.lineageRoot ?? null,
        lineageParent: agent.lineageParent ?? null,
        ownerId: user.id,
      },
    });

    // Equip pre-selected skills (if any)
    if (agent.skillIds?.length) {
      const validSkills = await prisma.skill.findMany({
        where: { id: { in: agent.skillIds } },
        select: { id: true },
      });

      if (validSkills.length > 0) {
        for (const s of validSkills) {
          await prisma.agentSkill.upsert({
            where: { agentId_skillId: { agentId: newAgent.id, skillId: s.id } },
            update: {},
            create: { agentId: newAgent.id, skillId: s.id },
          });
        }
      }
    }

    // Return agent with equipped skills
    const result = await prisma.agent.findUnique({
      where: { id: newAgent.id },
      include: {
        skills: { include: { skill: true } },
        owner: true,
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const fields = prismaUniqueConflictFields(err);
      const message =
        fields.length > 0
          ? `Agent uniqueness conflict on: ${fields.join(", ")}`
          : "Agent uniqueness conflict: nfaId and agentIdentity must be unique";
      return NextResponse.json({ error: message, fields }, { status: 409 });
    }

    console.error("[POST /api/agents/create]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
