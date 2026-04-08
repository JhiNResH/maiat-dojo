/**
 * Tests for bas.ts guard clauses and config functions.
 *
 * Mocks viem to test skip logic without BSC RPC.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('viem', () => ({
  createPublicClient: vi.fn(() => ({ readContract: vi.fn() })),
  createWalletClient: vi.fn(() => ({ writeContract: vi.fn() })),
  http: vi.fn(() => 'mock-transport'),
  encodeAbiParameters: vi.fn(() => '0x00'),
  parseAbiParameters: vi.fn(() => []),
  parseEventLogs: vi.fn(() => []),
}));

vi.mock('viem/accounts', () => ({
  privateKeyToAccount: vi.fn(() => ({
    address: '0x046aB9D6aC4EA10C42501ad89D9a741115A76Fa9',
  })),
}));

describe('getSessionEvaluationSchemaUid', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns null when BAS_SESSION_SCHEMA_UID not set', async () => {
    delete process.env.BAS_SESSION_SCHEMA_UID;
    const { getSessionEvaluationSchemaUid } = await import('@/lib/bas');
    expect(getSessionEvaluationSchemaUid()).toBeNull();
  });

  it('returns null when BAS_SESSION_SCHEMA_UID is "0x"', async () => {
    process.env.BAS_SESSION_SCHEMA_UID = '0x';
    const { getSessionEvaluationSchemaUid } = await import('@/lib/bas');
    expect(getSessionEvaluationSchemaUid()).toBeNull();
  });

  it('returns the UID when set', async () => {
    process.env.BAS_SESSION_SCHEMA_UID = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const { getSessionEvaluationSchemaUid } = await import('@/lib/bas');
    expect(getSessionEvaluationSchemaUid()).toBe('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
  });
});

describe('attestSessionClose guard paths', () => {
  const originalEnv = process.env;

  const dummyData = {
    sessionId: 'cltest',
    finalScore: 100,
    callCount: 1,
    passRate: 100,
    creatorAddress: '0x0000000000000000000000000000000000000001' as `0x${string}`,
    agentAddress: '0x0000000000000000000000000000000000000002' as `0x${string}`,
  };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('skips on testnet RPC (prebsc)', async () => {
    process.env.BSC_RPC_URL = 'https://data-seed-prebsc-1-s1.binance.org:8545';
    const { attestSessionClose } = await import('@/lib/bas');
    const result = await attestSessionClose(dummyData);
    expect(result.success).toBe(false);
    expect(result.error).toContain('testnet');
  });

  it('skips on testnet RPC (contains "97")', async () => {
    process.env.BSC_RPC_URL = 'https://bsc-testnet-rpc-97.example.com';
    const { attestSessionClose } = await import('@/lib/bas');
    const result = await attestSessionClose(dummyData);
    expect(result.success).toBe(false);
    expect(result.error).toContain('testnet');
  });

  it('skips when BAS_SESSION_SCHEMA_UID not set', async () => {
    process.env.BSC_RPC_URL = 'https://bsc-dataseed.binance.org';
    delete process.env.BAS_SESSION_SCHEMA_UID;
    const { attestSessionClose } = await import('@/lib/bas');
    const result = await attestSessionClose(dummyData);
    expect(result.success).toBe(false);
    expect(result.error).toContain('schema UID');
  });

  it('skips when DOJO_RELAYER_PRIVATE_KEY not set', async () => {
    process.env.BSC_RPC_URL = 'https://bsc-dataseed.binance.org';
    process.env.BAS_SESSION_SCHEMA_UID = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    delete process.env.DOJO_RELAYER_PRIVATE_KEY;
    const { attestSessionClose } = await import('@/lib/bas');
    const result = await attestSessionClose(dummyData);
    expect(result.success).toBe(false);
    expect(result.error).toContain('DOJO_RELAYER_PRIVATE_KEY');
  });
});
