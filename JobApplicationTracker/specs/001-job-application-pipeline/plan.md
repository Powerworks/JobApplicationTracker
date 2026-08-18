# Implementation Plan: Job Application Pipeline Tracking

**Branch**: `001-job-application-pipeline` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-job-application-pipeline/spec.md`

## Summary

Track a single job seeker's applications as event-sourced deciders: submit an application, progress
it through interview rounds, receive/accept/decline an offer, withdraw, or have it auto-ghosted on
silence — enforcing the sequencing and closed-state guards from the spec. Built with Emmett on an
in-memory event store for this increment (Postgres deferred to a later feature), organized as one
granular vertical slice per command plus one slice each for the active-pipeline read model and the
ghosting reactor, per the project constitution.

## Technical Context

**Language/Version**: TypeScript, Node.js 20+ (LTS)

**Primary Dependencies**: `@event-driven-io/emmett` (decider pattern, in-memory event store).
`@event-driven-io/emmett-expressjs` (or Fastify) is explicitly deferred — the spec's Assumptions
state no dedicated UI/API is required for this feature; an HTTP layer is out of scope here.

**Storage**: Emmett `getInMemoryEventStore` for this feature. Postgres event store is a constitution-
mandated later swap (Principle I), not part of this plan's scope — introducing it now would be
premature for logic that isn't solid yet.

**Testing**: Vitest, using Emmett's `deciderSpecification` for given-when-then tests (constitution
Principle II, NON-NEGOTIABLE — one test suite per command slice).

**Target Platform**: Node.js (local dev machine / CI), no browser target.

**Project Type**: Single project — library-style modules consumed directly (by tests now, by a
future CLI or HTTP slice later); no frontend in this increment.

**Performance Goals**: Not a driving constraint — single-user tool, in-memory store; any operation
completing well under human-perceptible latency (sub-100ms) is sufficient and trivially met.

**Constraints**: None beyond the constitution's principles. No external services required for this
feature (Postgres is out of scope here).

**Scale/Scope**: Single user, on the order of tens to low hundreds of tracked applications — no
scale engineering needed.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Event Sourcing via Emmett (NON-NEGOTIABLE) | State modeled as commands → events → state via Emmett deciders; in-memory store for now, Postgres deferred; reads go through the active-pipeline projection, not direct state queries | PASS |
| II. Test-First, Given-When-Then (NON-NEGOTIABLE) | Every command slice ships a `deciderSpecification` test covering its guards before being done; enforced per-slice at `/speckit-tasks` | PASS |
| III. Granular Vertical Slice Architecture | Project Structure below is one folder per command plus one for the read model and one for the reactor; no shared `commands.ts`/`handlers.ts`/`routes.ts` | PASS |
| IV. Decisive Greenfield Architecture | No legacy code, no compatibility shims; technology choices below are made outright | PASS |
| V. Simplicity: No Board, No Board-Driven Tooling | No Event Modeling board used; this plan is produced via the Spec Kit chain from `docs/BRIEF.md`/`docs/ADRs.md` | PASS |

No violations — Complexity Tracking table is not needed.

*Re-checked post-Phase 1 design (data-model.md, contracts/, quickstart.md): still PASS on all five
principles — the design introduced no shared handler files, no premature Postgres/HTTP dependency,
and every command/read-model/reactor slice remains independently testable via `deciderSpecification`.*

## Project Structure

### Documentation (this feature)

```text
specs/001-job-application-pipeline/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

**Structure Decision**: Single project. Source is organized as granular vertical slices per
constitution Principle III — one folder per command, plus one for the read model and one for the
reactor. Each slice owns its decider/projection/reactor logic and its own colocated
`deciderSpecification` test; there is no shared `commands.ts`/`handlers.ts` file. A minimal
`domain/` module holds only the shared `Application` state shape and the `Event`/`Command` type
unions that Emmett's decider wiring requires across slices — it contains no decision logic.

```text
src/
├── domain/
│   ├── events.ts             # Event type union: ApplicationSubmitted, InterviewScheduled, ...
│   ├── commands.ts           # Command type union (types only, no handlers)
│   └── state.ts              # Application state shape + evolve() fold used by every decider
│
├── slices/
│   ├── submit-application/
│   │   ├── decide.ts
│   │   └── decide.spec.ts
│   ├── schedule-interview/
│   │   ├── decide.ts
│   │   └── decide.spec.ts
│   ├── record-interview-outcome/
│   │   ├── decide.ts
│   │   └── decide.spec.ts
│   ├── receive-offer/
│   │   ├── decide.ts
│   │   └── decide.spec.ts
│   ├── accept-offer/
│   │   ├── decide.ts
│   │   └── decide.spec.ts
│   ├── decline-offer/
│   │   ├── decide.ts
│   │   └── decide.spec.ts
│   └── withdraw-application/
│       ├── decide.ts
│       └── decide.spec.ts
│
├── read-models/
│   └── active-pipeline/
│       ├── project.ts        # Projection: open applications, stage, idle time, sorted
│       └── project.spec.ts
│
├── reactors/
│   └── ghosting/
│       ├── reactor.ts        # Silence-clock reactor emitting ApplicationGhosted
│       └── reactor.spec.ts
│
└── store/
    └── event-store.ts        # getInMemoryEventStore wiring shared by slices at runtime only
                               # (not shared decision logic — no guard/business logic lives here)
```

## Complexity Tracking

*No violations — table omitted.*
