# Phase 1 Data Model: Richer Job Posting Details on Submission

Extends feature 001's `data-model.md`. Only the `Application` entity and the `ApplicationSubmitted`
event change; `InterviewRound`, `Offer`, and `ActivePipelineEntry` are unaffected.

## Entity: Application (decider state) — extended fields

| Field | Type | Notes |
|---|---|---|
| `location` | string | Required. Free text (e.g. "Remote", "London, UK") — no structured breakdown (spec Assumptions) |
| `salary` | `{ amount: number, currency: string } \| undefined` | Optional — "not disclosed" if absent (FR-002) |
| `employmentType` | `"Permanent" \| "Contract"` | Required (FR-003) |
| `bonus` | `{ amount: number, currency: string } \| undefined` | Optional — "not offered" if absent (FR-004) |
| `benefits` | `string[]` | Required field, but may be an empty array (FR-005) |

All other `Application` fields (`applicationId`, `company`, `role`, `status`, `rounds`, `offer`,
`lastActivityAt`) are unchanged from feature 001.

## Event: ApplicationSubmitted — extended data shape

```text
ApplicationSubmitted {
  company: string          # unchanged
  role: string              # unchanged
  location: string          # NEW
  salary?: { amount: number, currency: string }   # NEW, optional
  employmentType: "Permanent" | "Contract"          # NEW
  bonus?: { amount: number, currency: string }      # NEW, optional
  benefits: string[]        # NEW
}
```

`evolve()` for `ApplicationSubmitted` carries all five new fields from the event straight into the
initial `Open` state, exactly as it already does for `company`/`role` (feature 001's
`evolve` case for this event type).

## Command: SubmitApplication — extended data shape

Mirrors the event shape above exactly (feature 001's `SubmitApplication` already mirrors
`ApplicationSubmitted`'s data 1:1; this feature preserves that symmetry).
