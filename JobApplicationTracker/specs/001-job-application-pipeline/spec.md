# Feature Specification: Job Application Pipeline Tracking

**Feature Branch**: `001-job-application-pipeline`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "Track job applications through a multi-round interview pipeline to a terminal outcome (accepted, declined, withdrawn, or ghosted), with a read-only overview of active applications and automatic detection of applications that have gone silent." (derived from `docs/BRIEF.md`, the pre-agreed design for this project)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Track an application from submission to a terminal outcome (Priority: P1)

A job seeker submits a new application, then records what happens to it over time: interview rounds get scheduled, each round's outcome gets recorded, and eventually the application reaches a terminal outcome — an offer is received, accepted, or declined, or the seeker withdraws.

**Why this priority**: This is the core value of the tool — without it there is nothing to track. Every other capability builds on this pipeline existing and behaving correctly.

**Independent Test**: Can be fully tested by submitting one application, progressing it through one or more interview rounds, and driving it to a terminal outcome (e.g. accepting an offer) — delivers a complete, working record of one application's lifecycle on its own.

**Acceptance Scenarios**:

1. **Given** no prior record of an application, **When** the seeker submits an application for a company and role, **Then** the application exists in an open, trackable state.
2. **Given** an open application with no scheduled interviews, **When** the seeker schedules interview round 1, **Then** the application reflects that round as scheduled and awaiting an outcome.
3. **Given** an application with a scheduled interview round, **When** the seeker records that round's outcome as passed, **Then** the next interview round becomes schedulable.
4. **Given** an application whose most recent interview outcome was passed, **When** the seeker records a received offer, **Then** the application reflects an offer awaiting a decision.
5. **Given** an application with an offer awaiting a decision, **When** the seeker accepts the offer, **Then** the application reaches a closed, "accepted" state.
6. **Given** an open application at any stage, **When** the seeker withdraws it, **Then** the application reaches a closed, "withdrawn" state.

---

### User Story 2 - See which applications need attention (Priority: P2)

A job seeker looks at a single overview of every application still in progress, showing each one's current stage and how long it has been since anything happened on it, with the longest-idle applications shown first.

**Why this priority**: Tracking individual applications (User Story 1) has value on its own, but the practical payoff of tracking many applications is knowing, at a glance, which ones are stalling and need a follow-up. This depends on Story 1 existing but adds the "why bother tracking this at all" payoff.

**Independent Test**: Can be fully tested by creating several applications at different stages with different amounts of elapsed time since their last activity, then confirming the overview lists only the still-open ones, correctly ordered from most idle to least idle.

**Acceptance Scenarios**:

1. **Given** several open applications with varying time since their last recorded activity, **When** the seeker views the overview, **Then** the applications are listed most-idle-first.
2. **Given** an application that has reached a closed/terminal state, **When** the seeker views the overview, **Then** that application no longer appears in it.

---

### User Story 3 - Automatically flag applications that have gone silent (Priority: P3)

If an open application has had no activity for a defined period of silence, the system automatically marks it as "ghosted" — a terminal outcome — without the seeker having to notice and record it manually.

**Why this priority**: This is a convenience/completeness feature layered on top of Stories 1 and 2 — the pipeline and the overview are both fully usable without it, but it prevents stale applications from sitting in the overview indefinitely and requiring manual cleanup.

**Independent Test**: Can be fully tested by creating an open application, letting the configured silence period elapse with no further activity recorded on it, and confirming it is automatically transitioned to the closed "ghosted" state.

**Acceptance Scenarios**:

1. **Given** an open application with no activity for the full silence period, **When** that period elapses, **Then** the application is automatically marked "ghosted" and no longer appears as active.
2. **Given** an open application, **When** any new activity is recorded on it before the silence period elapses, **Then** its silence period resets and it is not marked "ghosted".
3. **Given** an application already in a closed state, **When** its silence period would otherwise have elapsed, **Then** it is not affected — ghosting only applies to open applications.

### Edge Cases

- What happens when the seeker tries to schedule interview round *N+1* before round *N*'s outcome has been recorded? → Rejected; the system must reject the action and leave the application unchanged.
- What happens when the seeker tries to record an offer when the most recent interview outcome was not "passed" (including when no interview has happened yet)? → Rejected.
- What happens when the seeker tries to take any action (schedule an interview, record an outcome, record an offer, accept/decline an offer, withdraw) on an application that is already closed (accepted, declined, withdrawn, or ghosted)? → Rejected; closed applications are immutable going forward.
- What happens when an interview round outcome is recorded as "rejected" rather than "passed"? → The application should reach a closed, rejected-style terminal outcome rather than allowing further interview rounds or an offer.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to submit a new application, recording at minimum the company and role.
- **FR-002**: Users MUST be able to schedule an interview round for an open application.
- **FR-003**: Users MUST be able to record the outcome (passed or rejected) of a scheduled interview round.
- **FR-004**: System MUST prevent scheduling interview round *N+1* until round *N*'s outcome has been recorded.
- **FR-005**: Users MUST be able to record a received offer for an application, but only when the most recently recorded interview outcome for that application was "passed".
- **FR-006**: Users MUST be able to accept a received offer, which closes the application in an "accepted" state.
- **FR-007**: Users MUST be able to decline a received offer, which closes the application in a "declined" state.
- **FR-008**: Users MUST be able to withdraw an open application at any stage, which closes it in a "withdrawn" state.
- **FR-009**: System MUST reject every action on an application that has already reached a closed state (accepted, declined, withdrawn, or ghosted).
- **FR-010**: System MUST automatically close an open application in a "ghosted" state once it has had no recorded activity for the configured silence period.
- **FR-011**: Any new recorded activity on an open application MUST reset that application's silence period.
- **FR-012**: Users MUST be able to view an overview of all currently open (non-closed) applications, each showing its current stage and time elapsed since its last recorded activity.
- **FR-013**: The overview MUST order applications by time elapsed since last activity, most-idle first.
- **FR-014**: The overview MUST exclude applications that have reached a closed state.

### Key Entities

- **Application**: A single job application tracked through its lifecycle. Key attributes: company, role, current stage, current state (open or closed-with-a-terminal-outcome), time of last recorded activity.
- **Interview Round**: A single round of interviews within an application's pipeline. Key attributes: round number, scheduled date, outcome (pending, passed, or rejected). Belongs to exactly one application; rounds are sequential.
- **Offer**: A job offer associated with an application, only valid once the most recent interview round passed. Key attributes: amount, decision deadline, decision (pending, accepted, declined).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can go from submitting a new application to it appearing in the active overview in under 30 seconds.
- **SC-002**: 100% of out-of-sequence or invalid actions (scheduling round *N+1* early, recording an offer without a preceding "passed" outcome, acting on a closed application) are rejected rather than silently accepted or corrupting the application's recorded state.
- **SC-003**: The active overview always reflects each open application's true current stage — never stale by more than the time it takes to record the most recent event.
- **SC-004**: 100% of open applications that exceed the configured silence period are automatically transitioned to "ghosted" without any manual action.
- **SC-005**: A user reviewing the active overview can identify which application has gone the longest without activity without cross-referencing any other source.

## Assumptions

- Single-user tool: this is a personal tracker for one job seeker's own applications, not a multi-tenant or multi-user system. No authentication, authorization, or per-user data isolation is in scope.
- The silence period used for automatic ghosting defaults to 14 days of no recorded activity on an open application; this is a reasonable, adjustable default rather than a value with a single correct answer.
- Interaction with the system (however applications are submitted and events recorded) does not require a dedicated graphical user interface for this feature — a programmatic or command-line interface satisfies all stories above.
- Each interview round outcome is either "passed" or "rejected"; a "rejected" outcome ends the pipeline for that application (no further rounds, no offer) even though the application's closed/terminal state itself is out of scope for this spec to name precisely (see `docs/BRIEF.md` for the full terminal-state model).
- Historical/closed applications remain queryable in principle (e.g. for later review) but are explicitly out of scope for the active overview in User Story 2.
