# Phase 0 Research: Postgres Event Store

## Decision: `@event-driven-io/emmett-postgresql`'s `getPostgreSQLEventStore`

- **Decision**: `getPostgreSQLEventStore(connectionString)` — the same-family package to Emmett
  core and `emmett-fastify`, already at version `0.42.4` matching what's installed.
- **Rationale**: This is Emmett's own Postgres event store — the natural, already-planned choice
  (ADR 1, `docs/BRIEF.md`'s exercise plan step 3). Inspecting its published types confirms
  `PostgresEventStore extends EventStore<...>`, the same interface `InMemoryEventStore`
  implements — so every existing `aggregateStream`/`readStream`/`appendToStream` call site across
  features 001–004 needs zero changes.
- **Alternatives considered**: A different Postgres client/ORM wired up by hand (rejected —
  reinvents what Emmett already provides, and this project's purpose is Emmett practice); staying
  in-memory (rejected — the entire point of this feature).

## Decision: Explicit `schema.migrate()` at startup, not `autoMigration`

- **Decision**: `src/http/server.ts` calls `await store.schema.migrate()` before `startAPI(app)`.
  If it throws (unreachable database, permissions issue, etc.), the process logs clearly and
  exits non-zero rather than starting in a broken state.
- **Rationale**: `PostgresEventStoreOptions.schema.autoMigration` exists as a more implicit
  alternative, but constitution Principle IV (decisive, no hedging) favors the explicit,
  visible-in-code version — it's also the only way to fail *before* accepting any request, which
  spec.md FR-008 requires outright ("fail clearly rather than starting in a degraded... state").
- **Alternatives considered**: `autoMigration` option (rejected — implicit, and still runs inline
  with the first store operation rather than guaranteeing failure happens before the server starts
  accepting traffic); a separate manual migration CLI step (rejected — spec.md FR-007 allows either
  automatic or one documented step, and automatic-on-startup is simpler for a single-operator tool
  with no deployment pipeline yet).

## Decision: A small hand-rolled `applications` index table, not Emmett's projection machinery

- **Decision**: One new table (`applications: application_id text primary key, submitted_at
  timestamptz`), written to by `src/store/application-index.ts`'s `register()` (called from
  `submit-application/route.ts`, same call site the old in-memory registry used) and read by
  `list()` (used by the active-pipeline and ghosting-check routes).
- **Rationale**: Directly extends feature 003's original registry decision (research.md there:
  "simplest thing that works... disappears once Postgres replaces the in-memory store" — that
  moment has arrived, and the simplest *Postgres* thing that works is still a plain index table,
  not a full projection). Emmett's Postgres package exposes considerably more machinery
  (`postgreSQLProjection`, `pongoProjection`, multi-stream projections) built for keeping
  *read models* in sync via subscriptions — disproportionate for "list the IDs that exist."
- **Alternatives considered**: Querying Emmett's own internal `streams` table directly (the
  package does export `streamsTable`/`streamsTableSQL`, so it's technically reachable) — rejected:
  it's schema Emmett owns and could change shape across versions; depending on it directly is more
  fragile than a one-table index we own outright. Full Postgres projection machinery (rejected —
  see Rationale; would also reintroduce eventual-consistency timing questions this small tool has
  no need for, since the index write and the event append can simply happen in the same request).

## Decision: Testing via `@event-driven-io/emmett-testcontainers`, one shared container per run

- **Decision**: Dev dependency `@event-driven-io/emmett-testcontainers`, whose
  `getPostgreSQLStartedContainer()` is used in a Vitest `globalSetup` file to start one Postgres
  container for the entire test run, run `schema.migrate()` once, and expose its connection string
  via `process.env.DATABASE_URL`. The container stops in `globalTeardown`. Tests whose assertions
  depend on the store's full contents (the active-overview and ghosting-check `route.spec.ts`
  files) truncate via `store.schema.dangerous.truncate()` in a `beforeEach`, restoring the
  per-test isolation the in-memory store used to give for free (a new `buildApp()` = a new empty
  store, previously).
- **Rationale**: This is the same tool Emmett's own test suite uses internally (found as a
  devDependency of `emmett-postgresql` itself) — the idiomatic, already-battle-tested approach for
  this exact library, requiring only Docker on the machine (no manual `docker-compose up` step
  before `npm test`, unlike local dev). One shared container per run, not per test, because
  starting a full Postgres container per test would make the suite unacceptably slow — truncation
  is fast and sufficient for isolation.
- **Alternatives considered**: A manually-managed `docker-compose` Postgres that the developer
  must start before running tests (rejected as the *test* strategy — too easy to forget, and CI
  would need the same manual step; kept as the *local dev-server* strategy instead, where a
  long-lived, inspectable database is actually useful); mocking the event store in tests (rejected
  — would test nothing about the actual Postgres integration this feature exists to add).

## Decision: Rename `applicationRegistry` → `applicationIndex`

- **Decision**: The Fastify decoration and module are renamed from `applicationRegistry`/
  `application-registry.ts` to `applicationIndex`/`application-index.ts`.
- **Rationale**: "Registry" fit a process-local, in-memory `Set` that only ever tracked what
  happened *this run*. Now that it's a real, persisted table surviving restarts (spec.md FR-005),
  "index" is the accurate name. The call sites in `submit-application/route.ts`,
  `active-pipeline/route.ts`, and `ghosting/route.ts` change only by this rename — their logic is
  otherwise untouched.
- **Alternatives considered**: Keeping the old name to minimize diff (rejected — the name would
  actively mislead future readers about what survives a restart).
