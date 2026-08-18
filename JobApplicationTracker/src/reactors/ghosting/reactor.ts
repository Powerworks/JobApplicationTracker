import type { ApplicationEvent, ApplicationGhosted } from "../../domain/events.js";
import {
  evolve,
  initialState,
  type SubmittedApplication,
} from "../../domain/state.js";

/** Days of no activity on an open application before it is auto-closed as ghosted (spec Assumptions). */
export const SILENCE_PERIOD_DAYS = 14;

const millisecondsPerDay = 1000 * 60 * 60 * 24;

/**
 * FR-010/FR-011: scans open application streams and emits ApplicationGhosted for any whose
 * silence clock (time since lastActivityAt) has exceeded the silence period. Closed applications
 * are untouched.
 */
export const ghostSilentApplications = (
  streams: Record<string, ApplicationEvent[]>,
  now: Date = new Date(),
): { applicationId: string; event: ApplicationGhosted }[] =>
  Object.entries(streams)
    .map(([applicationId, events]) => ({
      applicationId,
      state: events.reduce(evolve, initialState()),
    }))
    .filter(
      (
        entry,
      ): entry is { applicationId: string; state: SubmittedApplication } =>
        entry.state.status === "Open",
    )
    .filter(({ state }) => {
      const lastActivityAt = new Date(state.lastActivityAt);
      const daysSilent =
        (now.getTime() - lastActivityAt.getTime()) / millisecondsPerDay;
      return daysSilent >= SILENCE_PERIOD_DAYS;
    })
    .map(({ applicationId }) => ({
      applicationId,
      event: {
        type: "ApplicationGhosted" as const,
        data: {},
        metadata: { now: now.toISOString() },
      },
    }));
