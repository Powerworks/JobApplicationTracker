import type {
  ApplicationEvent,
  EmploymentType,
  InterviewOutcome,
  MonetaryAmount,
} from "./events.js";

export type ApplicationStatus =
  | "Open"
  | "Accepted"
  | "Declined"
  | "Withdrawn"
  | "Ghosted";

export type InterviewRound = {
  round: number;
  date: string;
  outcome: InterviewOutcome | "Pending";
};

export type Offer = {
  amount: number;
  deadline: string;
  decision: "Pending" | "Accepted" | "Declined";
};

export type NotSubmitted = { status: "NotSubmitted" };

export type SubmittedApplication = {
  status: ApplicationStatus;
  company: string;
  role: string;
  location: string;
  salary: MonetaryAmount | undefined;
  employmentType: EmploymentType;
  bonus: MonetaryAmount | undefined;
  benefits: string[];
  rounds: InterviewRound[];
  offer: Offer | undefined;
  lastActivityAt: string;
};

export type ApplicationState = NotSubmitted | SubmittedApplication;

export const initialState = (): ApplicationState => ({
  status: "NotSubmitted",
});

export const evolve = (
  state: ApplicationState,
  event: ApplicationEvent,
): ApplicationState => {
  switch (event.type) {
    case "ApplicationSubmitted":
      return {
        status: "Open",
        company: event.data.company,
        role: event.data.role,
        location: event.data.location,
        salary: event.data.salary,
        employmentType: event.data.employmentType,
        bonus: event.data.bonus,
        benefits: event.data.benefits,
        rounds: [],
        offer: undefined,
        lastActivityAt: event.metadata.now,
      };
    case "InterviewScheduled": {
      if (state.status === "NotSubmitted") return state;
      return {
        ...state,
        rounds: [
          ...state.rounds,
          { round: event.data.round, date: event.data.date, outcome: "Pending" },
        ],
        lastActivityAt: event.metadata.now,
      };
    }
    case "InterviewCompleted": {
      if (state.status === "NotSubmitted") return state;
      return {
        ...state,
        rounds: state.rounds.map((r) =>
          r.round === event.data.round
            ? { ...r, outcome: event.data.outcome }
            : r,
        ),
        lastActivityAt: event.metadata.now,
      };
    }
    case "OfferReceived": {
      if (state.status === "NotSubmitted") return state;
      return {
        ...state,
        offer: {
          amount: event.data.amount,
          deadline: event.data.deadline,
          decision: "Pending",
        },
        lastActivityAt: event.metadata.now,
      };
    }
    case "OfferAccepted": {
      if (state.status === "NotSubmitted") return state;
      return {
        ...state,
        status: "Accepted",
        offer: state.offer && { ...state.offer, decision: "Accepted" },
        lastActivityAt: event.metadata.now,
      };
    }
    case "OfferDeclined": {
      if (state.status === "NotSubmitted") return state;
      return {
        ...state,
        status: "Declined",
        offer: state.offer && { ...state.offer, decision: "Declined" },
        lastActivityAt: event.metadata.now,
      };
    }
    case "ApplicationWithdrawn": {
      if (state.status === "NotSubmitted") return state;
      return { ...state, status: "Withdrawn", lastActivityAt: event.metadata.now };
    }
    case "ApplicationGhosted": {
      if (state.status === "NotSubmitted") return state;
      return { ...state, status: "Ghosted", lastActivityAt: event.metadata.now };
    }
  }
};
