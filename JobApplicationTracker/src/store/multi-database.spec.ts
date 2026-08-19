import { describe, expect, it } from "vitest";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { getPostgreSQLEventStore } from "@event-driven-io/emmett-postgresql";
import { createApplicationIndex } from "./application-index.js";

/**
 * spec.md User Story 2: the connection is genuinely externalized. Spins up a *second* Postgres
 * database (independent of the shared testcontainer every other test uses) and confirms two
 * createEventStore()-style pairs, pointed at two different DATABASE_URL values, never see each
 * other's data — proving the connection is read from configuration, not hardcoded anywhere.
 */
describe("configurable database connection", () => {
  it("two databases stay fully isolated from each other", async () => {
    const originalDatabaseUrl = process.env.DATABASE_URL;
    const secondContainer = await new PostgreSqlContainer("postgres:17-alpine").start();

    try {
      const firstConnectionString = originalDatabaseUrl!;
      const secondConnectionString = secondContainer.getConnectionUri();

      const firstStore = getPostgreSQLEventStore(firstConnectionString);
      const secondStore = getPostgreSQLEventStore(secondConnectionString);
      await secondStore.schema.migrate();

      process.env.DATABASE_URL = firstConnectionString;
      const firstIndex = createApplicationIndex(firstStore);
      await firstIndex.register("first-db-app");

      process.env.DATABASE_URL = secondConnectionString;
      const secondIndex = createApplicationIndex(secondStore);
      await secondIndex.register("second-db-app");

      expect(await firstIndex.list()).toContain("first-db-app");
      expect(await firstIndex.list()).not.toContain("second-db-app");
      expect(await secondIndex.list()).toEqual(["second-db-app"]);

      await firstIndex.close();
      await secondIndex.close();
      await firstStore.close();
      await secondStore.close();
    } finally {
      process.env.DATABASE_URL = originalDatabaseUrl;
      await secondContainer.stop();
    }
  });
});
