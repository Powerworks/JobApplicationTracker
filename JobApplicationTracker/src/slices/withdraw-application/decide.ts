import { IllegalStateError } from "@event-driven-io/emmett";
import type { WithdrawApplication } from "../../domain/commands.js";
import type { ApplicationEvent } from "../../domain/events.js";
import type { ApplicationState } from "../../domain/state.js";

export const decide = (
  command: WithdrawApplication,
  state: ApplicationState,
): ApplicationEvent => {
  if (state.status !== "Open") {
    throw new IllegalStateError(
      "Cannot withdraw an application that is not open",
    );
  }

  const now = command.metadata?.now ?? new Date();
  return {
    type: "ApplicationWithdrawn",
    data: {},
    metadata: { now: now.toISOString() },
  };
};
