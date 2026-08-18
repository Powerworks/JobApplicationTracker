# Tasks: Application Tracker Frontend

**Input**: Design documents from `/specs/004-application-tracker-frontend/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Per research.md's testing-scope decision — pure logic (`format.js`, `api-client.js`'s
payload builders) and the new backend endpoint get tests written first (constitution Principle
II). DOM/fetch wiring in `views/*.js`, `router.js`, and `main.js` is thin glue verified manually
via quickstart.md, not unit tested — a documented exception, not an omission.

**Organization**: Setup + Foundational (shared infra and the new backend endpoint, blocking all
three views), then one phase per user story (spec.md P1/P2/P3).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Add `@fastify/static` to `package.json` dependencies; `npm install`
- [ ] T002 Register `@fastify/static` in `src/http/app.ts`, serving the new `public/` directory
      (depends on T001)
- [ ] T003 [P] Create `public/index.html`: one HTML entry with three (initially empty) view
      containers and a `<script type="module" src="/js/main.js">` tag
- [ ] T004 [P] Create `public/style.css`: minimal plain-CSS skeleton (no framework, per
      research.md)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The new backend endpoint every detail-view work depends on, plus the frontend's
shared infra (API boundary, pure formatting, routing) every view depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Backend: new application-detail endpoint (research.md's discovered gap)

- [ ] T005 [P] `project.spec.ts` for aggregating one stream to its full `Application` state in
      `src/read-models/application-detail/project.spec.ts` — covers both open and closed
      applications (unlike `active-pipeline`, which excludes closed ones)
- [ ] T006 [P] `route.spec.ts` for `GET /applications/:applicationId` in
      `src/read-models/application-detail/route.spec.ts` — 200 with full state (open and closed
      cases), 404 for an unknown id, per contracts/application-detail-endpoint.md
- [ ] T007 Implement `project.ts` in `src/read-models/application-detail/project.ts` (depends on
      T005)
- [ ] T008 Implement `route.ts` in `src/read-models/application-detail/route.ts`, reusing
      `src/http/require-application.ts`'s existence check (depends on T006, T007); register it in
      `src/http/app.ts`

### Frontend: shared infra

- [ ] T009 [P] `format.spec.js` for `formatMoney`, `formatIdleTime`, `describeStage` in
      `public/js/format.spec.js`, per contracts/frontend-modules.md
- [ ] T010 [P] Implement `public/js/format.js` (depends on T009)
- [ ] T011 [P] `api-client.spec.js` for the request-payload-building logic in
      `public/js/api-client.spec.js`
- [ ] T012 Implement `public/js/api-client.js`: all 10 functions from
      contracts/frontend-modules.md, each returning `{ ok, data }` / `{ ok: false, status, error,
      message }` (depends on T011, T008 for `getApplication`)
- [ ] T013 Implement `public/js/router.js`: hash-based switcher for `#/`, `#/new`,
      `#/applications/:id` (no dedicated test — DOM wiring, per research.md)
- [ ] T014 Implement `public/js/main.js`: boots the router against `index.html`'s three view
      containers, with placeholder view modules to be filled in by the user-story phases below
      (depends on T013)

**Checkpoint**: Foundation ready — `GET /applications/:applicationId` works end-to-end, and the
frontend has a working (if view-less) shell

---

## Phase 3: User Story 1 - Manage an application's lifecycle through the browser (Priority: P1) 🎯 MVP

**Goal**: Submit a new application and progress it through actions from its detail view.

**Independent Test**: quickstart.md's User Story 1 walkthrough — submit, schedule, record
outcome, receive offer, accept, then confirm a further action is visibly rejected.

No additional pure-logic tests beyond Foundational's `format.js`/`api-client.js` coverage — this
story is DOM wiring over already-tested logic (research.md).

- [ ] T015 [P] [US1] Implement `public/js/views/new-application.js`: renders the submission form
      (data-model.md's field list), calls `api-client.submitApplication`, navigates to
      `#/applications/:id` on success, shows the error inline on 400 without clearing input
      (spec.md FR-004)
- [ ] T016 [P] [US1] Implement `public/js/views/application-detail.js`: fetches via
      `api-client.getApplication`, renders state via `format.js`, shows the available actions per
      data-model.md's stage/actions table, calls the matching `api-client` function per action,
      re-fetches and re-renders on success, shows the error inline on 400/404/409
- [ ] T017 [US1] Wire `new-application.js` and `application-detail.js` into `router.js`/`main.js`
      (depends on T014, T015, T016)

**Checkpoint**: User Story 1 fully functional — quickstart.md's Story 1 walkthrough passes
end-to-end in a browser

---

## Phase 4: User Story 2 - See the active pipeline at a glance (Priority: P2)

**Goal**: The overview page lists open applications, most-idle-first, linking into detail.

**Independent Test**: quickstart.md's User Story 2 walkthrough.

- [ ] T018 [US2] Implement `public/js/views/overview.js`: fetches via
      `api-client.getActivePipeline`, renders the list (or FR-006's empty state), each row
      linking to `#/applications/:id`
- [ ] T019 [US2] Wire `overview.js` as the `#/` route in `router.js`/`main.js` (depends on T014,
      T018)

**Checkpoint**: User Stories 1 and 2 both work independently in the browser

---

## Phase 5: User Story 3 - Trigger the ghosting check from the browser (Priority: P3)

**Goal**: A control on the overview triggers the ghosting check and shows the outcome.

**Independent Test**: quickstart.md's User Story 3 walkthrough.

- [ ] T020 [US3] Add a ghosting-check control to `public/js/views/overview.js`: calls
      `api-client.triggerGhostingCheck`, shows the outcome (including "0 ghosted"), re-fetches the
      list (depends on T018)

**Checkpoint**: All three user stories independently functional in the browser

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T021 Run quickstart.md's full manual browser walkthrough (all three stories + error
      handling) against `npm run start`
- [ ] T022 [P] Verify no `fetch(` call exists anywhere under `public/js/views/` or `router.js`/
      `main.js` — every backend call must go through `api-client.js` (contracts/frontend-modules.md
      compliance)
- [ ] T023 [P] Update `docs/BRIEF.md`'s Status section noting feature 004 is complete

---

## Dependencies & Execution Order

- **Setup (Phase 1)** → **Foundational (Phase 2)**: blocks every user story
- **User Story 1 (Phase 3)**: depends on Foundational only
- **User Story 2 (Phase 4)**: depends on Foundational only — independent of US1 (its own view,
  own route wiring)
- **User Story 3 (Phase 5)**: depends on US2's `overview.js` existing (the control lives inside
  it) — the only cross-story dependency in this feature, and it's additive (T020 only adds to a
  file T018 already created)
- **Polish (Phase 6)**: depends on all three user stories

### Parallel Opportunities

- T003, T004 in parallel after T002
- T005, T006 in parallel; T009, T010's pair and T011's test in parallel with the backend tasks
- T015, T016 in parallel (different files) once Foundational is done
- User Story 1 and User Story 2 can be built in parallel once Foundational is done; User Story 3
  must follow User Story 2's `overview.js`

## Notes

- No new guard/business logic anywhere in this feature — the new backend endpoint is read-only,
  and every frontend action delegates to feature 001/002/003's already-tested commands
- Visual design/styling is intentionally minimal — spec.md Assumptions defer it, this feature only
  needs every functional requirement to be reachable and usable
