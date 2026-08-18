import { describe, expect, it } from "vitest";
import { buildApp } from "../../http/app.js";

const submitApplication = async (app: Awaited<ReturnType<typeof buildApp>>) => {
  const response = await app.inject({
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
  return response.json().applicationId as string;
};

describe("POST /applications/:applicationId/interviews", () => {
  it("schedules round 1 (200)", async () => {
    const app = await buildApp();
    const applicationId = await submitApplication(app);

    const response = await app.inject({
      method: "POST",
      url: `/applications/${applicationId}/interviews`,
      payload: { round: 1, date: "2026-08-20" },
    });

    expect(response.statusCode).toBe(200);
  });

  it("rejects a malformed body (400)", async () => {
    const app = await buildApp();
    const applicationId = await submitApplication(app);

    const response = await app.inject({
      method: "POST",
      url: `/applications/${applicationId}/interviews`,
      payload: { round: "not-a-number" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("rejects an unknown applicationId (404)", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/applications/does-not-exist/interviews",
      payload: { round: 1, date: "2026-08-20" },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toHaveProperty("error", "ApplicationNotFound");
  });

  it("rejects an out-of-sequence round (409)", async () => {
    const app = await buildApp();
    const applicationId = await submitApplication(app);

    const response = await app.inject({
      method: "POST",
      url: `/applications/${applicationId}/interviews`,
      payload: { round: 2, date: "2026-08-27" },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toHaveProperty("error", "IllegalStateError");
  });
});
