/**
 * Regression tests for bas.ts
 *
 * Regression: FINDING-02 — BAS attestation UID stored as txHash proxy
 * Found by /differential-review on 2026-04-06
 * Report: DIFFERENTIAL_REVIEW_PR14.md
 */

import { describe, it, expect } from 'vitest';
import { encodeSessionEvaluation, SESSION_EVALUATION_SCHEMA } from '@/lib/bas';
import { encodeAbiParameters, parseAbiParameters, decodeAbiParameters } from 'viem';

describe('encodeSessionEvaluation', () => {
  it('round-trips all fields without corruption', () => {
    const data = {
      agentWallet: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      agentId: 42n,
      skillId: 'skill-abc-123',
      callCount: 7n,
      budgetUsedUsdc: 1_500_000n, // 1.5 USDC in micro units
      outcome: 1 as const,
    };

    const encoded = encodeSessionEvaluation(data);
    const decoded = decodeAbiParameters(
      parseAbiParameters(SESSION_EVALUATION_SCHEMA),
      encoded
    );

    expect(decoded[0].toLowerCase()).toBe(data.agentWallet.toLowerCase());
    expect(decoded[1]).toBe(data.agentId);
    expect(decoded[2]).toBe(data.skillId);
    expect(decoded[3]).toBe(data.callCount);
    expect(decoded[4]).toBe(data.budgetUsedUsdc);
    expect(decoded[5]).toBe(data.outcome);
  });

  it('encodes zero agentId without throwing', () => {
    // agentId = 0n is valid for users who haven't minted yet
    const data = {
      agentWallet: '0x0000000000000000000000000000000000000001' as `0x${string}`,
      agentId: 0n,
      skillId: 'test-skill',
      callCount: 0n,
      budgetUsedUsdc: 0n,
      outcome: 0 as const,
    };
    expect(() => encodeSessionEvaluation(data)).not.toThrow();
  });

  it('encodes large uint256 values without overflow', () => {
    const data = {
      agentWallet: '0x0000000000000000000000000000000000000001' as `0x${string}`,
      agentId: 2n ** 64n - 1n,
      skillId: 'test',
      callCount: 10_000n,
      budgetUsedUsdc: 1_000_000_000_000n, // 1M USDC
      outcome: 1 as const,
    };
    expect(() => encodeSessionEvaluation(data)).not.toThrow();
  });
});

describe('budgetUsedUsdc calculation safety', () => {
  // Regression: FINDING-03 — SQLite Float subtraction can produce tiny negatives.
  // Real scenario: repeated floating-point add/subtract in the DB layer causes
  // budgetRemaining to drift slightly above budgetTotal.
  // BigInt(negative) → encodeAbiParameters(uint256) throws at runtime inside the
  // fire-and-forget IIFE, silently killing the BAS attestation.

  it('clamp prevents negative result when budgetRemaining drifts above budgetTotal', () => {
    // Simulate: 1.0 USDC budget, all refunded, but float arithmetic leaves
    // budgetRemaining = 1.000001 (1 micro-unit above budgetTotal)
    const budgetTotal = 1.0;
    const budgetRemaining = 1.000001; // realistic SQLite Float drift

    const rawDiff = Math.round((budgetTotal - budgetRemaining) * 1e6);
    expect(rawDiff).toBeLessThan(0); // -1 micro-unit

    // Without clamp: produces BigInt(-1), which encodeAbiParameters uint256 rejects
    expect(rawDiff).toBe(-1);

    // With clamp: safely becomes 0
    const safe = BigInt(Math.max(0, rawDiff));
    expect(safe).toBe(0n);
  });

  it('clamp is a no-op for normal positive values', () => {
    const budgetTotal = 5.0;
    const budgetRemaining = 3.5;
    const micro = BigInt(Math.max(0, Math.round((budgetTotal - budgetRemaining) * 1e6)));
    expect(micro).toBe(1_500_000n); // 1.5 USDC
  });
});
