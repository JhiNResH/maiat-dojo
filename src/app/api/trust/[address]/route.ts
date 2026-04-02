import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/trust/[address]
 * Open Trust Score API for third-party queries.
 *
 * Calculates trust score for an agent based on:
 * - successRate (40%)
 * - avgRating (30%)
 * - jobsCompleted (20%, capped at 100)
 * - attestationCount (10%, capped at 50)
 *
 * Formula: (successRate * 0.4) + (avgRating/5 * 0.3) + (min(jobsCompleted,100)/100 * 0.2) + (attestationCount/50 * 0.1) * 100
 */
export async function GET(
  _req: Request,
  { params }: { params: { address: string } }
) {
  try {
    const address = params.address;

    // Validate address format
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: "Invalid wallet address format" },
        { status: 400 }
      );
    }

    // Find agent by wallet address
    const agent = await prisma.agent.findUnique({
      where: { walletAddress: address.toLowerCase() },
      include: {
        reviews: {
          select: { rating: true },
        },
        jobs: {
          where: { status: "completed" },
          select: { id: true },
        },
      },
    });

    if (!agent) {
      // Try to find with original case
      const agentOriginalCase = await prisma.agent.findUnique({
        where: { walletAddress: address },
        include: {
          reviews: {
            select: { rating: true },
          },
          jobs: {
            where: { status: "completed" },
            select: { id: true },
          },
        },
      });

      if (!agentOriginalCase) {
        return NextResponse.json(
          { error: "Agent not found for this address" },
          { status: 404 }
        );
      }

      return calculateAndReturnTrustScore(agentOriginalCase, address);
    }

    return calculateAndReturnTrustScore(agent, address);
  } catch (err: unknown) {
    console.error("[GET /api/trust/[address]]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

interface AgentWithRelations {
  id: string;
  walletAddress: string | null;
  successRate: number;
  jobsCompleted: number;
  reviews: { rating: number }[];
  jobs: { id: string }[];
}

async function calculateAndReturnTrustScore(
  agent: AgentWithRelations,
  address: string
) {
  // Calculate average rating from reviews
  const ratings = agent.reviews.map((r) => r.rating);
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0;

  // Count attestations (purchases with attestationUid for skills created by this agent's owner)
  // For MVP, we count purchases that have an attestationUid
  const attestationCount = await prisma.purchase.count({
    where: {
      attestationUid: { not: null },
      skill: {
        creator: {
          ownedAgents: {
            some: { id: agent.id },
          },
        },
      },
    },
  });

  // Calculate trust score components
  const successRateComponent = agent.successRate * 0.4; // 0-40 points
  const ratingComponent = (avgRating / 5) * 0.3; // 0-30 points
  const jobsComponent = (Math.min(agent.jobsCompleted, 100) / 100) * 0.2; // 0-20 points
  const attestationComponent = (Math.min(attestationCount, 50) / 50) * 0.1; // 0-10 points

  // Final score (0-100)
  const trustScore =
    (successRateComponent + ratingComponent + jobsComponent + attestationComponent) * 100;

  // Round to 2 decimal places
  const roundedScore = Math.round(trustScore * 100) / 100;

  return NextResponse.json({
    address,
    trustScore: roundedScore,
    breakdown: {
      successRate: {
        value: agent.successRate,
        weight: 0.4,
        contribution: Math.round(successRateComponent * 100 * 100) / 100,
      },
      avgRating: {
        value: Math.round(avgRating * 100) / 100,
        weight: 0.3,
        contribution: Math.round(ratingComponent * 100 * 100) / 100,
      },
      jobsCompleted: {
        value: agent.jobsCompleted,
        cappedAt: 100,
        weight: 0.2,
        contribution: Math.round(jobsComponent * 100 * 100) / 100,
      },
      attestationCount: {
        value: attestationCount,
        cappedAt: 50,
        weight: 0.1,
        contribution: Math.round(attestationComponent * 100 * 100) / 100,
      },
    },
    attestationCount,
    jobsCompleted: agent.jobsCompleted,
    avgRating: Math.round(avgRating * 100) / 100,
  });
}
