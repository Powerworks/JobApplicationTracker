import pg from "pg";
import { createEventStore } from "./event-store.js";

/**
 * Test-only helper: restores the shared testcontainer database to empty between tests that
 * assert on the store's full contents (research.md's isolation decision) — the in-memory store
 * gave this for free (a new buildApp() was a new empty store); a shared Postgres instance needs
 * an explicit reset instead.
 */
export const resetDatabaseForTests = async (): Promise<void> => {
  const store = createEventStore();
  await store.schema.dangerous.truncate({ truncateProjections: true });
  await store.close();

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(
    `CREATE TABLE IF NOT EXISTS applications (
       application_id text PRIMARY KEY,
       submitted_at timestamptz NOT NULL DEFAULT now()
     )`,
  );
  await pool.query("TRUNCATE TABLE applications");
  await pool.end();
};
