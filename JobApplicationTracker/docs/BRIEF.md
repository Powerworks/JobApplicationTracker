Planned learning project — a small event-sourced job-application pipeline tracker, built to get real hands-on practice with **[Emmett](https://event-driven.io/en/type_script_node_Js_event_sourcing/)** (Oskar Dudycz's TypeScript/Node.js event sourcing library), the same "build the small thing to compare frameworks hands-on" instinct behind [[Expense Tracker]]'s Cratis-vs-Marten comparison — this is now a third Postgres-backed event store tried hands-on (Marten, Cratis/Chronicle, Emmett).

## Why this domain, not Emmett's own tutorials

Emmett's docs use Shopping Cart and Guest Stay Accounting as the canonical worked examples — building either would mostly be typing along rather than practicing. A job-application pipeline is a different shape: no checkout total or single toggle, instead a **multi-round pipeline with several branching terminal states** — genuinely different guard logic to write from scratch. It's also personally useful rather than a throwaway toy domain.

## Why no Event Modeling board this time

Deliberately skipped. Event Modeling earns its cost when there's real ambiguity to discover or several stakeholders to align — see [[Underwriting]] and [[Expense Tracker]], both of which use it for exactly that reason. This is a small, solo, well-understood domain, and the design below was already worked out directly in conversation rather than needing a dedicated discovery session. Going straight to [[about Spec-Driven Development (Spec Kit)|Spec Kit]]'s `/speckit.specify → /speckit.plan → /speckit.tasks → /speckit.implement` chain instead — the design below is effectively the pre-work `/speckit.specify` and `/speckit.plan` would formalize.

## The model

**Commands**: `SubmitApplication`, `ScheduleInterview`, `RecordInterviewOutcome`, `ReceiveOffer`, `AcceptOffer`, `DeclineOffer`, `WithdrawApplication`, `MarkGhosted`

**Events**: `ApplicationSubmitted { company, role }`, `InterviewScheduled { round, date }`, `InterviewCompleted { round, outcome: Passed|Rejected }`, `OfferReceived { amount, deadline }`, `OfferAccepted`, `OfferDeclined`, `ApplicationWithdrawn`, `ApplicationGhosted`

**Guards** (the actual practice value — several branches, not one toggle):
- Can't schedule interview round *n+1* before round *n* has a recorded outcome.
- Can't `ReceiveOffer` unless the most recent interview outcome was `Passed`.
- Once `Accepted` / `Declined` / `Withdrawn` / `Ghosted`, the aggregate is closed — every other command rejects.

**Read model**: `active pipeline` view — one row per application, current stage, days-since-last-event, sorted so stale ones surface first.

**Reactor**: on any event, reset a rolling "silence clock" for that application; if no new event lands within N days and the application isn't closed, emit `ApplicationGhosted`. Staleness relative to last activity, not a fixed due date — a different reactor pattern from the lending-tracker idea considered and dropped in favor of this one, worth keeping both shapes in mind for future practice apps (fixed-deadline reminder vs. rolling-silence detection).

## Emmett-specific exercise plan

1. **In-memory store first** (`getInMemoryEventStore`) — fast iteration on the guards above with no infra.
2. **`deciderSpecification` given-when-then tests** — this model has enough branches (multi-round guard, offer-requires-pass guard, closed-state rejection) to actually exercise Emmett's testing story, unlike a single-toggle domain.
3. **Swap to Postgres** once the logic's solid — the interesting comparison point against Marten and Cratis/Chronicle, both already used elsewhere in the vault.
4. **Optional**: `@event-driven-io/emmett-expressjs` (or Fastify) for a thin HTTP layer to `curl` against — not required for the event-sourcing practice itself.

## Spec Kit plan

Run `/speckit.constitution` first for TS/Node-specific non-negotiables (testing standard — likely Vitest given `deciderSpecification`'s given-when-then shape, no ORM/read-model framework beyond Emmett's own projections) — a genuinely different constitution from [[Spec Kit Constitution Template (Greenfield)|the .NET greenfield template]] already in the vault, worth writing as its own artifact rather than reusing that one. Then `/speckit.specify` and `/speckit.plan` from the model above (most of the actual thinking is already done, so these phases should be fast), `/speckit.tasks`, `/speckit.implement`.

## Status

Idea stage, not started — design agreed 2026-08-18. Next step: `specify init` in a fresh repo, `/speckit.constitution`.

## Related

[[about Spec-Driven Development (Spec Kit)|Spec Kit]] — the phased artifact chain this uses instead of an Event Modeling board; [[Expense Tracker]] and [[Underwriting]] — the sibling event-sourcing projects that *do* use Event Modeling, and the Postgres-event-store comparison this extends; [[about Cratis|Cratis]] — the .NET event store already compared against Marten.
