import { apiJson } from "./client.js";

export const fetchProperties = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "All") {
      query.set(key, value);
    }
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiJson(`/api/properties/${suffix}`);
};

export const fetchPropertyDetail = (id) => apiJson(`/api/properties/${id}/`);
export const fetchFeaturedProperties = () => apiJson("/api/properties/featured/");
export const fetchUniversityProperties = (university) =>
  apiJson(`/api/properties/university/?university=${encodeURIComponent(university)}`);
export const fetchLandlordProperties = () => apiJson("/api/properties/landlord/properties/");
