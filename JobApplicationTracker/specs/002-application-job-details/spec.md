# Feature Specification: Richer Job Posting Details on Submission

**Feature Branch**: `002-application-job-details`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "When a user submits a job application, capture the job posting details that matter for comparing opportunities: location, salary, whether the role is contract or permanent, bonus, and benefits included — not just company and role." (extends feature 001's `SubmitApplication`)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Record full job posting details at submission (Priority: P1)

A job seeker submitting a new application records not just the company and role, but the details
of the posting itself — where the job is, what it pays, whether it's a contract or permanent
position, whether a bonus is offered, and what benefits come with it — so that later, comparing
open applications, they have the information that actually matters for deciding between offers.

**Why this priority**: This is the only story in this feature — it's a direct extension of
feature 001's `SubmitApplication`, not a new capability with its own priority tiers. Every field
below is recorded at the same moment (submission), so there is no meaningful way to split this
into independently valuable increments.

**Independent Test**: Submit an application supplying all of the new fields, then confirm the
application's record reflects them exactly — independently testable the same way feature 001's
`SubmitApplication` was tested, by asserting on the resulting event.

**Acceptance Scenarios**:

1. **Given** no prior record of an application, **When** the seeker submits an application with
   company, role, location, salary, employment type, bonus, and benefits, **Then** the application
   exists with all of those details recorded.
2. **Given** a submitted application, **When** the seeker views that application's details (via
   the active overview or any future detail view), **Then** location, salary, employment type,
   bonus, and benefits are all visible alongside company and role.
3. **Given** an application with no bonus offered, **When** it is submitted with the bonus field
   omitted, **Then** the application is recorded successfully with no bonus present (bonus is
   optional, not every posting offers one).
4. **Given** an application with no benefits listed, **When** it is submitted with an empty
   benefits list, **Then** the application is recorded successfully with an empty benefits list
   (not every posting advertises benefits).

### Edge Cases

- What happens when salary is not yet known at submission time (e.g. "salary not disclosed")? →
  Out of scope for this feature; see Assumptions — salary is optional at the type level for this
  reason.
- What happens when the employment type is something other than contract or permanent (e.g.
  internship, temp-to-perm)? → Out of scope for this feature; see Assumptions — only the two
  values already implied by the request are supported.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to record a location when submitting an application.
- **FR-002**: Users MUST be able to record a salary (an amount and its currency) when submitting
  an application, and MAY omit it if not yet known.
- **FR-003**: Users MUST be able to record whether the role is "Permanent" or "Contract" when
  submitting an application.
- **FR-004**: Users MUST be able to record a bonus (an amount and its currency) when submitting an
  application, and MAY omit it if none is offered.
- **FR-005**: Users MUST be able to record a list of benefits included with the role when
  submitting an application, which MAY be empty if none are advertised.
- **FR-006**: The system MUST retain company and role exactly as feature 001 already requires —
  this feature only adds fields, it does not remove or change existing ones.
- **FR-007**: The active-pipeline overview (feature 001, User Story 2) MUST NOT be required to
  display every new field — only company, role, stage, and idle time remain mandatory there (per
  feature 001's FR-012); the new fields are recorded and retrievable but not mandated in that
  specific view.

### Key Entities

- **Application** (extended): in addition to feature 001's `company` and `role`, now also
  captures `location` (text), `salary` (optional amount + currency), `employmentType`
  ("Permanent" or "Contract"), `bonus` (optional amount + currency), and `benefits` (a list of
  text descriptions, possibly empty).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of newly submitted applications retain every job-posting detail supplied at
  submission (location, salary when given, employment type, bonus when given, benefits) without
  loss or corruption.
- **SC-002**: A user can submit an application with only the previously-required fields (company,
  role, location, employment type) and no salary, bonus, or benefits, without the submission being
  rejected — the new optional fields never block submission.
- **SC-003**: A user reviewing a submitted application's full details can distinguish "no bonus
  offered" from "bonus not yet recorded" is explicitly out of scope — omission is treated as "not
  offered/not disclosed" for this feature (see Assumptions).

## Assumptions

- Employment type is exactly one of "Permanent" or "Contract" for this feature — other
  arrangements (internship, temp-to-perm, freelance) are out of scope and can be added later if
  needed.
- Salary and bonus are each a single amount plus a currency (not a min/max range) — sufficient
  precision for a personal tracker comparing opportunities.
- Benefits are recorded as a free-text list of short descriptions (e.g. "Health insurance", "401k
  match") rather than a predefined, constrained set of benefit categories.
- Omitting salary or bonus at submission means "not disclosed / not offered", not "zero" — there
  is no attempt to distinguish those two cases further in this feature.
- Location is a single free-text field (e.g. "Remote", "London, UK") — no structured
  city/region/country breakdown or geocoding.
- These fields are captured only at submission time in this feature; editing them after
  submission is out of scope (feature 001 has no update-style command for `Application`, and this
  feature does not add one).
