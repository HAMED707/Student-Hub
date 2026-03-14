/**
 * serviceService.js
 * Central API layer for Services (nearby places + universities).
 *
 * Base URL:  http://localhost:8000/api/
 * Prefix:    services/  (from api/urls.py)
 */

const BASE_URL = "http://localhost:8000/api";

// ── Auth helper ───────────────────────────────────────────────────────────────
const getAuthHeaders = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.access) {
      return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.access}`,
      };
    }
  } catch {
    // corrupted storage — fall through to unauthenticated headers
  }
  return { "Content-Type": "application/json" };
};

// ── Response handler ──────────────────────────────────────────────────────────
const handleResponse = async (res) => {
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const err = await res.json();
      message = err.detail || err.error || JSON.stringify(err);
    } catch {
      // non-JSON error body
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
};

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/services/nearby/
 * Params: lat, lng, type, radius
 */
export const fetchNearbyServices = async ({ lat, lng, type, radius }) => {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    type,
    radius: String(radius),
  });
  const res = await fetch(`${BASE_URL}/services/nearby/?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * GET /api/services/university/
 * Params: name, type, radius
 */
export const fetchUniversityServices = async ({ name, type, radius }) => {
  const params = new URLSearchParams({
    name,
    type,
    radius: String(radius),
  });
  const res = await fetch(
    `${BASE_URL}/services/university/?${params.toString()}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse(res);
};

/**
 * GET /api/services/universities/
 * Public endpoint (no auth required).
 */
export const fetchServiceUniversities = async () => {
  const res = await fetch(`${BASE_URL}/services/universities/`, {
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
};

