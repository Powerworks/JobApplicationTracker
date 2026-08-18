import { describe, expect, it } from "vitest";
import { buildApp } from "../../http/app.js";

const submitScheduleOfferReady = async (app: Awaited<ReturnType<typeof buildApp>>) => {
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
  await app.inject({
    method: "POST",
    url: `/applications/${applicationId}/interviews/outcome`,
    payload: { round: 1, outcome: "Passed" },
  });
  await app.inject({
    method: "POST",
    url: `/applications/${applicationId}/offer`,
    payload: { amount: 150000, deadline: "2026-09-01" },
  });
  return applicationId;
};

describe("POST /applications/:applicationId/offer/accept", () => {
  it("accepts a pending offer (200)", async () => {
    const app = await buildApp();
    const applicationId = await submitScheduleOfferReady(app);

    const response = await app.inject({
      method: "POST",
      url: `/applications/${applicationId}/offer/accept`,
    });

    expect(response.statusCode).toBe(200);
  });

  it("rejects an unknown applicationId (404)", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/applications/does-not-exist/offer/accept",
    });

    expect(response.statusCode).toBe(404);
  });

  it("rejects accepting twice (409)", async () => {
    const app = await buildApp();
    const applicationId = await submitScheduleOfferReady(app);
    await app.inject({ method: "POST", url: `/applications/${applicationId}/offer/accept` });

    const response = await app.inject({
      method: "POST",
      url: `/applications/${applicationId}/offer/accept`,
    });

    expect(response.statusCode).toBe(409);
  });
});
