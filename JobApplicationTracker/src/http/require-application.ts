import type { InMemoryEventStore } from "@event-driven-io/emmett";
import { evolve, initialState } from "../domain/state.js";
import { ApplicationNotFoundError } from "./errors.js";

/**
 * Pre-check used by every route except SubmitApplication (research.md's 404 decision) — an
 * existence check, not a business guard, so it stays out of the deciders themselves.
 */
export const requireApplicationExists = async (
  eventStore: InMemoryEventStore,
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
