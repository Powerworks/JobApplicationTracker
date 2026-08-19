/**
 * Shared response-schema fragments for OpenAPI generation (@fastify/swagger) — HTTP
 * documentation infra, not business logic, same category as errors.ts.
 */
export const errorResponseSchema = {
  type: "object",
  properties: {
    error: { type: "string" },
    message: { type: "string" },
  },
} as const;

export const emptySuccessResponseSchema = {
  type: "object",
} as const;

export const monetaryAmountSchema = {
  type: "object",
  properties: {
    amount: { type: "number" },
    currency: { type: "string" },
  },
} as const;

export const applicationStateSchema = {
  type: "object",
  properties: {
    applicationId: { type: "string" },
    status: {
      type: "string",
      enum: ["Open", "Accepted", "Declined", "Withdrawn", "Ghosted"],
    },
    company: { type: "string" },
    role: { type: "string" },
    location: { type: "string" },
    employmentType: { type: "string", enum: ["Permanent", "Contract"] },
    salary: monetaryAmountSchema,
    bonus: monetaryAmountSchema,
    benefits: { type: "array", items: { type: "string" } },
    rounds: {
      type: "array",
      items: {
        type: "object",
        properties: {
          round: { type: "number" },
          date: { type: "string" },
          outcome: { type: "string", enum: ["Pending", "Passed", "Rejected"] },
        },
      },
    },
    offer: {
      type: "object",
      properties: {
        amount: { type: "number" },
        deadline: { type: "string" },
        decision: { type: "string", enum: ["Pending", "Accepted", "Declined"] },
      },
    },
    lastActivityAt: { type: "string" },
  },
} as const;

export const activePipelineEntrySchema = {
  type: "object",
  properties: {
    applicationId: { type: "string" },
    company: { type: "string" },
    role: { type: "string" },
    currentStage: { type: "string" },
    daysSinceLastActivity: { type: "number" },
  },
} as const;
