# Workflow Product Loop Hardening

> Last updated: 2026-04-29
> Related: `2026-04-27-agent-workflow-marketplace.md`, `2026-04-29-unified-receipt-ledger.md`

## Goal

Make the creator and buyer product loops match the workflow-first product model:

- creators publish, fork, and deploy workflows through a reliable CLI/API path
- buyers can distinguish sandbox preview from paid execution
- paid execution writes the final receipt/reputation ledger
- legacy publish paths cannot create workflow-less active skills

## Scope

1. `/api/skills/create` must accept the creator CLI payload and apply server-side defaults for non-null skill profile fields.
2. `/api/skills/publish` must no longer create active skills without workflow metadata.
3. `/workflow/:id/run` must expose a paid run path in addition to sandbox preview.
4. Gateway and REST execution routes must enforce bounded creator response bodies.
5. `scripts/dojo.ts` must support `fork` and `deploy` commands in addition to `init`, `test`, and `publish`.
6. Tests must cover the CLI publish payload and paid run UI/API contract where practical.

## Acceptance

- CLI `publish` payload can create an active Skill, Workflow, and WorkflowVersion.
- Legacy `POST /api/skills/publish` delegates to the workflow-creating path or returns a workflow-backed response.
- Workflow run page labels sandbox as sandbox and paid execution as paid.
- Paid execution uses `/api/v1/run` and surfaces `workflow_receipt`.
- Gateway creator response reads are capped to avoid unbounded memory use.
- CLI supports `fork` and `deploy` with API key auth.
- `npm run typecheck`, `npm test -- --run`, and `npm run lint` pass.
