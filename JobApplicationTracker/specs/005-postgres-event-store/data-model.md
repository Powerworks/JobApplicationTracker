# Phase 1 Data Model: Postgres Event Store

No change to `Application`, `InterviewRound`, `Offer`, or `ActivePipelineEntry` (spec.md Key
Entities) — this feature only changes where events are stored and adds one small index structure.

## Emmett-managed schema (events, streams)

Created and owned entirely by `@event-driven-io/emmett-postgresql`'s `schema.migrate()` — its
exact table shape (`streams`, `messages`, etc.) is that package's implementation detail, not
something this project defines or should depend on directly (research.md: rejected querying it
directly for that reason).

## New table: `applications` (this project's own, minimal)

| Column | Type | Notes |
|---|---|---|
| `application_id` | `text primary key` | Same ID used as the event stream name |
| `submitted_at` | `timestamptz` | When `register()` was called — informational only, not used for any guard or ordering logic (the active-pipeline projection already derives ordering from `lastActivityAt` inside the folded event state, unchanged) |

Written once per application (on `SubmitApplication`), read in full by
`GET /applications/active` and `POST /ghosting/check`, exactly replacing
`application-registry.ts`'s `register()`/`list()` call shape (research.md).

## Environment configuration

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string, read by `src/store/event-store.ts`. Required in
  every environment except the test run, where the Vitest global setup sets it to the shared
  testcontainer's connection string automatically. |
