# Contract: Active Pipeline Query

The read-model slice (`src/read-models/active-pipeline/project.ts`) exposes one query, consumed by
tests now and by a future CLI/HTTP layer later.

## `getActivePipeline()`

- **Input**: none (queries across all application streams)
- **Output**: `ActivePipelineEntry[]`, sorted by `daysSinceLastActivity` descending (FR-013)
- **Contents**: one entry per application whose `status === 'Open'` — closed applications
  (`Accepted`/`Declined`/`Withdrawn`/`Ghosted`) are excluded (FR-014)
- **Entry shape**: see `data-model.md`'s `ActivePipelineEntry` — `applicationId`, `company`, `role`,
  `currentStage`, `daysSinceLastActivity`
