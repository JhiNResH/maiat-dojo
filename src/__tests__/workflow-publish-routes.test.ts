import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    skill: {
      findUnique: vi.fn(),
    },
    workflow: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/workflow-api-auth', () => ({
  authenticateWorkflowUser: vi.fn(),
}));

vi.mock('@/lib/privy-server', () => ({
  verifyPrivyAuth: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { authenticateWorkflowUser } from '@/lib/workflow-api-auth';
import { POST as createSkill } from '@/app/api/skills/create/route';
import { POST as publishSkill } from '@/app/api/skills/publish/route';

function makeRequest(url: string, opts: RequestInit = {}) {
  return new Request(url, opts) as any;
}

function mockTransaction() {
  const tx = {
    skill: {
      create: vi.fn().mockResolvedValue({
        id: 'skill1',
        name: 'Quick Audit Workflow',
        description: 'Audit a target',
        category: 'Security',
        icon: 'W',
        gatewaySlug: 'quick-audit-workflow-abc123',
      }),
    },
    workflow: {
      create: vi.fn().mockResolvedValue({
        id: 'workflow1',
        slug: 'quick-audit-workflow-abc123',
        name: 'Quick Audit Workflow',
        description: 'Audit a target',
        category: 'Security',
        icon: 'W',
        status: 'published',
      }),
    },
    workflowVersion: {
      create: vi.fn().mockResolvedValue({
        id: 'version1',
        version: 1,
      }),
    },
  };
  (prisma.$transaction as any).mockImplementation(async (fn: (client: typeof tx) => unknown) => fn(tx));
  return tx;
}

describe('workflow publish routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DOJO_SKIP_PRIVY_AUTH = 'false';
    (process.env as Record<string, string>).NODE_ENV = 'test';
  });

  it('accepts the creator CLI publish payload and creates a workflow-backed active skill', async () => {
    (authenticateWorkflowUser as any).mockResolvedValue({
      ok: true,
      user: { id: 'user1' },
    });
    (prisma.skill.findUnique as any).mockResolvedValue(null);
    (prisma.workflow.findUnique as any).mockResolvedValue(null);
    const tx = mockTransaction();

    const res = await createSkill(
      makeRequest('http://localhost/api/skills/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dojo_sk_test',
        },
        body: JSON.stringify({
          name: 'Quick Audit Workflow',
          description: 'Audit a target',
          category: 'Security',
          icon: 'W',
          price: 0.25,
          pricePerCall: 0.25,
          tags: 'security,audit',
          fileContent: 'name: Quick Audit Workflow',
          fileType: 'text',
          endpointUrl: 'https://creator.example/run',
          executionKind: 'sync',
          inputSchema: { type: 'object' },
          exampleInput: { target: '0x0' },
          sandboxable: true,
          authRequired: false,
        }),
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.workflow.id).toBe('workflow1');
    expect(tx.skill.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          executionKind: 'sync',
          inputShape: 'form',
          outputShape: 'json',
          sandboxable: true,
          authRequired: false,
        }),
      }),
    );
    expect(tx.workflow.create).toHaveBeenCalled();
    expect(tx.workflowVersion.create).toHaveBeenCalled();
  });

  it('legacy SKILL.md publish creates workflow metadata instead of a workflow-less active skill', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'user1', apiKey: 'dojo_sk_test' });
    (prisma.skill.findUnique as any).mockResolvedValue(null);
    (prisma.workflow.findUnique as any).mockResolvedValue(null);
    const tx = mockTransaction();

    const skillMd = `---
name: Quick Audit Workflow
description: Audit a target
endpoint: https://creator.example/run
price: 0.25
category: Security
---

Run an audit.`;

    const res = await publishSkill(
      makeRequest('http://localhost/api/skills/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dojo_sk_test',
        },
        body: JSON.stringify({ skillMd }),
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.workflowId).toBe('workflow1');
    expect(data.url).toBe('/workflow/quick-audit-workflow-abc123/run');
    expect(tx.workflow.create).toHaveBeenCalled();
    expect(tx.workflowVersion.create).toHaveBeenCalled();
  });
});
