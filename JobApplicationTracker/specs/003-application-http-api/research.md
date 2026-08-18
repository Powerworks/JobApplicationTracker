# Phase 0 Research: HTTP API for the Application Pipeline

## Decision: Fastify over Express

- **Decision**: Fastify, via `@event-driven-io/emmett-fastify`'s `getApplication`/`startAPI`.
- **Rationale**: User-confirmed. `docs/BRIEF.md`'s exercise plan named both as options
  ("`@event-driven-io/emmett-expressjs` (or Fastify)"); the user chose Fastify directly, resolving
  what was previously an open choice.
- **Alternatives considered**: Express via `@event-driven-io/emmett-expressjs` (the other
  named option; not chosen).

## Decision: `emmett-fastify` is bootstrap only — routes and error mapping stay ours

- **Decision**: Use `getApplication({ registerRoutes })`/`startAPI` purely to construct and start
  the Fastify instance. Inspecting the package (`@event-driven-io/emmett-fastify@0.42.4`), it
  exposes only those two functions — no route/decider-to-endpoint generation. All route
  definitions, request/response schemas, and error mapping are written directly against Fastify's
  own API.
- **Rationale**: Matches constitution Principle III — routes belong inside their owning slice, not
  behind a framework-provided routing abstraction that would obscure the granular-slice structure.
- **Alternatives considered**: A hypothetical decider-to-route auto-wiring (not offered by the
  package as installed; not pursued).

## Decision: One route file per slice, no shared `routes.ts`

- **Decision**: `route.ts` lives inside each existing slice folder
  (`src/slices/<command>/route.ts`, plus `src/read-models/active-pipeline/route.ts` and
  `src/reactors/ghosting/route.ts`), each exporting a small Fastify plugin registered by
  `src/http/app.ts`.
- **Rationale**: Constitution Principle III, same reasoning as feature 001's `decide.ts` files —
  each route is independently readable/testable, and adding it next to its command's `decide.ts`
  keeps the command's full behavior (guard logic + its HTTP exposure) in one folder.
- **Alternatives considered**: A single `src/http/routes.ts` registering all endpoints (rejected —
  directly the shared-file pattern Principle III prohibits).

## Decision: Three-tier error mapping — 400 / 404 / 409

- **Decision**:
  - **400 Bad Request**: malformed/missing required input, caught by Fastify's built-in JSON
    Schema request validation (via each route's `schema.body`) — before any decider logic runs.
  - **404 Not Found**: the referenced `applicationId` has no prior events at all. Detected by
    reading current state via `eventStore.aggregateStream(streamName, { evolve, initialState })`
    *before* invoking `DeciderCommandHandler`, and checking the result's own `streamExists: boolean`
    flag (discovered during implementation — Emmett's `aggregateStream` already reports this
    directly, which is simpler and more robust than inferring non-existence from the domain's
    `NotSubmitted` state, so it's used instead of the originally-planned `state.status` check).
  - **409 Conflict**: every other guard violation (out-of-sequence round, offer without a pass,
    action on an already-closed application) — feature 001/002's existing `IllegalStateError`,
    thrown by the unchanged `decide()` functions and caught at the route boundary.
- **Rationale**: Satisfies spec.md FR-010/FR-011/FR-012 (three distinguishable rejection kinds)
  without adding any new guard logic or new error types to the existing deciders — the mapping is
  a pure translation layer. Accepts a minor redundant read (state is read once for the 404 check,
  then again inside `DeciderCommandHandler`) in exchange for not having to restructure feature
  001/002's `decide()` functions to throw distinguishable error subtypes — simplicity over
  optimization for a single-user, in-memory-store tool (constitution Principle IV, YAGNI).
- **Alternatives considered**: Making `decide()` throw a dedicated `NotFoundError` for
  `NotSubmitted` state (rejected — would touch and re-test feature 001/002's already-proven
  deciders for a distinction that only matters at the HTTP boundary); relying on Emmett's own
  `NotFoundError`/`STREAM_DOES_NOT_EXIST` machinery directly (available in the SDK, but would
  require restructuring the read-then-decide flow around store-level stream-existence checks
  rather than the domain's own `NotSubmitted` state, for no added clarity in this domain).

## Decision: `applicationId` generated via `crypto.randomUUID()`, no new dependency

- **Decision**: `SubmitApplication`'s route generates the new application's stream ID with
  Node's built-in `crypto.randomUUID()` before invoking the command handler, and returns it in the
  response body (spec.md Acceptance Scenario 1: "identifies it for future requests").
- **Rationale**: No existing ID-generation dependency in the project; Node's built-in avoids
  adding one (constitution Principle IV, YAGNI). `uuid` (already present transitively via Emmett's
  own dependencies) was considered but a built-in suffices.
- **Alternatives considered**: The `uuid` package directly (rejected — unnecessary dependency
  when `crypto.randomUUID()` already meets the need).

## Decision: HTTP-level testing via Fastify's `app.inject()`

- **Decision**: Every `route.spec.ts` uses `app.inject({ method, url, payload })` against the
  Fastify instance built by `src/http/app.ts` — no real network socket/port.
- **Rationale**: Constitution Principle II — these are still fast, in-process tests consistent
  with features 001/002's testing style, just exercised through the HTTP boundary instead of
  calling `decide()` directly.
- **Alternatives considered**: Starting a real server and using an HTTP client library in tests
  (rejected — slower, needs port management, no benefit for what's being verified).

## Decision: One shared in-memory event store instance per running process

- **Decision**: `src/store/event-store.ts`'s `createEventStore()` is called once in
  `src/http/app.ts` and the resulting store instance is passed into every route (e.g. via Fastify
  decoration or closure) — not recreated per request.
- **Rationale**: The whole point of the in-memory store is to hold state across requests within
  one running process (feature 001's ADR 1: in-memory first, Postgres later). Recreating it per
  request would silently discard all data between calls.
- **Alternatives considered**: None — a per-request store would break the feature outright.
