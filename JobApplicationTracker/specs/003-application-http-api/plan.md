# Implementation Plan: HTTP API for the Application Pipeline

**Branch**: `003-application-http-api` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-application-http-api/spec.md`

## Summary

Expose features 001/002's existing deciders, active-pipeline projection, and ghosting reactor over
HTTP using Fastify (user-confirmed choice) and `@event-driven-io/emmett-fastify` for app
bootstrap. One route per command/query, co-located inside its existing slice folder alongside its
`decide.ts`/`project.ts`/`reactor.ts` — no new parallel "http" or "routes" layer, and no shared
`routes.ts`. Introduces no new guard/business logic (spec FR-010, SC-002): routes call the
existing decider/projection/reactor functions unchanged and map their outcomes to HTTP responses.

## Technical Context

**Language/Version**: TypeScript, Node.js 20+ (unchanged from features 001/002)

**Primary Dependencies**: `fastify` (user-confirmed), `@event-driven-io/emmett-fastify` for
`getApplication`/`startAPI` bootstrap (thin wrapper — route registration and business logic remain
ours). `@event-driven-io/emmett`'s `DeciderCommandHandler` for command dispatch against the event
store.

**Storage**: Emmett `getInMemoryEventStore` (unchanged) — one shared store instance per running
process, created once at server startup and passed into every route.

**Testing**: Vitest, using Fastify's `app.inject()` for HTTP-level tests — no real network/port
needed, consistent with the in-process testing style already used in features 001/002.

**Target Platform**: Node.js HTTP server (local dev machine / CI for tests; no deployment target
in scope for this feature).

**Project Type**: Single project, now a web-service — this feature adds the server entrypoint but
still no frontend (spec.md Assumptions).

**Performance Goals**: Unchanged — not a driving constraint for a single-user tool.

**Constraints**: No authentication (spec.md Assumptions, matching features 001/002's existing
trust boundary). No concurrency handling beyond Emmett's existing optimistic concurrency at the
event-store level (spec.md Assumptions).

**Scale/Scope**: Unchanged.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Event Sourcing via Emmett (NON-NEGOTIABLE) | Routes call the existing deciders/projection/reactor via `DeciderCommandHandler` and `getInMemoryEventStore` — no direct state mutation introduced; still in-memory (Postgres remains deferred) | PASS |
| II. Test-First, Given-When-Then (NON-NEGOTIABLE) | Each route gets an HTTP-level test (via `app.inject()`) written first, covering success, guard rejection (409), validation rejection (400), and not-found (404) | PASS |
| III. Granular Vertical Slice Architecture | Each route lives inside its existing slice folder (`src/slices/<command>/route.ts`, `src/read-models/active-pipeline/route.ts`, `src/reactors/ghosting/route.ts`) — no shared `routes.ts`; the only new shared file is `src/http/app.ts`, which is server *wiring* (registers each slice's route plugin), not business/handler logic, same category as `src/store/event-store.ts` from feature 001 | PASS |
| IV. Decisive Greenfield Architecture | Fastify chosen outright (user-confirmed) over Express; error-mapping convention (400/404/409) decided outright in Phase 0, not hedged | PASS |
| V. Simplicity: No Board, No Board-Driven Tooling | No board used; same Spec Kit chain as features 001/002 | PASS |

No violations — Complexity Tracking table is not needed.

*Re-checked post-Phase 1 design (data-model.md, contracts/, quickstart.md): still PASS on all
five principles — routes stay co-located per slice, no shared routes.ts introduced, and the
error-mapping approach (research.md) touches no existing decider logic.*

## Project Structure

### Documentation (this feature)

```text
specs/003-application-http-api/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

**Structure Decision**: Extend each existing slice with a co-located route file, plus one new
`src/http/` module for server wiring only (no business logic):

```text
src/
├── http/
│   ├── app.ts             # NEW: getApplication({ registerRoutes }) wiring every slice's route
│   ├── app.spec.ts         # NEW: smoke test that the app boots and registers routes
│   ├── server.ts           # NEW: startAPI(app) entrypoint (not unit-tested; thin)
│   └── errors.ts           # NEW: maps IllegalStateError→409, NotSubmitted-state→404,
│                            #      Fastify validation failure→400 (shared *mapping* helper,
│                            #      not business/guard logic — see research.md)
│
├── slices/
│   ├── submit-application/
│   │   ├── decide.ts / decide.spec.ts      # unchanged
│   │   ├── route.ts        # NEW: POST /applications
│   │   └── route.spec.ts   # NEW
│   ├── schedule-interview/
│   │   ├── route.ts        # NEW: POST /applications/:applicationId/interviews
│   │   └── route.spec.ts   # NEW
│   ├── record-interview-outcome/
│   │   ├── route.ts        # NEW: POST /applications/:applicationId/interviews/outcome
│   │   └── route.spec.ts   # NEW
│   ├── receive-offer/
│   │   ├── route.ts        # NEW: POST /applications/:applicationId/offer
│   │   └── route.spec.ts   # NEW
│   ├── accept-offer/
│   │   ├── route.ts        # NEW: POST /applications/:applicationId/offer/accept
│   │   └── route.spec.ts   # NEW
│   ├── decline-offer/
│   │   ├── route.ts        # NEW: POST /applications/:applicationId/offer/decline
│   │   └── route.spec.ts   # NEW
│   └── withdraw-application/
│       ├── route.ts        # NEW: POST /applications/:applicationId/withdraw
│       └── route.spec.ts   # NEW
│
├── read-models/active-pipeline/
│   ├── project.ts / project.spec.ts        # unchanged
│   ├── route.ts             # NEW: GET /applications/active
│   └── route.spec.ts        # NEW
│
├── reactors/ghosting/
│   ├── reactor.ts / reactor.spec.ts        # unchanged
│   ├── route.ts             # NEW: POST /ghosting/check
│   └── route.spec.ts        # NEW
│
└── store/
    └── event-store.ts       # unchanged — now also the store instance shared across routes
```

## Complexity Tracking

*No violations — table omitted.*
