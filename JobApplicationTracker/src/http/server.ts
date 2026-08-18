import { startAPI } from "@event-driven-io/emmett-fastify";
import { buildApp } from "./app.js";

const app = await buildApp();
await startAPI(app);
