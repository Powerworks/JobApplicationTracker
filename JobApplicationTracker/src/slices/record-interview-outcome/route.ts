import { DeciderCommandHandler } from "@event-driven-io/emmett";
import type { FastifyInstance } from "fastify";
import { evolve, initialState } from "../../domain/state.js";
import { requireApplicationExists } from "../../http/require-application.js";
import { decide } from "./decide.js";

const handle = DeciderCommandHandler({ decide, evolve, initialState });

const bodySchema = {
  type: "object",
  required: ["round", "outcome"],
  properties: {
    round: { type: "number" },
    outcome: { type: "string", enum: ["Passed", "Rejected"] },
  },
} as const;

const paramsSchema = {
  type: "object",
  required: ["applicationId"],
  properties: { applicationId: { type: "string" } },
} as const;

type Body = { round: number; outcome: "Passed" | "Rejected" };
type Params = { applicationId: string };

export const registerRecordInterviewOutcomeRoute = (app: FastifyInstance): void => {
  app.post<{ Body: Body; Params: Params }>(
    "/applications/:applicationId/interviews/outcome",
    { schema: { body: bodySchema, params: paramsSchema } },
    async (request, reply) => {
      const { applicationId } = request.params;
      await requireApplicationExists(app.eventStore, applicationId);
      await handle(app.eventStore, applicationId, {
        type: "RecordInterviewOutcome",
        data: request.body,
        metadata: { now: new Date() },
      });
      reply.code(200).send({});
    },
  );
};
