/**
 * POST /api/skills/[id]/sandbox
 *
 * Phase 1 sandbox proxy. Lets `<SkillExecutor mode="sandbox">` invoke a
 * skill's creator endpoint without any payment / session / x402 ceremony.
 *
 * Spec: specs/2026-04-09-chat-first-ui.md (Step 5 — Publish Wizard hard gate
 *       and chat sandbox preview share the same backend).
 *
 * Why a server-side proxy:
 *  1. Creator endpoint URL must stay hidden from buyers (Dojo proxy pattern).
 *  2. HMAC secret never leaves the server.
 *  3. Avoids CORS surprises when the creator endpoint is on another origin.
 *
 * Auth: none in Phase 1. Sandbox is rate-limited at the network layer and
 * does not bill. Phase 2 will gate this on KYA-1 + per-creator quota.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { parseSkillProfile } from '@/lib/skill-profile';

export const dynamic = 'force-dynamic';

const SANDBOX_TIMEOUT_MS = 8_000;

interface SandboxRequestBody {
  input?: unknown;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const skill = await prisma.skill.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      endpointUrl: true,
      creatorHmacSecret: true,
      executionKind: true,
      inputShape: true,
      outputShape: true,
      estLatencyMs: true,
      sandboxable: true,
      authRequired: true,
      inputSchema: true,
      outputSchema: true,
      exampleInput: true,
      exampleOutput: true,
    },
  });

  if (!skill) {
    return NextResponse.json(
      { error: 'Skill not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  const { profile } = parseSkillProfile(skill);

  if (!profile.sandboxable) {
    return NextResponse.json(
      {
        error: 'This skill does not support sandbox preview',
        code: 'SANDBOX_DISABLED',
      },
      { status: 400 }
    );
  }

  if (!skill.endpointUrl) {
    return NextResponse.json(
      {
        error: 'Skill has no endpoint configured',
        code: 'NO_ENDPOINT',
      },
      { status: 400 }
    );
  }

  let body: SandboxRequestBody;
  try {
    body = (await req.json()) as SandboxRequestBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'BAD_BODY' },
      { status: 400 }
    );
  }

  const payload = body?.input ?? {};
  const rawBody = JSON.stringify(payload);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Dojo-Mode': 'sandbox',
    'X-Dojo-SkillId': skill.id,
  };

  if (skill.creatorHmacSecret) {
    const sig = createHmac('sha256', skill.creatorHmacSecret)
      .update(rawBody)
      .digest('hex');
    headers['X-Dojo-Hmac'] = sig;
  }

  const t0 = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SANDBOX_TIMEOUT_MS);

  try {
    const upstream = await fetch(skill.endpointUrl, {
      method: 'POST',
      headers,
      body: rawBody,
      signal: controller.signal,
    });
    clearTimeout(timer);

    const latencyMs = Date.now() - t0;
    const text = await upstream.text();
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Leave as text — TextOutput will render it.
    }

    return NextResponse.json(
      {
        ok: upstream.ok,
        status: upstream.status,
        latencyMs,
        data: parsed,
      },
      { status: 200 }
    );
  } catch (err) {
    clearTimeout(timer);
    const latencyMs = Date.now() - t0;
    const aborted =
      err instanceof Error && err.name === 'AbortError' ? true : false;
    return NextResponse.json(
      {
        ok: false,
        status: aborted ? 504 : 502,
        latencyMs,
        error: aborted
          ? `Sandbox call timed out after ${SANDBOX_TIMEOUT_MS}ms`
          : err instanceof Error
            ? err.message
            : 'Sandbox call failed',
        code: aborted ? 'SANDBOX_TIMEOUT' : 'SANDBOX_FETCH_ERROR',
      },
      { status: 200 }
    );
  }
}
