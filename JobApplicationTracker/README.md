# Job Application Tracker

A personal job-application pipeline tracker, built as a hands-on practice project for
[Emmett](https://event-driven.io/en/type_script_node_Js_event_sourcing/) (TypeScript/Node.js
event sourcing). Submit applications, progress them through interview rounds to a terminal
outcome, see an at-a-glance overview of what's still open, and auto-close applications that have
gone silent — via a Fastify HTTP API and a small vanilla-JS frontend, backed by a Postgres event
store.

See [`docs/BRIEF.md`](docs/BRIEF.md) for the project's origin/purpose and
[`docs/ADRs.md`](docs/ADRs.md) for its architecture decisions.

## Prerequisites

- Node.js 20+
- Docker (used both for local development's Postgres and for the automated tests' ephemeral
  Postgres container)

## Setup

```bash
npm install
docker compose up -d      # starts local Postgres
cp .env.example .env      # DATABASE_URL pointing at that local Postgres
```

## Running

```bash
npm run start
```

Serves the API and frontend on `http://localhost:5000`. The event store schema is migrated
automatically on startup; if the database is unreachable, the process logs the error and exits
rather than starting in a broken state.

## Testing

```bash
npm test
```

No manual setup needed — a Vitest global setup starts its own ephemeral Postgres container (via
Testcontainers), migrates it, and tears it down afterward. Requires Docker to be running.

## Project structure

Organized as granular vertical slices — one folder per command, no shared catch-all files:

```text
src/
├── domain/          # Event/command type unions, the Application state fold (evolve)
├── slices/          # One folder per command: SubmitApplication, ScheduleInterview, ...
│                     # each with its own decider (decide.ts) and HTTP route (route.ts)
├── read-models/      # active-pipeline (overview) and application-detail projections + routes
├── reactors/         # ghosting (auto-close silent applications) + its route
├── store/            # Postgres event store wiring, the applications index table
└── http/             # Fastify app wiring, error mapping, static file serving

public/               # The frontend: plain HTML/CSS/JS, no framework, no build step
```

## API

Fastify HTTP API exposing every command, the active-pipeline overview, and an on-demand
ghosting-check trigger.

**Interactive docs**: with the server running, open `http://localhost:5000/documentation` for a
Swagger UI generated from the routes' own schemas (raw OpenAPI document at
`/documentation/json`).

Prose reference:
[`specs/003-application-http-api/contracts/http-api.md`](specs/003-application-http-api/contracts/http-api.md)
(plus the detail endpoint added in
[`specs/004-application-tracker-frontend/contracts/application-detail-endpoint.md`](specs/004-application-tracker-frontend/contracts/application-detail-endpoint.md)).

## Further documentation

Every feature was built through a full spec → plan → tasks → implementation trail under
[`specs/`](specs/) — each feature's `spec.md` describes what it does and why, `plan.md`/
`research.md` the technical decisions, and `contracts/` the interfaces.

| Feature | What |
|---|---|
| [001](specs/001-job-application-pipeline/) | Core event-sourced pipeline: submit → interviews → terminal outcome, active overview, ghosting |
| [002](specs/002-application-job-details/) | Richer job posting fields (location, salary, employment type, bonus, benefits) |
| [003](specs/003-application-http-api/) | HTTP API (Fastify) over the pipeline |
| [004](specs/004-application-tracker-frontend/) | The frontend, plus the `GET /applications/:id` endpoint it needed |
| [005](specs/005-postgres-event-store/) | Postgres event store swap (durability across restarts) |
