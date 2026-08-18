# Contract: HTTP API

Concrete endpoint contract, superseding spec.md's tech-agnostic FR-001–FR-009 with actual
verbs/paths (spec.md deliberately stayed implementation-free; this is the `/speckit-plan`-level
concretization). Request/response bodies are detailed in `data-model.md`.

## Endpoints

| Method | Path | Command/Query | Slice |
|---|---|---|---|
| `POST` | `/applications` | `SubmitApplication` | `src/slices/submit-application/route.ts` |
| `POST` | `/applications/:applicationId/interviews` | `ScheduleInterview` | `src/slices/schedule-interview/route.ts` |
| `POST` | `/applications/:applicationId/interviews/outcome` | `RecordInterviewOutcome` | `src/slices/record-interview-outcome/route.ts` |
| `POST` | `/applications/:applicationId/offer` | `ReceiveOffer` | `src/slices/receive-offer/route.ts` |
| `POST` | `/applications/:applicationId/offer/accept` | `AcceptOffer` | `src/slices/accept-offer/route.ts` |
| `POST` | `/applications/:applicationId/offer/decline` | `DeclineOffer` | `src/slices/decline-offer/route.ts` |
| `POST` | `/applications/:applicationId/withdraw` | `WithdrawApplication` | `src/slices/withdraw-application/route.ts` |
| `GET` | `/applications/active` | `getActivePipeline()` | `src/read-models/active-pipeline/route.ts` |
| `POST` | `/ghosting/check` | `ghostSilentApplications()` | `src/reactors/ghosting/route.ts` |

## Per-endpoint preconditions and rejections

Every `POST /applications/:applicationId/...` endpoint (all except the first) shares this shape:

1. Fastify validates the request body against its JSON Schema → **400** on failure, before
   anything else runs.
2. The route reads current state via `aggregateStream` → **404** if `state.status === "NotSubmitted"`.
3. The route invokes `DeciderCommandHandler` (which calls the slice's unchanged `decide()`) →
   **409** if it throws `IllegalStateError` (the exact guard and message come from feature
   001/002's `contracts/commands.md`, unchanged by this feature).
4. Otherwise → success response per `data-model.md`.

`GET /applications/active` and `POST /ghosting/check` have no per-application precondition — they
operate over all streams and always succeed (spec.md Acceptance Scenarios, User Stories 2 & 3).

## Example: `POST /applications/:applicationId/interviews` (ScheduleInterview)

```text
Request:  POST /applications/abc-123/interviews
          { "round": 1, "date": "2026-08-20" }

400: { "error": "InvalidRequest", "message": "\"round\" is required" }
404: { "error": "ApplicationNotFound", "message": "No application with id abc-123" }
409: { "error": "RoundOutOfSequence", "message": "Round 2 is out of sequence; expected round 1" }
200: {}
```

Every other command endpoint follows the same four-outcome shape with its own body/guard, per
`data-model.md` and feature 001/002's `contracts/commands.md`.
