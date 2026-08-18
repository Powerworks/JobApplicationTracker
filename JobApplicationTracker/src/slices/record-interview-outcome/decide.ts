import { IllegalStateError } from "@event-driven-io/emmett";
import type { RecordInterviewOutcome } from "../../domain/commands.js";
import type { ApplicationEvent } from "../../domain/events.js";
import type { ApplicationState } from "../../domain/state.js";

export const decide = (
  command: RecordInterviewOutcome,
  state: ApplicationState,
): ApplicationEvent => {
  if (state.status !== "Open") {
    throw new IllegalStateError(
      "Cannot record an interview outcome for an application that is not open",
    );
  }

  const round = state.rounds.find(
    (r) => r.round === command.data.round && r.outcome === "Pending",
  );
  if (!round) {
    throw new IllegalStateError(
      `No pending round ${command.data.round} to record an outcome for`,
    );
  }

  const now = command.metadata?.now ?? new Date();
  return {
    type: "InterviewCompleted",
    data: { round: command.data.round, outcome: command.data.outcome },
    metadata: { now: now.toISOString() },
  };
};
