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

describe("GET /applications/:applicationId", () => {
  it("returns the full state of an open application", async () => {
    const app = await buildApp();
    const applicationId = await submitApplication(app);

    const response = await app.inject({ method: "GET", url: `/applications/${applicationId}` });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: "Open", company: "Acme" });
  });

  it("returns the full state of a closed application (unlike the active overview)", async () => {
    const app = await buildApp();
    const applicationId = await submitApplication(app);
    await app.inject({ method: "POST", url: `/applications/${applicationId}/withdraw` });

    const response = await app.inject({ method: "GET", url: `/applications/${applicationId}` });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: "Withdrawn" });
  });

  it("rejects an unknown applicationId (404)", async () => {
    const app = await buildApp();

    const response = await app.inject({ method: "GET", url: "/applications/does-not-exist" });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toHaveProperty("error", "ApplicationNotFound");
  });
});
