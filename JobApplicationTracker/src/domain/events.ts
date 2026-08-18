import type { Event } from "@event-driven-io/emmett";

export type InterviewOutcome = "Passed" | "Rejected";

export type EmploymentType = "Permanent" | "Contract";

export type MonetaryAmount = { amount: number; currency: string };

/** Every event carries `now` explicitly — Emmett does not auto-stamp business timestamps. */
export type EventMetadata = { now: string };

export type ApplicationSubmitted = Event<
  "ApplicationSubmitted",
  {
    company: string;
    role: string;
    location: string;
    salary?: MonetaryAmount;
    employmentType: EmploymentType;
    bonus?: MonetaryAmount;
    benefits: string[];
  },
  EventMetadata
>;

export type InterviewScheduled = Event<
  "InterviewScheduled",
  { round: number; date: string },
  EventMetadata
>;

export type InterviewCompleted = Event<
  "InterviewCompleted",
  { round: number; outcome: InterviewOutcome },
  EventMetadata
>;

export type OfferReceived = Event<
  "OfferReceived",
  { amount: number; deadline: string },
  EventMetadata
>;

export type OfferAccepted = Event<
  "OfferAccepted",
  Record<string, never>,
  EventMetadata
>;

export type OfferDeclined = Event<
  "OfferDeclined",
  Record<string, never>,
  EventMetadata
>;

export type ApplicationWithdrawn = Event<
  "ApplicationWithdrawn",
  Record<string, never>,
  EventMetadata
>;

export type ApplicationGhosted = Event<
  "ApplicationGhosted",
  Record<string, never>,
  EventMetadata
>;

export type ApplicationEvent =
  | ApplicationSubmitted
  | InterviewScheduled
  | InterviewCompleted
  | OfferReceived
  | OfferAccepted
  | OfferDeclined
  | ApplicationWithdrawn
  | ApplicationGhosted;
