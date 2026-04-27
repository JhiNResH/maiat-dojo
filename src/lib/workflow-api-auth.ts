import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPrivyAuth } from '@/lib/privy-server';

export async function authenticateWorkflowUser(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'Missing Authorization: Bearer <token>' },
        { status: 401 },
      ),
    };
  }

  const token = auth.slice(7).trim();
  if (token.startsWith('dojo_sk_')) {
    const user = await prisma.user.findUnique({ where: { apiKey: token } });
    if (!user) {
      return {
        ok: false as const,
        response: NextResponse.json({ error: 'Invalid API key' }, { status: 401 }),
      };
    }
    return { ok: true as const, user };
  }

  const authResult = await verifyPrivyAuth(auth);
  if (!authResult.success || !authResult.privyId) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: authResult.error ?? 'Unauthorized' },
        { status: 401 },
      ),
    };
  }

  const user = await prisma.user.findUnique({ where: { privyId: authResult.privyId } });
  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'User not found. Sign in again to sync your account.' },
        { status: 404 },
      ),
    };
  }

  return { ok: true as const, user };
}
