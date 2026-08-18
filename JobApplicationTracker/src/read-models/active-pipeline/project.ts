import type { ApplicationEvent } from "../../domain/events.js";
import {
  evolve,
  initialState,
  type SubmittedApplication,
} from "../../domain/state.js";

export type ActivePipelineEntry = {
  applicationId: string;
  company: string;
  role: string;
  currentStage: string;
  daysSinceLastActivity: number;
};

const millisecondsPerDay = 1000 * 60 * 60 * 24;

const currentStageOf = (state: SubmittedApplication): string => {
  if (state.offer && state.offer.decision === "Pending") {
    return "Offer pending decision";
  }
  const lastRound = state.rounds[state.rounds.length - 1];
  if (!lastRound) return "Awaiting first interview";
  if (lastRound.outcome === "Pending") {
    return `Awaiting round ${lastRound.round} outcome`;
  }
  if (lastRound.outcome === "Rejected") {
    return `Round ${lastRound.round} rejected`;
  }
  return `Passed round ${lastRound.round}, awaiting next step`;
};

/** FR-012–FR-014: one entry per open application, most-idle-first, closed applications excluded. */
export const project = (
  streams: Record<string, ApplicationEvent[]>,
  now: Date = new Date(),
): ActivePipelineEntry[] =>
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
    .map(({ applicationId, state }) => ({
      applicationId,
      company: state.company,
      role: state.role,
      currentStage: currentStageOf(state),
      daysSinceLastActivity: Math.floor(
        (now.getTime() - new Date(state.lastActivityAt).getTime()) /
          millisecondsPerDay,
      ),
    }))
    .sort((a, b) => b.daysSinceLastActivity - a.daysSinceLastActivity);
