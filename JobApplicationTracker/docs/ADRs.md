# Architecture Decision Records

## ADR 1: Event sourcing with Emmett, not a CRUD/relational model

**Status**: Accepted — 2026-08-18

**Context**: This is a learning project whose explicit purpose is hands-on practice with [Emmett](https://event-driven.io/en/type_script_node_Js_event_sourcing/) (Oskar Dudycz's TypeScript/Node.js event sourcing library), continuing a series of small event-sourcing practice apps already built against Marten and Cratis/Chronicle. A job-application pipeline was chosen specifically because it has a multi-round pipeline with several branching terminal states — guard logic worth writing from scratch, unlike Emmett's own Shopping Cart / Guest Stay Accounting tutorial examples.

**Decision**: Model the domain as a decider (commands → events → state) using Emmett, starting on `getInMemoryEventStore` and later swapping to Postgres as the event store. Every command handler gets a given-when-then test via Emmett's `deciderSpecification` before it's considered done.

**Consequences**: State is derived by folding events, not stored directly — reads require a projection (the `active pipeline` read model) rather than a simple table query. This is the intended practice, not overhead to minimize. Testing via `deciderSpecification` is non-negotiable, per the seeded Spec Kit constitution.

**Update (2026-08-19)**: The deferred "later swap to Postgres" half of this decision is now fulfilled — feature 005 (`specs/005-postgres-event-store/`) swapped `src/store/event-store.ts` to `@event-driven-io/emmett-postgresql`, verified with zero regressions across the full existing test suite plus a real server-restart durability check. See that feature's ADR-equivalent decisions in its own `research.md` for the details (store choice, migration strategy, the persisted applications-index replacement for the old in-memory registry, and the testcontainer-based test strategy).

---

## ADR 2: No Event Modeling board

**Status**: Accepted — 2026-08-18

**Context**: Sibling projects (Expense Tracker, Underwriting) use an Event Modeling board to discover ambiguity and align multiple stakeholders before building. This project is small, solo, and the domain (job application pipeline: submit, interview rounds, offer, terminal states) is already well understood — the model (commands, events, guards, read model, reactor) was worked out directly in conversation rather than needing a dedicated discovery session.

Also evaluated [eventmodelers.ai](https://app.eventmodelers.ai) (`@eventmodelers/cli`) as a route to vertical-slice code generation. Its codegen pipeline (`init --stack <name>`, then `run`) implements slices that have been modeled and marked "ready" on its visual board — there is no documented way to feed it a model without using the board. Since we're deliberately skipping the board, this tool doesn't fit.

**Decision**: Skip Event Modeling entirely for this project. Use [Spec Kit](https://github.com/github/spec-kit)'s `/speckit.constitution → /speckit.specify → /speckit.plan → /speckit.tasks → /speckit.implement` chain instead, treating the design already captured in `BRIEF.md` as the pre-work `/speckit.specify` and `/speckit.plan` would otherwise formalize.

**Consequences**: No visual board artifact exists or will exist for this project — `BRIEF.md` and this ADR file are the design record instead. No `eventmodelers` CLI or codegen is used anywhere in the toolchain. If the domain later turns out to have more ambiguity than expected, this decision should be revisited rather than pushed through.

---

## ADR 3: Granular vertical slice architecture, one slice per command

**Status**: Accepted — 2026-08-18

**Context**: Having ruled out board-driven code generation (ADR 2), the codebase still needs to end up organized as vertical slices rather than traditional technical layers (controllers/services/repositories), and the slices should be granular — small and independently readable — rather than one broad slice per aggregate.

**Decision**: Structure the codebase with one slice per command: `SubmitApplication`, `ScheduleInterview`, `RecordInterviewOutcome`, `ReceiveOffer`, `AcceptOffer`, `DeclineOffer`, `WithdrawApplication`, `MarkGhosted`. Each command's folder contains its own decider logic, its own `deciderSpecification` given-when-then test, and (once past the in-memory phase) its own route if `emmett-expressjs`/Fastify is added. The `active pipeline` read model and the ghosting reactor are each their own slice too, not bundled into any command slice. No shared catch-all files (`commands.ts`, `handlers.ts`).

**Consequences**: More folders/files than a layered or per-aggregate structure would produce, by design — the goal is that each slice can be read, tested, and reasoned about independently. `/speckit.constitution` and `/speckit.plan` should encode this so Spec Kit's generated tasks land one-slice-per-task rather than layer-by-layer.
