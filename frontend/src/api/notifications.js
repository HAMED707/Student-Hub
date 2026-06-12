import { apiJson } from "./client.js";

export const fetchNotifications = () => apiJson("/api/notifications/");
export const markAllNotificationsRead = () => apiJson("/api/notifications/read/", { method: "POST" });
export const markNotificationRead = (id) => apiJson(`/api/notifications/${id}/read/`, { method: "PATCH" });
