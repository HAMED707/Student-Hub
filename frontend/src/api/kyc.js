import { apiJson } from "./client.js";

export const fetchKycStatus   = ()  => apiJson("/api/kyc/status/");
export const createKycInquiry = ()  => apiJson("/api/kyc/create/", { method: "POST" });
export const syncKycStatus    = ()  => apiJson("/api/kyc/sync/",   { method: "POST" });
