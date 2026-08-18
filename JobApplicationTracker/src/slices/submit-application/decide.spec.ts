import { DeciderSpecification } from "@event-driven-io/emmett";
import { describe, it } from "vitest";
import { evolve, initialState } from "../../domain/state.js";
import { decide } from "./decide.js";

const given = DeciderSpecification.for({ decide, evolve, initialState });

const now = new Date("2026-08-18T00:00:00.000Z");

describe("SubmitApplication", () => {
  it("submits a new application with full job posting details", () => {
    given([])
      .when({
        type: "SubmitApplication",
        data: {
          company: "Acme",
          role: "Engineer",
          location: "Remote",
          salary: { amount: 150000, currency: "USD" },
          employmentType: "Permanent",
          bonus: { amount: 10000, currency: "USD" },
          benefits: ["Health insurance", "401k match"],
        },
        metadata: { now },
      })
      .then({
        type: "ApplicationSubmitted",
        data: {
          company: "Acme",
          role: "Engineer",
          location: "Remote",
          salary: { amount: 150000, currency: "USD" },
          employmentType: "Permanent",
          bonus: { amount: 10000, currency: "USD" },
          benefits: ["Health insurance", "401k match"],
        },
        metadata: { now: now.toISOString() },
      });
  });

  it("submits an application with salary and bonus omitted (FR-002, FR-004)", () => {
    given([])
      .when({
        type: "SubmitApplication",
        data: {
          company: "Beta Corp",
          role: "Contractor",
          location: "London, UK",
          employmentType: "Contract",
          benefits: [],
        },
        metadata: { now },
      })
      .then({
        type: "ApplicationSubmitted",
        data: {
          company: "Beta Corp",
          role: "Contractor",
          location: "London, UK",
          employmentType: "Contract",
          benefits: [],
        },
        metadata: { now: now.toISOString() },
      });
  });

  it("submits an application with an empty benefits list (FR-005)", () => {
    given([])
      .when({
        type: "SubmitApplication",
        data: {
          company: "Gamma Inc",
          role: "Designer",
          location: "New York, NY",
          employmentType: "Permanent",
          benefits: [],
        },
        metadata: { now },
      })
      .then({
        type: "ApplicationSubmitted",
        data: {
          company: "Gamma Inc",
          role: "Designer",
          location: "New York, NY",
          employmentType: "Permanent",
          benefits: [],
        },
        metadata: { now: now.toISOString() },
      });
  });
});
