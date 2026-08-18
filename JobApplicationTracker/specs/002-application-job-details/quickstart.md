# Quickstart: Richer Job Posting Details on Submission

## Prerequisites

Same as feature 001 — `npm install`, then `npm test`.

## Scenario walkthrough

Maps to spec.md's acceptance scenarios.

1. `SubmitApplication` with every field populated (company, role, location, salary, employmentType,
   bonus, benefits) → expect `ApplicationSubmitted` carrying all of them unchanged, and the
   resulting `evolve()`'d state exposing all of them (Acceptance Scenario 1 & 2).
2. `SubmitApplication` with `salary` omitted → expect success, resulting state has
   `salary: undefined` (Acceptance Scenario 3).
3. `SubmitApplication` with `benefits: []` → expect success, resulting state has
   `benefits: []` (Acceptance Scenario 4).
4. Re-run every existing feature 001 `submit-application` test case (now updated to also pass the
   new required fields) to confirm no regression in the base submission flow.

## Expected outcome

All scenarios pass as Vitest suites (`npm test`), satisfying SC-001 and SC-002 without any
UI — this feature has no UI in scope (same as feature 001).
