import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { rating, comment, userId } = await req.json();
  if (!rating || !comment || !userId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const review = await prisma.review.create({
    data: { rating: Number(rating), comment, userId, skillId: params.id },
    include: { user: true },
  });
  // Update skill average rating
  const agg = await prisma.review.aggregate({ where: { skillId: params.id }, _avg: { rating: true } });
  if (agg._avg.rating) {
    await prisma.skill.update({ where: { id: params.id }, data: { rating: agg._avg.rating } });
  }
  return NextResponse.json(review, { status: 201 });
}
