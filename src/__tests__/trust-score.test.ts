import { describe, it, expect } from 'vitest';
import { calculateTrustScore } from '@/lib/trust-score';

describe('calculateTrustScore', () => {
  it('returns 0 for a zero agent', () => {
    const result = calculateTrustScore({
      successRate: 0,
      avgRating: 0,
      jobsCompleted: 0,
      attestationCount: 0,
    });
    expect(result.score).toBe(0);
    expect(result.breakdown.successRate).toBe(0);
    expect(result.breakdown.rating).toBe(0);
    expect(result.breakdown.jobs).toBe(0);
    expect(result.breakdown.attestations).toBe(0);
  });

  it('returns 100 for a perfect agent', () => {
    const result = calculateTrustScore({
      successRate: 1,
      avgRating: 5,
      jobsCompleted: 100,
      attestationCount: 50,
    });
    expect(result.score).toBe(100);
  });

  it('calculates partial ratings correctly', () => {
    const result = calculateTrustScore({
      successRate: 0.5,
      avgRating: 2.5,
      jobsCompleted: 50,
      attestationCount: 25,
    });
    expect(result.score).toBe(50);
  });

  it('caps jobs at 100', () => {
    const a = calculateTrustScore({
      successRate: 0,
      avgRating: 0,
      jobsCompleted: 100,
      attestationCount: 0,
    });
    const b = calculateTrustScore({
      successRate: 0,
      avgRating: 0,
      jobsCompleted: 500,
      attestationCount: 0,
    });
    expect(a.score).toBe(b.score);
    expect(a.breakdown.jobs).toBe(20);
  });

  it('caps attestations at 50', () => {
    const a = calculateTrustScore({
      successRate: 0,
      avgRating: 0,
      jobsCompleted: 0,
      attestationCount: 50,
    });
    const b = calculateTrustScore({
      successRate: 0,
      avgRating: 0,
      jobsCompleted: 0,
      attestationCount: 200,
    });
    expect(a.score).toBe(b.score);
    expect(a.breakdown.attestations).toBe(10);
  });

  it('rounds to 2 decimal places', () => {
    const result = calculateTrustScore({
      successRate: 0.333,
      avgRating: 3.7,
      jobsCompleted: 33,
      attestationCount: 17,
    });
    // Score should have at most 2 decimal places
    const parts = String(result.score).split('.');
    if (parts[1]) {
      expect(parts[1].length).toBeLessThanOrEqual(2);
    }
  });

  it('applies correct weights: 40% success, 30% rating, 20% jobs, 10% attestations', () => {
    // Only successRate = 1 → should get 40 points
    const successOnly = calculateTrustScore({
      successRate: 1,
      avgRating: 0,
      jobsCompleted: 0,
      attestationCount: 0,
    });
    expect(successOnly.score).toBe(40);

    // Only avgRating = 5 → should get 30 points
    const ratingOnly = calculateTrustScore({
      successRate: 0,
      avgRating: 5,
      jobsCompleted: 0,
      attestationCount: 0,
    });
    expect(ratingOnly.score).toBe(30);

    // Only jobsCompleted = 100 → should get 20 points
    const jobsOnly = calculateTrustScore({
      successRate: 0,
      avgRating: 0,
      jobsCompleted: 100,
      attestationCount: 0,
    });
    expect(jobsOnly.score).toBe(20);

    // Only attestationCount = 50 → should get 10 points
    const attestOnly = calculateTrustScore({
      successRate: 0,
      avgRating: 0,
      jobsCompleted: 0,
      attestationCount: 50,
    });
    expect(attestOnly.score).toBe(10);
  });

  it('handles fractional successRate', () => {
    const result = calculateTrustScore({
      successRate: 0.85,
      avgRating: 4.2,
      jobsCompleted: 73,
      attestationCount: 12,
    });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(100);
  });
});
