# Phase 1 Data Model: Job Application Pipeline Tracking

Derived from spec.md's Key Entities and `docs/BRIEF.md`'s model. This is event-sourced: the
`Application` row below is the *folded state* (`evolve` output), not a stored table row — it exists
only in memory, reconstructed from the event stream for decision-making and projected into the
active-pipeline read model for querying.

## Entity: Application (decider state)

One instance per submitted application, identified by an application ID (stream ID).

| Field | Type | Notes |
|---|---|---|
| `applicationId` | string (stream ID) | Assigned on submission |
| `company` | string | From FR-001 |
| `role` | string | From FR-001 |
| `status` | `Open \| Accepted \| Declined \| Withdrawn \| Ghosted` | `Accepted`/`Declined`/`Withdrawn`/`Ghosted` are closed/terminal (FR-009) |
| `rounds` | `InterviewRound[]` | Ordered by round number; append-only via `evolve` |
| `offer` | `Offer \| undefined` | Present once `OfferReceived`; undefined before then |
| `lastActivityAt` | timestamp | Set by `evolve` on every event; drives FR-011 (silence-clock reset) and the read model's idle time |

### State transitions (status)

```text
Open --(OfferAccepted)-------------------> Accepted   [closed]
Open --(OfferDeclined)-------------------> Declined   [closed]
Open --(ApplicationWithdrawn)------------> Withdrawn  [closed]
Open --(ApplicationGhosted, via reactor)-> Ghosted    [closed]
```

No transitions are defined out of any closed status — FR-009 requires every command against a
closed application to be rejected, so `decide` must check `status !== 'Open'` as a universal guard
before any command-specific logic runs.

### Invariants enforced by `decide` (from spec Functional Requirements)

- **FR-004**: `ScheduleInterview` for round *N* requires `rounds` to contain exactly *N-1* rounds,
  and round *N-1* (if *N* > 1) must have a recorded (non-pending) outcome.
- **FR-005**: `ReceiveOffer` requires `rounds` non-empty and the last round's `outcome === 'Passed'`.
- **FR-009**: Every command requires `status === 'Open'`.
- **FR-011**: Any event applied via `evolve` sets `lastActivityAt` to that event's timestamp.

## Entity: InterviewRound (nested within Application state)

| Field | Type | Notes |
|---|---|---|
| `round` | number | 1-indexed, sequential |
| `date` | date | From `InterviewScheduled` |
| `outcome` | `Pending \| Passed \| Rejected` | `Pending` until `InterviewCompleted` recorded |

A `Rejected` outcome does not itself close the application (per spec Edge Cases, a rejected round
ends further pipeline progress but the closing action is a separate explicit command — e.g. the
seeker withdraws — consistent with `docs/BRIEF.md`'s command set having no automatic
reject-to-closed transition). `decide` for `ScheduleInterview`/`ReceiveOffer` naturally blocks
further progress once the latest round is `Rejected`, since neither guard above is satisfiable.

## Entity: Offer (nested within Application state)

| Field | Type | Notes |
|---|---|---|
| `amount` | number | From `OfferReceived` |
| `deadline` | date | From `OfferReceived` |
| `decision` | `Pending \| Accepted \| Declined` | Set by `AcceptOffer`/`DeclineOffer` |

## Read Model: ActivePipelineEntry (active-pipeline projection)

One row per **open** application (FR-014 excludes closed applications), projected from the same
event stream(s).

| Field | Type | Notes |
|---|---|---|
| `applicationId` | string | |
| `company` | string | |
| `role` | string | |
| `currentStage` | string | Human-readable derived stage, e.g. "Awaiting round 2 outcome", "Offer pending decision" |
| `daysSinceLastActivity` | number | `now - lastActivityAt`, recomputed at query time |

Sort order: `daysSinceLastActivity` descending (FR-013, most-idle-first).

## Events (reference — types only, defined in `src/domain/events.ts`)

`ApplicationSubmitted { company, role }`, `InterviewScheduled { round, date }`,
`InterviewCompleted { round, outcome: Passed | Rejected }`, `OfferReceived { amount, deadline }`,
`OfferAccepted`, `OfferDeclined`, `ApplicationWithdrawn`, `ApplicationGhosted` — as agreed in
`docs/BRIEF.md`.
