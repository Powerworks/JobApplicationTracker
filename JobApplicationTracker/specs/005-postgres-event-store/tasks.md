# Tasks: Postgres Event Store

**Input**: Design documents from `/specs/005-postgres-event-store/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included and REQUIRED per constitution Principle II. New/changed behavior (migration,
connection failure, the applications index) gets tests written first against the shared
testcontainer. Existing `deciderSpecification` tests are untouched (already store-agnostic).

**Organization**: Setup + Foundational (the store swap, migration, and index table — this is
where both user stories' actual capability gets built, since P1's durability and P2's
configurability are two properties of the same swap, not independently buildable increments),
then a verification-focused phase per user story.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Add `@event-driven-io/emmett-postgresql` (dependency) and
      `@event-driven-io/emmett-testcontainers` (dev dependency) to `package.json`; `npm install`
- [ ] T002 [P] Create `docker-compose.yml` at the repo root: a local Postgres service for
      development (spec.md Assumptions)
- [ ] T003 [P] Create `.env.example` documenting `DATABASE_URL`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The actual storage swap — durable events (P1) and env-var-configurable connection
(P2) both fall out of this phase directly.

**⚠️ CRITICAL**: No user story verification can begin until this phase is complete

- [ ] T004 [P] Create `vitest.setup.ts`: global setup starts one shared Postgres container via
      `@event-driven-io/emmett-testcontainers`'s `getPostgreSQLStartedContainer()`, runs
      `schema.migrate()` once, sets `process.env.DATABASE_URL`; teardown stops the container
      (research.md)
- [ ] T005 Register `vitest.setup.ts` as `globalSetup` in `vitest.config.ts` (depends on T004)
- [ ] T006 [P] `event-store.spec.ts` in `src/store/event-store.spec.ts`: `createEventStore()`
      throws clearly when `DATABASE_URL` is unset; `migrateEventStoreSchema()` succeeds against a
      fresh schema — write first
- [ ] T007 Implement `src/store/event-store.ts` per contracts/module-contracts.md:
      `createEventStore()` reads `DATABASE_URL` and calls `getPostgreSQLEventStore(...)`;
      `migrateEventStoreSchema(store)` calls `store.schema.migrate()` (depends on T006)
- [ ] T008 [P] `application-index.spec.ts` in `src/store/application-index.spec.ts`:
      `register()`/`list()` round-trip; a *second* `createApplicationIndex()` instance against the
      same store sees data written by the first (the automatable proxy for "survives a restart",
      per quickstart.md) — write first
- [ ] T009 Implement `src/store/application-index.ts` per contracts/module-contracts.md, backed
      by the `applications` table from data-model.md (depends on T008, T007)
- [ ] T010 Update `src/http/server.ts`: call `migrateEventStoreSchema()` before `startAPI(app)`;
      on failure, log clearly and exit non-zero (spec.md FR-008; depends on T007)
- [ ] T011 Update `src/http/app.ts`: remove the `application-registry.ts` import/decoration;
      decorate `applicationIndex` via `createApplicationIndex(eventStore)` instead (depends on
      T009)
- [ ] T012 Delete `src/http/application-registry.ts` (superseded, per constitution — no dead code
      left behind)
- [ ] T013 Update `src/slices/submit-application/route.ts`: `app.applicationRegistry.register(...)`
      → `await app.applicationIndex.register(...)` (depends on T011)
- [ ] T014 Update `src/read-models/active-pipeline/route.ts`: `app.applicationRegistry.list()` →
      `await app.applicationIndex.list()` (depends on T011)
- [ ] T015 Update `src/reactors/ghosting/route.ts`: same rename + `await` (depends on T011)
- [ ] T016 Update `src/read-models/active-pipeline/route.spec.ts` and
      `src/reactors/ghosting/route.spec.ts`: add a `beforeEach` that truncates the database (via
      `store.schema.dangerous.truncate()` and the `applications` table) — these are the tests
      whose assertions depend on the store's full contents (research.md's isolation decision)

**Checkpoint**: Foundation ready — the full existing suite runs against the shared testcontainer

---

## Phase 3: User Story 1 - Tracked applications survive a server restart (Priority: P1) 🎯 MVP

**Goal**: Prove data outlives the process, not just prove the plumbing compiles.

**Independent Test**: quickstart.md's manual walkthrough — stop and restart the real server,
confirm every application's full state is unchanged.

- [ ] T017 [P] [US1] Integration test (e.g. `src/store/durability.spec.ts`): build one app
      instance, submit and progress an application, then build a *second*, independent app
      instance against the same `DATABASE_URL` (simulating a restart without an OS-level process
      restart) and confirm `GET /applications/:id` and `GET /applications/active` on the second
      instance reflect exactly what the first instance wrote
- [ ] T018 [US1] Run quickstart.md's manual restart walkthrough against a real `npm run start`
      process — the proof T017's simulation can't fully substitute for

**Checkpoint**: User Story 1 verified both automatically (T017) and manually (T018)

---

## Phase 4: User Story 2 - Database connection is configurable without code changes (Priority: P2)

**Goal**: Prove the connection is genuinely externalized, not hardcoded anywhere.

**Independent Test**: quickstart.md's manual two-database walkthrough.

- [ ] T019 [P] [US2] Integration test: two `createEventStore()`/`createApplicationIndex()` pairs
      built against two different databases (e.g. two databases within the same shared Postgres
      instance) write and read independently, with no cross-contamination
- [ ] T020 [US2] Run quickstart.md's manual walkthrough: change `DATABASE_URL` in `.env`, restart
      `npm run start`, confirm the overview reflects the *new* database (empty), not the old one

**Checkpoint**: Both user stories verified

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T021 Run the full `npm test` suite and confirm zero regressions across every existing test
      (features 001–004) now running against real Postgres (spec.md SC-002)
- [ ] T022 [P] Verify `src/http/application-registry.ts` no longer exists and nothing references
      it (`grep -r applicationRegistry src/`)
- [ ] T023 [P] Update `docs/BRIEF.md`'s Status section and `docs/ADRs.md` (ADR 1's "Postgres once
      the logic is solid" is now fulfilled) noting feature 005 is complete

---

## Dependencies & Execution Order

- **Setup (Phase 1)** → **Foundational (Phase 2)**: blocks both user stories
- **User Story 1 (Phase 3)** and **User Story 2 (Phase 4)**: both depend on Foundational only,
  independent of each other
- **Polish (Phase 5)**: depends on both user stories

### Parallel Opportunities

- T002, T003 in parallel
- T004, T006, T008 (the three "write first" test tasks) can be drafted in parallel, though T007
  and T009 each depend on their own test landing first
- T013, T014, T015 in parallel (different files) once T011 lands
- Phase 3 and Phase 4 can be verified in parallel once Foundational is done

## Notes

- No decider, route contract, or frontend change anywhere in this feature (spec.md FR-004/FR-009)
  — every task either touches storage/wiring or is a test
- Docker must be available on the machine for T004 onward (new prerequisite, quickstart.md)
