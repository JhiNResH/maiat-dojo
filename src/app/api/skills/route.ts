import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const skills = await prisma.skill.findMany({
    include: {
      creator: true,
    },
    orderBy: { installs: "desc" },
  });
  return NextResponse.json(skills);
}
