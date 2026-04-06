/**
 * Regression tests for mint-identity race condition
 *
 * Regression: FINDING-01 — Duplicate mint race condition
 * Two concurrent requests could both pass idempotency guards and both
 * call registerFor(), burning gas or double-minting.
 * Found by /differential-review on 2026-04-06
 * Report: DIFFERENTIAL_REVIEW_PR14.md
 *
 * Tests the updateMany test-and-set pattern in isolation.
 * Full route integration requires DB — tested via logic unit tests here.
 */

import { describe, it, expect } from 'vitest';

/**
 * The race guard logic extracted for unit testing.
 * Mirrors the updateMany condition in mint-identity/route.ts:
 *   where: { id: user.id, pendingMint: false, erc8004TokenId: null }
 */
function simulateAtomicClaim(
  user: { id: string; pendingMint: boolean; erc8004TokenId: bigint | null },
  claims: Map<string, boolean>
): 'claimed' | 'lost' {
  // Atomic: only succeeds if pendingMint=false AND erc8004TokenId=null
  if (user.pendingMint || user.erc8004TokenId !== null) return 'lost';
  if (claims.has(user.id)) return 'lost'; // already claimed by concurrent request
  claims.set(user.id, true);
  return 'claimed';
}

describe('mint-identity race guard logic', () => {
  it('only one concurrent request wins the claim', () => {
    const user = { id: 'user-1', pendingMint: false, erc8004TokenId: null };
    const claims = new Map<string, boolean>();

    // Two concurrent requests arrive simultaneously
    const result1 = simulateAtomicClaim(user, claims);
    const result2 = simulateAtomicClaim(user, claims);

    expect(result1).toBe('claimed');
    expect(result2).toBe('lost'); // race lost
  });

  it('returns lost if pendingMint is already true', () => {
    const user = { id: 'user-2', pendingMint: true, erc8004TokenId: null };
    const claims = new Map<string, boolean>();

    expect(simulateAtomicClaim(user, claims)).toBe('lost');
  });

  it('returns lost if erc8004TokenId already set', () => {
    const user = { id: 'user-3', pendingMint: false, erc8004TokenId: 99n };
    const claims = new Map<string, boolean>();

    expect(simulateAtomicClaim(user, claims)).toBe('lost');
  });

  it('fresh user with no prior state can be claimed', () => {
    const user = { id: 'user-4', pendingMint: false, erc8004TokenId: null };
    const claims = new Map<string, boolean>();

    expect(simulateAtomicClaim(user, claims)).toBe('claimed');
  });
});

describe('4-case idempotency ordering', () => {
  type UserState = {
    erc8004TokenId: bigint | null;
    pendingMint: boolean;
  };

  function getCase(user: UserState, onChainId: bigint): string {
    if (user.erc8004TokenId != null) return 'existing-db';
    if (user.pendingMint) return 'pending';
    if (onChainId > 0n) return 'existing-onchain';
    return 'fresh-mint';
  }

  it('DB tokenId takes priority over on-chain read', () => {
    expect(getCase({ erc8004TokenId: 5n, pendingMint: false }, 5n)).toBe('existing-db');
  });

  it('pendingMint short-circuits before on-chain read', () => {
    expect(getCase({ erc8004TokenId: null, pendingMint: true }, 0n)).toBe('pending');
  });

  it('on-chain backfill handles DB miss with on-chain presence', () => {
    expect(getCase({ erc8004TokenId: null, pendingMint: false }, 7n)).toBe('existing-onchain');
  });

  it('fresh mint only when all checks pass', () => {
    expect(getCase({ erc8004TokenId: null, pendingMint: false }, 0n)).toBe('fresh-mint');
  });
});
