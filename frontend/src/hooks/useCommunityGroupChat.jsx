import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sendGroupMessage } from "../api/community.js";
import { useCommunity } from "../context/communityContext.js";
import { getApiErrorMessage, getStoredUser } from "../utils/auth.js";
import {
  buildGroupChatSocketUrl,
  mapCommunityMessage,
  mapCommunitySocketMessage,
} from "../utils/community.js";

const MAX_RECONNECT_ATTEMPTS = 4;

const createOptimisticMessage = (groupId, senderName, body) => {
  const createdAt = new Date().toISOString();
  return {
    id: `temp-${groupId}-${Date.now()}`,
    groupId: String(groupId),
    senderId: "me",
    senderName,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
      senderName || "Me",
    )}&background=155BC2&color=fff`,
    from: "me",
    text: body,
    createdAt,
    time: new Date(createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    status: "sending",
  };
};

export function useCommunityGroupChat(initialGroupId = null) {
  const storedUser = getStoredUser();
  const currentUserId = storedUser?.id ? String(storedUser.id) : "";
  const currentUserName =
    storedUser?.fullName || storedUser?.name || storedUser?.username || "Me";

  const {
    chatSummaries,
    messagesByGroup,
    loadingChats,
    loadingMessagesByGroup,
    ensureChats,
    ensureMessages,
    markGroupRead,
    appendOptimisticMessage,
    replaceMessage,
    removeMessage,
    applyIncomingMessage,
  } = useCommunity();

  const [fallbackActiveGroupId, setFallbackActiveGroupId] = useState(
    initialGroupId ? String(initialGroupId) : null,
  );
  const [connectionState, setConnectionState] = useState("idle");
  const [error, setError] = useState("");

  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const controlledGroupId = initialGroupId ? String(initialGroupId) : null;
  const activeGroupId = controlledGroupId || fallbackActiveGroupId;
  const activeGroupIdRef = useRef(activeGroupId);
  const pendingOutgoingRef = useRef({});

  const activeChat = useMemo(
    () =>
      chatSummaries.find((chat) => chat.id === activeGroupId) ||
      chatSummaries[0] ||
      null,
    [activeGroupId, chatSummaries],
  );

  const activeChatId = activeChat?.id || null;
  const activeMessages = activeChatId ? messagesByGroup[activeChatId] || [] : [];

  const loadingMessages = activeChatId
    ? Boolean(loadingMessagesByGroup[activeChatId])
    : false;

  useEffect(() => {
    activeGroupIdRef.current = activeChatId;
  }, [activeChatId]);

  const refreshChats = useCallback(async () => {
    try {
      setError("");
      const chats = await ensureChats({ force: true });
      setFallbackActiveGroupId((current) => {
        if (current && chats.some((chat) => chat.id === current)) {
          return current;
        }
        if (
          initialGroupId &&
          chats.some((chat) => chat.id === String(initialGroupId))
        ) {
          return String(initialGroupId);
        }
        return chats[0]?.id || null;
      });
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Failed to load community chats"));
    }
  }, [ensureChats, initialGroupId]);

  const markActiveGroupRead = useCallback(
    async (groupId) => {
      if (!groupId || !/^\d+$/.test(String(groupId))) return;
      try {
        await markGroupRead(groupId);
      } catch {
        // best effort
      }
    },
    [markGroupRead],
  );

  const loadGroupMessages = useCallback(
    async (groupId, { force = false } = {}) => {
      if (!groupId || !/^\d+$/.test(String(groupId))) return;

      try {
        await ensureMessages(groupId, { force });
        await markActiveGroupRead(groupId);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, "Failed to load group chat"));
      }
    },
    [ensureMessages, markActiveGroupRead],
  );

  useEffect(() => {
    queueMicrotask(() => {
      void refreshChats();
    });
  }, [refreshChats]);

  useEffect(() => {
    if (!activeChatId) return;
    queueMicrotask(() => {
      void loadGroupMessages(activeChatId);
    });
  }, [activeChatId, loadGroupMessages]);

  const reconcilePending = useCallback((groupId, incomingMessage) => {
    const queue = pendingOutgoingRef.current[groupId] || [];
    if (incomingMessage.from !== "me" || !queue.length) return null;

    const matchIndex = queue.findIndex((item) => item.body === incomingMessage.text);
    if (matchIndex < 0) return null;

    const [{ tempId }] = queue.splice(matchIndex, 1);
    pendingOutgoingRef.current[groupId] = queue;
    return tempId;
  }, []);

  const handleIncoming = useCallback(
    async (payload) => {
      if (payload?.type !== "group_chat_message") return;

      const groupId = String(payload.group_id);
      const incoming = mapCommunitySocketMessage(payload, currentUserId);
      const pendingId = reconcilePending(groupId, incoming);

      if (pendingId) {
        replaceMessage(groupId, pendingId, incoming);
      } else {
        applyIncomingMessage(groupId, incoming, {
          isActive: groupId === activeGroupIdRef.current,
        });
      }

      if (groupId === activeGroupIdRef.current && incoming.from !== "me") {
        await markActiveGroupRead(groupId);
      }
    },
    [
      applyIncomingMessage,
      currentUserId,
      markActiveGroupRead,
      reconcilePending,
      replaceMessage,
    ],
  );

  useEffect(() => {
    if (!activeChatId || !/^\d+$/.test(String(activeChatId))) {
      return undefined;
    }

    let isCancelled = false;

    const cleanupSocket = () => {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };

    const connect = () => {
      const socketUrl = buildGroupChatSocketUrl(activeChatId);
      if (!socketUrl) {
        setConnectionState("degraded");
        return;
      }

      setConnectionState(
        reconnectAttemptsRef.current > 0 ? "reconnecting" : "connecting",
      );

      const socket = new WebSocket(socketUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        if (isCancelled) {
          socket.close();
          return;
        }

        const recovered = reconnectAttemptsRef.current > 0;
        reconnectAttemptsRef.current = 0;
        setConnectionState("connected");

        if (recovered) {
          void ensureChats({ force: true });
          void loadGroupMessages(activeChatId, { force: true });
        }
      };

      socket.onmessage = (event) => {
        if (isCancelled) return;
        try {
          const payload = JSON.parse(event.data);
          handleIncoming(payload);
        } catch {
          // ignore malformed events
        }
      };

      socket.onerror = () => {
        if (!isCancelled && socket.readyState === WebSocket.OPEN) {
          setConnectionState("degraded");
        }
      };

      socket.onclose = () => {
        if (isCancelled) return;

        if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setConnectionState("degraded");
          return;
        }

        reconnectAttemptsRef.current += 1;
        const delay = Math.min(1000 * 2 ** (reconnectAttemptsRef.current - 1), 8000);
        setConnectionState("reconnecting");
        reconnectTimerRef.current = window.setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      isCancelled = true;
      reconnectAttemptsRef.current = 0;
      cleanupSocket();
    };
  }, [activeChatId, ensureChats, handleIncoming, loadGroupMessages]);

  const sendMessage = useCallback(
    async (body) => {
      const trimmed = body.trim();
      if (!trimmed || !activeChatId) return;

      const groupId = String(activeChatId);
      const optimisticMessage = createOptimisticMessage(groupId, currentUserName, trimmed);

      pendingOutgoingRef.current[groupId] = [
        ...(pendingOutgoingRef.current[groupId] || []),
        { tempId: optimisticMessage.id, body: trimmed },
      ];

      appendOptimisticMessage(groupId, optimisticMessage);

      const socket = socketRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ body: trimmed }));
        return;
      }

      try {
        const response = await sendGroupMessage(groupId, trimmed);
        const mapped = mapCommunityMessage(response, currentUserId);

        pendingOutgoingRef.current[groupId] = (
          pendingOutgoingRef.current[groupId] || []
        ).filter((item) => item.tempId !== optimisticMessage.id);

        replaceMessage(groupId, optimisticMessage.id, mapped);
      } catch (sendError) {
        pendingOutgoingRef.current[groupId] = (
          pendingOutgoingRef.current[groupId] || []
        ).filter((item) => item.tempId !== optimisticMessage.id);
        removeMessage(groupId, optimisticMessage.id);
        throw sendError;
      }
    },
    [
      activeChatId,
      appendOptimisticMessage,
      currentUserId,
      currentUserName,
      removeMessage,
      replaceMessage,
    ],
  );

  return {
    chats: chatSummaries,
    activeChat,
    activeMessages,
    activeGroupId: activeChat?.id || activeGroupId,
    loadingChats,
    loadingMessages,
    connectionState: activeChatId ? connectionState : "idle",
    error,
    setError,
    refreshChats,
    selectGroup: setFallbackActiveGroupId,
    sendMessage,
  };
}
