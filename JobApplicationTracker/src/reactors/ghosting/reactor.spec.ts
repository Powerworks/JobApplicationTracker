import { describe, expect, it } from "vitest";
import type { ApplicationEvent } from "../../domain/events.js";
import { ghostSilentApplications, SILENCE_PERIOD_DAYS } from "./reactor.js";

const at = (isoDate: string) => new Date(isoDate).toISOString();

const submitted = (when: string): ApplicationEvent => ({
  type: "ApplicationSubmitted",
  data: { company: "Acme", role: "Engineer", location: "Remote", employmentType: "Permanent" as const, benefits: [] },
  metadata: { now: at(when) },
});

const interviewScheduled = (round: number, when: string): ApplicationEvent => ({
  type: "InterviewScheduled",
  data: { round, date: when },
  metadata: { now: at(when) },
});

const withdrawn = (when: string): ApplicationEvent => ({
  type: "ApplicationWithdrawn",
  data: {},
  metadata: { now: at(when) },
});

describe("ghosting reactor", () => {
  it(`emits ApplicationGhosted for an open application silent for ${SILENCE_PERIOD_DAYS} days (FR-010)`, () => {
    const submittedAt = new Date("2026-08-01T00:00:00.000Z");
    const now = new Date(
      submittedAt.getTime() + SILENCE_PERIOD_DAYS * 24 * 60 * 60 * 1000,
    );

    const result = ghostSilentApplications(
      { app: [submitted(submittedAt.toISOString())] },
      now,
    );

    expect(result).toEqual([
      { applicationId: "app", event: { type: "ApplicationGhosted", data: {}, metadata: { now: now.toISOString() } } },
    ]);
  });

  it("resets the silence clock on new activity (FR-011)", () => {
    const submittedAt = new Date("2026-08-01T00:00:00.000Z");
    const resetAt = new Date("2026-08-10T00:00:00.000Z");
    const now = new Date(
      submittedAt.getTime() + SILENCE_PERIOD_DAYS * 24 * 60 * 60 * 1000,
    );

    const result = ghostSilentApplications(
      {
        app: [
          submitted(submittedAt.toISOString()),
          interviewScheduled(1, resetAt.toISOString()),
        ],
      },
      now,
    );

    expect(result).toEqual([]);
  });

  it("does not affect applications already in a closed state", () => {
    const submittedAt = new Date("2026-08-01T00:00:00.000Z");
    const now = new Date(
      submittedAt.getTime() + SILENCE_PERIOD_DAYS * 24 * 60 * 60 * 1000,
    );

    const result = ghostSilentApplications(
      {
        app: [
          submitted(submittedAt.toISOString()),
          withdrawn(submittedAt.toISOString()),
        ],
      },
      now,
    );

    expect(result).toEqual([]);
  });
});
