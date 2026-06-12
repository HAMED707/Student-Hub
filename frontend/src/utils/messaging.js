import { API_BASE_URL, withApiUrl } from "../api/client.js";
import { getStoredToken } from "./auth.js";

export const buildConversationMatchKey = (receiverId, bookingId) =>
  `${receiverId || "unknown"}:${bookingId || "direct"}`;

const formatTime = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toWsBaseUrl = () => {
  if (!API_BASE_URL) return "";
  return API_BASE_URL.replace(/^http/i, "ws");
};

export const buildChatSocketUrl = (conversationId) => {
  const token = getStoredToken();
  if (!conversationId || !token) return "";
  return `${toWsBaseUrl()}/ws/chat/${conversationId}/?token=${encodeURIComponent(token)}`;
};

export const buildNotificationSocketUrl = () => {
  const token = getStoredToken();
  if (!token) return "";
  return `${toWsBaseUrl()}/ws/notifications/?token=${encodeURIComponent(token)}`;
};

export const mapConversation = (conversation, currentUserId) => {
  const otherUser = conversation?.other_user || {};
  const isInitiator = String(conversation?.initiator || "") === String(currentUserId || "");

  return {
    id: String(conversation.id),
    receiverId: otherUser.id || null,
    bookingId: conversation.booking || null,
    propertyId: conversation.property || null,
    name: otherUser.name || "User",
    role: isInitiator ? "Host" : "Student",
    avatar:
      (otherUser.profile_picture ? withApiUrl(otherUser.profile_picture) : null) ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name || "User")}&background=0A2647&color=fff`,
    lastMessage: conversation.last_message?.body || "Start a conversation",
    lastTime: formatTime(conversation.last_message?.created_at),
    lastTimestamp: conversation.last_message?.created_at || conversation.updated_at || conversation.created_at,
    unreadCount: conversation.unread_count || 0,
    isDraft: false,
  };
};

export const mapMessage = (message, currentUserId) => ({
  id: String(message.id),
  conversationId: String(message.conversation || message.conversation_id || ""),
  from: String(message.sender) === String(currentUserId || "") ? "me" : "them",
  text: message.body,
  time: formatTime(message.created_at),
  createdAt: message.created_at,
  status: String(message.sender) === String(currentUserId || "")
    ? message.status || (message.is_read ? "sent" : "sent")
    : "received",
  type: "text",
  senderId: message.sender,
  senderName: message.sender_name || "",
});

export const mapSocketMessage = (payload, currentUserId) =>
  mapMessage(
    {
      ...payload,
      conversation: payload.conversation_id,
    },
    currentUserId,
  );

export const createDraftConversation = (routeState) => {
  if (!routeState) return null;

  const incoming = routeState.openChatWith || routeState;
  const receiverId =
    incoming.receiverId ||
    incoming.ownerId ||
    incoming.id ||
    incoming.userId ||
    incoming.studentId ||
    null;

  if (!receiverId) return null;

  const name = incoming.ownerName || incoming.name || incoming.fullName || "User";

  return {
    id: `draft-${receiverId}-${incoming.bookingId || incoming.booking_id || incoming.propertyId || "chat"}`,
    receiverId,
    bookingId: incoming.bookingId || incoming.booking_id || null,
    propertyId: incoming.propertyId || null,
    name,
    role: incoming.ownerId ? "Host" : "Student",
    avatar:
      incoming.ownerAvatar ||
      incoming.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0A2647&color=fff`,
    lastMessage: incoming.propertyTitle ? `About ${incoming.propertyTitle}` : "Start a conversation",
    lastTime: "",
    lastTimestamp: null,
    unreadCount: 0,
    isDraft: true,
  };
};

export const mergeDraftConversation = (conversations, draftConversation) => {
  if (!draftConversation) return conversations;

  const exists = conversations.some(
    (item) =>
      buildConversationMatchKey(item.receiverId, item.bookingId) ===
      buildConversationMatchKey(draftConversation.receiverId, draftConversation.bookingId),
  );

  return exists ? conversations : [draftConversation, ...conversations];
};

export const buildDraftChatState = ({
  receiverId,
  name,
  avatar,
  bookingId = null,
  propertyId = null,
  propertyTitle = "",
  receiverRole = "User",
}) => ({
  openChatWith: {
    receiverId,
    id: receiverId,
    name,
    avatar,
    bookingId,
    propertyId,
    propertyTitle,
    receiverRole,
  },
});

export const buildConversationRouteState = (conversationId) => ({
  conversationId: String(conversationId),
});
