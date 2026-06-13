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
export const fetchLandlordDashboard = () => apiJson("/api/properties/landlord/dashboard/");

export const createProperty = (payload) =>
  apiJson("/api/properties/create/", {
    method: "POST",
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });

export const updateProperty = (propertyId, payload) =>
  apiJson(`/api/properties/${propertyId}/edit/`, {
    method: "PATCH",
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });

export const deleteProperty = (propertyId) =>
  apiJson(`/api/properties/${propertyId}/`, {
    method: "DELETE",
  });

export const uploadPropertyImages = (propertyId, files = []) => {
  const body = new FormData();
  files.forEach((file) => body.append("images", file));
  return apiJson(`/api/properties/${propertyId}/images/`, {
    method: "POST",
    body,
  });
};

export const deletePropertyImage = (propertyId, imageId) =>
  apiJson(`/api/properties/${propertyId}/images/${imageId}/`, {
    method: "DELETE",
  });
