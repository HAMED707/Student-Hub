import { apiJson } from "./client.js";

export const fetchFavorites = () => apiJson("/api/favorites/");
export const addFavorite = (property) => apiJson("/api/favorites/", { method: "POST", body: JSON.stringify({ property }) });
export const removeFavorite = (propertyId) =>
  apiJson(`/api/favorites/${propertyId}/`, { method: "DELETE" });
