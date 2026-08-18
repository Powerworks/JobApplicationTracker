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

describe("POST /applications/:applicationId/withdraw", () => {
  it("withdraws an open application (200)", async () => {
    const app = await buildApp();
    const applicationId = await submitApplication(app);

    const response = await app.inject({
      method: "POST",
      url: `/applications/${applicationId}/withdraw`,
    });

    expect(response.statusCode).toBe(200);
  });

  it("rejects an unknown applicationId (404)", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/applications/does-not-exist/withdraw",
    });

    expect(response.statusCode).toBe(404);
  });

  it("rejects withdrawing an already-closed application (409)", async () => {
    const app = await buildApp();
    const applicationId = await submitApplication(app);
    await app.inject({ method: "POST", url: `/applications/${applicationId}/withdraw` });

    const response = await app.inject({
      method: "POST",
      url: `/applications/${applicationId}/withdraw`,
    });

    expect(response.statusCode).toBe(409);
  });
});
