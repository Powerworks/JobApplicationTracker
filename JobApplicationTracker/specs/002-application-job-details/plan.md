# Implementation Plan: Richer Job Posting Details on Submission

**Branch**: `002-application-job-details` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-application-job-details/spec.md`

## Summary

Extend feature 001's `SubmitApplication` command/event and the `Application` state with five new
fields captured at submission: `location`, `salary` (optional amount+currency), `employmentType`
("Permanent" | "Contract"), `bonus` (optional amount+currency), and `benefits` (string list,
possibly empty). No new command, no new slice — this modifies the existing
`src/slices/submit-application/` slice and the shared `src/domain/` types in place, per spec.md's
single P1 story.

## Technical Context

**Language/Version**: TypeScript, Node.js 20+ (unchanged from feature 001)

**Primary Dependencies**: `@event-driven-io/emmett` (unchanged) — no new dependency needed for
this feature.

**Storage**: Emmett `getInMemoryEventStore` (unchanged).

**Testing**: Vitest + `deciderSpecification` (unchanged) — the existing
`submit-application/decide.spec.ts` gains cases for the new fields; no new test file.

**Target Platform**: Node.js (unchanged).

**Project Type**: Single project (unchanged) — this feature does not touch storage, HTTP, or
frontend layers; those remain out of scope until this data model is settled, per the user's
explicit request to land this before the HTTP layer.

**Performance Goals**: Unchanged — not a driving constraint.

**Constraints**: None beyond the constitution's principles.

**Scale/Scope**: Unchanged.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Event Sourcing via Emmett (NON-NEGOTIABLE) | New fields flow through `ApplicationSubmitted`'s event data and the `evolve` fold, exactly like the existing fields — no direct state mutation introduced | PASS |
| II. Test-First, Given-When-Then (NON-NEGOTIABLE) | New given-when-then cases added to `submit-application/decide.spec.ts` before the `decide.ts`/`events.ts`/`state.ts` changes are made | PASS |
| III. Granular Vertical Slice Architecture | No new slice needed — this is a field extension of the existing `submit-application` slice, not a new command; it does not introduce a shared handler file | PASS |
| IV. Decisive Greenfield Architecture | Field shapes (Permanent/Contract only, amount+currency not ranges, free-text benefits) decided outright based on user confirmation, not hedged | PASS |
| V. Simplicity: No Board, No Board-Driven Tooling | No board used; this plan follows the same Spec Kit chain as feature 001 | PASS |

No violations — Complexity Tracking table is not needed.

*Re-checked post-Phase 1 design (data-model.md, contracts/, quickstart.md): still PASS on all
five principles — no new slice, no new shared file, and the field extension flows through the
existing decider/evolve pattern unchanged.*

## Project Structure

### Documentation (this feature)

```text
specs/002-application-job-details/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

**Structure Decision**: No new files/folders. This feature modifies three existing files from
feature 001, all within the already-established structure:

```text
src/
├── domain/
│   ├── events.ts       # MODIFIED: ApplicationSubmitted gains the 5 new data fields
│   └── state.ts        # MODIFIED: SubmittedApplication gains the 5 new fields; evolve()
│                        #           carries them from ApplicationSubmitted into state
│
├── slices/
│   └── submit-application/
│       ├── decide.ts       # MODIFIED: passes the new command fields through to the event
│       └── decide.spec.ts  # MODIFIED: new given-when-then cases for the new fields
│
└── domain/commands.ts   # MODIFIED: SubmitApplication command gains the 5 new data fields
```

`src/read-models/active-pipeline/` and `src/reactors/ghosting/` are unaffected — feature 001's
FR-012 still only mandates company/role/stage/idle-time there (spec.md FR-007).

## Complexity Tracking

*No violations — table omitted.*
