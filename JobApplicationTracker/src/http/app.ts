import { fileURLToPath } from "node:url";
import path from "node:path";
import fastifyStatic from "@fastify/static";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { getApplication } from "@event-driven-io/emmett-fastify";
import type { FastifyInstance } from "fastify";
import type { PostgresEventStore } from "@event-driven-io/emmett-postgresql";
import { createEventStore } from "../store/event-store.js";
import { createApplicationIndex, type ApplicationIndex } from "../store/application-index.js";
import { errorHandler } from "./errors.js";
import { registerSubmitApplicationRoute } from "../slices/submit-application/route.js";
import { registerScheduleInterviewRoute } from "../slices/schedule-interview/route.js";
import { registerRecordInterviewOutcomeRoute } from "../slices/record-interview-outcome/route.js";
import { registerReceiveOfferRoute } from "../slices/receive-offer/route.js";
import { registerAcceptOfferRoute } from "../slices/accept-offer/route.js";
import { registerDeclineOfferRoute } from "../slices/decline-offer/route.js";
import { registerWithdrawApplicationRoute } from "../slices/withdraw-application/route.js";
import { registerActivePipelineRoute } from "../read-models/active-pipeline/route.js";
import { registerApplicationDetailRoute } from "../read-models/application-detail/route.js";
import { registerGhostingCheckRoute } from "../reactors/ghosting/route.js";

declare module "fastify" {
  interface FastifyInstance {
    eventStore: PostgresEventStore;
    applicationIndex: ApplicationIndex;
  }
}

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../public");

export const buildApp = (): Promise<FastifyInstance> =>
  getApplication({
    registerRoutes: (app: FastifyInstance) => {
      const eventStore = createEventStore();
      app.decorate("eventStore", eventStore);
      app.decorate("applicationIndex", createApplicationIndex(eventStore));
      app.setErrorHandler(errorHandler);

      // emmett-fastify's registerRoutes callback is called without being awaited, so
      // fastify.register(fastifySwagger, ...) alone races the route registrations below (its
      // onRoute hook may not be attached yet when they run, silently producing an empty OpenAPI
      // document). `.after()` guarantees swagger has fully booted before any route is declared.
      app
        .register(fastifySwagger, {
          openapi: {
            info: {
              title: "Job Application Tracker API",
              description:
                "HTTP API for the job application pipeline tracker (features 001-005).",
              version: "0.1.0",
            },
            tags: [
              { name: "Applications", description: "Submit and progress applications" },
              { name: "Overview", description: "The active pipeline and ghosting check" },
            ],
          },
        })
        .after(() => {
          app.register(fastifySwaggerUi, { routePrefix: "/documentation" });
          app.register(fastifyStatic, { root: publicDir });
          registerSubmitApplicationRoute(app);
          registerScheduleInterviewRoute(app);
          registerRecordInterviewOutcomeRoute(app);
          registerReceiveOfferRoute(app);
          registerAcceptOfferRoute(app);
          registerDeclineOfferRoute(app);
          registerWithdrawApplicationRoute(app);
          registerActivePipelineRoute(app);
          registerApplicationDetailRoute(app);
          registerGhostingCheckRoute(app);
        });
    },
  });
