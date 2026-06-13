import { apiJson } from "./client.js";
export { fetchUserReviews } from "./reviews.js";

export const fetchRoommateProfile = (userId) =>
  apiJson(`/api/roommates/profile/${userId}/`);

export const fetchMyRoommateProfile = () => apiJson("/api/roommates/profile/");
export const updateMyRoommateProfile = (payload) =>
  apiJson("/api/roommates/profile/", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const fetchRoommates = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "All") {
      query.set(key, value);
    }
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiJson(`/api/roommates/${suffix}`);
};

export const fetchRoommateMatches = () => apiJson("/api/roommates/matches/");

export const fetchRoommateRequests = () => apiJson("/api/roommates/requests/");

export const sendRoommateRequest = (payload) =>
  apiJson("/api/roommates/request/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateRoommateRequestStatus = (requestId, status) =>
  apiJson(`/api/roommates/request/${requestId}/`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
