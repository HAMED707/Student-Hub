import { apiJson } from "./client.js";
export { fetchUserReviews } from "./reviews.js";

export const fetchRoommateProfile = (userId) =>
  apiJson(`/api/roommates/profile/${userId}/`);

export const fetchMyRoommateProfile = () => apiJson("/api/roommates/profile/");

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
