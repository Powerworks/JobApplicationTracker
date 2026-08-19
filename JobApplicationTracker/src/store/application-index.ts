import pg from "pg";
import type { PostgresEventStore } from "@event-driven-io/emmett-postgresql";

export type ApplicationIndex = {
  register: (applicationId: string) => Promise<void>;
  list: () => Promise<string[]>;
  close: () => Promise<void>;
};

const ensureTable = async (pool: pg.Pool): Promise<void> => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS applications (
       application_id text PRIMARY KEY,
       submitted_at timestamptz NOT NULL DEFAULT now()
     )`,
  );
};

/**
 * Replaces the old in-memory application-registry.ts's Set with a table that survives a restart
 * (spec.md FR-005) — this project's own table, independent of Emmett's event-store schema
 * (research.md). `_store` is unused directly but keeps this factory's shape symmetrical with
 * createEventStore()'s callers and signals the index is scoped to one event store's data.
 */
export const createApplicationIndex = (_store: PostgresEventStore): ApplicationIndex => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set — cannot connect to the applications index table",
    );
  }
  const pool = new pg.Pool({ connectionString });
  const ready = ensureTable(pool);

  return {
    register: async (applicationId) => {
      await ready;
      await pool.query(
        "INSERT INTO applications (application_id) VALUES ($1) ON CONFLICT DO NOTHING",
        [applicationId],
      );
    },
    list: async () => {
      await ready;
      const result = await pool.query<{ application_id: string }>(
        "SELECT application_id FROM applications ORDER BY submitted_at",
      );
      return result.rows.map((row) => row.application_id);
    },
    close: () => pool.end(),
  };
};
