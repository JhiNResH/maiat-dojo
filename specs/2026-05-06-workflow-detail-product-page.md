# Workflow Detail Product Page

> Status: Accepted for implementation
> Date: 2026-05-06
> Owner: JhiNResH
> Related: `2026-04-27-agent-workflow-marketplace.md`, `2026-05-04-workflow-spirit-profiles.md`

## Problem

The current skill and workflow run pages expose protocol facts before product value. Users can see price, trust, settlement, creator, and receipt data, but still struggle to answer:

- What does this workflow do?
- What input do I provide?
- What output will I receive?
- Where do I start?

## Decision

Treat workflow detail pages like simple marketplace product pages. The first viewport must explain the workflow job before showing settlement or protocol details.

## First Viewport

Show only the buying/execution essentials:

1. Workflow name and one-sentence job.
2. Input summary.
3. Output summary.
4. Price, runs, success/trust.
5. Primary action: `Run workflow`.
6. Secondary action: `Fork & customize`.

## Detail Sections

Use progressive disclosure:

- `How it works`: Input, process, output.
- `Sample result`: Render example output in a readable preview.
- `Run workflow`: Form and confirmation close to the explanation.
- `Trust & receipts`: ERC-8183, BSC, evaluator, and reputation proof moved below the product explanation.

## Copy Rules

- Prefer "workflow" over "skill" in user-facing page headers.
- Avoid protocol-first labels in the first viewport.
- Convert `inputSchema`, `outputSchema`, `exampleInput`, and `exampleOutput` into human-readable summaries.
- Keep creator, listed date, chain, settlement, and evaluator as secondary details.

## Acceptance

- `/skill/[id]` explains what the workflow does before creator/spec/protocol metadata.
- `/workflow/[id]/run` starts with run value, input, output, and CTA before clearing policy.
- Existing run, sandbox, paid run, review, trust, and purchase flows continue to work.
- Pages remain responsive in light and dark mode.
