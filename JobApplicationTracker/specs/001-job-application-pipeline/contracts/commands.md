# Contracts: Commands

Each command is the public contract of its slice (`src/slices/<slice-name>/decide.ts`) — the
interface any future caller (tests now, a CLI or HTTP layer later) invokes. `decide(command, state)`
either returns the event(s) to append, or rejects with a reason; it never throws for expected
business-rule violations.

## SubmitApplication

- **Input**: `{ company: string, role: string }`
- **Precondition**: None (creates a new stream).
- **On success**: `ApplicationSubmitted { company, role }`
- **Rejections**: none defined at this layer (empty/invalid strings are a UI-level concern, out of
  scope for this feature per spec Assumptions).

## ScheduleInterview

- **Input**: `{ round: number, date: Date }`
- **Preconditions**:
  - `state.status === 'Open'` (FR-009)
  - `round === state.rounds.length + 1` (FR-004 — rounds are strictly sequential)
  - if `round > 1`, the prior round's outcome is not `Pending` (FR-004)
- **On success**: `InterviewScheduled { round, date }`
- **Rejections**: `ApplicationClosed`, `RoundOutOfSequence`, `PriorRoundOutcomePending`

## RecordInterviewOutcome

- **Input**: `{ round: number, outcome: 'Passed' | 'Rejected' }`
- **Preconditions**:
  - `state.status === 'Open'` (FR-009)
  - `round` matches an existing scheduled round whose outcome is currently `Pending`
- **On success**: `InterviewCompleted { round, outcome }`
- **Rejections**: `ApplicationClosed`, `NoMatchingPendingRound`

## ReceiveOffer

- **Input**: `{ amount: number, deadline: Date }`
- **Preconditions**:
  - `state.status === 'Open'` (FR-009)
  - `state.rounds` is non-empty and the last round's `outcome === 'Passed'` (FR-005)
- **On success**: `OfferReceived { amount, deadline }`
- **Rejections**: `ApplicationClosed`, `NoPassingInterview`

## AcceptOffer

- **Input**: `{}`
- **Preconditions**:
  - `state.status === 'Open'` (FR-009)
  - `state.offer` is present and its `decision === 'Pending'`
- **On success**: `OfferAccepted` — application state becomes closed (`Accepted`) (FR-006)
- **Rejections**: `ApplicationClosed`, `NoPendingOffer`

## DeclineOffer

- **Input**: `{}`
- **Preconditions**: same as `AcceptOffer`
- **On success**: `OfferDeclined` — application state becomes closed (`Declined`) (FR-007)
- **Rejections**: `ApplicationClosed`, `NoPendingOffer`

## WithdrawApplication

- **Input**: `{}`
- **Preconditions**: `state.status === 'Open'` (FR-009)
- **On success**: `ApplicationWithdrawn` — application state becomes closed (`Withdrawn`) (FR-008)
- **Rejections**: `ApplicationClosed`

## (Reactor-emitted, not a directly invoked command) — ApplicationGhosted

Not called by a user; emitted by the ghosting reactor (`src/reactors/ghosting/reactor.ts`) when an
`Open` application's `lastActivityAt` exceeds the configured silence period (14 days, per spec
Assumptions). See `data-model.md` and spec User Story 3 / FR-010, FR-011.
