# Quickstart: Job Application Pipeline Tracking

Validation guide proving this feature works end-to-end once implemented. No implementation code
here — see `tasks.md` (from `/speckit-tasks`) for that.

## Prerequisites

- Node.js 20+ and the project's dependencies installed (`npm install`).
- No external services — this feature runs entirely on Emmett's in-memory event store.

## Setup

```bash
npm install
npm test
```

`npm test` runs every slice's `deciderSpecification` (Vitest) suite — this is the primary
validation path for this feature (constitution Principle II).

## Scenario walkthroughs

These map directly to spec.md's acceptance scenarios; each should be exercised as a
`deciderSpecification` given-when-then test in its slice (see `contracts/commands.md` for exact
inputs/preconditions/rejections).

### User Story 1 — pipeline lifecycle (P1)

1. `SubmitApplication { company: "Acme", role: "Engineer" }` on a new stream →
   expect `ApplicationSubmitted`.
2. `ScheduleInterview { round: 1, date }` → expect `InterviewScheduled { round: 1 }`.
3. `RecordInterviewOutcome { round: 1, outcome: "Passed" }` →
   expect `InterviewCompleted { round: 1, outcome: "Passed" }`.
4. `ReceiveOffer { amount, deadline }` → expect `OfferReceived`.
5. `AcceptOffer {}` → expect `OfferAccepted`; subsequent state has `status === "Accepted"`.
6. Any further command against this application (e.g. `WithdrawApplication`) →
   expect rejection `ApplicationClosed`.

### User Story 2 — active overview (P2)

1. Create three applications via `SubmitApplication`, with distinct, increasing
   `lastActivityAt` gaps (simulate by driving one further through Step 1's flow than the others).
2. Close one of them (e.g. `WithdrawApplication`).
3. Call `getActivePipeline()` (see `contracts/active-pipeline-query.md`) →
   expect exactly the two still-open applications, ordered most-idle-first, and the withdrawn one
   absent.

### User Story 3 — auto-ghosting (P3)

1. Submit an application, then advance the reactor's notion of "now" past the configured silence
   period (14 days) with no further events on that stream.
2. Run the ghosting reactor (`src/reactors/ghosting/reactor.ts`) →
   expect `ApplicationGhosted` emitted, and `getActivePipeline()` no longer lists it.
3. Repeat with an event recorded partway through the silence period (e.g. an interview scheduled
   at day 10) → expect the clock to have reset, so no `ApplicationGhosted` at the original
   14-day mark.

## Expected outcome

All scenarios above pass as Vitest suites, satisfying spec.md's Success Criteria SC-001–SC-004
without any manual/UI verification — this feature has no UI in scope (spec Assumptions).
