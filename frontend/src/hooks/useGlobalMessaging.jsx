import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessagingContext } from "../context/messagingContext.js";
import { useNotifications } from "../context/notificationsContext.js";
import { fetchConversations } from "../api/messaging.js";
import { getStoredUser } from "../utils/auth.js";
import { createDraftConversation, mapConversation } from "../utils/messaging.js";
import { playNotificationSound } from "../utils/sound.js";

export function MessagingProvider({ children }) {
  const navigate = useNavigate();
  const { latestNotification } = useNotifications();

  const storedUser = getStoredUser();
  const currentUserId = storedUser?.id ? String(storedUser.id) : "";

  const [conversations, setConversations] = useState([]);
  const [openWindows, setOpenWindows] = useState([]);

  const isDesktopRef = useRef(
    typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e) => {
      isDesktopRef.current = e.matches;
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const refreshConversations = useCallback(async () => {
    try {
      const data = await fetchConversations();
      if (!Array.isArray(data)) return;
      setConversations(data.map((c) => mapConversation(c, currentUserId)));
    } catch {
      // best-effort
    }
  }, [currentUserId]);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  // New message notifications → refresh list + maybe play sound
  const openWindowsRef = useRef(openWindows);
  useEffect(() => {
    openWindowsRef.current = openWindows;
  }, [openWindows]);

  useEffect(() => {
    if (latestNotification?.notificationType !== "new_message") return;
    const cid = String(latestNotification.data?.conversation_id || "");
    const windowIsVisible = openWindowsRef.current.some(
      (w) => w.conversationId === cid && !w.minimized,
    );
    if (!windowIsVisible) playNotificationSound();
    refreshConversations();
  }, [latestNotification?.id, latestNotification?.notificationType, refreshConversations]);

  const openChat = useCallback(
    (stateOrConversation) => {
      if (!isDesktopRef.current) {
        navigate("/messages", { state: stateOrConversation });
        return;
      }

      const id =
        stateOrConversation?.conversationId ||
        stateOrConversation?.id ||
        null;

      // Draft on desktop → inject into conversations list + open popup
      if (!id || String(id).startsWith("draft-")) {
        const draftConv = createDraftConversation(stateOrConversation);
        if (!draftConv) {
          navigate("/messages", { state: stateOrConversation });
          return;
        }
        setConversations((prev) => {
          const exists = prev.some((c) => String(c.receiverId) === String(draftConv.receiverId) && c.isDraft);
          return exists ? prev : [draftConv, ...prev];
        });
        const draftId = draftConv.id;
        setOpenWindows((prev) => {
          const existing = prev.find((w) => w.conversationId === draftId);
          if (existing) return prev.map((w) => w.conversationId === draftId ? { ...w, minimized: false } : w);
          const capped = prev.length >= 3 ? prev.slice(1) : prev;
          return [...capped, { conversationId: draftId, minimized: false }];
        });
        return;
      }

      const conversationId = String(id);
      setOpenWindows((prev) => {
        const existing = prev.find((w) => w.conversationId === conversationId);
        if (existing) {
          return prev.map((w) =>
            w.conversationId === conversationId ? { ...w, minimized: false } : w,
          );
        }
        // Cap at 3 simultaneous windows
        const capped = prev.length >= 3 ? prev.slice(1) : prev;
        return [...capped, { conversationId, minimized: false }];
      });
    },
    [navigate],
  );

  const upgradeWindow = useCallback((draftId, realConversationId) => {
    setOpenWindows((prev) =>
      prev.map((w) =>
        w.conversationId === String(draftId)
          ? { ...w, conversationId: String(realConversationId) }
          : w,
      ),
    );
    setConversations((prev) => prev.filter((c) => c.id !== String(draftId)));
  }, []);

  const closeChat = useCallback((conversationId) => {
    setOpenWindows((prev) => prev.filter((w) => w.conversationId !== String(conversationId)));
  }, []);

  const minimizeChat = useCallback((conversationId) => {
    setOpenWindows((prev) =>
      prev.map((w) =>
        w.conversationId === String(conversationId) ? { ...w, minimized: !w.minimized } : w,
      ),
    );
  }, []);

  const updateConversationPreview = useCallback((conversationId, update) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === String(conversationId) ? { ...c, ...update } : c)),
    );
  }, []);

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [conversations],
  );

  const value = useMemo(
    () => ({
      conversations,
      openWindows,
      totalUnread,
      currentUserId,
      openChat,
      closeChat,
      minimizeChat,
      upgradeWindow,
      refreshConversations,
      updateConversationPreview,
    }),
    [
      conversations,
      openWindows,
      totalUnread,
      currentUserId,
      openChat,
      closeChat,
      minimizeChat,
      upgradeWindow,
      refreshConversations,
      updateConversationPreview,
    ],
  );

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>;
}
