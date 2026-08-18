# Feature Specification: Application Tracker Frontend

**Feature Branch**: `004-application-tracker-frontend`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "A web frontend for the job application tracker, so the job seeker can use it without curl or a raw HTTP client — submit and progress applications, see the active overview, and trigger the ghosting check, all through a browser." (builds on feature 003's HTTP API; the last planned increment before the tracker is usable end-to-end as a real personal tool)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manage an application's lifecycle through the browser (Priority: P1)

A job seeker opens the tracker in a browser, submits a new application with its full job posting
details, and progresses it over time — scheduling interviews, recording outcomes, receiving an
offer, accepting/declining it, or withdrawing — using forms and buttons instead of hand-crafted
HTTP requests.

**Why this priority**: This is the entire point of a frontend — without it, everything feature
003 already exposes remains unreachable to the seeker except via a terminal. Every other story in
this feature depends on applications existing and being progressable.

**Independent Test**: Using only the browser, submit a new application, progress it through at
least one full path to a terminal outcome (e.g. offer accepted), and confirm each step's result is
visible on screen — independently testable without needing User Stories 2 or 3.

**Acceptance Scenarios**:

1. **Given** the tracker is open with no prior applications, **When** the seeker fills in and
   submits the new-application form (company, role, location, salary, employment type, bonus,
   benefits), **Then** the application appears with its submitted details visible.
2. **Given** a submitted application, **When** the seeker takes each valid next action in turn
   (schedule an interview, record its outcome, receive an offer, accept the offer), **Then** each
   action succeeds and the application's displayed state updates to reflect it.
3. **Given** an application, **When** the seeker attempts an action that violates a pipeline guard
   (e.g. scheduling a second interview round before the first's outcome is recorded, or acting on
   an application that already reached a terminal outcome), **Then** the action is prevented or
   rejected and the seeker sees a clear explanation of why, without the page crashing or silently
   doing nothing.
4. **Given** the new-application form, **When** the seeker tries to submit it with required fields
   missing, **Then** the seeker sees which fields are missing before or instead of any request
   being sent, and can correct and resubmit.

---

### User Story 2 - See the active pipeline at a glance (Priority: P2)

A job seeker opens the tracker and immediately sees every application still in progress, its
current stage, and how long it's been idle, with the most-neglected ones surfaced first — the
same view feature 001/003 already provide over the API, now as a page instead of a JSON response.

**Why this priority**: Builds directly on User Story 1 — there's nothing to overview until
applications exist. This is the view a returning user lands on and the reason to keep using the
tool at all, but it doesn't unlock any new data-entry capability of its own.

**Independent Test**: With several applications already created (via User Story 1) at different
stages and idle times, load the overview page and confirm it shows only the open ones,
most-idle-first, matching what feature 003's `GET /applications/active` returns.

**Acceptance Scenarios**:

1. **Given** several open applications with varying idle time and one closed application, **When**
   the seeker views the overview page, **Then** it lists only the open ones, ordered most-idle
   first, and the closed one is absent.
2. **Given** no applications exist yet, **When** the seeker views the overview page, **Then** they
   see an empty state that makes clear there's nothing tracked yet (not a blank page or an error).
3. **Given** the overview page, **When** the seeker selects an application, **Then** they reach
   that application's detail view (User Story 1) to take further action on it.

---

### User Story 3 - Trigger the ghosting check from the browser (Priority: P3)

A job seeker manually triggers a check for applications that have gone silent, closing any that
have, without needing to know the underlying HTTP endpoint.

**Why this priority**: Lowest priority — Stories 1 and 2 are both fully usable without it, and
this is a maintenance action the seeker would use occasionally, not a core workflow step.

**Independent Test**: With an application silent past the configured period, trigger the check
from the browser and confirm it disappears from the overview afterward, without needing to know
feature 003's endpoint exists.

**Acceptance Scenarios**:

1. **Given** an open application silent past the configured period, **When** the seeker triggers
   the ghosting check from the browser, **Then** that application no longer appears in the active
   overview, and the seeker sees confirmation of what happened (e.g. how many were closed).
2. **Given** no applications are currently silent, **When** the seeker triggers the check, **Then**
   they see confirmation that nothing changed, not an error.

### Edge Cases

- What happens when the backend is unreachable or returns an unexpected error? → The seeker sees
  an error indication rather than a silently broken or infinitely loading page (Assumptions).
- What happens when the seeker submits an action and then submits it again before seeing the
  result (e.g. double-clicking accept)? → Out of scope for this feature to prevent explicitly; see
  Assumptions — the underlying API's existing guards (feature 001/003) already reject the second,
  redundant request without corrupting state, and the UI need not add its own duplicate-submission
  prevention beyond disabling the control while a request is in flight.
- What happens when an application has no bonus/salary/benefits recorded (feature 002's optional
  fields)? → The detail view shows their absence clearly (e.g. "not disclosed") rather than
  showing blank or misleading values.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a way to submit a new application through a form covering
  every field from feature 002 (company, role, location, salary, employment type, bonus,
  benefits), with salary/bonus/benefits clearly optional.
- **FR-002**: The system MUST provide a way to view a single application's full current state:
  its job posting details, its interview rounds and their outcomes, its offer (if any), and its
  overall status.
- **FR-003**: The system MUST provide a way to take every valid next action on an application from
  its detail view: schedule an interview, record an interview outcome, receive an offer, accept an
  offer, decline an offer, withdraw.
- **FR-004**: When an action is rejected (validation failure or guard violation), the system MUST
  show the seeker why, distinguishably from a successful action, without losing their unsaved
  form input where practical.
- **FR-005**: The system MUST provide a page showing the active pipeline overview (feature 001
  FR-012–FR-014 / feature 003 `GET /applications/active`): open applications only, most-idle-first,
  each showing at minimum company, role, current stage, and idle time.
- **FR-006**: The overview MUST show a clear empty state when there are no open applications,
  rather than an empty or broken-looking page.
- **FR-007**: The system MUST let the seeker navigate from the overview to an individual
  application's detail view.
- **FR-008**: The system MUST provide a way to trigger the ghosting check on demand and show the
  seeker the outcome (how many applications were ghosted, including zero).
- **FR-009**: The system MUST indicate clearly when a request to the backend is in progress, and
  when it has failed due to the backend being unreachable or returning an unexpected error.

### Key Entities

No new entities — this feature is a UI over feature 001/002/003's existing `Application`,
`ActivePipelineEntry`, and the HTTP API's existing endpoints; it does not change what is tracked.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A job seeker with no prior familiarity with the tool's HTTP API can submit a new
  application and see it reflected in the overview without consulting any documentation beyond
  what's visible on screen.
- **SC-002**: 100% of rejected actions (validation or guard failure) are shown to the seeker with
  an explanation, never as a silent failure or a raw, unformatted error.
- **SC-003**: The overview and an application's detail view always reflect the backend's actual
  current state — no action the seeker takes appears to succeed in the UI while having failed on
  the backend, or vice versa.
- **SC-004**: A seeker can go from the overview page to taking an action on a specific application
  and back to the overview in a continuous flow, without needing to know or type an application
  ID.

## Assumptions

- Single-user, single-browser-tab usage, consistent with features 001–003's existing trust
  boundary — no authentication, no multi-user concerns, no real-time sync between multiple open
  tabs/windows.
- No offline support — the frontend requires a reachable backend (feature 003's HTTP API) to
  function; there is no local caching or optimistic-write-then-sync behavior beyond the standard
  "disable the control while a request is in flight" from Edge Cases.
- No automated or scheduled triggering of the ghosting check from the frontend — it remains an
  on-demand action the seeker takes (mirroring feature 003's Assumptions).
- Visual design, styling, and responsive/mobile layout are not specified here — left to
  `/speckit-plan` and implementation to decide reasonably; this spec only requires that every
  functional requirement above is reachable and usable, not how it looks.
- This is the last planned increment before the tracker is usable end-to-end as a personal tool
  without any direct HTTP calls; the Postgres event-store swap (deferred per `docs/ADRs.md`)
  remains a separate, later concern orthogonal to the frontend existing.
