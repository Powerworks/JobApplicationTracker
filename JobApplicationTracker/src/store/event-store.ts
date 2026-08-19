import {
  getPostgreSQLEventStore,
  type PostgresEventStore,
} from "@event-driven-io/emmett-postgresql";

export const createEventStore = (): PostgresEventStore => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set — cannot connect to the Postgres event store",
    );
  }
  return getPostgreSQLEventStore(connectionString);
};

export const migrateEventStoreSchema = (store: PostgresEventStore): Promise<unknown> =>
  store.schema.migrate();
