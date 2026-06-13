import { apiJson } from "./client.js";
import { storeSession, updateStoredUser } from "../utils/auth.js";

const buildRequestOptions = (method, payload) =>
  payload instanceof FormData
    ? { method, body: payload }
    : { method, body: JSON.stringify(payload) };

export const loginUser = async (payload) => {
  const data = await apiJson("/api/auth/login/", buildRequestOptions("POST", payload));
  storeSession(data);
  return data;
};

export const loginWithGoogle = async (idToken) => {
  const data = await apiJson("/api/auth/google/", buildRequestOptions("POST", { id_token: idToken }));
  storeSession(data);
  return data;
};

export const completeOnboarding = async (payload) => {
  const data = await apiJson("/api/auth/complete-onboarding/", buildRequestOptions("POST", payload));
  storeSession(data);
  return data;
};

export const registerUser = async (payload) => {
  const data = await apiJson("/api/auth/register/", buildRequestOptions("POST", payload));
  storeSession(data);
  return data;
};

export const fetchMyProfile = () => apiJson("/api/auth/profile/");

export const fetchPublicProfile = (userId) => apiJson(`/api/auth/profile/${userId}/`);

export const deleteMyAccount = () =>
  apiJson("/api/auth/profile/", {
    method: "DELETE",
  });

export const updateMyProfile = async (payload) => {
  const data = await apiJson("/api/auth/profile/", buildRequestOptions("PATCH", payload));
  updateStoredUser(data);
  return data;
};

export const uploadVerificationDocument = (payload) =>
  apiJson("/api/auth/verify/documents/", buildRequestOptions("POST", payload));

export const fetchVerificationDocuments = () => apiJson("/api/auth/verify/documents/");

export const fetchMySettings = () => apiJson("/api/auth/settings/");

export const updateMySettings = (payload) =>
  apiJson("/api/auth/settings/", buildRequestOptions("PATCH", payload));

export const changePassword = (payload) =>
  apiJson("/api/auth/change-password/", buildRequestOptions("POST", payload));

export const submitSupportRequest = (payload) =>
  apiJson("/api/auth/support-requests/", buildRequestOptions("POST", payload));
