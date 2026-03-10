/**
 * propertyService.js
 * Central API layer for all property-related calls.
 * Every component imports from here — no raw fetch() calls in pages.
 *
 * Base URL:  http://localhost:8000/api/
 * Prefix:    properties/  (from api/urls.py)
 * Endpoints: <defined in properties_api/urls.py>
 * Result:    http://localhost:8000/api/properties/...
 */

const BASE_URL = "http://localhost:8000/api";

// ── Auth helper ───────────────────────────────────────────────────────────────
// Reads the JWT access token that AuthContext saves to localStorage on login.
// Injected into every protected request automatically.
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
// Throws a proper Error with the backend's message so components can catch it.
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
  // 204 No Content has no body
  if (res.status === 204) return null;
  return res.json();
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ENDPOINTS (no token required — IsAuthenticatedOrReadOnly)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/properties/
 * Full filtered listing. Params are passed directly as query string.
 *
 * Supported params (all optional):
 *   city, district, type, status,
 *   price_min, price_max, num_beds, num_rooms,
 *   gender, university, amenity, is_featured
 *
 * @param {Object} filters  e.g. { city: "Cairo", type: "studio", price_max: 5000 }
 * @returns {Promise<Array>} list of PropertyListSerializer objects
 */
export const fetchProperties = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== "" && val !== null && val !== undefined) {
      params.append(key, val);
    }
  });
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${BASE_URL}/properties/${query}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * GET /api/properties/featured/
 * Returns is_featured=True available listings.
 * Used by Home page "Featured Properties" section.
 *
 * @returns {Promise<Array>}
 */
export const fetchFeaturedProperties = async () => {
  const res = await fetch(`${BASE_URL}/properties/featured/`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * GET /api/properties/university/?university=<name>
 * Returns listings near a specific university.
 * Used by Home page "Find by University" section.
 *
 * @param {string} university  e.g. "Cairo University"
 * @returns {Promise<Array>}
 */
export const fetchPropertiesByUniversity = async (university) => {
  const params = new URLSearchParams({ university });
  const res = await fetch(
    `${BASE_URL}/properties/university/?${params.toString()}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse(res);
};

/**
 * GET /api/properties/<id>/
 * Full property detail. Also increments view_count server-side.
 * Used by PropertyDetails page.
 *
 * @param {number|string} id
 * @returns {Promise<Object>} PropertySerializer object
 */
export const fetchPropertyById = async (id) => {
  const res = await fetch(`${BASE_URL}/properties/${id}/`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED ENDPOINTS (JWT token required)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/properties/create/
 * Landlord creates a new listing.
 * Sends as FormData to support file uploads (images).
 *
 * @param {FormData} formData  includes all Property fields + optional images array
 * @returns {Promise<Object>} full PropertySerializer of the created property
 */
export const createProperty = async (formData) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const res = await fetch(`${BASE_URL}/properties/create/`, {
    method: "POST",
    headers: {
      // NOTE: Do NOT set Content-Type when sending FormData.
      // The browser sets it automatically with the correct multipart boundary.
      Authorization: `Bearer ${user?.access}`,
    },
    body: formData,
  });
  return handleResponse(res);
};

/**
 * PATCH /api/properties/<id>/edit/
 * Landlord edits their own listing. Only the owner can call this.
 *
 * @param {number|string} id
 * @param {Object} data  partial update fields
 * @returns {Promise<Object>} updated PropertySerializer
 */
export const updateProperty = async (id, data) => {
  const res = await fetch(`${BASE_URL}/properties/${id}/edit/`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

/**
 * GET /api/properties/landlord/properties/
 * Landlord dashboard — their own listings only.
 *
 * @returns {Promise<Array>}
 */
export const fetchMyProperties = async () => {
  const res = await fetch(`${BASE_URL}/properties/landlord/properties/`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/properties/<id>/images/
 * Upload images to an existing listing.
 * Send files as FormData with key "images" (multiple allowed).
 *
 * @param {number|string} propertyId
 * @param {FileList|File[]} images
 * @returns {Promise<Array>} list of PropertyImageSerializer objects
 */
export const uploadPropertyImages = async (propertyId, images) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const formData = new FormData();
  Array.from(images).forEach((file) => formData.append("images", file));
  const res = await fetch(
    `${BASE_URL}/properties/${propertyId}/images/`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${user?.access}` },
      body: formData,
    }
  );
  return handleResponse(res);
};

/**
 * DELETE /api/properties/<id>/images/<imageId>/
 * Remove a single image from a listing.
 *
 * @param {number|string} propertyId
 * @param {number|string} imageId
 * @returns {Promise<null>}
 */
export const deletePropertyImage = async (propertyId, imageId) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const res = await fetch(
    `${BASE_URL}/properties/${propertyId}/images/${imageId}/`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${user?.access}` },
    }
  );
  return handleResponse(res);
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA NORMALIZER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * normalizeProperty(raw)
 * Maps backend field names → the field names PropertyCard expects.
 * Call this on every item before passing it to <PropertyCard />.
 *
 * Backend sends:          PropertyCard reads:
 *   cover_image        →    image
 *   city + district    →    location
 *   distance_to_uni    →    universityDistance
 *   num_roommates      →    roommates
 *   average_rating     →    rating
 *   review_count       →    reviews
 *
 * @param {Object} raw  raw API response object
 * @returns {Object}    normalized object safe to pass to PropertyCard
 */
export const normalizeProperty = (raw) => ({
  // pass everything through first so no backend field is lost
  ...raw,
  // ── field renames ─────────────────────────────────────────
  image: raw.cover_image || "https://placehold.co/600x400/e2e8f0/1e293b?text=Room+Image",
  location: raw.district ? `${raw.city} - ${raw.district}` : raw.city,
  universityDistance: raw.distance_to_university || "",
  roommates: raw.num_roommates ?? 0,
  rating: raw.average_rating ?? 0,
  reviews: raw.review_count ?? 0,
});
