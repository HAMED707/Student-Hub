import { apiJson } from "./client.js";

export const fetchMyPayments = () => apiJson("/api/payments/my/");

export const initiateDepositPayment = ({ booking_id, phone = "NA" }) =>
  apiJson("/api/payments/deposit/", {
    method: "POST",
    body: JSON.stringify({ booking_id, phone }),
  });

export const initiateRemainingPaymentOnline = ({ booking_id, phone = "NA" }) =>
  apiJson("/api/payments/remaining/online/", {
    method: "POST",
    body: JSON.stringify({ booking_id, phone }),
  });

export const markRemainingPaymentOffline = ({ booking_id }) =>
  apiJson("/api/payments/remaining/offline/", {
    method: "POST",
    body: JSON.stringify({ booking_id }),
  });
