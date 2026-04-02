import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/skills/create
 * Create a new skill + upsert user from Privy
 *
 * Body: {
 *   privyId: string;        // from Privy session
 *   email?: string;
 *   walletAddress?: string;
 *   displayName?: string;
 *   name: string;           // skill name
 *   description: string;    // short description
 *   longDescription?: string;
 *   category: string;       // Trading, Security, Content, DeFi, Analytics, Infra, Social
 *   icon?: string;          // emoji (defaults to ⚡)
 *   price: number;          // USD
 *   tags?: string;          // comma-separated
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      privyId,
      email,
      walletAddress,
      displayName,
      name,
      description,
      longDescription,
      category,
      icon,
      price,
      tags,
    } = body;

    // Validate required fields
    if (!privyId) {
      return NextResponse.json(
        { error: "Missing required field: privyId" },
        { status: 400 }
      );
    }

    if (!name || !description || !category) {
      return NextResponse.json(
        { error: "Missing required fields: name, description, category" },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ["Trading", "Security", "Content", "DeFi", "Analytics", "Infra", "Social"];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate price
    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { error: "Invalid price. Must be a non-negative number." },
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
      },
      create: {
        privyId,
        email: email ?? null,
        walletAddress: walletAddress ?? null,
        displayName: displayName ?? null,
      },
    });

    // Create the skill
    const skill = await prisma.skill.create({
      data: {
        name,
        description,
        longDescription: longDescription ?? null,
        category,
        icon: icon || "⚡",
        price: parsedPrice,
        currency: "USD",
        tags: tags ?? "",
        creatorId: user.id,
      },
      include: {
        creator: true,
      },
    });

    return NextResponse.json(skill, { status: 201 });
  } catch (err: unknown) {
    console.error("[POST /api/skills/create]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
