import { refreshAccessToken } from '../api/clients'

const BASE = import.meta.env.VITE_API_URL || "http://localhost/sb-tracker-be";

function getToken() {
  return localStorage.getItem("access_token");
}

async function request(path, options = {}, isRetry = false) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  // Access token expired — try refreshing once
  if (res.status === 401 && !isRetry) {
    console.log("Access token expired, attempting refresh...");
    const newToken = await refreshAccessToken();

    if (!newToken) {
      console.log("Refresh failed, logging out...");
      throw new Error("Session expired. Please log in again.");
    }

    console.log("Token refreshed successfully, retrying request...");
    localStorage.setItem("access_token", newToken);
    return request(path, options, true);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  meta: () => request("/meta"),
  months: () => request("/months"),

  getEntries: (params = {}) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v && v !== "ALL"))
    ).toString();
    return request(`/entries${q ? "?" + q : ""}`);
  },

  createEntry: (body) =>
    request("/entries", { method: "POST", body: JSON.stringify(body) }),

  updateEntry: (id, body) =>
    request(`/entries/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  deleteEntry: (id) =>
    request(`/entries/${id}`, { method: "DELETE" }),

  summary: (params = {}) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v && v !== "ALL"))
    ).toString();
    return request(`/stats/summary${q ? "?" + q : ""}`);
  },

  byAM: (params = {}) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v && v !== "ALL"))
    ).toString();
    return request(`/stats/by-am${q ? "?" + q : ""}`);
  },

  byVertical: (params = {}) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v && v !== "ALL"))
    ).toString();
    return request(`/stats/by-vertical${q ? "?" + q : ""}`);
  },

  byClient: (params = {}) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v && v !== "ALL"))
    ).toString();
    return request(`/stats/by-client${q ? "?" + q : ""}`);
  },

  rollup: () => request("/stats/rollup"),
};
