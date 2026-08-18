# Phase 0 Research: Richer Job Posting Details on Submission

No `[NEEDS CLARIFICATION]` markers remained — the three open questions for this feature were
resolved directly with the user before specification. Recorded here per the research task format.

## Decision: Extend `SubmitApplication` in place, not a new `UpdateApplicationDetails` command

- **Decision**: Add the five new fields to the existing `SubmitApplication` command/event/state,
  rather than introducing a second command to record them after the fact.
- **Rationale**: User-confirmed. All of this data is known at the moment a job posting is found
  and applied to — there's no real-world workflow where company/role are known before location,
  salary, or employment type. A separate command would add a slice and a two-step submission flow
  for no corresponding user value.
- **Alternatives considered**: A new `UpdateApplicationDetails` command/slice (rejected per above);
  making `SubmitApplication` accept a nested `details` object with its own event (rejected —
  unnecessary indirection for fields that belong directly on submission).

## Decision: Salary and bonus as a single amount + currency, not a range

- **Decision**: `{ amount: number, currency: string }` for both `salary` and `bonus`, each
  optional.
- **Rationale**: User-confirmed. Matches the shape already used for `Offer.amount` in feature 001's
  data model (data-model.md) — consistent with the existing domain rather than introducing a new
  shape. Sufficient precision for a personal comparison tool.
- **Alternatives considered**: Min/max range (rejected by user — more fields for a personal
  tracker than the value justifies).

## Decision: Benefits as a free-text string list

- **Decision**: `benefits: string[]`, possibly empty.
- **Rationale**: User-confirmed. Avoids prematurely designing a fixed benefits taxonomy for a
  single-user learning project — YAGNI (constitution Principle IV).
- **Alternatives considered**: Boolean `benefitsIncluded` flag only (rejected by user — loses
  detail on what's actually offered, which is the point of tracking it).

## Decision: Employment type as a closed `"Permanent" | "Contract"` union

- **Decision**: `employmentType: "Permanent" | "Contract"`, required (not optional).
- **Rationale**: Directly matches the two values named in the user's original request ("if its a
  contract or perm"). No evidence of a need for more categories yet — extending a union later is a
  small change if it turns out to be needed (YAGNI, Principle IV), versus speculatively building a
  richer taxonomy now.
- **Alternatives considered**: An open string field (rejected — loses the guarantee that this
  field is always one of exactly two meaningful values, harder to build UI/filtering against
  later).
