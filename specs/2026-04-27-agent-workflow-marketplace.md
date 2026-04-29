# Agent Workflow Marketplace

> Status: Draft for product pivot
> Date: 2026-04-27
> Owner: JhiNResH
> Related: `2026-04-16-agent-commerce-protocol.md`, `2026-04-13-reputation-clearing-loop.md`

## Decision

Dojo should focus on agent workflows, not isolated skills as the primary product surface.

The product becomes:

> Dojo is the transaction network where creators publish agent workflows that others can run, fork, and monetize, with reputation built from real executions.

This keeps the existing commerce and reputation architecture, but changes the top-level product object:

- Old surface: skill marketplace
- New surface: workflow marketplace
- Core engine: authorization, execution, clearing, settlement
- Moat: workflow lineage plus execution-based reputation
- Long-term direction: reputation-based allocation / RBE

## Why

Single skills are too small. They look like API endpoints and compete with ordinary SaaS APIs.

Workflows are closer to real agent businesses:

- They encode a repeatable process.
- They can combine prompts, tools, APIs, evaluator rules, and settlement policy.
- They can be run directly, forked into variants, or deployed as services.
- They generate richer reputation data than a single endpoint call.

This also differentiates Dojo from agent tokenization platforms. Dojo is not primarily for co-owning an agent asset. Dojo is for running, copying, monetizing, and clearing agent workflows.

## Product Model

### Workflow

A workflow is a versioned executable package:

- Input schema
- Output schema
- Step graph
- Required tools / skills
- Pricing
- SLA / timeout policy
- Evaluator policy
- Creator wallet
- Version and fork lineage
- Execution history
- Reputation summary

### User Actions

1. Run
   - Pay to execute the workflow once.
   - Result returns through Dojo.
   - Execution receipt is created.

2. Fork
   - Copy the workflow into a new version.
   - Replace prompts, API keys, tools, pricing, or evaluator policy.
   - Original creator can receive royalty on downstream runs.

3. Deploy
   - Publish a fork as a callable service.
   - Other agents can hire it through the same transaction rail.

## On-Chain Objects

Use on-chain assets for ownership, usage, and receipts, not for speculative positioning.

| Object | Semantics | Transferability |
|---|---|---|
| Agent Identity | Who owns reputation | Non-transferable |
| Workflow NFT | Versioned workflow ownership / metadata pointer | Transferable only if reputation does not move |
| Fork NFT | Forked workflow variant and lineage pointer | Transferable only if reputation does not move |
| Run Token | 1 token = 1 workflow execution | Transferable |
| Execution Receipt | Proof that a workflow ran and how it scored | Non-transferable or append-only |
| Reputation | Execution-derived trust score | Non-transferable |

## Clearing Loop

Every run should produce an execution record:

```text
agent hires workflow
→ Dojo authorizes balance / limit / reputation
→ workflow executes
→ evaluator scores output
→ settlement releases or refunds
→ execution receipt is recorded
→ creator / workflow / fork reputation updates
```

Minimum receipt fields:

```ts
{
  workflowId: string;
  versionId: string;
  forkParentId?: string;
  buyerAgent: string;
  creator: string;
  evaluator: string;
  requestHash: string;
  responseHash: string;
  delivered: boolean;
  validFormat: boolean;
  withinSla: boolean;
  score: number;
  costUsdc: number;
  settlementStatus: "paid" | "refunded" | "disputed";
  attestationUid?: string;
}
```

## First Vertical

Dojo should start with security agent workflows on BNB / smart contracts.

Initial workflow examples:

- Quick Audit Workflow
- PR Diff Security Review Workflow
- Token Launch Risk Workflow
- Approval Risk Check Workflow
- Bug Bounty Triage Workflow

This vertical fits the existing contracts, reputation thesis, and JhiNResH's security positioning.

## What To Stop Saying

- "Skill marketplace" as the main category.
- "NFT marketplace" as the main category.
- "Full RBE" as the current product.
- "Agent tokenization" as the main differentiator.

## What To Say

Primary:

> Run, fork, and monetize agent workflows.

Secondary:

> Dojo clears each run with verifiable execution receipts, settlement, and reputation.

Developer:

> Publish a workflow once. Other agents can run it through one API call, fork it into variants, or deploy it as their own service.

## Implementation Implications

Keep existing `/api/v1/run` as the execution primitive.

Near-term changes:

1. Rename product copy from skills to workflows where user-facing.
2. Add workflow metadata fields before changing contract model.
3. Treat current skills as one-step workflows.
4. Add fork lineage in DB.
5. Add execution receipts as first-class records.
6. Use reputation in marketplace ranking.
7. Add royalty split for fork-derived workflow runs.
8. Support creator CLI publish from `dojo.workflow.yaml` / `SKILL.md` via dry-run-gated `/api/skills/create`.

## Non-Goals

- No AMM / price discovery for workflows.
- No transferable reputation.
- No generic agent launchpad.
- No co-ownership narrative.
- No broad vertical expansion before the security workflow wedge is usable.
