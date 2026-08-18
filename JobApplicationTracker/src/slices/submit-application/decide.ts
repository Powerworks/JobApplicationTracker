import type { SubmitApplication } from "../../domain/commands.js";
import type { ApplicationEvent } from "../../domain/events.js";
import type { ApplicationState } from "../../domain/state.js";

export const decide = (
  command: SubmitApplication,
  _state: ApplicationState,
): ApplicationEvent => {
  const now = command.metadata?.now ?? new Date();
  return {
    type: "ApplicationSubmitted",
    data: { company: command.data.company, role: command.data.role },
    metadata: { now: now.toISOString() },
  };
};
