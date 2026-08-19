import { describe, expect, it } from "vitest";
import { describeStage, formatIdleTime, formatMoney } from "./format.js";

describe("formatMoney", () => {
  it("formats an amount with its currency", () => {
    expect(formatMoney(150000, "USD")).toBe("150,000 USD");
  });

  it("returns a placeholder when the amount is not given", () => {
    expect(formatMoney(undefined, undefined)).toBe("not disclosed");
  });
});

describe("formatIdleTime", () => {
  it("says 'today' for 0 days", () => {
    expect(formatIdleTime(0)).toBe("today");
  });

  it("uses singular for 1 day", () => {
    expect(formatIdleTime(1)).toBe("1 day");
  });

  it("uses plural for N days", () => {
    expect(formatIdleTime(5)).toBe("5 days");
  });
});

describe("describeStage", () => {
  it("describes a closed application by its status", () => {
    expect(describeStage({ status: "Accepted", rounds: [], offer: undefined })).toBe("Accepted");
  });

  it("describes an application with no interviews yet", () => {
    expect(describeStage({ status: "Open", rounds: [], offer: undefined })).toBe(
      "Awaiting first interview",
    );
  });

  it("describes an application awaiting a round's outcome", () => {
    expect(
      describeStage({
        status: "Open",
        rounds: [{ round: 1, date: "2026-08-20", outcome: "Pending" }],
        offer: undefined,
      }),
    ).toBe("Awaiting round 1 outcome");
  });

  it("describes an application whose latest round was rejected", () => {
    expect(
      describeStage({
        status: "Open",
        rounds: [{ round: 1, date: "2026-08-20", outcome: "Rejected" }],
        offer: undefined,
      }),
    ).toBe("Round 1 rejected");
  });

  it("describes an application that passed and is awaiting next step", () => {
    expect(
      describeStage({
        status: "Open",
        rounds: [{ round: 1, date: "2026-08-20", outcome: "Passed" }],
        offer: undefined,
      }),
    ).toBe("Passed round 1, awaiting next step");
  });

  it("describes an application with a pending offer", () => {
    expect(
      describeStage({
        status: "Open",
        rounds: [{ round: 1, date: "2026-08-20", outcome: "Passed" }],
        offer: { amount: 150000, currency: "USD", decision: "Pending" },
      }),
    ).toBe("Offer pending decision");
  });
});
