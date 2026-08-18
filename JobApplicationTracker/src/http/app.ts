import { getApplication } from "@event-driven-io/emmett-fastify";
import type { FastifyInstance } from "fastify";
import type { InMemoryEventStore } from "@event-driven-io/emmett";
import { createEventStore } from "../store/event-store.js";
import { errorHandler } from "./errors.js";
import { registerSubmitApplicationRoute } from "../slices/submit-application/route.js";
import { registerScheduleInterviewRoute } from "../slices/schedule-interview/route.js";
import { registerRecordInterviewOutcomeRoute } from "../slices/record-interview-outcome/route.js";
import { registerReceiveOfferRoute } from "../slices/receive-offer/route.js";
import { registerAcceptOfferRoute } from "../slices/accept-offer/route.js";
import { registerDeclineOfferRoute } from "../slices/decline-offer/route.js";
import { registerWithdrawApplicationRoute } from "../slices/withdraw-application/route.js";

declare module "fastify" {
  interface FastifyInstance {
    eventStore: InMemoryEventStore;
  }
}

export const buildApp = (): Promise<FastifyInstance> =>
  getApplication({
    registerRoutes: (app: FastifyInstance) => {
      app.decorate("eventStore", createEventStore());
      app.setErrorHandler(errorHandler);
      registerSubmitApplicationRoute(app);
      registerScheduleInterviewRoute(app);
      registerRecordInterviewOutcomeRoute(app);
      registerReceiveOfferRoute(app);
      registerAcceptOfferRoute(app);
      registerDeclineOfferRoute(app);
      registerWithdrawApplicationRoute(app);
    },
  });
