/** Pure formatting helpers — no DOM/fetch access (contracts/frontend-modules.md). */

export const formatMoney = (amount, currency) => {
  if (amount === undefined || currency === undefined) return "not disclosed";
  return `${amount.toLocaleString("en-US")} ${currency}`;
};

export const formatIdleTime = (days) => {
  if (days === 0) return "today";
  return days === 1 ? "1 day" : `${days} days`;
};

/**
 * Mirrors src/read-models/active-pipeline/project.ts's currentStageOf() — kept in sync by test,
 * not by sharing code across the HTTP boundary (contracts/frontend-modules.md).
 */
export const describeStage = ({ status, rounds, offer }) => {
  if (status !== "Open") return status;
  if (offer && offer.decision === "Pending") return "Offer pending decision";
  const lastRound = rounds[rounds.length - 1];
  if (!lastRound) return "Awaiting first interview";
  if (lastRound.outcome === "Pending") return `Awaiting round ${lastRound.round} outcome`;
  if (lastRound.outcome === "Rejected") return `Round ${lastRound.round} rejected`;
  return `Passed round ${lastRound.round}, awaiting next step`;
};
