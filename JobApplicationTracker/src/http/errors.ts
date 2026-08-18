import { IllegalStateError } from "@event-driven-io/emmett";
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";

/** Thrown by a route's pre-check when `applicationId` has no prior events (research.md). */
export class ApplicationNotFoundError extends Error {
  constructor(applicationId: string) {
    super(`No application with id ${applicationId}`);
    this.name = "ApplicationNotFoundError";
  }
}

/**
 * Three-tier mapping per research.md: Fastify validation → 400, ApplicationNotFoundError → 404,
 * IllegalStateError (feature 001/002's existing guard errors) → 409. No other error mapping is
 * introduced — this is a pure translation layer, not new guard logic.
 */
export const errorHandler = (
  error: FastifyError | Error,
  _request: FastifyRequest,
  reply: FastifyReply,
): void => {
  if ("validation" in error && error.validation) {
    reply
      .code(400)
      .send({ error: "InvalidRequest", message: error.message });
    return;
  }
  if (error instanceof ApplicationNotFoundError) {
    reply.code(404).send({ error: "ApplicationNotFound", message: error.message });
    return;
  }
  if (error instanceof IllegalStateError) {
    reply.code(409).send({ error: "IllegalStateError", message: error.message });
    return;
  }
  reply.code(500).send({ error: "InternalError", message: error.message });
};
