import { fileURLToPath } from "node:url";
import path from "node:path";
import fastifyStatic from "@fastify/static";
import { getApplication } from "@event-driven-io/emmett-fastify";
import type { FastifyInstance } from "fastify";
import type { InMemoryEventStore } from "@event-driven-io/emmett";
import { createEventStore } from "../store/event-store.js";
import { errorHandler } from "./errors.js";
import { createApplicationRegistry, type ApplicationRegistry } from "./application-registry.js";
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
    eventStore: InMemoryEventStore;
    applicationRegistry: ApplicationRegistry;
  }
}

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../public");

export const buildApp = (): Promise<FastifyInstance> =>
  getApplication({
    registerRoutes: (app: FastifyInstance) => {
      app.decorate("eventStore", createEventStore());
      app.decorate("applicationRegistry", createApplicationRegistry());
      app.setErrorHandler(errorHandler);
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
    },
  });
