# Handoff notes for the next session

This repo is a learning project: build a small event-sourced job-application pipeline tracker to get real hands-on practice with [Emmett](https://event-driven.io/en/type_script_node_Js_event_sourcing/) (TypeScript/Node.js event sourcing). Full design brief is in `docs/BRIEF.md` — read that first, it's the `/speckit.specify` and `/speckit.plan` pre-work already done.

## Setup already done

- Empty git repo initialized here (`main` branch), remote will be https://github.com/Powerworks/JobApplicationTracker.
- `docs/BRIEF.md` copied in from the Obsidian vault (design already agreed — commands, events, guards, reactor).
- `specify init` was **not** completed yet — the flag is `--integration claude`, not `--ai claude`. Run:
  ```
  specify init --here --integration claude
  ```

## Why no Event Modeling board

Deliberately skipped — small, solo, well-understood domain, and the model was worked out directly in conversation rather than needing a discovery session. Going straight through Spec Kit instead.

## Before running `/speckit.constitution`

Don't copy an existing `.NET` constitution template from the vault — wrong stack. Instead, seed it with this in one line:

> Greenfield TypeScript/Node project using Emmett for event sourcing, Vitest for testing, Postgres as the event store once past the in-memory phase. Testing is non-negotiable — every command handler gets a given-when-then test via Emmett's `deciderSpecification` before it's considered done. Vertical slice architecture, granular: one slice per command (not per aggregate/layer), each with its own decider logic, test, and route — no shared catch-all files. Decide the architecture outright, no hedging for a nonexistent legacy codebase.

That's the pattern worth carrying over from prior Spec Kit projects (decisive greenfield choices, a Day-Zero bootstrap gate, testing treated as non-negotiable) — not a document to adapt, just the instinct, restated for this stack.

## Then run the chain

```
/speckit.constitution   (seeded as above)
/speckit.specify        (draw from docs/BRIEF.md, don't re-derive from scratch)
/speckit.plan
/speckit.tasks
/speckit.implement
```

## Emmett exercise plan (from the brief, restated short)

1. In-memory store first (`getInMemoryEventStore`) — fast iteration on the guards.
2. `deciderSpecification` given-when-then tests — this model has real branches (multi-round guard, offer-requires-pass guard, closed-state rejection), worth exercising properly.
3. Swap to Postgres once the logic's solid.
4. Optional: `@event-driven-io/emmett-expressjs` (or Fastify) for a thin HTTP layer.

## Once this file and BRIEF.md have been read and acted on

Delete this file — it's a one-time handoff note, not a permanent doc. `docs/BRIEF.md` is the one worth keeping.
