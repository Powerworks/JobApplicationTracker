import { startAPI } from "@event-driven-io/emmett-fastify";
import { buildApp } from "./app.js";
import { migrateEventStoreSchema } from "../store/event-store.js";

try {
  const app = await buildApp();
  await migrateEventStoreSchema(app.eventStore);
  await startAPI(app);
} catch (error) {
  console.error("Failed to start: could not connect to or migrate the Postgres event store.");
  console.error(error);
  process.exit(1);
}
