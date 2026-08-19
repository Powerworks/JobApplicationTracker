import { beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../../http/app.js";
import { resetDatabaseForTests } from "../../store/testing.js";

beforeEach(resetDatabaseForTests);

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

describe("GET /applications/active", () => {
  it("returns an empty list when no applications exist", async () => {
    const app = await buildApp();

    const response = await app.inject({ method: "GET", url: "/applications/active" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });

  it("lists only open applications, excluding closed ones", async () => {
    const app = await buildApp();
    const openId = await submitApplication(app);
    const closedId = await submitApplication(app);
    await app.inject({ method: "POST", url: `/applications/${closedId}/withdraw` });

    const response = await app.inject({ method: "GET", url: "/applications/active" });

    const ids = response.json().map((entry: { applicationId: string }) => entry.applicationId);
    expect(ids).toEqual([openId]);
  });
});
