<!--
Sync Impact Report
- Version change: [TEMPLATE] → 1.0.0 (initial ratification)
- Modified principles: n/a (first fill of template placeholders)
- Added sections: I. Event Sourcing via Emmett, II. Test-First (given-when-then, NON-NEGOTIABLE),
  III. Granular Vertical Slice Architecture, IV. Decisive Greenfield Architecture, V. Simplicity / No Board
- Removed sections: none
- Templates checked: .specify/templates/{spec,plan,tasks,checklist}-template.md — no agent-specific
  version references found requiring edits; generic enough to remain consistent with this constitution
- Follow-up TODOs: none — all placeholders resolved from docs/BRIEF.md and docs/ADRs.md
-->

# JobApplicationTracker Constitution

## Core Principles

### I. Event Sourcing via Emmett (NON-NEGOTIABLE)
State MUST be modeled as a decider (commands → events → state), built with
`@event-driven-io/emmett`, never as direct CRUD/relational state mutation. Start on
`getInMemoryEventStore` for fast iteration; swap to Postgres as the event store once the
decider logic is solid. Reads MUST go through a projection (the `active pipeline` read model),
never a direct query against event-derived state.
**Rationale**: this project exists specifically for hands-on Emmett practice (see
`docs/ADRs.md`, ADR 1); a CRUD shortcut would defeat its purpose.

### II. Test-First, Given-When-Then (NON-NEGOTIABLE)
Every command handler MUST have a passing `deciderSpecification` given-when-then test before
it is considered done. This covers the happy path and every guard: the multi-round
interview-sequencing guard, the offer-requires-pass guard, and rejection once the aggregate is
closed (`Accepted`/`Declined`/`Withdrawn`/`Ghosted`).
**Rationale**: this domain's entire practice value is its branching guard logic (`docs/BRIEF.md`);
untested guards are unverified guards.

### III. Granular Vertical Slice Architecture
The codebase MUST be organized as one slice per command — `SubmitApplication`,
`ScheduleInterview`, `RecordInterviewOutcome`, `ReceiveOffer`, `AcceptOffer`, `DeclineOffer`,
`WithdrawApplication`, `MarkGhosted` — plus one slice for the `active pipeline` read model and
one for the ghosting reactor. Each slice owns its own decider logic, its own
`deciderSpecification` test, and (once an HTTP layer exists) its own route. Shared catch-all
files (`commands.ts`, `handlers.ts`, `routes.ts`) are PROHIBITED — every slice MUST be readable
and testable in isolation.
**Rationale**: `docs/ADRs.md` ADR 3; granularity is the explicit goal, not an incidental
side effect of feature-based organization.

### IV. Decisive Greenfield Architecture
There is no legacy codebase to stay compatible with. Architecture and technology decisions MUST
be made outright, without hedging, backwards-compatibility shims, or speculative abstraction for
requirements that do not yet exist (YAGNI). Every non-trivial architecture decision MUST be
recorded as an ADR in `docs/ADRs.md`.
**Rationale**: carried over from prior Spec Kit projects (`docs/SESSION_HANDOFF.md`) as a
deliberate practice discipline — indecision and hedging are themselves a bad habit to avoid
practicing.

### V. Simplicity: No Modeling Board, No Board-Driven Tooling
This is a small, solo, well-understood domain. An Event Modeling board and board-driven code
generation (e.g. eventmodelers.ai) are explicitly out of scope; `docs/BRIEF.md` and
`docs/ADRs.md` are the design record instead, and the Spec Kit chain
(`/speckit-constitution → /speckit-specify → /speckit-plan → /speckit-tasks → /speckit-implement`)
is the process used to go from that design to code.
**Rationale**: `docs/ADRs.md` ADR 2; avoids paying discovery-tooling cost where there is no
discovery left to do.

## Technology Stack

- Language/runtime: TypeScript on Node.js.
- Event sourcing: `@event-driven-io/emmett`, decider pattern.
- Event store: `getInMemoryEventStore` during development of decider logic; Postgres
  (Emmett's Postgres event store) once that logic is solid.
- Testing: Vitest, using Emmett's `deciderSpecification` for given-when-then tests.
- HTTP layer (optional, not required for the event-sourcing practice itself):
  `@event-driven-io/emmett-expressjs` or Fastify, added only once the decider layer is complete.
- No ORM and no read-model framework beyond Emmett's own projections.

## Development Workflow

- Design flows from `docs/BRIEF.md` (the agreed domain model) and `docs/ADRs.md` (the
  architecture decisions) into the Spec Kit chain: `/speckit-specify` → `/speckit-plan` →
  `/speckit-tasks` → `/speckit-implement`.
- `/speckit-plan` and `/speckit-tasks` MUST reflect Principle III: generated tasks land
  one-slice-per-task, not layer-by-layer (e.g. not "write all handlers" then "write all tests").
- A new or revised architecture decision (technology choice, structural pattern, tooling
  adoption or rejection) MUST be captured as an ADR in `docs/ADRs.md` before or alongside the
  Spec Kit artifact that depends on it.

## Governance

This constitution supersedes any conflicting practice adopted ad hoc during implementation. Any
amendment MUST update this file, bump `CONSTITUTION_VERSION` per semantic versioning (MAJOR for
backward-incompatible principle removal/redefinition, MINOR for new/materially expanded
principles or sections, PATCH for clarifications), and update `Last Amended`. Compliance with
Principles I–III MUST be checked at `/speckit-plan` and `/speckit-tasks` time — a plan or task
list that violates them (e.g. proposes a shared `handlers.ts`, or reads/write state without
going through the decider) is non-compliant and MUST be revised before `/speckit-implement`.

**Version**: 1.0.0 | **Ratified**: 2026-08-18 | **Last Amended**: 2026-08-18
