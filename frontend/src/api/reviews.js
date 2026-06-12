import { apiJson } from "./client.js";

export const fetchPropertyReviews = (propertyId) =>
  apiJson(`/api/reviews/property/${propertyId}/`);

export const createPropertyReview = (propertyId, payload) =>
  apiJson(`/api/reviews/property/${propertyId}/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const fetchUserReviews = (userId) =>
  apiJson(`/api/reviews/user/${userId}/`);

export const createUserReview = (userId, payload) =>
  apiJson(`/api/reviews/user/${userId}/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
