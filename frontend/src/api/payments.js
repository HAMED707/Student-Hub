import { apiJson } from "./client.js";

export const fetchMyPayments = () => apiJson("/api/payments/my/");
