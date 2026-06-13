import { API_BASE_URL, withApiUrl } from "../api/client.js";
import { getStoredToken } from "./auth.js";

export const COMMUNITY_CATEGORY_LABELS = {
  university: "University",
  housing: "Housing",
  social: "Social",
  study: "Study",
  other: "Other",
};

export const COMMUNITY_CATEGORY_OPTIONS = Object.entries(
  COMMUNITY_CATEGORY_LABELS,
).map(([value, label]) => ({
  value,
  label,
}));

const DEFAULT_GROUP_COVER =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80";

const toWsBaseUrl = () => {
  if (!API_BASE_URL) return "";
  return API_BASE_URL.replace(/^http/i, "ws");
};

export const buildGroupChatSocketUrl = (groupId) => {
  const token = getStoredToken();
  if (!groupId || !token) return "";
  return `${toWsBaseUrl()}/ws/community/groups/${groupId}/chat/?token=${encodeURIComponent(token)}`;
};

export const formatCommunityClock = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatCommunityDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
};

export const formatCommunityRelative = (value) => {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  const diff = date.getTime() - Date.now();
  const diffMinutes = Math.round(diff / (1000 * 60));
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes || -1, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) {
    return formatter.format(diffDays, "day");
  }

  const diffMonths = Math.round(diffDays / 30);
  return formatter.format(diffMonths, "month");
};

const buildAvatar = (name, image) => {
  if (image) return withApiUrl(image);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "Member",
  )}&background=0A2647&color=fff`;
};

export const mapCommunityGroup = (raw = {}) => {
  const lastMessage = raw.last_message || raw.latest_chat_message || null;
  const lastMessageAt =
    lastMessage?.created_at || raw.last_message_at || raw.latest_activity_at || raw.updated_at || raw.created_at || null;
  const lastMessageText = lastMessage?.body || "";
  const lastMessageAuthor = lastMessage?.sender_name || "Community";

  return {
    id: String(raw.id || ""),
    name: raw.name || "Community group",
    description: raw.description || "",
    categoryValue: raw.category || "other",
    categoryLabel: COMMUNITY_CATEGORY_LABELS[raw.category] || "Other",
    coverImage: raw.cover_image ? withApiUrl(raw.cover_image) : DEFAULT_GROUP_COVER,
    memberCount: Number(raw.member_count || 0),
    isMember: Boolean(raw.is_member),
    memberRole: raw.member_role || "",
    isPrivate: Boolean(raw.is_private),
    unreadCount: Number(raw.unread_count || 0),
    recentPostsCount: Number(raw.recent_posts_count || 0),
    latestPostExcerpt: raw.latest_post_excerpt || "",
    latestActivityAt: raw.latest_activity_at || raw.updated_at || raw.created_at || null,
    latestActivityLabel: formatCommunityRelative(
      raw.latest_activity_at || raw.updated_at || raw.created_at,
    ),
    lastMessageText,
    lastMessageAt,
    lastMessageTime: formatCommunityClock(lastMessageAt),
    lastMessagePreview: lastMessageText
      ? `${lastMessageAuthor}: ${lastMessageText}`
      : "No messages yet",
    creatorName: raw.creator_name || "",
  };
};

export const mapCommunityPost = (raw = {}) => {
  const author = raw.author || {};
  const authorName =
    [author.first_name, author.last_name].filter(Boolean).join(" ").trim() ||
    author.username ||
    "Community member";

  return {
    id: String(raw.id || ""),
    groupId: String(raw.group || ""),
    authorName,
    authorAvatar: buildAvatar(authorName, author.profile_picture),
    content: raw.content || "",
    image: raw.image ? withApiUrl(raw.image) : "",
    createdAt: raw.created_at || null,
    createdAtLabel: formatCommunityRelative(raw.created_at),
  };
};

export const mapCommunityMessage = (raw = {}, currentUserId = "") => {
  const sender = raw.sender || {};
  const senderId = sender.id || raw.sender_id || raw.sender || null;
  const senderName =
    raw.sender_name ||
    [sender.first_name, sender.last_name].filter(Boolean).join(" ").trim() ||
    sender.username ||
    "Member";

  return {
    id: String(raw.id || ""),
    groupId: String(raw.group || raw.group_id || ""),
    senderId: senderId ? String(senderId) : "",
    senderName,
    avatar: buildAvatar(senderName, sender.profile_picture),
    from: String(senderId || "") === String(currentUserId || "") ? "me" : "them",
    text: raw.body || "",
    createdAt: raw.created_at || null,
    time: formatCommunityClock(raw.created_at),
    status: String(senderId || "") === String(currentUserId || "") ? "sent" : "received",
  };
};

export const mapCommunitySocketMessage = (payload = {}, currentUserId = "") =>
  mapCommunityMessage(
    {
      ...payload,
      group: payload.group_id,
      sender: payload.sender,
    },
    currentUserId,
  );

export const sortCommunityMessages = (messages = []) =>
  [...messages].sort((left, right) => {
    const leftTime = new Date(left.createdAt || 0).getTime();
    const rightTime = new Date(right.createdAt || 0).getTime();
    return leftTime - rightTime;
  });

export const upsertCommunityMessage = (messages = [], nextMessage) => {
  const nextId = String(nextMessage.id);
  const existingIndex = messages.findIndex(
    (message) => String(message.id) === nextId,
  );

  if (existingIndex >= 0) {
    const updated = [...messages];
    updated[existingIndex] = {
      ...updated[existingIndex],
      ...nextMessage,
    };
    return sortCommunityMessages(updated);
  }

  return sortCommunityMessages([...messages, nextMessage]);
};
