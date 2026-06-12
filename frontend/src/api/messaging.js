import { apiJson } from "./client.js";

export const fetchConversations = () => apiJson("/api/messaging/");
export const fetchConversationMessages = (conversationId) =>
  apiJson(`/api/messaging/${conversationId}/`);
