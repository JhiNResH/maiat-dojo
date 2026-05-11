export const SKILL_MATURITY_LEVELS = [
  'draft',
  'tested',
  'cleared',
  'reputable',
] as const;

export type SkillMaturityLevel = (typeof SKILL_MATURITY_LEVELS)[number];

export type SkillMaturityEvidence = {
  evaluationPassed?: boolean | null;
  evaluationScore?: number | null;
  testReceiptCount?: number | null;
  clearedRunCount?: number | null;
  passRate?: number | null;
  refundRate?: number | null;
  disputeRate?: number | null;
  version?: number | null;
};

export type SkillMaturity = {
  level: SkillMaturityLevel;
  label: 'Draft' | 'Tested' | 'Cleared' | 'Reputable';
  rank: 0 | 1 | 2 | 3;
  summary: string;
  evidence: {
    evaluationPassed: boolean;
    evaluationScore: number | null;
    testReceiptCount: number;
    clearedRunCount: number;
    passRate: number | null;
    refundRate: number;
    disputeRate: number;
    version: number | null;
  };
  next: string;
};

const TESTED_SCORE_THRESHOLD = 80;
const REPUTABLE_MIN_CLEARED_RUNS = 10;
const REPUTABLE_MIN_PASS_RATE = 90;
const REPUTABLE_MAX_NEGATIVE_RATE = 5;

function percent(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  const normalized = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

function nonNegativeInt(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function negativePercent(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  const normalized = value > 0 && value < 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

export function computeSkillMaturity(input: SkillMaturityEvidence): SkillMaturity {
  const evaluationScore = percent(input.evaluationScore);
  const passRate = percent(input.passRate);
  const refundRate = negativePercent(input.refundRate);
  const disputeRate = negativePercent(input.disputeRate);
  const testReceiptCount = nonNegativeInt(input.testReceiptCount);
  const clearedRunCount = nonNegativeInt(input.clearedRunCount);
  const evaluationPassed =
    input.evaluationPassed === true ||
    (evaluationScore != null && evaluationScore >= TESTED_SCORE_THRESHOLD);
  const negativeRate = refundRate + disputeRate;

  const evidence = {
    evaluationPassed,
    evaluationScore,
    testReceiptCount,
    clearedRunCount,
    passRate,
    refundRate,
    disputeRate,
    version: input.version ?? null,
  };

  if (
    clearedRunCount >= REPUTABLE_MIN_CLEARED_RUNS &&
    (passRate ?? 0) >= REPUTABLE_MIN_PASS_RATE &&
    negativeRate <= REPUTABLE_MAX_NEGATIVE_RATE
  ) {
    return {
      level: 'reputable',
      label: 'Reputable',
      rank: 3,
      summary: 'Repeated cleared runs with strong pass rate and low refund or dispute drag.',
      evidence,
      next: 'Keep refining evaluator policy and preserve lineage for downstream forks.',
    };
  }

  if (clearedRunCount > 0) {
    return {
      level: 'cleared',
      label: 'Cleared',
      rank: 2,
      summary: 'Used in a real cleared run with a receipt-backed outcome.',
      evidence,
      next: `Reach ${REPUTABLE_MIN_CLEARED_RUNS} cleared runs with ${REPUTABLE_MIN_PASS_RATE}%+ pass rate.`,
    };
  }

  if (testReceiptCount > 0 || evaluationPassed) {
    return {
      level: 'tested',
      label: 'Tested',
      rank: 1,
      summary: 'Passed evaluator or test evidence, but has not cleared paid work yet.',
      evidence,
      next: 'Run through the paid clearing path to create the first WorkflowRunReceipt.',
    };
  }

  return {
    level: 'draft',
    label: 'Draft',
    rank: 0,
    summary: 'Published or generated, but not yet backed by test or cleared-run evidence.',
    evidence,
    next: 'Pass evaluator testing before presenting this as cleared work.',
  };
}

export function maturityBadgeTitle(maturity: SkillMaturity): string {
  return `${maturity.label}: ${maturity.summary}`;
}
