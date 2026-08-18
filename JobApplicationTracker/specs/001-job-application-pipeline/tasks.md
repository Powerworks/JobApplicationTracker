# Tasks: Job Application Pipeline Tracking

**Input**: Design documents from `/specs/001-job-application-pipeline/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included and REQUIRED, not optional — constitution Principle II (Test-First,
Given-When-Then) is NON-NEGOTIABLE for this project: every command handler gets a passing
`deciderSpecification` test before it is considered done.

**Organization**: Tasks are grouped by user story (spec.md P1/P2/P3), and within each story by
constitution Principle III's granular vertical slices — one slice per command, no shared files.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Path Conventions

Single project, per plan.md's Project Structure: `src/domain/`, `src/slices/<command>/`,
`src/read-models/active-pipeline/`, `src/reactors/ghosting/`, `src/store/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization

- [X] T001 Initialize the Node/TypeScript project: `package.json`, `tsconfig.json`, and dependencies
      `@event-driven-io/emmett` and `vitest` (dev), per plan.md's Technical Context, at repo root
      of `JobApplicationTracker/`
- [X] T002 [P] Configure Vitest (`vitest.config.ts`) to discover `src/**/*.spec.ts`
- [X] T003 [P] Configure TypeScript strictness (`strict: true` in `tsconfig.json`) — no runtime
      lint/format tooling beyond this; keep Setup minimal per constitution Principle IV (YAGNI)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared domain types and state fold every slice's decider needs. Per
research.md's decision, this is the one piece of cross-slice sharing the decider pattern itself
requires (not business/handler logic), so it does not violate Principle III.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 [P] Define the `Event` type union (`ApplicationSubmitted`, `InterviewScheduled`,
      `InterviewCompleted`, `OfferReceived`, `OfferAccepted`, `OfferDeclined`,
      `ApplicationWithdrawn`, `ApplicationGhosted`) in `src/domain/events.ts`, per data-model.md
- [X] T005 [P] Define the `Command` type union (types only, no handler logic) in
      `src/domain/commands.ts`, per contracts/commands.md's input shapes
- [X] T006 Define the `Application` state shape and its `evolve(state, event)` fold in
      `src/domain/state.ts` (depends on T004) — implements data-model.md's state-transition table
      and sets `lastActivityAt` on every event (FR-011)
- [X] T007 [P] Wire Emmett's `getInMemoryEventStore` in `src/store/event-store.ts`, per
      research.md's in-memory-first decision

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Track an application from submission to a terminal outcome (Priority: P1) 🎯 MVP

**Goal**: Submit an application and drive it through interview rounds to a terminal outcome
(offer accepted/declined, or withdrawn), enforcing the sequencing, offer, and closed-state guards.

**Independent Test**: Submit one application, progress it through one or more interview rounds,
and drive it to a terminal outcome (quickstart.md's User Story 1 walkthrough) — a complete,
working record of one application's lifecycle, on its own.

### Tests for User Story 1 (write FIRST, must fail before implementation)

- [X] T008 [P] [US1] `deciderSpecification` test for `SubmitApplication` in
      `src/slices/submit-application/decide.spec.ts` — happy path only (no preconditions per
      contracts/commands.md)
- [X] T009 [P] [US1] `deciderSpecification` test for `ScheduleInterview` in
      `src/slices/schedule-interview/decide.spec.ts` — covers round 1 (no prior rounds), round
      *N+1* after round *N* has a recorded outcome, rejection when round is out of sequence
      (FR-004), rejection when the prior round's outcome is still pending (FR-004), and rejection
      on a closed application (FR-009)
- [X] T010 [P] [US1] `deciderSpecification` test for `RecordInterviewOutcome` in
      `src/slices/record-interview-outcome/decide.spec.ts` — covers Passed and Rejected outcomes,
      rejection when no matching pending round exists, and rejection on a closed application
      (FR-009)
- [X] T011 [P] [US1] `deciderSpecification` test for `ReceiveOffer` in
      `src/slices/receive-offer/decide.spec.ts` — covers success when the latest round outcome is
      Passed, rejection when no interview has occurred, rejection when the latest outcome is
      Rejected (FR-005), and rejection on a closed application (FR-009)
- [X] T012 [P] [US1] `deciderSpecification` test for `AcceptOffer` in
      `src/slices/accept-offer/decide.spec.ts` — covers success with a pending offer, rejection
      with no offer, and rejection on a closed application (FR-009)
- [X] T013 [P] [US1] `deciderSpecification` test for `DeclineOffer` in
      `src/slices/decline-offer/decide.spec.ts` — same coverage shape as T012
- [X] T014 [P] [US1] `deciderSpecification` test for `WithdrawApplication` in
      `src/slices/withdraw-application/decide.spec.ts` — covers success on any open application
      and rejection on a closed application (FR-009)

### Implementation for User Story 1

- [X] T015 [P] [US1] Implement `decide()` for `SubmitApplication` in
      `src/slices/submit-application/decide.ts` (depends on T004-T007, T008)
- [X] T016 [P] [US1] Implement `decide()` for `ScheduleInterview` in
      `src/slices/schedule-interview/decide.ts` (depends on T004-T007, T009)
- [X] T017 [P] [US1] Implement `decide()` for `RecordInterviewOutcome` in
      `src/slices/record-interview-outcome/decide.ts` (depends on T004-T007, T010)
- [X] T018 [P] [US1] Implement `decide()` for `ReceiveOffer` in
      `src/slices/receive-offer/decide.ts` (depends on T004-T007, T011)
- [X] T019 [P] [US1] Implement `decide()` for `AcceptOffer` in
      `src/slices/accept-offer/decide.ts` (depends on T004-T007, T012)
- [X] T020 [P] [US1] Implement `decide()` for `DeclineOffer` in
      `src/slices/decline-offer/decide.ts` (depends on T004-T007, T013)
- [X] T021 [P] [US1] Implement `decide()` for `WithdrawApplication` in
      `src/slices/withdraw-application/decide.ts` (depends on T004-T007, T014)

**Checkpoint**: User Story 1 fully functional — quickstart.md's Story 1 walkthrough passes end to
end as Vitest suites (`npm test`)

---

## Phase 4: User Story 2 - See which applications need attention (Priority: P2)

**Goal**: A read-only overview of open applications, most-idle-first, excluding closed ones.

**Independent Test**: Given several synthetic event streams (built directly, not requiring US1's
slices to be wired to a running app) at different stages and idle times, `getActivePipeline()`
returns only the open ones, correctly ordered (quickstart.md's User Story 2 walkthrough).

### Tests for User Story 2 (write FIRST, must fail before implementation)

- [X] T022 [P] [US2] Test for `getActivePipeline()` in
      `src/read-models/active-pipeline/project.spec.ts` — covers most-idle-first ordering
      (FR-013), exclusion of closed applications (FR-014), and `currentStage`/
      `daysSinceLastActivity` derivation per data-model.md's `ActivePipelineEntry`

### Implementation for User Story 2

- [X] T023 [US2] Implement `getActivePipeline()` in
      `src/read-models/active-pipeline/project.ts` (depends on T004-T006, T022)

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: User Story 3 - Automatically flag applications that have gone silent (Priority: P3)

**Goal**: Open applications with no activity for the configured silence period (14 days, per
spec.md Assumptions) are auto-closed as "ghosted".

**Independent Test**: Create an open application, advance time past the silence period with no
further events, and confirm the reactor emits `ApplicationGhosted` (quickstart.md's User Story 3
walkthrough); confirm an event partway through resets the clock.

### Tests for User Story 3 (write FIRST, must fail before implementation)

- [X] T024 [P] [US3] Test for the ghosting reactor in `src/reactors/ghosting/reactor.spec.ts` —
      covers emitting `ApplicationGhosted` after 14 days of silence (FR-010), the silence clock
      resetting on new activity (FR-011), and closed applications being unaffected

### Implementation for User Story 3

- [X] T025 [US3] Implement the ghosting reactor in `src/reactors/ghosting/reactor.ts` (depends on
      T004-T007, T024)

**Checkpoint**: All three user stories independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T026 Run quickstart.md's full scenario walkthrough (`npm test`) and confirm every scenario
      from all three user stories passes
- [X] T027 [P] Update `docs/SESSION_HANDOFF.md`: mark the Spec Kit chain complete, note `npm test`
      as the way to verify, and delete the file's now-stale "before running /speckit.constitution"
      section (constitution is ratified)
- [X] T028 Verify no file matches the prohibited shared-catch-all pattern (no `commands.ts`,
      `handlers.ts`, or `routes.ts` containing decision logic) — confirms constitution Principle
      III compliance

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational only
- **User Story 2 (Phase 4)**: Depends on Foundational only — independent of US1 (reads
  `src/domain/events.ts`/`state.ts` types directly, not US1's slice implementations)
- **User Story 3 (Phase 5)**: Depends on Foundational only — independent of US1 and US2
- **Polish (Phase 6)**: Depends on all three user stories being complete

### Within Each User Story

- Tests MUST be written and FAIL before implementation (constitution Principle II)
- Each command slice's test/implementation pair is independent of every other slice's pair

### Parallel Opportunities

- T002, T003 in parallel after T001
- T004, T005, T007 in parallel; T006 after T004
- All seven US1 test tasks (T008-T014) in parallel; all seven US1 implementation tasks
  (T015-T021) in parallel once Foundational and their respective test exist
- US1, US2, and US3 phases can be worked in parallel once Foundational (Phase 2) is done

---

## Parallel Example: User Story 1

```bash
# All seven US1 tests together (must fail first):
Task: "deciderSpecification test for SubmitApplication in src/slices/submit-application/decide.spec.ts"
Task: "deciderSpecification test for ScheduleInterview in src/slices/schedule-interview/decide.spec.ts"
Task: "deciderSpecification test for RecordInterviewOutcome in src/slices/record-interview-outcome/decide.spec.ts"
Task: "deciderSpecification test for ReceiveOffer in src/slices/receive-offer/decide.spec.ts"
Task: "deciderSpecification test for AcceptOffer in src/slices/accept-offer/decide.spec.ts"
Task: "deciderSpecification test for DeclineOffer in src/slices/decline-offer/decide.spec.ts"
Task: "deciderSpecification test for WithdrawApplication in src/slices/withdraw-application/decide.spec.ts"

# Then all seven US1 implementations together:
Task: "Implement decide() for SubmitApplication in src/slices/submit-application/decide.ts"
Task: "Implement decide() for ScheduleInterview in src/slices/schedule-interview/decide.ts"
Task: "Implement decide() for RecordInterviewOutcome in src/slices/record-interview-outcome/decide.ts"
Task: "Implement decide() for ReceiveOffer in src/slices/receive-offer/decide.ts"
Task: "Implement decide() for AcceptOffer in src/slices/accept-offer/decide.ts"
Task: "Implement decide() for DeclineOffer in src/slices/decline-offer/decide.ts"
Task: "Implement decide() for WithdrawApplication in src/slices/withdraw-application/decide.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: `npm test` covers the full pipeline lifecycle independently
5. This alone is a working, if minimal, demonstration of the Emmett decider pattern

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. User Story 1 → validate independently → core pipeline practice complete (MVP)
3. User Story 2 → validate independently → active-overview read-model practice added
4. User Story 3 → validate independently → reactor practice added
5. Each story adds Emmett practice value without touching the others' files

---

## Notes

- [P] tasks touch different files with no dependency on an incomplete task
- Every command slice is independently completable and testable — no cross-slice imports beyond
  the shared `src/domain/` types and `src/store/event-store.ts` wiring
- Commit after each task or logical group
- No `SPECIFY_FEATURE_DIRECTORY` HTTP/CLI tasks are included — out of scope per spec.md Assumptions
  and research.md's decision to defer `emmett-expressjs`/Fastify
