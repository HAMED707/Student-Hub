import { clearSession, getStoredRefreshToken, getStoredToken } from "../utils/auth.js";

const DEFAULT_BASE_URL = "http://localhost:8000";

export const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  DEFAULT_BASE_URL;

const toAbsoluteUrl = (path) => {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/")) return `${API_BASE_URL}${path}`;
  return `${API_BASE_URL}/${path}`;
};

const readToken = () => getStoredToken();

const writeToken = (token) => {
  try {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  } catch {
    // ignore
  }
};

const readRefreshToken = () => getStoredRefreshToken();

const refreshAccessToken = async () => {
  const refresh = readRefreshToken();
  if (!refresh) return null;

  const response = await fetch(toAbsoluteUrl("/api/token/refresh/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    clearSession();
    return null;
  }
  const data = await response.json();
  if (data?.access) writeToken(data.access);
  return data?.access || null;
};

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = readToken();

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const requestOptions = { ...options, headers };
  let response = await fetch(toAbsoluteUrl(path), requestOptions);

  if (response.status === 401 && !options._retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const retryHeaders = new Headers(requestOptions.headers);
      retryHeaders.set("Authorization", `Bearer ${refreshed}`);
      response = await fetch(toAbsoluteUrl(path), {
        ...requestOptions,
        headers: retryHeaders,
        _retry: true,
      });
    } else if (token || readRefreshToken()) {
      clearSession();
    }
  }

  return response;
}

export async function apiJson(path, options = {}) {
  const response = await apiRequest(path, options);
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const firstPayloadMessage =
      payload && typeof payload === "object"
        ? Object.values(payload)
            .flatMap((value) => (Array.isArray(value) ? value : [value]))
            .find((value) => typeof value === "string" && value.trim())
        : null;

    const error = new Error(
      payload?.error || payload?.detail || firstPayloadMessage || "Request failed",
    );
    error.response = response;
    error.data = payload;
    throw error;
  }

  return payload;
}

export const withApiUrl = toAbsoluteUrl;
