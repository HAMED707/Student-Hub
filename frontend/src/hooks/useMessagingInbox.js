import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchConversationMessages,
  fetchConversations,
  markConversationRead,
  sendConversationMessage,
  startConversation,
} from "../api/messaging.js";
import { getApiErrorMessage, getStoredUser } from "../utils/auth.js";
import {
  buildChatSocketUrl,
  createDraftConversation,
  mapConversation,
  mapMessage,
  mapSocketMessage,
  mergeDraftConversation,
} from "../utils/messaging.js";
import { useNotifications } from "../context/notificationsContext.js";

const MAX_RECONNECT_ATTEMPTS = 4;

const upsertMessage = (messages, nextMessage) => {
  const existingIndex = messages.findIndex((message) => message.id === nextMessage.id);
  if (existingIndex >= 0) {
    const updated = [...messages];
    updated[existingIndex] = { ...updated[existingIndex], ...nextMessage };
    return updated;
  }
  return [...messages, nextMessage];
};

const sortByTimestamp = (messages) =>
  [...messages].sort((left, right) => {
    const leftTime = new Date(left.createdAt || 0).getTime();
    const rightTime = new Date(right.createdAt || 0).getTime();
    return leftTime - rightTime;
  });

export function useMessagingInbox(routeState) {
  const storedUser = getStoredUser();
  const currentUserId = storedUser?.id ? String(storedUser.id) : "";
  const requestedConversationId = routeState?.conversationId ? String(routeState.conversationId) : null;
  const draftConversation = useMemo(() => createDraftConversation(routeState), [routeState]);
  const { latestNotification } = useNotifications();

  const [conversations, setConversations] = useState([]);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [activeConversationId, setActiveConversationId] = useState(requestedConversationId);
  const [error, setError] = useState("");
  const [connectionState, setConnectionState] = useState("idle");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const chatSocketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const activeConversationIdRef = useRef(requestedConversationId);
  const pendingOutgoingRef = useRef({});
  const isMountedRef = useRef(true);

  const visibleConversations = useMemo(
    () => mergeDraftConversation(conversations, draftConversation),
    [conversations, draftConversation],
  );

  const activeConversation = useMemo(() => {
    if (!visibleConversations.length) return null;
    return (
      visibleConversations.find((conversation) => conversation.id === activeConversationId) ||
      visibleConversations.find((conversation) => conversation.id === requestedConversationId) ||
      visibleConversations[0]
    );
  }, [activeConversationId, requestedConversationId, visibleConversations]);

  const activeMessages = useMemo(() => {
    if (!activeConversation?.id) return [];
    return messagesByConversation[activeConversation.id] || [];
  }, [activeConversation?.id, messagesByConversation]);

  useEffect(() => {
    activeConversationIdRef.current = activeConversation?.id || null;
  }, [activeConversation?.id]);

  useEffect(() => {
    if (requestedConversationId) {
      setActiveConversationId(requestedConversationId);
    } else if (draftConversation?.id) {
      setActiveConversationId((current) => current || draftConversation.id);
    }
  }, [draftConversation?.id, requestedConversationId]);

  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  const applyConversationMessages = useCallback((conversationId, nextMessages) => {
    setMessagesByConversation((current) => ({
      ...current,
      [conversationId]: sortByTimestamp(nextMessages),
    }));
  }, []);

  const updateConversationPreview = useCallback((conversationId, update) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, ...update }
          : conversation,
      ),
    );
  }, []);

  const refreshConversations = useCallback(
    async (preferredConversationId = null) => {
      try {
        setIsRefreshing(true);
        const data = await fetchConversations();
        if (!Array.isArray(data)) return;

        const mapped = data.map((conversation) => mapConversation(conversation, currentUserId));
        setConversations(mapped);

        setActiveConversationId((current) => {
          if (preferredConversationId) return String(preferredConversationId);
          // Keep current selection if it is a real (non-draft) conversation
          if (current && mapped.some((conversation) => conversation.id === current)) return current;
          if (requestedConversationId && mapped.some((conversation) => conversation.id === requestedConversationId)) {
            return requestedConversationId;
          }
          // When arriving from another page with a draft, find the matching real conversation
          // by receiverId so the correct thread opens automatically.
          if (draftConversation?.receiverId) {
            const matched = mapped.find(
              (conversation) => String(conversation.receiverId) === String(draftConversation.receiverId),
            );
            if (matched) return matched.id;
            // No real conversation exists yet — keep the draft active
            return current || draftConversation.id;
          }
          return mapped[0]?.id || draftConversation?.id || null;
        });
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, "Failed to load conversations"));
      } finally {
        if (isMountedRef.current) setIsRefreshing(false);
      }
    },
    [currentUserId, draftConversation?.id, requestedConversationId],
  );

  const markActiveConversationRead = useCallback(async (conversationId) => {
    if (!conversationId || !/^\d+$/.test(String(conversationId))) return;
    try {
      await markConversationRead(conversationId);
      updateConversationPreview(String(conversationId), { unreadCount: 0 });
    } catch {
      // best effort
    }
  }, [updateConversationPreview]);

  const loadConversationHistory = useCallback(
    async (conversationId) => {
      if (!conversationId || !/^\d+$/.test(String(conversationId))) return;

      try {
        const data = await fetchConversationMessages(conversationId);
        if (!Array.isArray(data)) return;

        const mappedMessages = data.map((message) => mapMessage(message, currentUserId));
        applyConversationMessages(String(conversationId), mappedMessages);
        await markActiveConversationRead(conversationId);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, "Failed to load conversation"));
      }
    },
    [applyConversationMessages, currentUserId, markActiveConversationRead],
  );

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  useEffect(() => {
    if (!activeConversation?.id || activeConversation.isDraft) return;
    loadConversationHistory(activeConversation.id);
  }, [activeConversation?.id, activeConversation?.isDraft, loadConversationHistory]);

  const reconcilePendingOutgoing = useCallback((conversationId, incomingMessage) => {
    const pendingQueue = pendingOutgoingRef.current[conversationId] || [];
    if (incomingMessage.from !== "me" || !pendingQueue.length) return null;

    const matchIndex = pendingQueue.findIndex((item) => item.body === incomingMessage.text);
    if (matchIndex < 0) return null;

    const [{ tempId }] = pendingQueue.splice(matchIndex, 1);
    pendingOutgoingRef.current[conversationId] = pendingQueue;
    return tempId;
  }, []);

  const handleIncomingSocketMessage = useCallback(
    async (payload) => {
      if (payload?.type !== "chat_message") return;

      const conversationId = String(payload.conversation_id);
      const incomingMessage = mapSocketMessage(payload, currentUserId);
      const pendingTempId = reconcilePendingOutgoing(conversationId, incomingMessage);

      setMessagesByConversation((current) => {
        const currentMessages = current[conversationId] || [];
        let nextMessages = currentMessages;

        if (pendingTempId) {
          nextMessages = currentMessages.map((message) =>
            message.id === pendingTempId ? incomingMessage : message,
          );
        } else {
          nextMessages = upsertMessage(currentMessages, incomingMessage);
        }

        return {
          ...current,
          [conversationId]: sortByTimestamp(nextMessages),
        };
      });

      updateConversationPreview(conversationId, {
        lastMessage: incomingMessage.text,
        lastTime: incomingMessage.time,
        lastTimestamp: incomingMessage.createdAt,
        unreadCount:
          conversationId === activeConversationIdRef.current || incomingMessage.from === "me"
            ? 0
            : undefined,
      });

      if (conversationId !== activeConversationIdRef.current && incomingMessage.from !== "me") {
        await refreshConversations();
        return;
      }

      if (incomingMessage.from !== "me") {
        await markActiveConversationRead(conversationId);
      }
    },
    [
      currentUserId,
      markActiveConversationRead,
      reconcilePendingOutgoing,
      refreshConversations,
      updateConversationPreview,
    ],
  );

  useEffect(() => {
    if (!activeConversation?.id || activeConversation.isDraft) {
      setConnectionState("idle");
      if (chatSocketRef.current) {
        chatSocketRef.current.close();
        chatSocketRef.current = null;
      }
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      return undefined;
    }

    let isCancelled = false;

    const connect = () => {
      const socketUrl = buildChatSocketUrl(activeConversation.id);
      if (!socketUrl) {
        setConnectionState("degraded");
        return;
      }

      setConnectionState(reconnectAttemptsRef.current > 0 ? "reconnecting" : "connecting");
      const socket = new WebSocket(socketUrl);
      chatSocketRef.current = socket;

      socket.onopen = () => {
        if (isCancelled) {
          socket.close();
          return;
        }
        reconnectAttemptsRef.current = 0;
        setConnectionState("connected");
      };

      socket.onmessage = async (event) => {
        if (isCancelled || activeConversationIdRef.current !== activeConversation.id) return;

        try {
          const payload = JSON.parse(event.data);
          await handleIncomingSocketMessage(payload);
        } catch {
          // ignore malformed socket event
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

      socket.onerror = () => {
        // onclose fires immediately after every error; reconnect logic lives there
      };
    };

    connect();

    return () => {
      isCancelled = true;
      reconnectAttemptsRef.current = 0;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (chatSocketRef.current) {
        chatSocketRef.current.close();
        chatSocketRef.current = null;
      }
    };
  }, [activeConversation?.id, activeConversation?.isDraft, handleIncomingSocketMessage]);

  useEffect(() => {
    if (latestNotification?.notificationType !== "new_message") return;

    const conversationId = String(latestNotification.data?.conversation_id || "");
    if (!conversationId) return;

    if (conversationId === activeConversationIdRef.current) {
      // Active conversation: reload history as a reliable fallback in case the
      // chat WebSocket hadn't delivered the message yet (REST-sent messages,
      // brief WS reconnect window, etc.). Idempotent — overwrites same state.
      loadConversationHistory(conversationId);
    } else {
      refreshConversations();
    }
  }, [
    latestNotification?.data?.conversation_id,
    latestNotification?.id,
    latestNotification?.notificationType,
    loadConversationHistory,
    refreshConversations,
  ]);

  const sendMessage = useCallback(
    async (body) => {
      const trimmedBody = body.trim();
      if (!trimmedBody || !activeConversation) return null;

      setError("");

      if (activeConversation.isDraft) {
        const createdConversation = await startConversation({
          receiver_id: activeConversation.receiverId,
          booking_id: activeConversation.bookingId || undefined,
          message: trimmedBody,
        });

        const mappedConversation = mapConversation(createdConversation, currentUserId);
        const optimisticMessage = {
          id: `temp-${Date.now()}`,
          conversationId: mappedConversation.id,
          from: "me",
          text: trimmedBody,
          time: "Just now",
          createdAt: new Date().toISOString(),
          status: "sent",
          type: "text",
        };

        setConversations((current) => {
          const withoutDraft = current.filter((conversation) => conversation.id !== activeConversation.id);
          return [mappedConversation, ...withoutDraft];
        });
        applyConversationMessages(mappedConversation.id, [optimisticMessage]);
        setActiveConversationId(mappedConversation.id);
        await refreshConversations(mappedConversation.id);
        return mappedConversation.id;
      }

      const conversationId = String(activeConversation.id);

      if (connectionState === "connected" && chatSocketRef.current?.readyState === WebSocket.OPEN) {
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage = {
          id: tempId,
          conversationId,
          from: "me",
          text: trimmedBody,
          time: "Just now",
          createdAt: new Date().toISOString(),
          status: "sending",
          type: "text",
        };

        pendingOutgoingRef.current[conversationId] = [
          ...(pendingOutgoingRef.current[conversationId] || []),
          { tempId, body: trimmedBody },
        ];

        applyConversationMessages(conversationId, [
          ...(messagesByConversation[conversationId] || []),
          optimisticMessage,
        ]);
        updateConversationPreview(conversationId, {
          lastMessage: trimmedBody,
          lastTime: optimisticMessage.time,
          lastTimestamp: optimisticMessage.createdAt,
        });

        chatSocketRef.current.send(JSON.stringify({ body: trimmedBody }));
        return conversationId;
      }

      if (connectionState !== "degraded") {
        throw new Error("Chat connection is still restoring. Please wait a moment.");
      }

      const createdMessage = await sendConversationMessage(conversationId, trimmedBody);
      const mappedMessage = mapMessage(createdMessage, currentUserId);
      applyConversationMessages(conversationId, [
        ...(messagesByConversation[conversationId] || []),
        mappedMessage,
      ]);
      updateConversationPreview(conversationId, {
        lastMessage: mappedMessage.text,
        lastTime: mappedMessage.time,
        lastTimestamp: mappedMessage.createdAt,
      });
      return conversationId;
    },
    [
      activeConversation,
      applyConversationMessages,
      connectionState,
      currentUserId,
      messagesByConversation,
      refreshConversations,
      updateConversationPreview,
    ],
  );

  return {
    activeConversation,
    activeConversationId: activeConversation?.id || null,
    activeMessages,
    connectionState,
    conversations: visibleConversations,
    error,
    isRefreshing,
    refreshConversations,
    selectConversation: setActiveConversationId,
    sendMessage,
    setError,
  };
}
