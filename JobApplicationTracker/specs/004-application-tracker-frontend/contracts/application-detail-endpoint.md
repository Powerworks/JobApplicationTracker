# Contract: GET /applications/:applicationId (new)

Extends feature 003's `contracts/http-api.md` with one new endpoint, added by this feature to
close the gap described in `research.md`.

## `GET /applications/:applicationId`

- **Input**: none beyond the path param.
- **Success (200)**: the full `Application` state (feature 001 `data-model.md`'s decider state,
  as JSON) — `applicationId`, `company`, `role`, `location`, `salary`, `employmentType`, `bonus`,
  `benefits`, `status`, `rounds`, `offer`, `lastActivityAt`. Returned for both open and closed
  applications (unlike `GET /applications/active`, which excludes closed ones).
- **404**: no application with that ID exists — same `streamExists`-based check feature 003's
  other routes already use (`src/http/require-application.js` — reused, not duplicated).

```text
Request:  GET /applications/abc-123

200: {
  "applicationId": "abc-123",
  "company": "Acme", "role": "Engineer", "location": "Remote",
  "employmentType": "Permanent", "benefits": [],
  "status": "Open",
  "rounds": [{ "round": 1, "date": "2026-08-20", "outcome": "Passed" }],
  "offer": null,
  "lastActivityAt": "2026-08-18T00:00:00.000Z"
}

404: { "error": "ApplicationNotFound", "message": "No application with id abc-123" }
```
