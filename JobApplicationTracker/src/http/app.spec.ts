import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

describe("app", () => {
  it("boots and has an eventStore decoration available to routes", async () => {
    const app = await buildApp();
    expect(app.eventStore).toBeDefined();
  });

  it("maps an unknown route to a 404 (Fastify default, not our ApplicationNotFoundError)", async () => {
    const app = await buildApp();
    const response = await app.inject({ method: "GET", url: "/does-not-exist" });
    expect(response.statusCode).toBe(404);
  });
});
