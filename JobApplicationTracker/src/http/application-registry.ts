/**
 * Tracks every applicationId created via SubmitApplication so US2/US3 routes can enumerate
 * streams to read — Emmett's InMemoryEventStore has no built-in stream listing (research.md).
 * One registry per app instance (decorated onto the Fastify app in app.ts), not a module
 * singleton — each `buildApp()` call gets a fresh event store, so it must get a fresh registry
 * too, or tests (and any future multi-instance use) would leak IDs across instances.
 */
export type ApplicationRegistry = {
  register: (applicationId: string) => void;
  list: () => string[];
};

export const createApplicationRegistry = (): ApplicationRegistry => {
  const applicationIds = new Set<string>();
  return {
    register: (applicationId: string) => applicationIds.add(applicationId),
    list: () => [...applicationIds],
  };
};
