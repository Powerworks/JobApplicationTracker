import { describe, expect, it } from "vitest";
import { buildApp } from "../../http/app.js";
import { SILENCE_PERIOD_DAYS } from "./reactor.js";

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

const daysFromNow = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

describe("POST /ghosting/check", () => {
  it("succeeds with an empty list when nothing is silent", async () => {
    const app = await buildApp();
    await submitApplication(app);

    const response = await app.inject({ method: "POST", url: "/ghosting/check" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ghosted: [] });
  });

  it("ghosts an application silent past the configured period and removes it from the active overview", async () => {
    const app = await buildApp();
    const applicationId = await submitApplication(app);

    const response = await app.inject({
      method: "POST",
      url: "/ghosting/check",
      payload: { now: daysFromNow(SILENCE_PERIOD_DAYS + 1) },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().ghosted).toEqual([applicationId]);

    const overview = await app.inject({ method: "GET", url: "/applications/active" });
    expect(overview.json()).toEqual([]);
  });
});
