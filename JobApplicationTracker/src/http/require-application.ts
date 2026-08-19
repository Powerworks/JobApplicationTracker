import type { EventStore } from "@event-driven-io/emmett";
import { evolve, initialState } from "../domain/state.js";
import { ApplicationNotFoundError } from "./errors.js";

/**
 * Pre-check used by every route except SubmitApplication (research.md's 404 decision) — an
 * existence check, not a business guard, so it stays out of the deciders themselves. Typed
 * against the generic EventStore interface, not a concrete store, so it works unchanged
 * regardless of which store implementation is wired up (feature 005: in-memory -> Postgres).
 */
export const requireApplicationExists = async (
  eventStore: EventStore,
  applicationId: string,
): Promise<void> => {
  const result = await eventStore.aggregateStream(applicationId, {
    evolve,
    initialState,
  });
  if (!result.streamExists) {
    throw new ApplicationNotFoundError(applicationId);
  }
};
