# Contract: `public/js/api-client.js`

The frontend's one boundary module — every other frontend file reaches the backend only through
these functions, never via a direct `fetch()` call of its own. One function per backend endpoint
(feature 003's existing 9, plus this feature's new 1).

| Function | Backend call |
|---|---|
| `submitApplication(data)` | `POST /applications` |
| `getActivePipeline()` | `GET /applications/active` |
| `getApplication(applicationId)` | `GET /applications/:applicationId` (new, this feature) |
| `scheduleInterview(applicationId, data)` | `POST /applications/:applicationId/interviews` |
| `recordInterviewOutcome(applicationId, data)` | `POST /applications/:applicationId/interviews/outcome` |
| `receiveOffer(applicationId, data)` | `POST /applications/:applicationId/offer` |
| `acceptOffer(applicationId)` | `POST /applications/:applicationId/offer/accept` |
| `declineOffer(applicationId)` | `POST /applications/:applicationId/offer/decline` |
| `withdrawApplication(applicationId)` | `POST /applications/:applicationId/withdraw` |
| `triggerGhostingCheck()` | `POST /ghosting/check` |

Every function returns a `Promise` resolving to `{ ok: true, data }` on 2xx or
`{ ok: false, status, error, message }` on non-2xx — callers (the `views/*.js` modules) branch on
`ok` rather than on thrown exceptions, so a rejected action (400/404/409) is always handled
explicitly (spec.md FR-004), and a network failure is the only case that rejects the Promise
(spec.md Edge Cases: backend unreachable).

# Contract: `public/js/format.js`

Pure functions, no DOM/fetch access — the testable core of the rendering logic.

| Function | Purpose |
|---|---|
| `formatMoney(amount, currency)` | `"150000", "USD"` → `"150,000 USD"` (or similar); used for salary/bonus/offer amounts |
| `formatIdleTime(days)` | `0` → `"today"`, `1` → `"1 day"`, `N` → `"N days"` |
| `describeStage(application)` | Given an `Application`/`ActivePipelineEntry`-shaped object, returns the same human-readable stage strings feature 001's `active-pipeline/project.ts` already produces server-side (kept in sync by test, not by sharing code across the HTTP boundary) |
