import { DeciderSpecification, IllegalStateError } from "@event-driven-io/emmett";
import { describe, it } from "vitest";
import { evolve, initialState } from "../../domain/state.js";
import { decide } from "./decide.js";

const given = DeciderSpecification.for({ decide, evolve, initialState });

const now = new Date("2026-08-18T00:00:00.000Z");

const submitted = {
  type: "ApplicationSubmitted" as const,
  data: { company: "Acme", role: "Engineer" },
  metadata: { now: now.toISOString() },
};

const round1Scheduled = {
  type: "InterviewScheduled" as const,
  data: { round: 1, date: "2026-08-20" },
  metadata: { now: now.toISOString() },
};

const round1Passed = {
  type: "InterviewCompleted" as const,
  data: { round: 1, outcome: "Passed" as const },
  metadata: { now: now.toISOString() },
};

describe("ScheduleInterview", () => {
  it("schedules round 1 on a freshly submitted application", () => {
    given([submitted])
      .when({ type: "ScheduleInterview", data: { round: 1, date: "2026-08-20" }, metadata: { now } })
      .then({
        type: "InterviewScheduled",
        data: { round: 1, date: "2026-08-20" },
        metadata: { now: now.toISOString() },
      });
  });

  it("schedules round 2 once round 1's outcome is recorded", () => {
    given([submitted, round1Scheduled, round1Passed])
      .when({ type: "ScheduleInterview", data: { round: 2, date: "2026-08-27" }, metadata: { now } })
      .then({
        type: "InterviewScheduled",
        data: { round: 2, date: "2026-08-27" },
        metadata: { now: now.toISOString() },
      });
  });

  it("rejects round 2 before round 1's outcome is recorded (FR-004)", () => {
    given([submitted, round1Scheduled])
      .when({ type: "ScheduleInterview", data: { round: 2, date: "2026-08-27" }, metadata: { now } })
      .thenThrows(IllegalStateError);
  });

  it("rejects an out-of-sequence round number (FR-004)", () => {
    given([submitted])
      .when({ type: "ScheduleInterview", data: { round: 2, date: "2026-08-27" }, metadata: { now } })
      .thenThrows(IllegalStateError);
  });

  it("rejects scheduling on a closed application (FR-009)", () => {
    given([
      submitted,
      { type: "ApplicationWithdrawn" as const, data: {}, metadata: { now: now.toISOString() } },
    ])
      .when({ type: "ScheduleInterview", data: { round: 1, date: "2026-08-20" }, metadata: { now } })
      .thenThrows(IllegalStateError);
  });
});
