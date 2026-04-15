import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { rating, comment, userId, sessionId } = await req.json();
  if (!rating || !comment || !userId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required — complete a session first" }, { status: 400 });
  }

  // Verify session exists, belongs to this user's agent, targets this skill, and is settled/refunded
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { agent: true },
  });
  if (
    !session ||
    session.skillId !== params.id ||
    session.agent.ownerId !== userId ||
    !["settled", "refunded"].includes(session.status)
  ) {
    return NextResponse.json(
      { error: "No settled session receipt for this skill" },
      { status: 403 }
    );
  }

  // Check duplicate review for same session
  const existing = await prisma.review.findUnique({
    where: { userId_skillId_sessionId: { userId, skillId: params.id, sessionId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already reviewed this session" }, { status: 409 });
  }

  const review = await prisma.review.create({
    data: { rating: Number(rating), comment, userId, skillId: params.id, sessionId },
    include: { user: true },
  });

  // Update skill average rating
  const agg = await prisma.review.aggregate({ where: { skillId: params.id }, _avg: { rating: true } });
  if (agg._avg.rating) {
    await prisma.skill.update({ where: { id: params.id }, data: { rating: agg._avg.rating } });
  }

  return NextResponse.json(review, { status: 201 });
}
