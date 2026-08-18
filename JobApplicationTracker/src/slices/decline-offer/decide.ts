import { IllegalStateError } from "@event-driven-io/emmett";
import type { DeclineOffer } from "../../domain/commands.js";
import type { ApplicationEvent } from "../../domain/events.js";
import type { ApplicationState } from "../../domain/state.js";

export const decide = (
  command: DeclineOffer,
  state: ApplicationState,
): ApplicationEvent => {
  if (state.status !== "Open") {
    throw new IllegalStateError(
      "Cannot decline an offer for an application that is not open",
    );
  }
  if (!state.offer || state.offer.decision !== "Pending") {
    throw new IllegalStateError("There is no pending offer to decline");
  }

  const now = command.metadata?.now ?? new Date();
  return { type: "OfferDeclined", data: {}, metadata: { now: now.toISOString() } };
};
