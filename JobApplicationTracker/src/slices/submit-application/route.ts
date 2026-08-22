import { randomUUID } from "node:crypto";
import { DeciderCommandHandler } from "@event-driven-io/emmett";
import type { FastifyInstance } from "fastify";
import { evolve, initialState } from "../../domain/state.js";
import { errorResponseSchema } from "../../http/openapi-schemas.js";
import { decide } from "./decide.js";

const handle = DeciderCommandHandler({ decide, evolve, initialState });

const bodySchema = {
  type: "object",
  required: ["company", "role", "location", "employmentType", "benefits"],
  properties: {
    company: { type: "string", minLength: 1 },
    role: { type: "string", minLength: 1 },
    location: { type: "string" },
    salary: {
      type: "object",
      required: ["amount", "currency"],
      properties: { amount: { type: "number" }, currency: { type: "string" } },
    },
    employmentType: { type: "string", enum: ["Permanent", "Contract"] },
    bonus: {
      type: "object",
      required: ["amount", "currency"],
      properties: { amount: { type: "number" }, currency: { type: "string" } },
    },
    benefits: { type: "array", items: { type: "string" } },
  },
} as const;

type SubmitApplicationBody = {
  company: string;
  role: string;
  location: string;
  salary?: { amount: number; currency: string };
  employmentType: "Permanent" | "Contract";
  bonus?: { amount: number; currency: string };
  benefits: string[];
};

export const registerSubmitApplicationRoute = (app: FastifyInstance): void => {
  app.post<{ Body: SubmitApplicationBody }>(
    "/applications",
    {
      schema: {
        tags: ["Applications"],
        summary: "Submit a new job application",
        body: bodySchema,
        response: {
          201: {
            type: "object",
            properties: { applicationId: { type: "string" } },
          },
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const applicationId = randomUUID();
      await handle(app.eventStore, applicationId, {
        type: "SubmitApplication",
        data: request.body,
        metadata: { now: new Date() },
      });
      await app.applicationIndex.register(applicationId);
      reply.code(201).send({ applicationId });
    },
  );
};
