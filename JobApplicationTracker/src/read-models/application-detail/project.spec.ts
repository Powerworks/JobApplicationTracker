import { describe, expect, it } from "vitest";
import type { ApplicationEvent } from "../../domain/events.js";
import { project } from "./project.js";

const now = new Date("2026-08-18T00:00:00.000Z").toISOString();

const submitted: ApplicationEvent = {
  type: "ApplicationSubmitted",
  data: {
    company: "Acme",
    role: "Engineer",
    location: "Remote",
    employmentType: "Permanent",
    benefits: [],
  },
  metadata: { now },
};

const withdrawn: ApplicationEvent = {
  type: "ApplicationWithdrawn",
  data: {},
  metadata: { now },
};

describe("application-detail project", () => {
  it("projects an open application's full state", () => {
    const state = project([submitted]);
    expect(state).toMatchObject({ status: "Open", company: "Acme", role: "Engineer" });
  });

  it("projects a closed application's full state too (unlike active-pipeline)", () => {
    const state = project([submitted, withdrawn]);
    expect(state).toMatchObject({ status: "Withdrawn" });
  });

  it("projects NotSubmitted for an empty event list", () => {
    const state = project([]);
    expect(state).toEqual({ status: "NotSubmitted" });
  });
});
