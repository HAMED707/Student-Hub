import { apiJson, apiRequest } from "./client.js";

export const fetchFavorites = () => apiJson("/api/favorites/");
export const addFavorite = (property) => apiJson("/api/favorites/", { method: "POST", body: JSON.stringify({ property }) });
export const removeFavorite = (propertyId) => apiRequest(`/api/favorites/${propertyId}/`, { method: "DELETE" });

