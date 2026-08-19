# Feature Specification: Postgres Event Store

**Feature Branch**: `005-postgres-event-store`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "Swap the in-memory event store for Postgres, so tracked application data survives server restarts, as the prerequisite before deploying the tracker anywhere (e.g. GCP) — deployment itself is a separate, later step." (builds on features 001–004; the deferred half of ADR 1's "in-memory first, Postgres once the logic's solid")

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tracked applications survive a server restart (Priority: P1)

A job seeker who has submitted and progressed applications restarts the server (or it restarts on
its own, e.g. after a crash or redeploy) and finds every application exactly as they left it —
nothing lost, nothing corrupted.

**Why this priority**: This is the entire point of the swap. Everything built in features 001–004
already works correctly against an in-memory store; the only thing missing is that the data
disappears the moment the process stops, which makes the tracker unusable as a real personal tool
beyond a single running session.

**Independent Test**: Submit and progress several applications through different stages, restart
the server process, then confirm — via the existing HTTP API and frontend, unchanged — that every
application's full history and current state is exactly as it was before the restart.

**Acceptance Scenarios**:

1. **Given** several applications at different pipeline stages, **When** the server process is
   stopped and started again, **Then** every application's current state and full event history
   are unchanged.
2. **Given** the server has just restarted, **When** the seeker views the active overview or an
   individual application's detail, **Then** both reflect exactly what they showed before the
   restart, with no missing or duplicated applications.
3. **Given** the server has just restarted, **When** the seeker takes a further action on an
   existing application (e.g. records an interview outcome), **Then** the action succeeds or is
   rejected by the same guards as before the restart — no guard behavior changes because the
   storage changed.

---

### User Story 2 - Database connection is configurable without code changes (Priority: P2)

An operator points the running system at a different Postgres database (e.g. a local development
database today, a different one when deploying later) by changing configuration, not code.

**Why this priority**: Builds on User Story 1 — durability only matters once storage is real, and
being unable to point at different databases for different environments would make the swap far
less useful once deployment (a separate, later step) is on the table. Still independently
valuable on its own: even for local development alone, hardcoding a connection string is a
foreseeable pain point this story avoids from the start.

**Independent Test**: Run the system against two different Postgres databases in turn, changing
only configuration between runs (no code or rebuild), and confirm each run reads and writes only
its own database.

**Acceptance Scenarios**:

1. **Given** a Postgres connection is specified via configuration, **When** the system starts,
   **Then** it connects to and uses exactly that database.
2. **Given** the configured connection is changed and the system is restarted, **When** it starts
   again, **Then** it uses the newly configured database instead, with no leftover state from the
   previous one.

### Edge Cases

- What happens on the very first run against a brand-new, empty Postgres database (no schema set
  up yet)? → The system MUST be able to establish whatever schema it needs, either automatically
  on startup or via one documented one-time step (Assumptions) — not fail unexplained.
- What happens if the configured database is unreachable when the system starts? → The system
  MUST fail clearly and immediately, not start up silently without persistence or lose writes.
- What happens to data that only ever existed in the in-memory store (features 001–004's
  development/testing so far)? → Out of scope to migrate — see Assumptions; the in-memory store
  was always ephemeral, so there is nothing durable to carry forward.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST durably persist every event, surviving a full process restart.
- **FR-002**: After a restart, every previously submitted application's full event history and
  current state MUST be identical to before the restart.
- **FR-003**: The database connection MUST be configurable without modifying or rebuilding code
  (spec.md User Story 2).
- **FR-004**: Every existing guard (feature 001/002: sequencing, offer-requires-pass,
  closed-application rejection) MUST behave identically to the in-memory implementation — this
  feature changes storage only, never business logic.
- **FR-005**: The active-pipeline overview and application-detail views (features 003/004) MUST
  correctly reflect all applications' current state when backed by Postgres, including
  discovering applications created in a *previous* run of the system (something the in-memory
  store's process-local registry could never do, since it never survived a restart either).
- **FR-006**: The ghosting check MUST continue to operate correctly against data that persists
  across restarts — including applications that went silent in a previous run.
- **FR-007**: The system MUST be able to establish its required schema against a fresh, empty
  database, either automatically or via one documented step (Edge Cases).
- **FR-008**: If the configured database is unreachable at startup, the system MUST fail clearly
  rather than starting in a degraded or silently non-persistent state.
- **FR-009**: The existing HTTP API (feature 003) and frontend (feature 004) MUST require no
  changes to their own request/response contracts — this is a storage-layer swap invisible to API
  consumers.

### Key Entities

No new entities and no change to existing ones (`Application`, `InterviewRound`, `Offer`,
`ActivePipelineEntry`) — this feature changes only where their event history is stored, not what
is tracked.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of applications and their full event history survive a server restart with no
  data loss or corruption.
- **SC-002**: Every existing automated test (features 001–004) passes with zero regressions when
  run against the new storage backend.
- **SC-003**: An operator can switch the system to a different database by changing configuration
  alone, verified without any code change or rebuild.
- **SC-004**: A fresh, empty database can be brought to a working state (ready to accept the
  first application) via one documented step or fully automatically.

## Assumptions

- This feature is the storage swap only — deploying the system anywhere (e.g. GCP) is explicitly
  a separate, later step, not part of this feature's scope, per the user's own framing.
- Local development uses a locally-run Postgres instance (e.g. via Docker); provisioning any
  cloud-hosted database instance is out of scope here and belongs with the later deployment work.
- No data migration is needed from the in-memory store — it was always ephemeral by design
  (ADR 1), so there is no durable prior state to carry forward into Postgres.
- Single database, single schema, single application instance — no multi-tenancy, no
  multi-instance/concurrent-writer concerns beyond what feature 001's Assumptions already deferred
  (Emmett's existing optimistic concurrency at the event-store level).
- Existing tests that exercise the store directly via Emmett's in-memory testing helpers
  (`deciderSpecification`) are unaffected by this feature — they test decider logic in isolation
  from any specific store implementation, which is exactly why that pattern was chosen in feature
  001 in the first place.
