import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware, rateLimitMap, WINDOW_MS } from '@/middleware';

function makeRequest(
  path: string,
  ip = '127.0.0.1',
  method = 'GET',
  contentLength?: number,
): NextRequest {
  const url = `http://localhost:3000${path}`;
  const headers: Record<string, string> = { 'x-forwarded-for': ip };
  if (contentLength !== undefined) {
    headers['content-length'] = String(contentLength);
  }
  return new NextRequest(url, { method, headers });
}

describe('rate limiter middleware', () => {
  beforeEach(() => {
    rateLimitMap.clear();
  });

  it('allows requests under the limit', () => {
    const res = middleware(makeRequest('/api/v1/run'));
    expect(res.status).not.toBe(429);
  });

  it('allows requests at exactly the limit', () => {
    // /api/v1/run limit = 60
    for (let i = 0; i < 60; i++) {
      const res = middleware(makeRequest('/api/v1/run'));
      expect(res.status).not.toBe(429);
    }
  });

  it('returns 429 when over the limit', () => {
    // /api/v1/run limit = 60
    for (let i = 0; i < 60; i++) {
      middleware(makeRequest('/api/v1/run'));
    }
    const res = middleware(makeRequest('/api/v1/run'));
    expect(res.status).toBe(429);
  });

  it('resets window after 60s', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    // Fill up
    for (let i = 0; i < 60; i++) {
      middleware(makeRequest('/api/v1/run'));
    }

    // Advance time past window
    vi.spyOn(Date, 'now').mockReturnValue(now + WINDOW_MS + 1);

    const res = middleware(makeRequest('/api/v1/run'));
    expect(res.status).not.toBe(429);

    vi.restoreAllMocks();
  });

  it('tracks different IPs independently', () => {
    // Fill up IP-A
    for (let i = 0; i < 60; i++) {
      middleware(makeRequest('/api/v1/run', '10.0.0.1'));
    }

    // IP-A should be blocked
    const resA = middleware(makeRequest('/api/v1/run', '10.0.0.1'));
    expect(resA.status).toBe(429);

    // IP-B should still be fine
    const resB = middleware(makeRequest('/api/v1/run', '10.0.0.2'));
    expect(resB.status).not.toBe(429);
  });
});
