import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate limiting + security headers + body size guard.
 * Edge middleware on /api/:path*.
 */

// In-memory rate limiter (per-process; resets on deploy — fine for MVP)
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

const RATE_LIMITS: Record<string, number> = {
  '/api/v1/run': 60,
  '/api/v1/deposit': 10,
  '/api/faucet': 5,
};
const DEFAULT_RATE_LIMIT = 120;
const WINDOW_MS = 60_000;

// Body size limits (bytes)
const BODY_LIMITS: Record<string, number> = {
  '/api/v1/run': 1_048_576, // 1 MB
};
const DEFAULT_BODY_LIMIT = 102_400; // 100 KB

const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

function getRateLimit(pathname: string): number {
  for (const [prefix, limit] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(prefix)) return limit;
  }
  return DEFAULT_RATE_LIMIT;
}

function getBodyLimit(pathname: string): number {
  for (const [prefix, limit] of Object.entries(BODY_LIMITS)) {
    if (pathname.startsWith(prefix)) return limit;
  }
  return DEFAULT_BODY_LIMIT;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- Rate limiting ---
  const ip = getClientIp(req);
  const key = `${ip}:${pathname}`;
  const now = Date.now();
  const limit = getRateLimit(pathname);

  const entry = rateLimitMap.get(key);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
  } else {
    entry.count++;
    if (entry.count > limit) {
      const retryAfter = Math.ceil((entry.windowStart + WINDOW_MS - now) / 1000);
      return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
          ...SECURITY_HEADERS,
        },
      });
    }
  }

  // --- Body size guard (POST/PUT/PATCH only) ---
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentLength = Number(req.headers.get('content-length') ?? 0);
    const bodyLimit = getBodyLimit(pathname);
    if (contentLength > bodyLimit) {
      return new NextResponse(
        JSON.stringify({ error: 'Request body too large' }),
        {
          status: 413,
          headers: { 'Content-Type': 'application/json', ...SECURITY_HEADERS },
        },
      );
    }
  }

  // --- Attach security headers ---
  const res = NextResponse.next();
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(k, v);
  }
  return res;
}

export const config = {
  matcher: '/api/:path*',
};

// Exported for testing
export { rateLimitMap, WINDOW_MS, getRateLimit };
