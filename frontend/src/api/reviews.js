import { apiJson } from "./client.js";

export const fetchPropertyReviews = (propertyId) =>
  apiJson(`/api/reviews/property/${propertyId}/`);
