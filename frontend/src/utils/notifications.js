import { API_BASE_URL, withApiUrl } from "../api/client.js";
import { getStoredToken } from "./auth.js";
import { buildConversationRouteState } from "./messaging.js";

const toWsBaseUrl = () => {
  if (!API_BASE_URL) return "";
  return API_BASE_URL.replace(/^http/i, "ws");
};

export const buildNotificationSocketUrl = () => {
  const token = getStoredToken();
  if (!token) return "";
  return `${toWsBaseUrl()}/ws/notifications/?token=${encodeURIComponent(token)}`;
};

export const formatNotificationTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

export const getNotificationCategory = (notificationType = "") => {
  if (notificationType.includes("message")) return "Messages";
  if (notificationType.includes("booking")) return "Bookings";
  return "System";
};

export const getNotificationTone = (notificationType = "") => {
  if (notificationType.includes("payment")) return "success";
  if (notificationType.includes("booking")) return "warning";
  if (notificationType.includes("message")) return "info";
  if (notificationType.includes("review")) return "info";
  return "info";
};

export const mapNotification = (raw = {}) => {
  const notificationType = raw.notification_type || raw.notificationType || "system";
  const createdAt = raw.created_at || raw.createdAt || null;
  const actorAvatar = raw.actor_avatar || raw.actorAvatar || "";
  const message = raw.message || raw.desc || "";
  const read = Boolean(raw.is_read ?? raw.read);

  return {
    id: String(raw.id || ""),
    notificationType,
    title: raw.title || "Notification",
    message,
    desc: message,
    data: raw.data || {},
    read,
    createdAt,
    time: formatNotificationTime(createdAt),
    category: getNotificationCategory(notificationType),
    tone: getNotificationTone(notificationType),
    actorName: raw.actor_name || raw.actorName || "",
    actorAvatar: actorAvatar ? withApiUrl(actorAvatar) : "",
  };
};

export const sortNotifications = (notifications) =>
  [...notifications].sort((left, right) => {
    const leftTime = new Date(left.createdAt || 0).getTime();
    const rightTime = new Date(right.createdAt || 0).getTime();
    return rightTime - leftTime;
  });

export const upsertNotification = (notifications, nextNotification) => {
  const nextId = String(nextNotification.id);
  const existingIndex = notifications.findIndex(
    (notification) => String(notification.id) === nextId,
  );

  if (existingIndex >= 0) {
    const updated = [...notifications];
    updated[existingIndex] = {
      ...updated[existingIndex],
      ...nextNotification,
    };
    return sortNotifications(updated);
  }

  return sortNotifications([nextNotification, ...notifications]);
};

export const countUnreadNotifications = (notifications) =>
  notifications.filter((notification) => !notification.read).length;

export const buildBookingRouteState = (bookingId) => ({
  bookingId: String(bookingId),
});

export const buildPropertyRouteState = (propertyId) => ({
  propertyId: String(propertyId),
});

export const getNotificationActionLabel = (notification) => {
  if (notification.notificationType.includes("message")) return "Open chat";
  if (notification.notificationType.includes("booking")) return "Open booking";
  if (notification.notificationType.includes("review")) return "View review";
  if (notification.notificationType === "welcome") return "Get started";
  return "Open";
};

export const resolveNotificationDestination = (notification, role) => {
  const isOwner = role === "landlord";
  const bookingId = notification.data?.booking_id;
  const conversationId = notification.data?.conversation_id;
  const propertyId = notification.data?.property_id;
  const roommateRequestId = notification.data?.request_id;

  if (notification.notificationType === "new_message" && conversationId) {
    return {
      path: isOwner ? "/owner/messages" : "/messages",
      state: buildConversationRouteState(conversationId),
    };
  }

  if (
    (notification.notificationType === "booking_request" ||
      notification.notificationType === "booking_update") &&
    bookingId
  ) {
    return {
      path: isOwner ? "/owner/bookings" : "/my-bookings",
      state: buildBookingRouteState(bookingId),
    };
  }

  if (notification.notificationType === "new_review" && propertyId) {
    return {
      path: isOwner ? "/owner/properties" : "/profile",
      state: buildPropertyRouteState(propertyId),
    };
  }

  if (notification.notificationType === "new_review") {
    return {
      path: isOwner ? "/owner/profile" : "/profile",
    };
  }

  if (notification.notificationType.includes("payment")) {
    return {
      path: isOwner ? "/owner/payments" : "/payments",
    };
  }

  if (notification.notificationType === "welcome") {
    return {
      path: isOwner ? "/owner/overview" : "/home",
    };
  }

  if (
    !isOwner &&
    (notification.notificationType === "roommate_request" ||
      notification.notificationType === "roommate_update")
  ) {
    return {
      path: "/roommate",
      state: {
        tab: "requests",
        requestId: roommateRequestId ? String(roommateRequestId) : undefined,
      },
    };
  }

  return {
    path: isOwner ? "/owner/notifications" : "/notifications",
  };
};
