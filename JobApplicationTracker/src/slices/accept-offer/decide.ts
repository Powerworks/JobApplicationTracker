import { IllegalStateError } from "@event-driven-io/emmett";
import type { AcceptOffer } from "../../domain/commands.js";
import type { ApplicationEvent } from "../../domain/events.js";
import type { ApplicationState } from "../../domain/state.js";

export const decide = (
  command: AcceptOffer,
  state: ApplicationState,
): ApplicationEvent => {
  if (state.status !== "Open") {
    throw new IllegalStateError(
      "Cannot accept an offer for an application that is not open",
    );
  }
  if (!state.offer || state.offer.decision !== "Pending") {
    throw new IllegalStateError("There is no pending offer to accept");
  }

  const now = command.metadata?.now ?? new Date();
  return { type: "OfferAccepted", data: {}, metadata: { now: now.toISOString() } };
};
