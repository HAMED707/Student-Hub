import { apiJson } from "./client.js";

export const fetchConversations = () => apiJson("/api/messaging/");
export const fetchConversationMessages = (conversationId) =>
  apiJson(`/api/messaging/${conversationId}/`);
export const markConversationRead = (conversationId) =>
  apiJson(`/api/messaging/${conversationId}/read/`, {
    method: "POST",
  });
export const startConversation = (payload) =>
  apiJson("/api/messaging/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const sendConversationMessage = (conversationId, body) =>
  apiJson(`/api/messaging/${conversationId}/`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
