import {
  acceptOffer,
  declineOffer,
  getApplication,
  receiveOffer,
  recordInterviewOutcome,
  scheduleInterview,
  withdrawApplication,
} from "../api-client.js";
import { describeStage, formatMoney } from "../format.js";

const errorHtml = (message) => (message ? `<p class="error">${message}</p>` : "");

const actionsFor = (application) => {
  if (application.status !== "Open") return [];

  const actions = [];
  const lastRound = application.rounds[application.rounds.length - 1];
  const hasPendingOffer = application.offer && application.offer.decision === "Pending";

  if (hasPendingOffer) {
    actions.push("acceptOffer", "declineOffer");
  } else if (!lastRound) {
    actions.push("scheduleInterview");
  } else if (lastRound.outcome === "Pending") {
    actions.push("recordOutcome");
  } else if (lastRound.outcome === "Passed") {
    actions.push("scheduleInterview", "receiveOffer");
  }

  actions.push("withdraw");
  return actions;
};

const detailHtml = (application, errorMessage) => `
  <p><a href="#/">&larr; Back to overview</a></p>
  <h2>${application.company} — ${application.role}</h2>
  <p>${application.location} · ${application.employmentType}</p>
  <p>Status: <strong>${describeStage(application)}</strong></p>
  <p>Salary: ${formatMoney(application.salary?.amount, application.salary?.currency)}</p>
  <p>Bonus: ${formatMoney(application.bonus?.amount, application.bonus?.currency)}</p>
  <p>Benefits: ${application.benefits.length ? application.benefits.join(", ") : "none listed"}</p>
  ${errorHtml(errorMessage)}
  <div class="actions" id="detail-actions"></div>
`;

const actionForms = {
  scheduleInterview: (nextRound) => `
    <form data-action="scheduleInterview" data-round="${nextRound}">
      <label>Round ${nextRound} date <input name="date" type="date" required /></label>
      <button type="submit">Schedule interview</button>
    </form>`,
  recordOutcome: (round) => `
    <form data-action="recordOutcome" data-round="${round}">
      <label>Round ${round} outcome
        <select name="outcome" required>
          <option value="Passed">Passed</option>
          <option value="Rejected">Rejected</option>
        </select>
      </label>
      <button type="submit">Record outcome</button>
    </form>`,
  receiveOffer: () => `
    <form data-action="receiveOffer">
      <label>Offer amount <input name="amount" type="number" required /></label>
      <label>Currency <input name="currency" placeholder="USD" required /></label>
      <label>Decision deadline <input name="deadline" type="date" required /></label>
      <button type="submit">Record offer</button>
    </form>`,
  acceptOffer: () => `<button data-action="acceptOffer">Accept offer</button>`,
  declineOffer: () => `<button data-action="declineOffer">Decline offer</button>`,
  withdraw: () => `<button data-action="withdraw">Withdraw</button>`,
};

const runAction = (applicationId, action, form) => {
  const formData = form.tagName === "FORM" ? new FormData(form) : undefined;
  switch (action) {
    case "scheduleInterview":
      return scheduleInterview(applicationId, {
        round: Number(form.dataset.round),
        date: formData.get("date"),
      });
    case "recordOutcome":
      return recordInterviewOutcome(applicationId, {
        round: Number(form.dataset.round),
        outcome: formData.get("outcome"),
      });
    case "receiveOffer":
      return receiveOffer(applicationId, {
        amount: Number(formData.get("amount")),
        currency: formData.get("currency"),
        deadline: formData.get("deadline"),
      });
    case "acceptOffer":
      return acceptOffer(applicationId);
    case "declineOffer":
      return declineOffer(applicationId);
    case "withdraw":
      return withdrawApplication(applicationId);
    default:
      throw new Error(`Unknown action: ${action}`);
  }
};

const load = async (element, applicationId, errorMessage) => {
  const result = await getApplication(applicationId);
  if (!result.ok) {
    element.innerHTML = `<p class="error">${result.message ?? "Could not load this application."}</p>`;
    return;
  }

  const application = result.data;
  element.innerHTML = detailHtml(application, errorMessage);

  const actionsEl = element.querySelector("#detail-actions");
  const nextRound = application.rounds.length + 1;
  const lastRound = application.rounds[application.rounds.length - 1];

  for (const action of actionsFor(application)) {
    actionsEl.insertAdjacentHTML(
      "beforeend",
      action === "scheduleInterview"
        ? actionForms.scheduleInterview(nextRound)
        : action === "recordOutcome"
          ? actionForms.recordOutcome(lastRound.round)
          : actionForms[action](),
    );
  }

  const handleResult = async (result) => {
    await load(element, applicationId, result.ok ? undefined : result.message);
  };

  actionsEl.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await handleResult(await runAction(applicationId, form.dataset.action, form));
    });
  });

  actionsEl.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      await handleResult(await runAction(applicationId, button.dataset.action, button));
    });
  });
};

export const renderApplicationDetail = async (element, { applicationId }) => {
  await load(element, applicationId);
};
