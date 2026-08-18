# Phase 1 Data Model: Application Tracker Frontend

No new domain entities (spec.md Key Entities) — this feature renders and submits data using
feature 003's existing HTTP request/response shapes (`data-model.md` in
`specs/003-application-http-api/`) unchanged. This document covers only the client-side view
state each screen needs.

## View: Overview (`#/`)

Renders `ActivePipelineEntry[]` (feature 003 `GET /applications/active`) directly — one row per
entry: `applicationId`, `company`, `role`, `currentStage`, `daysSinceLastActivity`. Each row links
to `#/applications/:applicationId`. A button triggers `POST /ghosting/check`; the response's
`ghosted` array length is shown as a confirmation message (spec.md FR-008), then the overview
re-fetches.

## View: New Application (`#/new`)

A form matching `SubmitApplication`'s request body exactly (feature 003 `data-model.md`):
`company`, `role`, `location`, `employmentType` (a choice of "Permanent"/"Contract"), `salary`
(optional amount + currency), `bonus` (optional amount + currency), `benefits` (a repeatable
text-list input). On submit, `POST /applications`; on success, navigate to
`#/applications/:applicationId` (the new ID from the response). On a 400, show the validation
message inline without navigating away or clearing the form (spec.md FR-004).

## View: Application Detail (`#/applications/:applicationId`)

Feature 003 has no endpoint that returns a single application's full state (only the
active-pipeline *list*, which excludes closed applications entirely) — a gap surfaced by this
feature's FR-002 ("view a single application's full current state") and the edge case requiring
closed applications to still be viewable, just action-less. This plan adds one new backend
endpoint to close that gap: `GET /applications/:applicationId`, returning the full `Application`
state (open or closed) as a new read-model slice — see `contracts/application-detail-endpoint.md`.

Shows every field from that response plus the available next actions, each calling its
corresponding feature 003 command endpoint:

| Displayed state | Available actions |
|---|---|
| Open, no interview scheduled yet | Schedule interview |
| Open, round *N* scheduled, outcome pending | Record outcome (round *N*) |
| Open, latest round outcome Passed, no offer | Schedule next round, or receive offer |
| Open, offer pending decision | Accept offer, decline offer |
| Any open state | Withdraw |
| Closed (any reason) | No actions — view only |

On any action's 409/404, show the error message from the response body inline (spec.md FR-004);
on success, re-fetch and re-render the same view.
