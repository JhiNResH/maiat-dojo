import { describe, expect, it } from 'vitest';
import {
  computeMaturityEvidenceFromReceipts,
  computeSkillMaturity,
} from '@/lib/skill-maturity';

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
      evaluatorEvidenceCount: 1,
      versionLineageCount: 1,
      version: 1,
    });
    expect(maturity.level).toBe('cleared');
  });

  it('does not classify paid runs as cleared without evaluator and version provenance', () => {
    const maturity = computeSkillMaturity({
      clearedRunCount: 1,
      passRate: 100,
    });
    expect(maturity.level).toBe('tested');
    expect(maturity.evidence.evaluatorEvidenceCount).toBe(0);
  });

  it('classifies high-volume, high-pass, low-negative skills as reputable', () => {
    const maturity = computeSkillMaturity({
      clearedRunCount: 12,
      passRate: 0.93,
      refundRate: 2,
      disputeRate: 1,
      version: 4,
      evaluatorEvidenceCount: 12,
      versionLineageCount: 12,
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
      evaluatorEvidenceCount: 20,
      versionLineageCount: 20,
      version: 2,
    });
    expect(maturity.level).toBe('cleared');
  });

  it('derives maturity evidence from W3 receipt provenance fields', () => {
    const evidence = computeMaturityEvidenceFromReceipts([
      {
        settlementStatus: 'paid',
        score: 1,
        skillVersion: 2,
        contextRefs: JSON.stringify(['telegram:thread', 'repo:dojo']),
        artifactRefs: JSON.stringify(['receipt:abc']),
        evaluatorEvidence: JSON.stringify([{ delivered: true }, { format: true }]),
        lineageDepth: 1,
      },
      {
        settlementStatus: 'refunded',
        score: 0,
        skillVersion: 2,
        contextRefs: JSON.stringify(['telegram:thread']),
        artifactRefs: null,
        evaluatorEvidence: JSON.stringify([{ delivered: false }]),
        lineageDepth: 1,
      },
    ]);

    expect(evidence.clearedRunCount).toBe(1);
    expect(evidence.passRate).toBe(50);
    expect(evidence.refundRate).toBe(50);
    expect(evidence.contextRefCount).toBe(3);
    expect(evidence.artifactRefCount).toBe(1);
    expect(evidence.evaluatorEvidenceCount).toBe(3);
    expect(evidence.versionLineageCount).toBe(2);
    expect(evidence.lineageDepth).toBe(1);
  });
});
