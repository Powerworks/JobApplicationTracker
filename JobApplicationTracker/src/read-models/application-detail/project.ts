import type { ApplicationEvent } from "../../domain/events.js";
import { evolve, initialState, type ApplicationState } from "../../domain/state.js";

/**
 * Full Application state for a single stream, open or closed — unlike active-pipeline's
 * project(), which deliberately excludes closed applications (feature 001 FR-014).
 */
export const project = (events: ApplicationEvent[]): ApplicationState =>
  events.reduce(evolve, initialState());
