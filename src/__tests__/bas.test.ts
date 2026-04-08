/**
 * Regression tests for bas.ts
 *
 * Updated 2026-04-07: schema changed from old (agentWallet, agentId, skillId, callCount,
 * budgetUsedUsdc, outcome) to new (sessionId, finalScore, callCount, passRate,
 * creatorAddress, agentAddress, merkleRoot) — spec: 2026-04-07-concept-validation-loop.md
 */

import { describe, it, expect } from 'vitest';
import { encodeSessionEvaluation, SESSION_EVALUATION_SCHEMA } from '@/lib/bas';
import { decodeAbiParameters, parseAbiParameters } from 'viem';

const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

describe('encodeSessionEvaluation', () => {
  it('round-trips all fields without corruption', () => {
    const data = {
      sessionId: 'cltest123456789',
      finalScore: 80,
      callCount: 7,
      passRate: 80,
      creatorAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      agentAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as `0x${string}`,
    };

    const encoded = encodeSessionEvaluation(data);
    const decoded = decodeAbiParameters(
      parseAbiParameters(SESSION_EVALUATION_SCHEMA),
      encoded
    );

    // decoded[0] = bytes32 sessionId (padded string — just verify it's 32 bytes)
    expect(typeof decoded[0]).toBe('string');
    expect((decoded[0] as string).length).toBe(66); // 0x + 64 hex chars
    expect(decoded[1]).toBe(data.finalScore);     // uint8 finalScore
    expect(decoded[2]).toBe(data.callCount);      // uint16 callCount
    expect(decoded[3]).toBe(data.passRate);       // uint8 passRate
    expect((decoded[4] as string).toLowerCase()).toBe(data.creatorAddress.toLowerCase());
    expect((decoded[5] as string).toLowerCase()).toBe(data.agentAddress.toLowerCase());
    expect(decoded[6]).toBe(ZERO_BYTES32);        // bytes32 merkleRoot (Phase 1 = zeros)
  });

  it('encodes zero scores without throwing', () => {
    const data = {
      sessionId: 'clzero',
      finalScore: 0,
      callCount: 0,
      passRate: 0,
      creatorAddress: '0x0000000000000000000000000000000000000001' as `0x${string}`,
      agentAddress: '0x0000000000000000000000000000000000000002' as `0x${string}`,
    };
    expect(() => encodeSessionEvaluation(data)).not.toThrow();
  });

  it('encodes max uint8 scores without throwing', () => {
    const data = {
      sessionId: 'clmax',
      finalScore: 100,
      callCount: 1000,
      passRate: 100,
      creatorAddress: '0x0000000000000000000000000000000000000001' as `0x${string}`,
      agentAddress: '0x0000000000000000000000000000000000000002' as `0x${string}`,
    };
    expect(() => encodeSessionEvaluation(data)).not.toThrow();
  });
});

describe('SESSION_EVALUATION_SCHEMA', () => {
  it('contains the expected fields for Phase 1', () => {
    expect(SESSION_EVALUATION_SCHEMA).toContain('bytes32 sessionId');
    expect(SESSION_EVALUATION_SCHEMA).toContain('uint8 finalScore');
    expect(SESSION_EVALUATION_SCHEMA).toContain('uint16 callCount');
    expect(SESSION_EVALUATION_SCHEMA).toContain('uint8 passRate');
    expect(SESSION_EVALUATION_SCHEMA).toContain('address creatorAddress');
    expect(SESSION_EVALUATION_SCHEMA).toContain('address agentAddress');
    expect(SESSION_EVALUATION_SCHEMA).toContain('bytes32 merkleRoot');
  });
});
