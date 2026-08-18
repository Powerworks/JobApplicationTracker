# Implementation Plan: Application Tracker Frontend

**Branch**: `004-application-tracker-frontend` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-application-tracker-frontend/spec.md`

## Summary

A vanilla-JavaScript, single-page frontend (user-confirmed: no framework, no browser build step)
served as static files by the existing Fastify server from feature 003 (user-confirmed: via
`@fastify/static`, same origin, no CORS). Hash-based client-side routing switches between three
views matching spec.md's three user stories: the active overview (P2, and the landing view),
the new-application form (part of P1), and an application's detail/actions view (P1). A small
`api-client` module wraps every call to feature 003's endpoints; a `ghosting` trigger (P3) lives
in the overview view. One new backend endpoint (`GET /applications/:applicationId`) is added to
close a gap surfaced by this feature's own detail-view requirement — see research.md.

## Technical Context

**Language/Version**: Plain JavaScript (ES modules), not TypeScript — user-confirmed "no build
step beyond what Vitest/tsx already give us" rules out a browser transpile/bundle step. The
backend (`src/`) remains TypeScript, unchanged.

**Primary Dependencies**: `@fastify/static` (new — serves `public/` from feature 003's existing
Fastify app). No frontend framework, no bundler, no CSS framework. No new backend dependency for
the new `GET /applications/:applicationId` endpoint — built with the same
`@event-driven-io/emmett`/Fastify already in use.

**Storage**: N/A — the frontend holds no state beyond what's needed to render the current view;
all data comes from feature 003's API on each view load/action.

**Testing**: Vitest (unchanged tool) extended to also discover `public/js/**/*.spec.js`, for the
frontend's pure/testable logic (formatting, payload building — see Constitution Check). DOM
wiring and fetch calls are verified manually via quickstart.md's browser walkthrough — no
headless-browser test tooling (e.g. Playwright) is introduced (constitution Principle IV, YAGNI —
this project's purpose is Emmett practice, not frontend test infrastructure practice).

**Target Platform**: A modern evergreen browser, loaded from `http://localhost:5000` (feature
003's server, now also serving `public/`).

**Project Type**: Single project, web-service + static frontend — no separate frontend
project/package.

**Performance Goals**: Unchanged — not a driving constraint.

**Constraints**: No authentication (spec.md Assumptions). No offline support (spec.md
Assumptions). No real-time sync between tabs (spec.md Assumptions).

**Scale/Scope**: Unchanged — single user.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Event Sourcing via Emmett (NON-NEGOTIABLE) | The frontend itself has no direct event-store access — only calls the HTTP API. The one new backend piece (`GET /applications/:applicationId`) reads via `aggregateStream`/`evolve` like every other read model, no direct state mutation | PASS |
| II. Test-First, Given-When-Then (NON-NEGOTIABLE) | Applies to this feature's testable logic: pure functions (`format.js`, `api-client.js`'s payload builders) get Vitest tests written first, and the new backend read-model slice gets its own test (route-level `app.inject()`, matching feature 003's pattern) written first. DOM wiring/event handlers are thin glue verified manually (documented exception, not a silent gap) | PASS |
| III. Granular Vertical Slice Architecture | Adapted for a UI layer: one view module per screen/concern (`views/overview.js`, `views/new-application.js`, `views/application-detail.js`), no monolithic `app.js` catch-all handling every view. `api-client.js` is shared infra (the HTTP boundary), same category as `src/store/event-store.ts` — not business logic. The new backend endpoint is its own slice (`src/read-models/application-detail/`), not folded into `active-pipeline` | PASS |
| IV. Decisive Greenfield Architecture | Stack decided outright (user-confirmed): vanilla JS, hash routing, static serving via the existing server — no framework evaluation left open-ended | PASS |
| V. Simplicity: No Board, No Board-Driven Tooling | No board used; same Spec Kit chain | PASS |

No violations — Complexity Tracking table is not needed.

*Re-checked post-Phase 1 design (data-model.md, contracts/, quickstart.md): still PASS on all
five principles — the one backend addition (`GET /applications/:applicationId`) follows the exact
same read-model/route pattern as feature 003's existing endpoints, and the frontend stays a thin,
framework-free client over the HTTP boundary.*

## Project Structure

### Documentation (this feature)

```text
specs/004-application-tracker-frontend/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

**Structure Decision**: New top-level `public/` directory for static frontend assets (distinct
from `src/`, which stays Node/TypeScript backend source). `src/http/app.ts` gains a call to
`@fastify/static` pointing at `public/`.

```text
public/
├── index.html            # Single HTML entry; three views live/hide inside it
├── style.css              # Plain CSS, no framework
└── js/
    ├── main.js             # Boots the router, wires the three views
    ├── router.js           # Minimal hash-based view switcher (#/, #/new, #/applications/:id)
    ├── api-client.js       # One function per feature 003 endpoint (contracts/frontend-modules.md)
    ├── api-client.spec.js  # Tests for payload-building logic
    ├── format.js           # Pure formatting helpers (currency, stage label, idle time)
    ├── format.spec.js
    └── views/
        ├── overview.js             # US2: active-pipeline list + ghosting-check trigger (US3)
        ├── new-application.js      # US1: submission form
        └── application-detail.js   # US1: detail + action buttons

src/http/
└── app.ts                # MODIFIED: registers @fastify/static serving public/, registers the
                           #           new application-detail route

src/read-models/
└── application-detail/
    ├── project.ts         # NEW: aggregates one stream to its full Application state
    ├── project.spec.ts    # NEW
    ├── route.ts            # NEW: GET /applications/:applicationId (200 with state, 404 if
                             #      streamExists is false, same pattern as feature 003's routes)
    └── route.spec.ts       # NEW
```

## Complexity Tracking

*No violations — table omitted.*
