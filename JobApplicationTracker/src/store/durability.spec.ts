import { beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../http/app.js";
import { resetDatabaseForTests } from "./testing.js";

beforeEach(resetDatabaseForTests);

describe("durability across a simulated restart", () => {
  it("a second, independent app instance sees everything the first wrote (spec.md FR-002/FR-005)", async () => {
    const firstApp = await buildApp();

    const submit = await firstApp.inject({
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
    await firstApp.inject({
      method: "POST",
      url: `/applications/${applicationId}/interviews`,
      payload: { round: 1, date: "2026-08-20" },
    });
    await firstApp.inject({
      method: "POST",
      url: `/applications/${applicationId}/interviews/outcome`,
      payload: { round: 1, outcome: "Passed" },
    });

    // A brand-new app instance, built independently — no shared in-process state with firstApp,
    // just the same DATABASE_URL. This is the closest thing to an OS-level process restart an
    // automated test can exercise (quickstart.md covers the real thing manually).
    const secondApp = await buildApp();

    const detail = await secondApp.inject({
      method: "GET",
      url: `/applications/${applicationId}`,
    });
    expect(detail.json()).toMatchObject({
      status: "Open",
      company: "Acme",
      rounds: [{ round: 1, date: "2026-08-20", outcome: "Passed" }],
    });

    const overview = await secondApp.inject({ method: "GET", url: "/applications/active" });
    expect(overview.json()).toEqual([
      expect.objectContaining({ applicationId, company: "Acme" }),
    ]);

    // Further action on the second instance succeeds under the same guards as before.
    const offer = await secondApp.inject({
      method: "POST",
      url: `/applications/${applicationId}/offer`,
      payload: { amount: 150000, deadline: "2026-09-01" },
    });
    expect(offer.statusCode).toBe(200);
  });
});
