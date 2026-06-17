import { apiJson } from "./client.js";

export const fetchChatHistory = () => apiJson("/api/chatbot/");

export const sendChatMessage = (message) =>
  apiJson("/api/chatbot/", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
