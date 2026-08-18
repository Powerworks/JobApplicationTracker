# Feature Specification: HTTP API for the Application Pipeline

**Feature Branch**: `003-application-http-api`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "Expose the existing job application pipeline (submit, progress through interviews, offers, terminal outcomes, the active overview, and ghosting) over HTTP, so a future frontend (or any other external client) can drive it instead of only being callable from within the same process." (builds on features 001 and 002; precedes a frontend)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manage an application's lifecycle over HTTP (Priority: P1)

An external client (eventually a frontend, for now anything that can make HTTP requests) submits a
new application and progresses it through its lifecycle — scheduling interviews, recording
outcomes, receiving and deciding on an offer, or withdrawing — using HTTP requests instead of
calling the underlying logic directly in-process.

**Why this priority**: Without this, nothing external can create or change data at all — every
other capability in this feature (viewing the overview, ghosting) is only meaningful once
applications can be created and progressed from outside the process.

**Independent Test**: Using only HTTP requests, submit an application, progress it through at
least one full path to a terminal outcome (e.g. offer accepted), and confirm each step succeeds
or is rejected as feature 001's guards specify — independently testable without a frontend, e.g.
with `curl` or an HTTP test client.

**Acceptance Scenarios**:

1. **Given** no prior application, **When** a client submits a new application over HTTP with the
   job posting details from feature 002 (company, role, location, salary, employment type, bonus,
   benefits), **Then** the response confirms the application was created and identifies it for
   future requests.
2. **Given** a submitted application, **When** a client requests each valid next step in turn
   (schedule an interview, record its outcome, receive an offer, accept the offer), **Then** each
   request succeeds and the application's state reflects it.
3. **Given** an application, **When** a client requests an action that violates one of feature
   001's guards (e.g. scheduling round 2 before round 1's outcome is recorded, receiving an offer
   without a passing interview, or acting on an application that already reached a terminal
   outcome), **Then** the request is rejected with a response that identifies it was rejected and
   why, and the application's state is unchanged.
4. **Given** a request with missing or malformed required data (e.g. submitting an application
   with no company), **When** the client sends it, **Then** the request is rejected as invalid
   before any guard logic runs, distinctly from a guard rejection.

---

### User Story 2 - View the active pipeline overview over HTTP (Priority: P2)

An external client requests the list of currently open applications, most-idle-first, the same
view feature 001's User Story 2 already provides in-process.

**Why this priority**: Builds directly on User Story 1 — there is no overview to view until
applications exist. Independent of ghosting (User Story 3): the overview already excludes closed
applications regardless of *why* they closed.

**Independent Test**: Using only HTTP requests, submit several applications at different stages
(via User Story 1's endpoints) and confirm a single HTTP request returns exactly the open ones,
correctly ordered — independently testable, e.g. with `curl`.

**Acceptance Scenarios**:

1. **Given** several open applications with varying idle time and one closed application, **When**
   a client requests the active overview over HTTP, **Then** the response lists only the open
   ones, ordered most-idle-first, and excludes the closed one.
2. **Given** no applications exist yet, **When** a client requests the active overview, **Then**
   the response is an empty list, not an error.

---

### User Story 3 - Trigger the ghosting check over HTTP (Priority: P3)

An external client (or a scheduler acting as one) requests that the system check for and close any
applications that have gone silent past the configured period, the same behavior feature 001's
User Story 3 already provides in-process.

**Why this priority**: Lowest priority — the pipeline (P1) and the overview (P2) are both fully
usable without this; it's a convenience that keeps the overview from accumulating stale entries
indefinitely. No scheduling infrastructure is assumed to exist yet, so this feature exposes the
check as something that can be triggered on demand, not as an automatic background job.

**Independent Test**: Submit an application, simulate its silence period elapsing, then send a
single HTTP request to trigger the check, and confirm the application is subsequently absent from
the active overview.

**Acceptance Scenarios**:

1. **Given** an open application silent past the configured period, **When** a client triggers the
   ghosting check over HTTP, **Then** that application no longer appears in the active overview
   afterward.
2. **Given** no applications are currently silent past the period, **When** a client triggers the
   ghosting check, **Then** the request still succeeds and no applications change state.

### Edge Cases

- What happens when a client requests an action on an application ID that does not exist? →
  Rejected with a response distinguishable from both a validation failure and a guard rejection
  (Assumptions).
- What happens when two requests for the same application arrive concurrently? → Out of scope for
  this feature; see Assumptions.
- What happens when a client requests the overview or triggers ghosting with no applications in
  the system at all? → Succeeds with an empty result, not an error (covered above).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose a way, over HTTP, to submit a new application with the full
  job posting details from feature 002.
- **FR-002**: The system MUST expose a way, over HTTP, to schedule an interview round for an
  existing application.
- **FR-003**: The system MUST expose a way, over HTTP, to record an interview round's outcome.
- **FR-004**: The system MUST expose a way, over HTTP, to record a received offer.
- **FR-005**: The system MUST expose a way, over HTTP, to accept a received offer.
- **FR-006**: The system MUST expose a way, over HTTP, to decline a received offer.
- **FR-007**: The system MUST expose a way, over HTTP, to withdraw an application.
- **FR-008**: The system MUST expose a way, over HTTP, to retrieve the active pipeline overview
  (feature 001 FR-012–FR-014).
- **FR-009**: The system MUST expose a way, over HTTP, to trigger the ghosting check (feature 001
  FR-010/FR-011) on demand.
- **FR-010**: Every request that violates one of feature 001/002's existing guards (sequencing,
  offer-requires-pass, closed-application rejection) MUST be rejected with a response that
  identifies the rejection and its reason, distinguishable from success.
- **FR-011**: Every request with missing or malformed required input MUST be rejected as invalid,
  distinguishably from a guard rejection (Acceptance Scenario 4 / Edge Cases).
- **FR-012**: A request referencing an application ID that does not exist MUST be rejected
  distinguishably from both of the above (Edge Cases).
- **FR-013**: The system MUST NOT change any application's recorded state as a side effect of a
  rejected request (Acceptance Scenario 3).

### Key Entities

No new entities — this feature exposes feature 001/002's existing `Application`,
`ActivePipelineEntry`, and the eight existing commands/events over HTTP; it does not change what
is being tracked, only how it is reached.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An external client with no access to the process's internals can complete the full
  user story 1 walkthrough (submit → interview rounds → terminal outcome) using only HTTP
  requests.
- **SC-002**: 100% of requests that violate an existing guard are rejected without changing any
  application's state, matching feature 001/002's already-proven decider behavior exactly (no new
  guard logic is introduced or duplicated by this feature).
- **SC-003**: 100% of requests with invalid input are rejected before reaching guard logic,
  distinguishably from a guard rejection.
- **SC-004**: The active overview retrieved over HTTP always matches what the in-process
  projection would report for the same event history.
- **SC-005**: A client can retrieve the active overview or trigger the ghosting check when zero
  applications exist, in both cases receiving a successful, non-error response.

## Assumptions

- Single-user tool, consistent with features 001/002: no authentication or authorization is in
  scope for this feature — any client that can reach the HTTP layer is trusted, the same trust
  boundary the in-process API already has.
- Concurrent requests against the same application are out of scope for this feature — feature
  001/002's decider logic already relies on Emmett's optimistic concurrency at the event-store
  level; this feature does not add HTTP-specific concurrency handling beyond what that already
  provides.
- The ghosting check (User Story 3) is exposed as an on-demand trigger, not wired to any
  scheduler or cron — automating *when* it runs is out of scope for this feature.
- No pagination, filtering, or sorting options beyond the existing most-idle-first order are in
  scope for the active overview endpoint — it returns the same result feature 001's read model
  already produces.
- This feature does not include a frontend or any UI — it is the API surface a future frontend
  (or any HTTP client) would call, per the user's explicit request to land this before a
  frontend.
