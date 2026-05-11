# Skill Maturity Levels

> Last updated: 2026-05-11

## Goal

Make Dojo skills legible by showing evidence maturity instead of treating every listing as equally trustworthy.

## Levels

```text
Draft -> Tested -> Cleared -> Reputable
```

### Draft

A skill has been published or generated, but it has no durable test or cleared-run evidence yet.

Current rule:

- No evaluator pass.
- No test receipt evidence.
- No cleared paid run.

### Tested

A skill has passed evaluator or test evidence, but it has not cleared real paid work yet.

Current rule:

- `evaluationPassed === true`, or
- `evaluationScore >= 80`, or
- future `testReceiptCount > 0`.

### Cleared

A skill has been used in at least one real clearing path and has a receipt-backed outcome.

Current rule:

- `clearedRunCount > 0`.

In the current codebase this is derived from workflow run count because `/api/v1/run` writes `WorkflowRunReceipt` through the workflow ledger.

### Reputable

A skill has enough repeated cleared outcomes to be trusted beyond a single demo or isolated run.

Current rule:

- `clearedRunCount >= 10`.
- `passRate >= 90`.
- `refundRate + disputeRate <= 5`.

## Product Implication

Skill cards and workflow pages should present maturity as the trust primitive:

```text
Maturity: Cleared
12 cleared runs · 91% pass · v3
```

This keeps Dojo focused on receipt-backed work history instead of likes, installs, or listing aesthetics.

## Implementation Notes

- `src/lib/skill-maturity.ts` is the shared helper.
- `/api/skills`, `/api/v1/skills`, and `/api/workflows` should expose maturity metadata.
- UI should label the column as `Maturity`, not generic `Status`.
- Future W3 receipt provenance work should feed `contextRefs`, `artifactRefs`, evaluator evidence, skill version, refund/dispute status, and lineage back into this same helper.
