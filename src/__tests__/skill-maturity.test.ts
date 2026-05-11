import { describe, expect, it } from 'vitest';
import { computeSkillMaturity } from '@/lib/skill-maturity';

describe('computeSkillMaturity', () => {
  it('classifies a skill with no evidence as draft', () => {
    expect(computeSkillMaturity({}).level).toBe('draft');
  });

  it('classifies evaluator-passed skills as tested before real cleared runs', () => {
    const maturity = computeSkillMaturity({ evaluationPassed: true, evaluationScore: 86 });
    expect(maturity.level).toBe('tested');
    expect(maturity.evidence.evaluationScore).toBe(86);
  });

  it('classifies any real cleared run as cleared before reputable thresholds', () => {
    const maturity = computeSkillMaturity({
      clearedRunCount: 1,
      passRate: 100,
    });
    expect(maturity.level).toBe('cleared');
  });

  it('classifies high-volume, high-pass, low-negative skills as reputable', () => {
    const maturity = computeSkillMaturity({
      clearedRunCount: 12,
      passRate: 0.93,
      refundRate: 2,
      disputeRate: 1,
      version: 4,
    });
    expect(maturity.level).toBe('reputable');
    expect(maturity.rank).toBe(3);
    expect(maturity.evidence.passRate).toBe(93);
    expect(maturity.evidence.version).toBe(4);
  });

  it('does not mark high-volume skills reputable when negative rate is too high', () => {
    const maturity = computeSkillMaturity({
      clearedRunCount: 20,
      passRate: 96,
      refundRate: 4,
      disputeRate: 3,
    });
    expect(maturity.level).toBe('cleared');
  });
});
