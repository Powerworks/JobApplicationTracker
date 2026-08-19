import { getActivePipeline, triggerGhostingCheck } from "../api-client.js";
import { formatIdleTime } from "../format.js";

const rowHtml = (entry) => `
  <tr>
    <td><a href="#/applications/${entry.applicationId}">${entry.company} — ${entry.role}</a></td>
    <td>${entry.currentStage}</td>
    <td>${formatIdleTime(entry.daysSinceLastActivity)}</td>
  </tr>
`;

const listHtml = (entries) =>
  entries.length === 0
    ? `<p class="empty-state">No applications tracked yet. <a href="#/new">Submit one</a> to get started.</p>`
    : `
      <table>
        <thead><tr><th>Application</th><th>Stage</th><th>Idle</th></tr></thead>
        <tbody>${entries.map(rowHtml).join("")}</tbody>
      </table>
    `;

const load = async (element) => {
  const result = await getActivePipeline();
  if (!result.ok) {
    element.innerHTML = `<p class="error">${result.message ?? "Could not load the overview."}</p>`;
    return;
  }

  element.innerHTML = `
    <h2>Active pipeline</h2>
    <button id="ghosting-check">Check for ghosted applications</button>
    <p id="ghosting-result"></p>
    ${listHtml(result.data)}
  `;

  element.querySelector("#ghosting-check").addEventListener("click", async () => {
    const resultEl = element.querySelector("#ghosting-result");
    const ghostingResult = await triggerGhostingCheck();
    resultEl.textContent = ghostingResult.ok
      ? `${ghostingResult.data.ghosted.length} application(s) ghosted.`
      : (ghostingResult.message ?? "Could not run the ghosting check.");
    await load(element);
  });
};

export const renderOverview = async (element) => {
  await load(element);
};
