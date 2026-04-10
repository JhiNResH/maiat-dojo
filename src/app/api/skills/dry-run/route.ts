import { NextRequest, NextResponse } from 'next/server';
import { verifyPrivyAuth } from '@/lib/privy-server';
import { evaluateCall } from '@/lib/session-evaluator';

export const dynamic = 'force-dynamic';

const DRY_RUN_TIMEOUT_MS = 8_000;

/**
 * POST /api/skills/dry-run
 *
 * Stateless pre-publish sandbox. Calls the creator endpoint,
 * runs evaluateCall(), returns results. No skill record required.
 *
 * Body: { endpointUrl, input, authHeader? }
 * Auth: Privy JWT (dev bypass with DOJO_SKIP_PRIVY_AUTH).
 */
export async function POST(req: NextRequest) {
  try {
    const skipAuth =
      process.env.DOJO_SKIP_PRIVY_AUTH === 'true' &&
      process.env.NODE_ENV !== 'production';

    if (!skipAuth) {
      const auth = await verifyPrivyAuth(req.headers.get('Authorization'));
      if (!auth.success) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await req.json();
    const { endpointUrl, input, authHeader } = body;

    if (!endpointUrl) {
      return NextResponse.json(
        { error: 'Missing required field: endpointUrl' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(endpointUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid endpointUrl' },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DRY_RUN_TIMEOUT_MS);

    let httpStatus = 0;
    let responseBody = '';
    let failed = false;
    const t0 = Date.now();

    try {
      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(input ?? {}),
        signal: controller.signal,
      });
      httpStatus = res.status;
      responseBody = await res.text();
    } catch (err) {
      failed = true;
      if (err instanceof DOMException && err.name === 'AbortError') {
        responseBody = 'Request timed out';
      } else {
        responseBody = err instanceof Error ? err.message : 'Network error';
      }
    } finally {
      clearTimeout(timeout);
    }

    const latencyMs = Date.now() - t0;
    const evalResult = evaluateCall(httpStatus, responseBody, latencyMs, failed);

    // Parse response data for display
    let data: unknown = null;
    if (!failed && responseBody) {
      try {
        data = JSON.parse(responseBody);
      } catch {
        data = responseBody;
      }
    }

    return NextResponse.json({
      ok: evalResult.score === 1.0,
      status: httpStatus,
      latencyMs,
      data,
      eval: {
        score: evalResult.score,
        delivered: evalResult.delivered,
        validFormat: evalResult.validFormat,
        withinSla: evalResult.withinSla,
      },
    });
  } catch (err) {
    console.error('[POST /api/skills/dry-run]', err);
    const message = err instanceof Error ? err.message : 'Dry run failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
