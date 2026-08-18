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

const round1Rejected = {
  type: "InterviewCompleted" as const,
  data: { round: 1, outcome: "Rejected" as const },
  metadata: { now: now.toISOString() },
};

describe("ReceiveOffer", () => {
  it("records an offer when the latest interview outcome was Passed (FR-005)", () => {
    given([submitted, round1Scheduled, round1Passed])
      .when({
        type: "ReceiveOffer",
        data: { amount: 150000, deadline: "2026-09-01" },
        metadata: { now },
      })
      .then({
        type: "OfferReceived",
        data: { amount: 150000, deadline: "2026-09-01" },
        metadata: { now: now.toISOString() },
      });
  });

  it("rejects when no interview has occurred yet (FR-005)", () => {
    given([submitted])
      .when({
        type: "ReceiveOffer",
        data: { amount: 150000, deadline: "2026-09-01" },
        metadata: { now },
      })
      .thenThrows(IllegalStateError);
  });

  it("rejects when the latest interview outcome was Rejected (FR-005)", () => {
    given([submitted, round1Scheduled, round1Rejected])
      .when({
        type: "ReceiveOffer",
        data: { amount: 150000, deadline: "2026-09-01" },
        metadata: { now },
      })
      .thenThrows(IllegalStateError);
  });

  it("rejects receiving an offer on a closed application (FR-009)", () => {
    given([
      submitted,
      round1Scheduled,
      round1Passed,
      { type: "ApplicationWithdrawn" as const, data: {}, metadata: { now: now.toISOString() } },
    ])
      .when({
        type: "ReceiveOffer",
        data: { amount: 150000, deadline: "2026-09-01" },
        metadata: { now },
      })
      .thenThrows(IllegalStateError);
  });
});
