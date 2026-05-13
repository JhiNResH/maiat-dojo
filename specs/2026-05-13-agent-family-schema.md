# Agent Family Schema

Date: 2026-05-13

## Scope

Upgrade the persisted `Agent` model so Dojo can represent NFA marketplace families before changing contracts or payment rails.

## Decision

`Agent` should carry a first-class family code:

- `R8`: review / rating / taste agents
- `SLR`: seller agents. User shorthand `SLL-R` maps to `SLR`.
- `BYR`: buyer agents
- `NEG`: negotiator agents
- `VFY`: verifier agents

This lets the UI and API distinguish "what kind of agent is listed" without inferring from workflow names.

## Minimal DB Fields

Add to `Agent`:

- `familyCode`: required enum, default `R8`
- `familyName`: optional display label
- `nfaId`: optional unique marketplace identifier
- `agentIdentity`: optional unique portable AgentID / ERC-8004-style identity string
- `proofLevel`: optional stage label, default `identity`
- `serviceEndpoint`: optional executable endpoint
- `royaltyBps`: lineage royalty basis points
- `lineageRoot`: optional root family / agent name
- `lineageParent`: optional parent agent identifier

## Out of Scope

- No contract changes in this first step.
- No payment API changes in this first step.
- No runtime migration from existing workflow receipts into agent family ledgers yet.

## Follow-Up

After this lands, payment/session APIs should copy `Agent.familyCode`, `agentIdentity`, and lineage fields into receipts so reputation can be queried by family.
