import { describe, expect, it } from "vitest";
import { buildApp } from "../../http/app.js";

describe("POST /applications", () => {
  it("submits a new application and returns its id (201)", async () => {
    const app = await buildApp();
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

    expect(response.statusCode).toBe(201);
    expect(response.json()).toHaveProperty("applicationId");
  });

  it("rejects a request missing required fields (400)", async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/applications",
      payload: { company: "Acme" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toHaveProperty("error", "InvalidRequest");
  });

  it("rejects a request with an empty-string company (400)", async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/applications",
      payload: {
        company: "",
        role: "Engineer",
        location: "Remote",
        employmentType: "Permanent",
        benefits: [],
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toHaveProperty("error", "InvalidRequest");
  });
});
