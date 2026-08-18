# Quickstart: HTTP API for the Application Pipeline

## Prerequisites

`npm install` (adds `fastify` and `@event-driven-io/emmett-fastify`), then `npm test` for the
automated (in-process, `app.inject()`-based) validation — no server needs to be running for tests.

To try it manually instead:

```bash
npm run start   # starts the Fastify server (src/http/server.ts), default port per Fastify config
```

## Scenario walkthrough (manual, via curl — mirrors the automated route.spec.ts suites)

### User Story 1 — pipeline lifecycle over HTTP

```bash
curl -s -X POST localhost:3000/applications \
  -H 'content-type: application/json' \
  -d '{"company":"Acme","role":"Engineer","location":"Remote","employmentType":"Permanent","benefits":[]}'
# -> 201 { "applicationId": "..." }

curl -s -X POST localhost:3000/applications/<id>/interviews \
  -H 'content-type: application/json' -d '{"round":1,"date":"2026-08-20"}'
# -> 200 {}

curl -s -X POST localhost:3000/applications/<id>/interviews/outcome \
  -H 'content-type: application/json' -d '{"round":1,"outcome":"Passed"}'
# -> 200 {}

curl -s -X POST localhost:3000/applications/<id>/offer \
  -H 'content-type: application/json' -d '{"amount":150000,"deadline":"2026-09-01"}'
# -> 200 {}

curl -s -X POST localhost:3000/applications/<id>/offer/accept
# -> 200 {}

# Any further request against <id> now:
curl -s -X POST localhost:3000/applications/<id>/withdraw
# -> 409 { "error": "...", "message": "..." }
```

### User Story 2 — active overview over HTTP

```bash
curl -s localhost:3000/applications/active
# -> 200 [ { "applicationId": "...", "company": "...", ..., "daysSinceLastActivity": N }, ... ]
```

### User Story 3 — trigger ghosting over HTTP

```bash
curl -s -X POST localhost:3000/ghosting/check
# -> 200 { "ghosted": [] }   (or a list of newly-ghosted application IDs)
```

### Error cases

```bash
curl -s -X POST localhost:3000/applications -d '{}' -H 'content-type: application/json'
# -> 400 (missing required fields)

curl -s -X POST localhost:3000/applications/does-not-exist/withdraw
# -> 404
```

## Expected outcome

Every scenario above has a corresponding `route.spec.ts` using `app.inject()` (no real server),
satisfying spec.md's Success Criteria SC-001–SC-005 as part of `npm test`.
