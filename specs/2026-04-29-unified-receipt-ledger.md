# Unified Receipt / Reputation Ledger

> Status: Implementation spec
> Date: 2026-04-29
> Owner: JhiNResH
> Related: `2026-04-27-agent-workflow-marketplace.md`, `2026-04-29-testnet-hardening.md`

## Goal

Make `WorkflowRunReceipt` the single final ledger for execution outcomes, reputation updates, and review eligibility.

Today the REST workflow path writes receipts, while the UI gateway / ERC-8183 session path writes `SkillCall` only. This splits product truth across `Session`, `SkillCall`, and `WorkflowRunReceipt`.

## Scope

### 1. Ledger Write Path

Every executable workflow run must write:

- `SkillCall` as the low-level call log.
- `WorkflowRunReceipt` as the final product ledger when the skill is attached to a workflow.

This applies to:

- `/api/v1/run`
- `/api/gateway/skills/[slug]/run`

### 2. Reputation Update

Workflow `runCount` and `trustScore` must update from the same ledger write path for both REST and UI gateway runs.

### 3. Settlement Reconciliation

When an ERC-8183 session closes:

- if session result is `settled`, receipts remain / become `paid`.
- if session result is `refunded`, receipts for that session become `refunded`.

### 4. Review Eligibility

Review eligibility should be based on the receipt ledger, not only raw session status.

## Acceptance

- A gateway session run for a workflow creates a `WorkflowRunReceipt`.
- REST `/api/v1/run` and gateway route use the same receipt helper.
- Session close reconciles receipt `settlementStatus`.
- Review API accepts only users with a final receipt for that skill/session.
- `npm run typecheck` passes.
- Tests pass.

## Non-Goals

- No new smart contract deployment.
- No mainnet migration.
- No review UI redesign.
