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

describe("RecordInterviewOutcome", () => {
  it("records a Passed outcome for a scheduled round", () => {
    given([submitted, round1Scheduled])
      .when({
        type: "RecordInterviewOutcome",
        data: { round: 1, outcome: "Passed" },
        metadata: { now },
      })
      .then({
        type: "InterviewCompleted",
        data: { round: 1, outcome: "Passed" },
        metadata: { now: now.toISOString() },
      });
  });

  it("records a Rejected outcome for a scheduled round", () => {
    given([submitted, round1Scheduled])
      .when({
        type: "RecordInterviewOutcome",
        data: { round: 1, outcome: "Rejected" },
        metadata: { now },
      })
      .then({
        type: "InterviewCompleted",
        data: { round: 1, outcome: "Rejected" },
        metadata: { now: now.toISOString() },
      });
  });

  it("rejects when there is no matching pending round", () => {
    given([submitted])
      .when({
        type: "RecordInterviewOutcome",
        data: { round: 1, outcome: "Passed" },
        metadata: { now },
      })
      .thenThrows(IllegalStateError);
  });

  it("rejects recording an outcome on a closed application (FR-009)", () => {
    given([
      submitted,
      round1Scheduled,
      { type: "ApplicationWithdrawn" as const, data: {}, metadata: { now: now.toISOString() } },
    ])
      .when({
        type: "RecordInterviewOutcome",
        data: { round: 1, outcome: "Passed" },
        metadata: { now },
      })
      .thenThrows(IllegalStateError);
  });
});
