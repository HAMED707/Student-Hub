import { apiJson } from "./client.js";

export const fetchMyBookings = () => apiJson("/api/bookings/my/");
export const createBooking = (payload) =>
  apiJson("/api/bookings/", { method: "POST", body: JSON.stringify(payload) });
export const updateBookingStatus = (bookingId, status) =>
  apiJson(`/api/bookings/${bookingId}/status/`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
