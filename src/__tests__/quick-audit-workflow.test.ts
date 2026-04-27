import { describe, expect, it } from 'vitest';
import { POST } from '@/app/api/skills-internal/quick-audit/route';

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/skills-internal/quick-audit', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  }) as any;
}

describe('Quick Audit Workflow', () => {
  it('returns a structured security workflow report', async () => {
    const res = await POST(makeRequest({ target: 'UpgradeableERC20Token', chain: 'bsc' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.workflow).toBe('quick-audit-workflow');
    expect(data.risk_score).toBeGreaterThan(0);
    expect(data.findings.length).toBeGreaterThan(1);
    expect(data.next_actions).toContain('Run a full manual review before handling user funds');
  });

  it('rejects missing target', async () => {
    const res = await POST(makeRequest({ chain: 'bsc' }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/target is required/);
  });
});
