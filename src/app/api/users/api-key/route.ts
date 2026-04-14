import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * POST /api/users/api-key
 *
 * Generate or retrieve the API key for the authenticated user.
 * Idempotent: returns existing key if already generated.
 *
 * Auth: privyId in body (same pattern as other Dojo endpoints).
 *
 * Body: { privyId: string }
 * Response: { apiKey: string, created: boolean }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { privyId } = body as { privyId?: string };

  if (!privyId) {
    return NextResponse.json(
      { error: 'Missing required field: privyId' },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { privyId } });
  if (!user) {
    return NextResponse.json(
      { error: 'User not found — sync account first via /api/users/sync' },
      { status: 404 },
    );
  }

  // Idempotent: return existing key if already generated
  if (user.apiKey) {
    return NextResponse.json({ apiKey: user.apiKey, created: false });
  }

  // Generate new key: dojo_sk_ + 32 random hex bytes
  const apiKey = `dojo_sk_${randomBytes(32).toString('hex')}`;

  await prisma.user.update({
    where: { id: user.id },
    data: { apiKey },
  });

  return NextResponse.json({ apiKey, created: true }, { status: 201 });
}
