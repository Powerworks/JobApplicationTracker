import { DeciderSpecification, IllegalStateError } from "@event-driven-io/emmett";
import { describe, it } from "vitest";
import { evolve, initialState } from "../../domain/state.js";
import { decide } from "./decide.js";

const given = DeciderSpecification.for({ decide, evolve, initialState });

const now = new Date("2026-08-18T00:00:00.000Z");

const submitted = {
  type: "ApplicationSubmitted" as const,
  data: { company: "Acme", role: "Engineer", location: "Remote", employmentType: "Permanent" as const, benefits: [] },
  metadata: { now: now.toISOString() },
};

describe("WithdrawApplication", () => {
  it("withdraws an open application", () => {
    given([submitted])
      .when({ type: "WithdrawApplication", data: {}, metadata: { now } })
      .then({ type: "ApplicationWithdrawn", data: {}, metadata: { now: now.toISOString() } });
  });

  it("rejects withdrawing an application that is already closed (FR-009)", () => {
    given([
      submitted,
      { type: "ApplicationWithdrawn" as const, data: {}, metadata: { now: now.toISOString() } },
    ])
      .when({ type: "WithdrawApplication", data: {}, metadata: { now } })
      .thenThrows(IllegalStateError);
  });
});
