# Implementation Plan: Postgres Event Store

**Branch**: `005-postgres-event-store` | **Date**: 2026-08-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-postgres-event-store/spec.md`

## Summary

Swap `src/store/event-store.ts` from `getInMemoryEventStore` to Emmett's
`@event-driven-io/emmett-postgresql` `getPostgreSQLEventStore`, connected via a `DATABASE_URL`
environment variable, with schema migration run explicitly at server startup. Replaces the
process-local `application-registry.ts` (which never survived a restart anyway, and is now
actively wrong once data does) with a small persisted `applications` index table. No decider,
route, or frontend contract changes — this is a storage-layer swap only (spec.md FR-004/FR-009).

## Technical Context

**Language/Version**: TypeScript, Node.js 20+ (unchanged)

**Primary Dependencies**: `@event-driven-io/emmett-postgresql` (runtime — provides
`getPostgreSQLEventStore`, whose `PostgresEventStore` implements the same `EventStore` interface
`InMemoryEventStore` already did, so `aggregateStream`/`readStream`/`appendToStream` call sites in
existing routes need no changes). `@event-driven-io/emmett-testcontainers` (dev-only — spins up a
real, ephemeral Postgres for automated tests; this is the same tool Emmett's own test suite uses,
per inspecting the published package). No new dependency for our own SQL — `pg` is pulled in
transitively by `@event-driven-io/emmett-postgresql`'s own dependency chain, but we only ever call
`getPostgreSQLEventStore(connectionString)` with a connection string, never construct a `pg.Pool`
ourselves.

**Storage**: Postgres, connected via `DATABASE_URL`. Schema migration via the store's own
`schema.migrate()`, called explicitly at server startup (`src/http/server.ts`) before serving any
requests — not Emmett's `autoMigration` option, so the migration step stays visible and its
failure mode explicit (spec.md FR-007/FR-008).

**Testing**: Vitest (unchanged tool). A global setup/teardown starts one shared Postgres
testcontainer for the whole run, runs the schema migration once, and exposes its connection
string via `DATABASE_URL` for every test — starting a fresh container per test would be far too
slow. Tests that assert on full-store state (the active-overview and ghosting-check route tests)
truncate the database in a `beforeEach`, restoring the per-test isolation the in-memory store gave
for free. Every existing `deciderSpecification` test (features 001/002) is unaffected — it never
touched a concrete store implementation (spec.md Assumptions), so it needs no changes and no
Postgres connection to pass.

**Target Platform**: Node.js server, now depending on a reachable Postgres instance. Local
development uses a `docker-compose.yml`-provisioned Postgres (spec.md Assumptions); automated
tests provision their own via testcontainers. **Docker must be available on the machine to run
`npm test`** — a new prerequisite this feature introduces, documented in quickstart.md.

**Project Type**: Single project (unchanged).

**Constraints**: No migration of prior in-memory data (spec.md Assumptions — there was never
anything durable to migrate). Single database/schema, no multi-tenancy (spec.md Assumptions).

**Scale/Scope**: Unchanged.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Event Sourcing via Emmett (NON-NEGOTIABLE) | Same decider pattern, same `EventStore` interface — only the concrete store implementation changes. This is ADR 1's deferred second half, now fulfilled | PASS |
| II. Test-First, Given-When-Then (NON-NEGOTIABLE) | New/changed behavior (schema migration, connection-failure handling, the applications index table) gets tests written first, against the shared testcontainer. Existing `deciderSpecification` tests are untouched and need no new tests — they were already store-agnostic | PASS |
| III. Granular Vertical Slice Architecture | No slice restructuring. The one new shared piece (`src/store/application-index.ts`) is storage infra, same category as `src/store/event-store.ts` itself — not business logic. `application-registry.ts` is removed, not left behind as dead code | PASS |
| IV. Decisive Greenfield Architecture | Package, migration strategy, index-table approach (a small hand-rolled table over Emmett's fuller projection machinery), and test-container strategy are all decided outright below, not left open | PASS |
| V. Simplicity: No Board, No Board-Driven Tooling | No board used; same Spec Kit chain | PASS |

No violations — Complexity Tracking table is not needed.

*Re-checked post-Phase 1 design (data-model.md, contracts/, quickstart.md): still PASS on all
five principles — the applications index table stays a thin storage-infra addition, no decider or
route business logic changed, and the testing strategy (shared testcontainer + truncation) keeps
every test's guard-behavior assertions exactly as strict as before.*

## Project Structure

### Documentation (this feature)

```text
specs/005-postgres-event-store/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

**Structure Decision**: Modify the existing store/wiring layer in place; add one new small storage
module; remove the now-obsolete in-memory registry; no changes to `src/domain/`, `src/slices/`,
or `public/`.

```text
docker-compose.yml          # NEW: local dev Postgres (spec.md Assumptions)
.env.example                 # NEW: documents DATABASE_URL

src/store/
├── event-store.ts           # MODIFIED: getPostgreSQLEventStore(process.env.DATABASE_URL), throws
│                             #           clearly if DATABASE_URL is unset
├── event-store.spec.ts       # NEW: migration succeeds against a fresh schema; clear failure on
│                             #      an unreachable/misconfigured connection
├── application-index.ts      # NEW: register(applicationId)/list() backed by a small `applications`
│                             #      table, replacing application-registry.ts's in-memory Set
└── application-index.spec.ts # NEW

src/http/
├── application-registry.ts   # REMOVED (superseded by src/store/application-index.ts)
├── app.ts                     # MODIFIED: decorates `applicationIndex` (renamed from
│                              #            `applicationRegistry` for accuracy) backed by the new
│                              #            module; runs schema migration before registering routes
└── server.ts                  # MODIFIED: migration failure exits clearly (spec.md FR-008)

src/slices/submit-application/route.ts        # MODIFIED: registers into applicationIndex (rename only)
src/read-models/active-pipeline/route.ts       # MODIFIED: reads from applicationIndex (rename only)
src/reactors/ghosting/route.ts                 # MODIFIED: reads from applicationIndex (rename only)

vitest.setup.ts               # NEW: global setup/teardown — starts/stops the shared testcontainer,
                               #      runs schema.migrate() once, sets process.env.DATABASE_URL
vitest.config.ts              # MODIFIED: registers globalSetup
```

## Complexity Tracking

*No violations — table omitted.*
