import { describe, expect, it } from "vitest";
import type { ApplicationEvent } from "../../domain/events.js";
import { project } from "./project.js";

const at = (isoDate: string) => new Date(isoDate).toISOString();

const submitted = (company: string, role: string, when: string): ApplicationEvent => ({
  type: "ApplicationSubmitted",
  data: { company, role },
  metadata: { now: at(when) },
});

const withdrawn = (when: string): ApplicationEvent => ({
  type: "ApplicationWithdrawn",
  data: {},
  metadata: { now: at(when) },
});

const interviewScheduled = (round: number, when: string): ApplicationEvent => ({
  type: "InterviewScheduled",
  data: { round, date: when },
  metadata: { now: at(when) },
});

const now = new Date("2026-08-18T00:00:00.000Z");

describe("getActivePipeline", () => {
  it("lists only open applications, most-idle-first (FR-013, FR-014)", () => {
    const streams: Record<string, ApplicationEvent[]> = {
      stale: [submitted("Stale Co", "Engineer", "2026-08-01T00:00:00.000Z")],
      fresh: [
        submitted("Fresh Co", "Engineer", "2026-08-01T00:00:00.000Z"),
        interviewScheduled(1, "2026-08-17T00:00:00.000Z"),
      ],
      closed: [
        submitted("Closed Co", "Engineer", "2026-08-01T00:00:00.000Z"),
        withdrawn("2026-08-02T00:00:00.000Z"),
      ],
    };

    const result = project(streams, now);

    expect(result.map((e) => e.applicationId)).toEqual(["stale", "fresh"]);
    expect(result[0]?.daysSinceLastActivity).toBeGreaterThan(
      result[1]?.daysSinceLastActivity ?? 0,
    );
  });

  it("derives a human-readable current stage", () => {
    const streams: Record<string, ApplicationEvent[]> = {
      app: [submitted("Acme", "Engineer", "2026-08-01T00:00:00.000Z")],
    };

    const [entry] = project(streams, now);

    expect(entry?.currentStage).toBe("Awaiting first interview");
    expect(entry?.company).toBe("Acme");
    expect(entry?.role).toBe("Engineer");
  });
});
