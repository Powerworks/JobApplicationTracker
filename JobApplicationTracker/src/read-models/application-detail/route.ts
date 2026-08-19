import type { FastifyInstance } from "fastify";
import type { ApplicationEvent } from "../../domain/events.js";
import { requireApplicationExists } from "../../http/require-application.js";
import { project } from "./project.js";

const paramsSchema = {
  type: "object",
  required: ["applicationId"],
  properties: { applicationId: { type: "string" } },
} as const;

type Params = { applicationId: string };

export const registerApplicationDetailRoute = (app: FastifyInstance): void => {
  app.get<{ Params: Params }>(
    "/applications/:applicationId",
    { schema: { params: paramsSchema } },
    async (request, reply) => {
      const { applicationId } = request.params;
      await requireApplicationExists(app.eventStore, applicationId);
      const { events } = await app.eventStore.readStream<ApplicationEvent>(applicationId);
      const state = project(
        events.map((event) => ({
          type: event.type,
          data: event.data,
          metadata: event.metadata,
        })) as ApplicationEvent[],
      );
      reply.code(200).send({ applicationId, ...state });
    },
  );
};
