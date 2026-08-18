# Tasks: Richer Job Posting Details on Submission

**Input**: Design documents from `/specs/002-application-job-details/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included and REQUIRED per constitution Principle II — the existing
`submit-application/decide.spec.ts` gets new given-when-then cases before the implementation
changes are made.

**Organization**: Single P1 story (this feature is a field extension, not new capability tiers —
see spec.md). No Setup or Foundational phase is needed: this feature adds no dependency and no
new shared infrastructure, only extends existing files from feature 001.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: User Story 1 - Record full job posting details at submission (Priority: P1)

**Goal**: `SubmitApplication` and the resulting `Application` state carry location, salary
(optional), employment type, bonus (optional), and benefits.

**Independent Test**: Submit an application with all new fields populated, and separately with
salary/bonus omitted and benefits empty; confirm the resulting event/state reflect exactly what
was supplied (quickstart.md).

### Tests for User Story 1 (write/update FIRST, must fail before implementation)

- [X] T001 [US1] Add given-when-then cases to
      `src/slices/submit-application/decide.spec.ts`: full fields populated (Acceptance Scenario
      1/2), salary omitted (Acceptance Scenario 3), benefits empty (Acceptance Scenario 4) — per
      contracts/submit-application.md's input shape

### Implementation for User Story 1

- [X] T002 [P] [US1] Extend `ApplicationSubmitted`'s data shape in `src/domain/events.ts` with
      `location: string`, `salary?: { amount: number; currency: string }`,
      `employmentType: "Permanent" | "Contract"`, `bonus?: { amount: number; currency: string }`,
      `benefits: string[]`, per data-model.md
- [X] T003 [P] [US1] Mirror the same extension onto `SubmitApplication`'s data shape in
      `src/domain/commands.ts`
- [X] T004 [US1] Extend `SubmittedApplication` in `src/domain/state.ts` with the same five fields,
      and update the `ApplicationSubmitted` case in `evolve()` to carry them into state (depends
      on T002)
- [X] T005 [US1] Update `decide()` in `src/slices/submit-application/decide.ts` to pass the five
      new fields from `command.data` through to the returned event's `data` (depends on T002, T003)
- [X] T006 [P] [US1] Update the `ApplicationSubmitted`/`SubmitApplication` test fixtures in
      `src/slices/schedule-interview/decide.spec.ts`,
      `src/slices/record-interview-outcome/decide.spec.ts`,
      `src/slices/receive-offer/decide.spec.ts`, `src/slices/accept-offer/decide.spec.ts`,
      `src/slices/decline-offer/decide.spec.ts`, and
      `src/slices/withdraw-application/decide.spec.ts` to include the now-required
      `location`/`employmentType`/`benefits` fields, so they continue to type-check (depends on
      T002)
- [X] T007 [P] [US1] Update the `ApplicationSubmitted` fixtures in
      `src/read-models/active-pipeline/project.spec.ts` the same way (depends on T002)
- [X] T008 [P] [US1] Update the `ApplicationSubmitted` fixtures in
      `src/reactors/ghosting/reactor.spec.ts` the same way (depends on T002)

**Checkpoint**: Feature 002 fully functional; feature 001's existing scenarios still pass
unmodified in behavior, only their fixtures' shape changed

---

## Phase 2: Polish & Cross-Cutting Concerns

- [X] T009 Run `npm test` and `npx tsc --noEmit`; confirm the full suite (feature 001 + 002)
      passes with no type errors
- [X] T010 Update `docs/BRIEF.md`'s Status section noting feature 002 is complete

---

## Dependencies & Execution Order

- T001 before T002-T008 (test-first, constitution Principle II)
- T002 blocks T004, T005, T006, T007, T008 (all depend on the event shape existing)
- T003 blocks T005 (decide.ts needs the command shape too)
- T004, T005 can proceed in parallel once T002/T003 land (different files)
- T006, T007, T008 are independent of each other and of T004/T005 — all touch only test fixtures
- T009 depends on all of T001-T008
- T010 depends on T009 passing

## Notes

- No Setup or Foundational phase — nothing new to initialize (Technical Context in plan.md is
  unchanged from feature 001)
- This feature intentionally stops before the HTTP layer and frontend, per the user's explicit
  request to land the data model changes first
