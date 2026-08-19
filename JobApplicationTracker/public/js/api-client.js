/**
 * The frontend's sole HTTP boundary — every backend call goes through one of these functions
 * (contracts/frontend-modules.md). Resolves to { ok: true, data } on 2xx, or
 * { ok: false, status, error, message } on a non-2xx response. A network failure (fetch itself
 * throwing) rejects the promise — the only case callers need to catch, per research.md/spec.md
 * FR-009's "backend unreachable" distinction from a normal rejection.
 */
const request = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: options.body ? { "content-type": "application/json", ...options.headers } : options.headers,
  });
  const body = await response.json();
  if (!response.ok) {
    return { ok: false, status: response.status, error: body.error, message: body.message };
  }
  return { ok: true, data: body };
};

const post = (url, data) =>
  request(url, { method: "POST", body: data !== undefined ? JSON.stringify(data) : undefined });

const get = (url) => request(url, { method: "GET" });

export const submitApplication = (data) => post("/applications", data);

export const getActivePipeline = () => get("/applications/active");

export const getApplication = (applicationId) => get(`/applications/${applicationId}`);

export const scheduleInterview = (applicationId, data) =>
  post(`/applications/${applicationId}/interviews`, data);

export const recordInterviewOutcome = (applicationId, data) =>
  post(`/applications/${applicationId}/interviews/outcome`, data);

export const receiveOffer = (applicationId, data) =>
  post(`/applications/${applicationId}/offer`, data);

export const acceptOffer = (applicationId) =>
  post(`/applications/${applicationId}/offer/accept`);

export const declineOffer = (applicationId) =>
  post(`/applications/${applicationId}/offer/decline`);

export const withdrawApplication = (applicationId) =>
  post(`/applications/${applicationId}/withdraw`);

export const triggerGhostingCheck = () => post("/ghosting/check");
