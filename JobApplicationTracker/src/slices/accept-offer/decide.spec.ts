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

const offerReceived = {
  type: "OfferReceived" as const,
  data: { amount: 150000, deadline: "2026-09-01" },
  metadata: { now: now.toISOString() },
};

describe("AcceptOffer", () => {
  it("accepts a pending offer", () => {
    given([submitted, offerReceived])
      .when({ type: "AcceptOffer", data: {}, metadata: { now } })
      .then({ type: "OfferAccepted", data: {}, metadata: { now: now.toISOString() } });
  });

  it("rejects when there is no offer", () => {
    given([submitted])
      .when({ type: "AcceptOffer", data: {}, metadata: { now } })
      .thenThrows(IllegalStateError);
  });

  it("rejects accepting an offer on a closed application (FR-009)", () => {
    given([
      submitted,
      offerReceived,
      { type: "ApplicationWithdrawn" as const, data: {}, metadata: { now: now.toISOString() } },
    ])
      .when({ type: "AcceptOffer", data: {}, metadata: { now } })
      .thenThrows(IllegalStateError);
  });
});
