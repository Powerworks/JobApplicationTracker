import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { getPostgreSQLEventStore } from "@event-driven-io/emmett-postgresql";

/**
 * Vitest globalSetup: one shared Postgres container for the whole test run (research.md) — far
 * too slow to start a fresh container per test. Migrates the schema once and exposes the
 * connection string via DATABASE_URL for every test's createEventStore() call.
 *
 * Uses @testcontainers/postgresql directly rather than @event-driven-io/emmett-testcontainers
 * (Emmett's own thin wrapper) — that wrapper's published build unconditionally imports
 * @eventstore/db-client (for its unrelated EventStoreDB helper) without declaring it as a
 * dependency, which crashes module resolution for anyone who only wants its Postgres helper.
 * @testcontainers/postgresql is the actual library doing the work underneath it either way.
 */
export default async function setup() {
  const container = await new PostgreSqlContainer("postgres:17-alpine").start();
  const connectionString = container.getConnectionUri();
  process.env.DATABASE_URL = connectionString;

  const store = getPostgreSQLEventStore(connectionString);
  await store.schema.migrate();
  await store.close();

  return async () => {
    await container.stop();
  };
}
