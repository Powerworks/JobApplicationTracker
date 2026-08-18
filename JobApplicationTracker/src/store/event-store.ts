import { getInMemoryEventStore } from "@event-driven-io/emmett";

export const createEventStore = () => getInMemoryEventStore();
