# Phase 0 Research: Job Application Pipeline Tracking

No `[NEEDS CLARIFICATION]` markers remained in the Technical Context — the constitution
(`.specify/memory/constitution.md`) and `docs/BRIEF.md`/`docs/ADRs.md` had already settled the
technology and architecture questions before this feature entered planning. This document records
the resulting decisions and the alternatives considered, per the research task format.

## Decision: Emmett decider pattern over a CRUD/relational model

- **Decision**: Model `Application` as an Emmett decider — `decide(command, state) → event[]` plus
  `evolve(state, event) → state` — rather than a mutable row updated in place.
- **Rationale**: This is the explicit purpose of the project (ADR 1) and is required by constitution
  Principle I (NON-NEGOTIABLE). It also matches the domain: the guards ("can't schedule round *N+1*
  before round *N*'s outcome", "can't receive an offer without a preceding pass", "closed
  applications reject everything") are naturally expressed as decisions over folded state.
- **Alternatives considered**: Direct relational CRUD (rejected — defeats the project's purpose and
  violates Principle I); a generic state-machine library instead of Emmett specifically (rejected —
  the project's purpose is Emmett practice, not state machines in the abstract).

## Decision: In-memory event store for this feature, Postgres deferred

- **Decision**: Use Emmett's `getInMemoryEventStore` for all slices in this feature. Do not
  introduce Postgres yet.
- **Rationale**: Constitution's Technology Stack section and ADR 1 both specify in-memory first,
  Postgres "once that logic is solid." This feature is where the decider/guard logic gets written
  and tested for the first time — introducing Postgres now would add infrastructure risk before the
  logic it's meant to persist is proven.
- **Alternatives considered**: Postgres from the start (rejected — premature per the constitution);
  SQLite as a lighter first store (rejected — not part of the agreed stack, and Emmett's in-memory
  store already serves the same "fast iteration" purpose without any infra).

## Decision: Vitest + `deciderSpecification` for every command slice

- **Decision**: Every command slice's guard behavior is verified with Emmett's
  `deciderSpecification` given-when-then helper, run under Vitest.
- **Rationale**: Constitution Principle II (NON-NEGOTIABLE). This domain's practice value is its
  branching guards (spec Edge Cases); `deciderSpecification` is Emmett's purpose-built tool for
  exactly this kind of test.
- **Alternatives considered**: Hand-rolled given-when-then helpers (rejected — reinvents what
  Emmett already provides, and diverges from the framework being practiced); Jest instead of Vitest
  (rejected — constitution specifies Vitest).

## Decision: Granular per-command vertical slices, no shared handler files

- **Decision**: One folder per command (`src/slices/<command-name>/`), each with its own
  `decide.ts` and `decide.spec.ts`; the read model and reactor are each their own slice under
  `src/read-models/` and `src/reactors/`. A minimal `src/domain/` holds only the shared `Event`/
  `Command` type unions and the `Application` state fold (`evolve`) — no decision/guard logic.
- **Rationale**: Constitution Principle III and ADR 3, verbatim. The state fold (`evolve`) is
  necessarily shared across every command's decider (Emmett's decider signature requires a single
  fold function per aggregate to reconstruct state from history) — this is inherent to the decider
  pattern itself, not a business-logic catch-all, so it does not violate the "no shared catch-all
  files" rule, which targets shared *decision*/*handler*/*routing* logic.
- **Alternatives considered**: One file per aggregate containing all command handlers (rejected —
  directly the "shared handlers.ts" pattern Principle III prohibits); slices grouped by pipeline
  stage instead of by command (rejected — coarser than "granular," and stage boundaries are fuzzier
  than command boundaries in this domain).

## Decision: No HTTP/CLI interface in this feature

- **Decision**: This feature ships the decider slices, the read-model projection, and the reactor
  as directly-callable TypeScript modules (exercised by tests), with no HTTP or CLI layer.
- **Rationale**: Spec Assumptions explicitly state no dedicated UI/API is required for this feature.
  `emmett-expressjs`/Fastify remains optional future work per `docs/BRIEF.md`'s exercise plan step 4,
  not required for the event-sourcing practice this feature is about.
- **Alternatives considered**: Adding a thin Express/Fastify layer now (rejected — out of this
  feature's scope per the spec; would also pull in a dependency before it's needed, against
  Principle IV's YAGNI stance).
