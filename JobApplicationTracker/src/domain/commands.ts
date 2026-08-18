import type { Command } from "@event-driven-io/emmett";
import type { InterviewOutcome } from "./events.js";

export type SubmitApplication = Command<
  "SubmitApplication",
  { company: string; role: string }
>;

export type ScheduleInterview = Command<
  "ScheduleInterview",
  { round: number; date: string }
>;

export type RecordInterviewOutcome = Command<
  "RecordInterviewOutcome",
  { round: number; outcome: InterviewOutcome }
>;

export type ReceiveOffer = Command<
  "ReceiveOffer",
  { amount: number; deadline: string }
>;

export type AcceptOffer = Command<"AcceptOffer", Record<string, never>>;

export type DeclineOffer = Command<"DeclineOffer", Record<string, never>>;

export type WithdrawApplication = Command<
  "WithdrawApplication",
  Record<string, never>
>;

export type ApplicationCommand =
  | SubmitApplication
  | ScheduleInterview
  | RecordInterviewOutcome
  | ReceiveOffer
  | AcceptOffer
  | DeclineOffer
  | WithdrawApplication;
