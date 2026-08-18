import { DeciderSpecification } from "@event-driven-io/emmett";
import { describe, it } from "vitest";
import { evolve, initialState } from "../../domain/state.js";
import { decide } from "./decide.js";

const given = DeciderSpecification.for({ decide, evolve, initialState });

const now = new Date("2026-08-18T00:00:00.000Z");

describe("SubmitApplication", () => {
  it("submits a new application", () => {
    given([])
      .when({
        type: "SubmitApplication",
        data: { company: "Acme", role: "Engineer" },
        metadata: { now },
      })
      .then({
        type: "ApplicationSubmitted",
        data: { company: "Acme", role: "Engineer" },
        metadata: { now: now.toISOString() },
      });
  });
});
