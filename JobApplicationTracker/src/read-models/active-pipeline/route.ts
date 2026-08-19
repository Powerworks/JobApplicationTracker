import type { FastifyInstance } from "fastify";
import type { ApplicationEvent } from "../../domain/events.js";
import { activePipelineEntrySchema } from "../../http/openapi-schemas.js";
import { project } from "./project.js";

export const registerActivePipelineRoute = (app: FastifyInstance): void => {
  app.get(
    "/applications/active",
    {
      schema: {
        tags: ["Overview"],
        summary: "List open applications, most-idle-first",
        response: {
          200: { type: "array", items: activePipelineEntrySchema },
        },
      },
    },
    async (_request, reply) => {
      const streams: Record<string, ApplicationEvent[]> = {};
      for (const applicationId of await app.applicationIndex.list()) {
        const { events } = await app.eventStore.readStream<ApplicationEvent>(applicationId);
        streams[applicationId] = events.map((event) => ({
          type: event.type,
          data: event.data,
          metadata: event.metadata,
        })) as ApplicationEvent[];
      }
      reply.code(200).send(project(streams));
    },
  );
};
