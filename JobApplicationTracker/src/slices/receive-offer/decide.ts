import { IllegalStateError } from "@event-driven-io/emmett";
import type { ReceiveOffer } from "../../domain/commands.js";
import type { ApplicationEvent } from "../../domain/events.js";
import type { ApplicationState } from "../../domain/state.js";

export const decide = (
  command: ReceiveOffer,
  state: ApplicationState,
): ApplicationEvent => {
  if (state.status !== "Open") {
    throw new IllegalStateError(
      "Cannot receive an offer for an application that is not open",
    );
  }

  const lastRound = state.rounds[state.rounds.length - 1];
  if (!lastRound || lastRound.outcome !== "Passed") {
    throw new IllegalStateError(
      "Cannot receive an offer without a passing interview outcome",
    );
  }

  const now = command.metadata?.now ?? new Date();
  return {
    type: "OfferReceived",
    data: { amount: command.data.amount, deadline: command.data.deadline },
    metadata: { now: now.toISOString() },
  };
};
