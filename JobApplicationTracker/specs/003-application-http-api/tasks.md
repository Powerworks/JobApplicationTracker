# Tasks: HTTP API for the Application Pipeline

**Input**: Design documents from `/specs/003-application-http-api/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included and REQUIRED per constitution Principle II — every route gets an
`app.inject()`-based test, written first, covering success, 400, 404, and 409 (per
contracts/http-api.md's four-outcome shape) before the route itself is implemented.

**Organization**: Setup + Foundational (server wiring, shared across every route), then one phase
per user story (spec.md P1/P2/P3), each route co-located inside its existing slice per
constitution Principle III.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Add `fastify` and `@event-driven-io/emmett-fastify` to `package.json` dependencies, and
      `tsx` as a dev dependency (to run the server locally via `npm run start` without a separate
      build step); add a `"start": "tsx src/http/server.ts"` script
- [ ] T002 Run `npm install`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Server wiring shared by every route — not business logic, per plan.md's constitution
justification (same category as feature 001's `src/store/event-store.ts`).

**⚠️ CRITICAL**: No route work can begin until this phase is complete

- [ ] T003 [P] Implement `src/http/errors.ts`: a `mapErrorToResponse` helper (or Fastify error
      handler) implementing research.md's three-tier mapping — Fastify validation failure → 400
      (usually automatic, but confirm the shape matches data-model.md's error body), a thrown
      `NotSubmitted` marker → 404, `IllegalStateError` → 409, per data-model.md's error response
      shape
- [ ] T004 Implement `src/http/app.ts`: `getApplication({ registerRoutes })` wiring — creates one
      shared `createEventStore()` instance (feature 001's `src/store/event-store.ts`), decorates
      the Fastify instance with it so every route can reach it, and registers each slice's route
      plugin (depends on T003; route plugins themselves land in later phases and are registered
      here incrementally)
- [ ] T005 [P] Implement `src/http/server.ts`: thin `startAPI(app)` entrypoint (depends on T004)
- [ ] T006 [P] Write `src/http/app.spec.ts`: smoke test that `getApplication(...)` builds
      successfully and boots via `app.inject()` against a trivial route (depends on T004)

**Checkpoint**: Foundation ready — route implementation can now begin

---

## Phase 3: User Story 1 - Manage an application's lifecycle over HTTP (Priority: P1) 🎯 MVP

**Goal**: All 7 commands reachable over HTTP with the 400/404/409/success outcomes from
contracts/http-api.md.

**Independent Test**: Using only `app.inject()` calls, submit an application and drive it through
one full path to a terminal outcome, per quickstart.md's User Story 1 walkthrough.

### Tests for User Story 1 (write FIRST, must fail before implementation)

- [ ] T007 [P] [US1] `route.spec.ts` for `POST /applications` in
      `src/slices/submit-application/route.spec.ts` — 201 + `applicationId` on success, 400 on
      missing required fields (e.g. no `company`)
- [ ] T008 [P] [US1] `route.spec.ts` for `POST /applications/:applicationId/interviews` in
      `src/slices/schedule-interview/route.spec.ts` — 200 on success, 400 on malformed body, 404
      on unknown `applicationId`, 409 on out-of-sequence round or closed application
- [ ] T009 [P] [US1] `route.spec.ts` for `POST /applications/:applicationId/interviews/outcome`
      in `src/slices/record-interview-outcome/route.spec.ts` — same four-outcome coverage for
      `RecordInterviewOutcome`'s guards
- [ ] T010 [P] [US1] `route.spec.ts` for `POST /applications/:applicationId/offer` in
      `src/slices/receive-offer/route.spec.ts` — same four-outcome coverage for `ReceiveOffer`'s
      guards (including 409 when the latest interview outcome wasn't Passed)
- [ ] T011 [P] [US1] `route.spec.ts` for `POST /applications/:applicationId/offer/accept` in
      `src/slices/accept-offer/route.spec.ts` — same four-outcome coverage for `AcceptOffer`
- [ ] T012 [P] [US1] `route.spec.ts` for `POST /applications/:applicationId/offer/decline` in
      `src/slices/decline-offer/route.spec.ts` — same four-outcome coverage for `DeclineOffer`
- [ ] T013 [P] [US1] `route.spec.ts` for `POST /applications/:applicationId/withdraw` in
      `src/slices/withdraw-application/route.spec.ts` — same four-outcome coverage for
      `WithdrawApplication`

### Implementation for User Story 1

- [ ] T014 [P] [US1] Implement `route.ts` for `POST /applications` in
      `src/slices/submit-application/route.ts`: JSON Schema body validation, generate
      `applicationId` via `crypto.randomUUID()`, invoke `DeciderCommandHandler`, return 201
      (depends on T004, T007)
- [ ] T015 [P] [US1] Implement `route.ts` for `POST /applications/:applicationId/interviews` in
      `src/slices/schedule-interview/route.ts`: schema validation, `NotSubmitted` pre-check (404),
      `DeciderCommandHandler` + `IllegalStateError` → 409 (depends on T004, T008)
- [ ] T016 [P] [US1] Implement `route.ts` for
      `POST /applications/:applicationId/interviews/outcome` in
      `src/slices/record-interview-outcome/route.ts` (same shape; depends on T004, T009)
- [ ] T017 [P] [US1] Implement `route.ts` for `POST /applications/:applicationId/offer` in
      `src/slices/receive-offer/route.ts` (same shape; depends on T004, T010)
- [ ] T018 [P] [US1] Implement `route.ts` for `POST /applications/:applicationId/offer/accept` in
      `src/slices/accept-offer/route.ts` (same shape; depends on T004, T011)
- [ ] T019 [P] [US1] Implement `route.ts` for `POST /applications/:applicationId/offer/decline`
      in `src/slices/decline-offer/route.ts` (same shape; depends on T004, T012)
- [ ] T020 [P] [US1] Implement `route.ts` for `POST /applications/:applicationId/withdraw` in
      `src/slices/withdraw-application/route.ts` (same shape; depends on T004, T013)
- [ ] T021 Register all 7 User Story 1 route plugins in `src/http/app.ts` (depends on
      T014-T020)

**Checkpoint**: User Story 1 fully functional over HTTP — quickstart.md's Story 1 walkthrough
passes as Vitest suites (`npm test`)

---

## Phase 4: User Story 2 - View the active pipeline overview over HTTP (Priority: P2)

**Goal**: `GET /applications/active` returns feature 001's active-pipeline projection.

**Independent Test**: Submit several applications at different stages via User Story 1's routes,
then confirm a single `app.inject()` GET returns exactly the open ones, most-idle-first.

### Tests for User Story 2 (write FIRST, must fail before implementation)

- [ ] T022 [US2] `route.spec.ts` for `GET /applications/active` in
      `src/read-models/active-pipeline/route.spec.ts` — most-idle-first ordering, closed
      applications excluded, empty list when no applications exist

### Implementation for User Story 2

- [ ] T023 [US2] Implement `route.ts` for `GET /applications/active` in
      `src/read-models/active-pipeline/route.ts`: reads all streams from the shared store, calls
      the existing `project()` unchanged, returns 200 (depends on T004, T022)
- [ ] T024 [US2] Register the route plugin in `src/http/app.ts` (depends on T023)

**Checkpoint**: User Stories 1 and 2 both work independently over HTTP

---

## Phase 5: User Story 3 - Trigger the ghosting check over HTTP (Priority: P3)

**Goal**: `POST /ghosting/check` runs feature 001's ghosting reactor on demand.

**Independent Test**: Submit an application, simulate its silence period elapsing, trigger the
check via `app.inject()`, confirm it's absent from a subsequent active-overview call.

### Tests for User Story 3 (write FIRST, must fail before implementation)

- [ ] T025 [US3] `route.spec.ts` for `POST /ghosting/check` in
      `src/reactors/ghosting/route.spec.ts` — returns ghosted IDs when applicable, succeeds with
      an empty list when nothing is silent

### Implementation for User Story 3

- [ ] T026 [US3] Implement `route.ts` for `POST /ghosting/check` in
      `src/reactors/ghosting/route.ts`: reads all streams, calls the existing
      `ghostSilentApplications()` unchanged, appends each resulting `ApplicationGhosted` event to
      its stream, returns the ghosted IDs (depends on T004, T025)
- [ ] T027 [US3] Register the route plugin in `src/http/app.ts` (depends on T026)

**Checkpoint**: All three user stories independently functional over HTTP

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T028 Run quickstart.md's full curl walkthrough manually against `npm run start`, confirming
      it matches the automated `app.inject()` suites
- [ ] T029 [P] Verify no shared `routes.ts` exists and every route file lives inside its owning
      slice/read-model/reactor folder (constitution Principle III compliance)
- [ ] T030 [P] Update `docs/BRIEF.md`'s Status section noting feature 003 is complete

---

## Dependencies & Execution Order

- **Setup (Phase 1)** → **Foundational (Phase 2)**: blocks every route
- **User Story 1 (Phase 3)**: depends on Foundational only
- **User Story 2 (Phase 4)**: depends on Foundational only — independent of US1's routes (reads
  streams directly, doesn't call US1's route handlers)
- **User Story 3 (Phase 5)**: depends on Foundational only — independent of US1/US2
- **Polish (Phase 6)**: depends on all three user stories

### Within Each User Story

- Tests MUST be written and FAIL before implementation (constitution Principle II)
- Each route's test/implementation pair is independent of every other route's pair
- The final "register in app.ts" task within each story phase depends on all of that phase's route
  implementations

### Parallel Opportunities

- T003, T005, T006 in parallel after T004's dependency is met where applicable (T003 has no
  dependency; T005/T006 depend on T004)
- All 7 US1 test tasks (T007-T013) in parallel; all 7 US1 implementation tasks (T014-T020) in
  parallel once Foundational and their respective test exist
- US1, US2, and US3 phases can be worked in parallel once Foundational (Phase 2) is done, same as
  features 001/002's independent-slice pattern

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Setup + Foundational
2. User Story 1
3. **STOP and VALIDATE**: full pipeline lifecycle reachable over HTTP, `npm test` green
4. This alone lets a future frontend create and progress applications

### Incremental Delivery

1. Setup + Foundational → server boots, no routes yet
2. User Story 1 → validate independently → HTTP-driven pipeline lifecycle (MVP)
3. User Story 2 → validate independently → HTTP-driven overview
4. User Story 3 → validate independently → HTTP-driven ghosting trigger
5. Each story adds an HTTP capability without touching the others' files

## Notes

- No task introduces or modifies guard/business logic — every route calls an existing
  `decide()`/`project()`/`ghostSilentApplications()` unchanged (spec.md FR-010, SC-002)
- No frontend work is included — out of scope for this feature (spec.md Assumptions)
