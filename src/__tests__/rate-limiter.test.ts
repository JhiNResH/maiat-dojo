import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware, rateLimitMap, WINDOW_MS, MAX_MAP_SIZE, getClientIp, evictStaleEntries } from '@/middleware';

function makeRequest(
  path: string,
  options?: {
    ip?: string;
    method?: string;
    contentLength?: number;
    headers?: Record<string, string>;
  },
): NextRequest {
  const url = `http://localhost:3000${path}`;
  const headers: Record<string, string> = { ...options?.headers };
  if (options?.ip) headers['x-forwarded-for'] = options.ip;
  if (options?.contentLength !== undefined) {
    headers['content-length'] = String(options.contentLength);
  }
  // POST requests need content-length to pass the 411 guard
  if ((options?.method === 'POST' || options?.method === 'PUT' || options?.method === 'PATCH') && options?.contentLength === undefined) {
    headers['content-length'] = '0';
  }
  return new NextRequest(url, { method: options?.method ?? 'GET', headers });
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
    for (let i = 0; i < 60; i++) {
      const res = middleware(makeRequest('/api/v1/run'));
      expect(res.status).not.toBe(429);
    }
  });

  it('returns 429 when over the limit', () => {
    for (let i = 0; i < 60; i++) {
      middleware(makeRequest('/api/v1/run'));
    }
    const res = middleware(makeRequest('/api/v1/run'));
    expect(res.status).toBe(429);
  });

  it('resets window after 60s', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    for (let i = 0; i < 60; i++) {
      middleware(makeRequest('/api/v1/run'));
    }

    vi.spyOn(Date, 'now').mockReturnValue(now + WINDOW_MS + 1);

    const res = middleware(makeRequest('/api/v1/run'));
    expect(res.status).not.toBe(429);

    vi.restoreAllMocks();
  });

  it('tracks different IPs independently', () => {
    for (let i = 0; i < 60; i++) {
      middleware(makeRequest('/api/v1/run', { ip: '10.0.0.1' }));
    }

    const resA = middleware(makeRequest('/api/v1/run', { ip: '10.0.0.1' }));
    expect(resA.status).toBe(429);

    const resB = middleware(makeRequest('/api/v1/run', { ip: '10.0.0.2' }));
    expect(resB.status).not.toBe(429);
  });
});

describe('IP extraction', () => {
  it('prefers cf-connecting-ip over x-forwarded-for', () => {
    const req = makeRequest('/api/test', {
      headers: {
        'cf-connecting-ip': '1.2.3.4',
        'x-forwarded-for': '9.9.9.9, 8.8.8.8',
      },
    });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('uses rightmost x-forwarded-for entry (proxy-appended)', () => {
    const req = makeRequest('/api/test', {
      headers: { 'x-forwarded-for': 'spoofed, real-proxy' },
    });
    expect(getClientIp(req)).toBe('real-proxy');
  });

  it('falls back to x-real-ip', () => {
    const req = makeRequest('/api/test', {
      headers: { 'x-real-ip': '5.6.7.8' },
    });
    expect(getClientIp(req)).toBe('5.6.7.8');
  });
});

describe('body size guard', () => {
  beforeEach(() => {
    rateLimitMap.clear();
  });

  it('returns 413 for oversized body', () => {
    const res = middleware(makeRequest('/api/v1/run', {
      method: 'POST',
      contentLength: 2_000_000,
    }));
    expect(res.status).toBe(413);
  });

  it('returns 411 when Content-Length is missing on POST', () => {
    const url = 'http://localhost:3000/api/v1/run';
    const req = new NextRequest(url, { method: 'POST' });
    const res = middleware(req);
    expect(res.status).toBe(411);
  });
});

describe('map eviction', () => {
  beforeEach(() => {
    rateLimitMap.clear();
  });

  it('evicts stale entries when map exceeds MAX_MAP_SIZE', () => {
    const now = Date.now();
    // Fill map with stale entries
    for (let i = 0; i < MAX_MAP_SIZE + 100; i++) {
      rateLimitMap.set(`stale-${i}:/api/test`, { count: 1, windowStart: now - WINDOW_MS - 1 });
    }
    expect(rateLimitMap.size).toBeGreaterThan(MAX_MAP_SIZE);

    evictStaleEntries(now);

    expect(rateLimitMap.size).toBe(0);
  });

  it('does not evict when under MAX_MAP_SIZE', () => {
    const now = Date.now();
    rateLimitMap.set('a:/api/test', { count: 1, windowStart: now - WINDOW_MS - 1 });
    evictStaleEntries(now);
    // Still there — under threshold
    expect(rateLimitMap.size).toBe(1);
  });
});
