import { apiJson } from "./client.js";

export const createCheckoutSession = (booking_id) =>
  apiJson("/api/payments/create-checkout-session/", {
    method: "POST",
    body: JSON.stringify({ booking_id }),
  });

export const getConnectStatus = () =>
  apiJson("/api/payments/connect/status/");

export const startOnboarding = () =>
  apiJson("/api/payments/connect/onboard/", { method: "POST" });

export const getLandlordPayouts = () =>
  apiJson("/api/payments/payouts/");

export const requestRemainingPayment = (booking_id) =>
  apiJson("/api/payments/request-remaining/", {
    method: "POST",
    body: JSON.stringify({ booking_id }),
  });

export const createRemainingCheckoutSession = (booking_id) =>
  apiJson("/api/payments/pay-remaining/", {
    method: "POST",
    body: JSON.stringify({ booking_id }),
  });
