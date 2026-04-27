/**
 * bookingService.js
 * Central API layer for all booking-related calls.
 *
 * Base URL:  http://localhost:8000/api/
 * Prefix:    bookings/  
 */

const BASE_URL = "http://localhost:8000/api";

// Reads the JWT access token that AuthContext saves to localStorage on login.
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
    // corrupted storage
  }
  return { "Content-Type": "application/json" };
};

// Response handler
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

/**
 * POST /api/bookings/
 * Student creates a new booking request.
 * 
 * @param {Object} data  e.g. { property: 1, move_in_date: "2024-01-01", duration_months: 6 }
 */
export const createBooking = async (data) => {
  const res = await fetch(`${BASE_URL}/bookings/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

/**
 * GET /api/bookings/my/
 * Gets all bookings for the currently logged-in user.
 * Works for both students (their requests) and landlords (requests for their properties).
 */
export const fetchMyBookings = async () => {
  const res = await fetch(`${BASE_URL}/bookings/my/`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

/**
 * PATCH /api/bookings/<id>/status/
 * Update the status of a booking.
 * 
 * Landlord allowed statuses: "approved", "rejected", "completed"
 * Student allowed statuses: "cancelled"
 * 
 * @param {number|string} id 
 * @param {string} status 
 */
export const updateBookingStatus = async (id, status) => {
  const res = await fetch(`${BASE_URL}/bookings/${id}/status/`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
};
