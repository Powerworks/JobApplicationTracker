import { afterEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "./api-client.js";

const jsonResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("api-client", () => {
  it("submitApplication posts the given data to /applications and returns ok+data on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, { applicationId: "abc" }));
    vi.stubGlobal("fetch", fetchMock);

    const data = { company: "Acme", role: "Engineer", location: "Remote", employmentType: "Permanent", benefits: [] };
    const result = await apiClient.submitApplication(data);

    expect(fetchMock).toHaveBeenCalledWith(
      "/applications",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "content-type": "application/json" }),
        body: JSON.stringify(data),
      }),
    );
    expect(result).toEqual({ ok: true, data: { applicationId: "abc" } });
  });

  it("returns ok:false with the error body on a non-2xx response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(400, { error: "InvalidRequest", message: "bad" }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiClient.submitApplication({});

    expect(result).toEqual({
      ok: false,
      status: 400,
      error: "InvalidRequest",
      message: "bad",
    });
  });

  it("getActivePipeline calls GET /applications/active", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, []));
    vi.stubGlobal("fetch", fetchMock);

    await apiClient.getActivePipeline();

    expect(fetchMock).toHaveBeenCalledWith("/applications/active", expect.objectContaining({ method: "GET" }));
  });

  it("getApplication calls GET /applications/:id", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { status: "Open" }));
    vi.stubGlobal("fetch", fetchMock);

    await apiClient.getApplication("abc");

    expect(fetchMock).toHaveBeenCalledWith("/applications/abc", expect.objectContaining({ method: "GET" }));
  });

  it("scheduleInterview posts to /applications/:id/interviews", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, {}));
    vi.stubGlobal("fetch", fetchMock);

    await apiClient.scheduleInterview("abc", { round: 1, date: "2026-08-20" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/applications/abc/interviews",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ round: 1, date: "2026-08-20" }) }),
    );
  });

  it("acceptOffer posts to /applications/:id/offer/accept with no body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, {}));
    vi.stubGlobal("fetch", fetchMock);

    await apiClient.acceptOffer("abc");

    expect(fetchMock).toHaveBeenCalledWith(
      "/applications/abc/offer/accept",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("triggerGhostingCheck posts to /ghosting/check", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ghosted: [] }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiClient.triggerGhostingCheck();

    expect(fetchMock).toHaveBeenCalledWith("/ghosting/check", expect.objectContaining({ method: "POST" }));
    expect(result).toEqual({ ok: true, data: { ghosted: [] } });
  });

  it("rejects the promise on a network failure (fetch itself throws)", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiClient.getActivePipeline()).rejects.toThrow("network down");
  });
});
