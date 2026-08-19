# Quickstart: Postgres Event Store

## Prerequisites

- Docker available on the machine (new prerequisite this feature introduces — used both by local
  dev's `docker-compose` and by the automated tests' testcontainer).
- `npm install` (adds `@event-driven-io/emmett-postgresql` and, as a dev dependency,
  `@event-driven-io/emmett-testcontainers`).

## Automated tests

```bash
npm test
```

No manual setup needed — a Vitest global setup starts a real, ephemeral Postgres container for
the run, migrates its schema, and tears it down afterward (research.md). Every existing
`deciderSpecification` test (features 001/002) still runs with no Postgres dependency, unchanged.

## Local development

```bash
docker compose up -d          # starts a local Postgres, per docker-compose.yml
cp .env.example .env          # DATABASE_URL pointing at that local Postgres
npm run start                  # migrates the schema on startup, then serves on :5000
```

## Manual verification (spec.md's acceptance scenarios)

1. With the server running, submit and progress a few applications through the browser (feature
   004) or `curl` (feature 003) — same as before, no API changes.
2. Stop the server (`Ctrl+C`), then run `npm run start` again.
3. Reload the overview and a couple of application detail pages.
   - Expect: every application, its full history, and its current stage are exactly as they were
     before the restart (spec.md Acceptance Scenario 1/2).
4. Take a further action on one of the restored applications (e.g. record an interview outcome).
   - Expect: it succeeds or is rejected by the same guard as before the restart — no behavior
     change (spec.md Acceptance Scenario 3).
5. Stop the server, change `DATABASE_URL` in `.env` to point at a second, empty local database,
   restart.
   - Expect: the overview is now empty (a different database, per spec.md User Story 2) — not an
     error, and not the first database's data.

## Expected outcome

`event-store.spec.ts` and `application-index.spec.ts` (new) cover migration and index behavior
directly, written first against the shared testcontainer. The full existing suite (features
001–004) passes unchanged in behavior, now running against a real Postgres for every route-level
test. The manual walkthrough above is the acceptance check for the restart-survival behavior
itself, which no unit test can directly exercise (it requires actually stopping and restarting
the process).
