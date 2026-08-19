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

const bodySchema = {
  type: "object",
  required: ["amount", "deadline"],
  properties: {
    amount: { type: "number" },
    deadline: { type: "string" },
  },
} as const;

const paramsSchema = {
  type: "object",
  required: ["applicationId"],
  properties: { applicationId: { type: "string" } },
} as const;

type Body = { amount: number; deadline: string };
type Params = { applicationId: string };

export const registerReceiveOfferRoute = (app: FastifyInstance): void => {
  app.post<{ Body: Body; Params: Params }>(
    "/applications/:applicationId/offer",
    {
      schema: {
        tags: ["Applications"],
        summary: "Record a received offer",
        body: bodySchema,
        params: paramsSchema,
        response: {
          200: emptySuccessResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { applicationId } = request.params;
      await requireApplicationExists(app.eventStore, applicationId);
      await handle(app.eventStore, applicationId, {
        type: "ReceiveOffer",
        data: request.body,
        metadata: { now: new Date() },
      });
      reply.code(200).send({});
    },
  );
};
