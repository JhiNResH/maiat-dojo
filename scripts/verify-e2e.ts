/**
 * E2E Verification Script
 *
 * Runs 2 sessions programmatically to verify the full pipeline:
 *   Session A: echo skill, all calls succeed → PASS → trust up
 *   Session B: echo skill with hash mismatch → some calls fail → different outcome
 *
 * Usage: npx tsx scripts/verify-e2e.ts
 *
 * Prerequisites:
 *   - `pnpm prisma db seed` has run
 *   - `pnpm dev` is running on localhost:3000
 *   - DOJO_GATEWAY_SKIP_SIG_CHECK=true in .env
 */

import { keccak256, toHex } from 'viem';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

interface Session {
  id: string;
  status: string;
  onchainJobId: string | null;
  budgetTotal: number;
  budgetRemaining: number;
  callCount: number;
}

async function findSkill(slug: string) {
  const res = await fetch(`${BASE}/api/skills?limit=20`);
  const data = await res.json();
  const skill = data.skills?.find((s: { gatewaySlug?: string }) => s.gatewaySlug === slug);
  if (!skill) throw new Error(`Skill '${slug}' not found. Run prisma db seed first.`);
  return skill;
}

async function openSession(skillId: string, agentId: string, budgetUsdc: number): Promise<Session> {
  // Direct DB insert since session/open requires Privy auth
  // We'll use the internal endpoint pattern
  const res = await fetch(`${BASE}/api/sessions/open`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skillId, agentId, budgetUsdc }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'unknown' }));
    console.log(`  [open] HTTP ${res.status}:`, err);
    throw new Error(`Session open failed: ${err.error ?? res.status}`);
  }
  const data = await res.json();
  return data.session;
}

async function callGateway(slug: string, jobId: string, nonce: number, body: object) {
  const rawBody = JSON.stringify(body);
  const hash = keccak256(toHex(rawBody));
  const expiresAt = Math.floor(Date.now() / 1000) + 120;

  const res = await fetch(`${BASE}/api/gateway/skills/${slug}/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Dojo-Auth': 'e2e-test-sig',
      'X-Dojo-JobId': jobId,
      'X-Dojo-AgentTokenId': '1',
      'X-Dojo-Nonce': String(nonce),
      'X-Dojo-ExpiresAt': String(expiresAt),
      'X-Dojo-RequestHash': hash,
    },
    body: rawBody,
  });

  return {
    status: res.status,
    budgetRemaining: res.headers.get('X-Dojo-BudgetRemaining'),
    callCount: res.headers.get('X-Dojo-CallCount'),
    body: await res.json().catch(() => null),
  };
}

async function check402(slug: string) {
  console.log(`\n[Step 1] Hit gateway without session → expect 402`);
  const res = await fetch(`${BASE}/api/gateway/skills/${slug}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ test: true }),
  });

  const headers: Record<string, string> = {};
  res.headers.forEach((v, k) => {
    if (k.toLowerCase().startsWith('x-payment')) headers[k] = v;
  });

  console.log(`  HTTP ${res.status}`);
  console.log('  x402 headers:', headers);
  if (res.status !== 402) {
    console.error('  FAIL: Expected 402');
    return false;
  }
  console.log('  PASS: 402 with x402 headers');
  return true;
}

async function main() {
  console.log('=== Dojo E2E Verification ===');
  console.log(`Base URL: ${BASE}\n`);

  // Find echo skill
  const echo = await findSkill('echo-test');
  console.log(`Echo skill: ${echo.id} (${echo.name})`);

  // Step 1: Verify 402 flow
  const step1ok = await check402('echo-test');
  if (!step1ok) {
    console.log('\n402 flow broken — fix before continuing.');
    process.exit(1);
  }

  // Step 2: Test echo endpoint directly
  console.log('\n[Step 2] Test internal echo endpoint');
  const echoRes = await fetch(`${BASE}/api/skills-internal/echo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'e2e-test' }),
  });
  const echoData = await echoRes.json();
  console.log(`  HTTP ${echoRes.status}:`, echoData);
  if (echoRes.status !== 200 || !echoData.echo) {
    console.error('  FAIL: Echo endpoint not working');
    process.exit(1);
  }
  console.log('  PASS: Echo endpoint works');

  // Step 3: Test price endpoint
  console.log('\n[Step 3] Test internal price endpoint');
  const priceRes = await fetch(`${BASE}/api/skills-internal/price`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: 'BNB' }),
  });
  const priceData = await priceRes.json();
  console.log(`  HTTP ${priceRes.status}:`, priceData);
  if (priceRes.status !== 200 || !priceData.price_usd) {
    console.error('  FAIL: Price endpoint not working');
    process.exit(1);
  }
  console.log('  PASS: Price endpoint works');

  // Step 4: Verify session open (will likely fail without auth — that's OK)
  console.log('\n[Step 4] Attempt session open (requires auth — expected to fail in script)');
  try {
    const session = await openSession(echo.id, 'test-agent', 1.0);
    console.log(`  Session opened: ${session.id} (status: ${session.status})`);

    // If session opened, run full flow
    console.log('\n[Step 5] Call echo skill 3 times');
    for (let i = 1; i <= 3; i++) {
      const result = await callGateway('echo-test', session.onchainJobId ?? session.id, i, {
        message: `call-${i}`,
        timestamp: Date.now(),
      });
      console.log(`  Call ${i}: HTTP ${result.status}, budget=${result.budgetRemaining}, count=${result.callCount}`);
    }

    console.log('\n[Step 6] Close session');
    const closeRes = await fetch(`${BASE}/api/sessions/${session.id}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ privyId: 'e2e-test' }),
    });
    const closeData = await closeRes.json();
    console.log(`  Close HTTP ${closeRes.status}:`, closeData.session?.status);
  } catch (e) {
    console.log(`  Expected: ${(e as Error).message}`);
    console.log('  This is normal — session open requires Privy auth in production.');
    console.log('  Use /demo page for interactive walkthrough or seed test sessions.');
  }

  console.log('\n=== Summary ===');
  console.log('  [x] Echo endpoint works');
  console.log('  [x] Price endpoint works');
  console.log('  [x] 402 + x402 headers returned on no-session gateway call');
  console.log('  [ ] Full session flow (requires auth — test via /demo page)');
  console.log('\nDone.');
}

main().catch((e) => {
  console.error('E2E failed:', e);
  process.exit(1);
});
