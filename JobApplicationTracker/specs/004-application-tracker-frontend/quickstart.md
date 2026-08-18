# Quickstart: Application Tracker Frontend

## Prerequisites

`npm install` (adds `@fastify/static`), then `npm test` for the automated (pure-logic + backend
route) tests. For the manual browser walkthrough:

```bash
npm run start   # http://localhost:5000 — now also serves public/
```

## Manual browser walkthrough (mirrors spec.md's acceptance scenarios)

### User Story 1 — manage a lifecycle through the browser

1. Open `http://localhost:5000/` → lands on the overview (empty state, per FR-006).
2. Navigate to `#/new` → fill in the new-application form (company, role, location, employment
   type; leave salary/bonus/benefits at their optional defaults) → submit.
   - Expect: navigation to the new application's detail view, showing what was just submitted.
3. From the detail view: schedule an interview (round 1) → record its outcome as Passed → receive
   an offer → accept the offer.
   - Expect: after each action, the detail view updates to reflect the new state.
4. Attempt any action on the now-accepted application (e.g. withdraw).
   - Expect: a visible rejection message (409), not a silent failure or crash (FR-004).
5. Back on `#/new`, submit with company left blank.
   - Expect: the missing field is flagged before/without a request succeeding (FR-004).

### User Story 2 — overview

1. Create a few applications at different stages (User Story 1's steps).
2. Return to `#/` → expect only open applications listed, most-idle-first, with the one accepted
   above absent.
3. Select an application from the list → expect navigation to its detail view without needing to
   know or type its ID (SC-004).

### User Story 3 — ghosting trigger

1. From `#/`, use the "check for ghosted applications" control.
2. Expect a confirmation of the outcome (e.g. "0 applications ghosted") even when nothing changed.

### Error handling

1. Stop the server, then attempt any action in the browser.
2. Expect a visible indication that the backend is unreachable (FR-009), not an indefinite loading
   state or a blank screen.

## Expected outcome

`format.js` and `api-client.js`'s payload-building logic are covered by Vitest
(`public/js/*.spec.js`, part of `npm test`); the new `GET /applications/:applicationId` endpoint
is covered by `route.spec.ts` (`app.inject()`, same pattern as feature 003). The walkthrough above
is the acceptance check for everything else, per research.md's testing-scope decision.
