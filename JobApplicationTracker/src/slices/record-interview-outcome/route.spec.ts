import { describe, expect, it } from "vitest";
import { buildApp } from "../../http/app.js";

const submitAndSchedule = async (app: Awaited<ReturnType<typeof buildApp>>) => {
  const submit = await app.inject({
    method: "POST",
    url: "/applications",
    payload: {
      company: "Acme",
      role: "Engineer",
      location: "Remote",
      employmentType: "Permanent",
      benefits: [],
    },
  });
  const applicationId = submit.json().applicationId as string;
  await app.inject({
    method: "POST",
    url: `/applications/${applicationId}/interviews`,
    payload: { round: 1, date: "2026-08-20" },
  });
  return applicationId;
};

describe("POST /applications/:applicationId/interviews/outcome", () => {
  it("records a Passed outcome (200)", async () => {
    const app = await buildApp();
    const applicationId = await submitAndSchedule(app);

    const response = await app.inject({
      method: "POST",
      url: `/applications/${applicationId}/interviews/outcome`,
      payload: { round: 1, outcome: "Passed" },
    });

    expect(response.statusCode).toBe(200);
  });

  it("rejects an unknown applicationId (404)", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/applications/does-not-exist/interviews/outcome",
      payload: { round: 1, outcome: "Passed" },
    });

    expect(response.statusCode).toBe(404);
  });

  it("rejects an outcome for a non-pending round (409)", async () => {
    const app = await buildApp();
    const applicationId = await submitAndSchedule(app);

    const response = await app.inject({
      method: "POST",
      url: `/applications/${applicationId}/interviews/outcome`,
      payload: { round: 2, outcome: "Passed" },
    });

    expect(response.statusCode).toBe(409);
  });

  it("rejects a malformed body (400)", async () => {
    const app = await buildApp();
    const applicationId = await submitAndSchedule(app);

    const response = await app.inject({
      method: "POST",
      url: `/applications/${applicationId}/interviews/outcome`,
      payload: { round: 1, outcome: "Maybe" },
    });

    expect(response.statusCode).toBe(400);
  });
});
