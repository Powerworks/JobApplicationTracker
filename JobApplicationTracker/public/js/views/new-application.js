import { submitApplication } from "../api-client.js";

const formHtml = () => `
  <h2>New application</h2>
  <form id="new-application-form">
    <p class="error" id="new-application-error" hidden></p>
    <label>Company <input name="company" required /></label>
    <label>Role <input name="role" required /></label>
    <label>Location <input name="location" required /></label>
    <label>
      Employment type
      <select name="employmentType" required>
        <option value="Permanent">Permanent</option>
        <option value="Contract">Contract</option>
      </select>
    </label>
    <label>Salary amount (optional) <input name="salaryAmount" type="number" /></label>
    <label>Salary currency (optional) <input name="salaryCurrency" placeholder="USD" /></label>
    <label>Bonus amount (optional) <input name="bonusAmount" type="number" /></label>
    <label>Bonus currency (optional) <input name="bonusCurrency" placeholder="USD" /></label>
    <label>Benefits (comma-separated, optional) <input name="benefits" /></label>
    <button type="submit">Submit application</button>
  </form>
`;

const toBody = (formData) => {
  const salaryAmount = formData.get("salaryAmount");
  const salaryCurrency = formData.get("salaryCurrency");
  const bonusAmount = formData.get("bonusAmount");
  const bonusCurrency = formData.get("bonusCurrency");
  const benefits = formData.get("benefits");

  return {
    company: formData.get("company"),
    role: formData.get("role"),
    location: formData.get("location"),
    employmentType: formData.get("employmentType"),
    ...(salaryAmount && salaryCurrency
      ? { salary: { amount: Number(salaryAmount), currency: salaryCurrency } }
      : {}),
    ...(bonusAmount && bonusCurrency
      ? { bonus: { amount: Number(bonusAmount), currency: bonusCurrency } }
      : {}),
    benefits: benefits
      ? benefits.split(",").map((b) => b.trim()).filter(Boolean)
      : [],
  };
};

export const renderNewApplication = (element) => {
  element.innerHTML = formHtml();
  const form = element.querySelector("#new-application-form");
  const errorEl = element.querySelector("#new-application-error");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorEl.hidden = true;

    const result = await submitApplication(toBody(new FormData(form)));

    if (!result.ok) {
      errorEl.textContent = result.message ?? "Something went wrong.";
      errorEl.hidden = false;
      return;
    }

    window.location.hash = `#/applications/${result.data.applicationId}`;
  });
};
