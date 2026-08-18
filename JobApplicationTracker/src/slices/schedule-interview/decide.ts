import { IllegalStateError } from "@event-driven-io/emmett";
import type { ScheduleInterview } from "../../domain/commands.js";
import type { ApplicationEvent } from "../../domain/events.js";
import type { ApplicationState } from "../../domain/state.js";

export const decide = (
  command: ScheduleInterview,
  state: ApplicationState,
): ApplicationEvent => {
  if (state.status !== "Open") {
    throw new IllegalStateError(
      "Cannot schedule an interview for an application that is not open",
    );
  }

  const expectedRound = state.rounds.length + 1;
  if (command.data.round !== expectedRound) {
    throw new IllegalStateError(
      `Round ${command.data.round} is out of sequence; expected round ${expectedRound}`,
    );
  }

  const priorRound = state.rounds[state.rounds.length - 1];
  if (priorRound && priorRound.outcome === "Pending") {
    throw new IllegalStateError(
      `Round ${priorRound.round}'s outcome must be recorded before scheduling round ${command.data.round}`,
    );
  }

  const now = command.metadata?.now ?? new Date();
  return {
    type: "InterviewScheduled",
    data: { round: command.data.round, date: command.data.date },
    metadata: { now: now.toISOString() },
  };
};
