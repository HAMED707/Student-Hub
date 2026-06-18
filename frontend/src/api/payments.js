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
