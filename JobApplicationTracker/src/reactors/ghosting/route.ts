import type { FastifyInstance } from "fastify";
import type { ApplicationEvent } from "../../domain/events.js";
import { ghostSilentApplications } from "./reactor.js";

type Body = { now?: string } | undefined;

/**
 * `now` is an optional override (defaults to the real current time) — it exists so this route
 * can be exercised without waiting SILENCE_PERIOD_DAYS in real time, the same purpose the fixed
 * `now` constant serves in reactor.spec.ts's direct unit tests. No body schema is declared: the
 * request body itself is optional (data-model.md documents it as empty), and Fastify's schema
 * validation rejects a missing body against a declared object schema.
 */
export const registerGhostingCheckRoute = (app: FastifyInstance): void => {
  app.post<{ Body: Body }>(
    "/ghosting/check",
    {
      schema: {
        tags: ["Overview"],
        summary: "Trigger the ghosting check for silent applications",
        response: {
          200: {
            type: "object",
            properties: { ghosted: { type: "array", items: { type: "string" } } },
          },
        },
      },
    },
    async (request, reply) => {
      const now = request.body?.now ? new Date(request.body.now) : new Date();
      const streams: Record<string, ApplicationEvent[]> = {};
      for (const applicationId of await app.applicationIndex.list()) {
        const { events } = await app.eventStore.readStream<ApplicationEvent>(applicationId);
        streams[applicationId] = events.map((event) => ({
          type: event.type,
          data: event.data,
          metadata: event.metadata,
        })) as ApplicationEvent[];
      }

      const toGhost = ghostSilentApplications(streams, now);
      for (const { applicationId, event } of toGhost) {
        await app.eventStore.appendToStream(applicationId, [event]);
      }

      reply.code(200).send({ ghosted: toGhost.map((g) => g.applicationId) });
    },
  );
};
