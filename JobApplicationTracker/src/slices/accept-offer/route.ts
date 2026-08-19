import { DeciderCommandHandler } from "@event-driven-io/emmett";
import type { FastifyInstance } from "fastify";
import { evolve, initialState } from "../../domain/state.js";
import { requireApplicationExists } from "../../http/require-application.js";
import {
  emptySuccessResponseSchema,
  errorResponseSchema,
} from "../../http/openapi-schemas.js";
import { decide } from "./decide.js";

const handle = DeciderCommandHandler({ decide, evolve, initialState });

const paramsSchema = {
  type: "object",
  required: ["applicationId"],
  properties: { applicationId: { type: "string" } },
} as const;

type Params = { applicationId: string };

export const registerAcceptOfferRoute = (app: FastifyInstance): void => {
  app.post<{ Params: Params }>(
    "/applications/:applicationId/offer/accept",
    {
      schema: {
        tags: ["Applications"],
        summary: "Accept a pending offer",
        params: paramsSchema,
        response: {
          200: emptySuccessResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { applicationId } = request.params;
      await requireApplicationExists(app.eventStore, applicationId);
      await handle(app.eventStore, applicationId, {
        type: "AcceptOffer",
        data: {},
        metadata: { now: new Date() },
      });
      reply.code(200).send({});
    },
  );
};
