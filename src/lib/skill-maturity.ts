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
  contextRefCount?: number | null;
  artifactRefCount?: number | null;
  evaluatorEvidenceCount?: number | null;
  versionLineageCount?: number | null;
  lineageDepth?: number | null;
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
    contextRefCount: number;
    artifactRefCount: number;
    evaluatorEvidenceCount: number;
    versionLineageCount: number;
    lineageDepth: number;
  };
  next: string;
};

export type SkillMaturityReceiptEvidence = {
  settlementStatus?: string | null;
  score?: number | null;
  skillVersion?: number | null;
  contextRefs?: string | null;
  artifactRefs?: string | null;
  evaluatorEvidence?: string | null;
  lineageDepth?: number | null;
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

function jsonArrayCount(value: string | null | undefined): number {
  if (!value) return 0;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

function ratioPercent(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 100);
}

export function computeMaturityEvidenceFromReceipts(
  receipts: SkillMaturityReceiptEvidence[],
  fallback: Pick<SkillMaturityEvidence, 'evaluationPassed' | 'evaluationScore' | 'version'> = {},
): SkillMaturityEvidence {
  const paidReceipts = receipts.filter((receipt) => receipt.settlementStatus === 'paid');
  const refundedReceipts = receipts.filter((receipt) => receipt.settlementStatus === 'refunded');
  const disputedReceipts = receipts.filter((receipt) => receipt.settlementStatus === 'disputed');
  const passedReceipts = paidReceipts.filter((receipt) => (receipt.score ?? 0) > 0);
  const maxReceiptVersion = receipts.reduce<number | null>((max, receipt) => {
    if (receipt.skillVersion == null) return max;
    return max == null ? receipt.skillVersion : Math.max(max, receipt.skillVersion);
  }, null);

  return {
    ...fallback,
    testReceiptCount: receipts.filter((receipt) => (receipt.score ?? 0) >= 0.8).length,
    clearedRunCount: paidReceipts.length,
    passRate: ratioPercent(passedReceipts.length, receipts.length),
    refundRate: ratioPercent(refundedReceipts.length, receipts.length),
    disputeRate: ratioPercent(disputedReceipts.length, receipts.length),
    version: maxReceiptVersion ?? fallback.version ?? null,
    contextRefCount: receipts.reduce((total, receipt) => total + jsonArrayCount(receipt.contextRefs), 0),
    artifactRefCount: receipts.reduce((total, receipt) => total + jsonArrayCount(receipt.artifactRefs), 0),
    evaluatorEvidenceCount: receipts.reduce((total, receipt) => total + jsonArrayCount(receipt.evaluatorEvidence), 0),
    versionLineageCount: receipts.filter((receipt) => receipt.skillVersion != null).length,
    lineageDepth: receipts.reduce((max, receipt) => Math.max(max, nonNegativeInt(receipt.lineageDepth)), 0),
  };
}

export function computeSkillMaturity(input: SkillMaturityEvidence): SkillMaturity {
  const evaluationScore = percent(input.evaluationScore);
  const passRate = percent(input.passRate);
  const refundRate = negativePercent(input.refundRate);
  const disputeRate = negativePercent(input.disputeRate);
  const testReceiptCount = nonNegativeInt(input.testReceiptCount);
  const clearedRunCount = nonNegativeInt(input.clearedRunCount);
  const contextRefCount = nonNegativeInt(input.contextRefCount);
  const artifactRefCount = nonNegativeInt(input.artifactRefCount);
  const evaluatorEvidenceCount = nonNegativeInt(input.evaluatorEvidenceCount);
  const versionLineageCount = nonNegativeInt(input.versionLineageCount);
  const lineageDepth = nonNegativeInt(input.lineageDepth);
  const evaluationPassed =
    input.evaluationPassed === true ||
    (evaluationScore != null && evaluationScore >= TESTED_SCORE_THRESHOLD);
  const negativeRate = refundRate + disputeRate;
  const hasReceiptProvenance =
    contextRefCount > 0 ||
    artifactRefCount > 0 ||
    evaluatorEvidenceCount > 0 ||
    versionLineageCount > 0;
  const hasVersionEvidence = input.version != null || versionLineageCount > 0;
  const hasEvaluatorEvidence = evaluatorEvidenceCount > 0;
  const hasClearedProvenance = clearedRunCount > 0 && hasEvaluatorEvidence && hasVersionEvidence;

  const evidence = {
    evaluationPassed,
    evaluationScore,
    testReceiptCount,
    clearedRunCount,
    passRate,
    refundRate,
    disputeRate,
    version: input.version ?? null,
    contextRefCount,
    artifactRefCount,
    evaluatorEvidenceCount,
    versionLineageCount,
    lineageDepth,
  };

  if (
    clearedRunCount >= REPUTABLE_MIN_CLEARED_RUNS &&
    (passRate ?? 0) >= REPUTABLE_MIN_PASS_RATE &&
    negativeRate <= REPUTABLE_MAX_NEGATIVE_RATE &&
    evaluatorEvidenceCount >= REPUTABLE_MIN_CLEARED_RUNS &&
    versionLineageCount >= REPUTABLE_MIN_CLEARED_RUNS
  ) {
    return {
      level: 'reputable',
      label: 'Reputable',
      rank: 3,
      summary: 'Repeated provenance-backed cleared runs with strong pass rate and low refund or dispute drag.',
      evidence,
      next: 'Keep refining evaluator policy and preserve lineage for downstream forks.',
    };
  }

  if (hasClearedProvenance) {
    return {
      level: 'cleared',
      label: 'Cleared',
      rank: 2,
      summary: 'Used in a real cleared run with evaluator evidence and version lineage.',
      evidence,
      next: `Reach ${REPUTABLE_MIN_CLEARED_RUNS} cleared runs with ${REPUTABLE_MIN_PASS_RATE}%+ pass rate.`,
    };
  }

  if (testReceiptCount > 0 || clearedRunCount > 0 || evaluationPassed || hasReceiptProvenance) {
    return {
      level: 'tested',
      label: 'Tested',
      rank: 1,
      summary: 'Has evaluator, context, artifact, or version evidence, but has not cleared paid work yet.',
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
