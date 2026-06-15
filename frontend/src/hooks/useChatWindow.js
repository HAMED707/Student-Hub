import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchConversationMessages,
  markConversationRead,
  sendConversationMessage,
} from "../api/messaging.js";
import {
  buildChatSocketUrl,
  mapMessage,
  mapSocketMessage,
} from "../utils/messaging.js";

const MAX_RECONNECT_ATTEMPTS = 4;

const upsertMessage = (messages, next) => {
  const idx = messages.findIndex((m) => m.id === next.id);
  if (idx >= 0) {
    const updated = [...messages];
    updated[idx] = { ...updated[idx], ...next };
    return updated;
  }
  return [...messages, next];
};

const sortByTimestamp = (messages) =>
  [...messages].sort((a, b) => {
    const at = new Date(a.createdAt || 0).getTime();
    const bt = new Date(b.createdAt || 0).getTime();
    return at - bt;
  });

export function useChatWindow(conversationId, { currentUserId, onPreviewUpdate }) {
  const [messages, setMessages] = useState([]);
  const [connectionState, setConnectionState] = useState("idle");
  const [inputText, setInputText] = useState("");

  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const pendingOutgoingRef = useRef([]);
  const isMountedRef = useRef(true);
  const onPreviewUpdateRef = useRef(onPreviewUpdate);

  useEffect(() => {
    onPreviewUpdateRef.current = onPreviewUpdate;
  }, [onPreviewUpdate]);

  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    [],
  );

  // Load message history
  useEffect(() => {
    if (!conversationId || !/^\d+$/.test(String(conversationId))) return;
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchConversationMessages(conversationId);
        if (cancelled || !Array.isArray(data)) return;
        const mapped = data.map((m) => mapMessage(m, currentUserId));
        setMessages(sortByTimestamp(mapped));
        markConversationRead(conversationId).catch(() => {});
        onPreviewUpdateRef.current(conversationId, { unreadCount: 0 });
      } catch {
        // best-effort
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId, currentUserId]);

  // WebSocket connection
  useEffect(() => {
    if (!conversationId || !/^\d+$/.test(String(conversationId))) return;

    let isCancelled = false;

    const connect = () => {
      const url = buildChatSocketUrl(conversationId);
      if (!url) {
        setConnectionState("degraded");
        return;
      }

      setConnectionState(reconnectAttemptsRef.current > 0 ? "reconnecting" : "connecting");
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        if (isCancelled) {
          socket.close();
          return;
        }
        reconnectAttemptsRef.current = 0;
        setConnectionState("connected");
      };

      socket.onmessage = (event) => {
        if (isCancelled) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type !== "chat_message") return;

          const incoming = mapSocketMessage(payload, currentUserId);

          setMessages((prev) => {
            const pendingIdx = pendingOutgoingRef.current.findIndex(
              (p) => p.body === incoming.text,
            );
            if (pendingIdx >= 0) {
              const { tempId } = pendingOutgoingRef.current[pendingIdx];
              pendingOutgoingRef.current.splice(pendingIdx, 1);
              return sortByTimestamp(prev.map((m) => (m.id === tempId ? incoming : m)));
            }
            return sortByTimestamp(upsertMessage(prev, incoming));
          });

          if (incoming.from !== "me") {
            onPreviewUpdateRef.current(conversationId, {
              lastMessage: incoming.text,
              lastTime: incoming.time,
              lastTimestamp: incoming.createdAt,
            });
            markConversationRead(conversationId).catch(() => {});
            onPreviewUpdateRef.current(conversationId, { unreadCount: 0 });
          }
        } catch {
          // ignore malformed event
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
        if (!isCancelled && socket.readyState === WebSocket.OPEN) {
          setConnectionState("degraded");
        }
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
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [conversationId, currentUserId]);

  const sendMessage = useCallback(
    async (body) => {
      const trimmed = body.trim();
      if (!trimmed || !conversationId) return;

      if (connectionState === "connected" && socketRef.current?.readyState === WebSocket.OPEN) {
        const tempId = `temp-${Date.now()}`;
        const optimistic = {
          id: tempId,
          conversationId: String(conversationId),
          from: "me",
          text: trimmed,
          time: "Just now",
          createdAt: new Date().toISOString(),
          status: "sending",
          type: "text",
        };
        pendingOutgoingRef.current.push({ tempId, body: trimmed });
        setMessages((prev) => sortByTimestamp([...prev, optimistic]));
        onPreviewUpdateRef.current(conversationId, {
          lastMessage: trimmed,
          lastTime: "Just now",
          lastTimestamp: optimistic.createdAt,
        });
        socketRef.current.send(JSON.stringify({ body: trimmed }));
        return;
      }

      if (connectionState !== "degraded") {
        throw new Error("Chat connection is still restoring. Please wait a moment.");
      }

      const created = await sendConversationMessage(conversationId, trimmed);
      const mapped = mapMessage(created, currentUserId);
      setMessages((prev) => sortByTimestamp([...prev, mapped]));
      onPreviewUpdateRef.current(conversationId, {
        lastMessage: mapped.text,
        lastTime: mapped.time,
        lastTimestamp: mapped.createdAt,
      });
    },
    [conversationId, connectionState, currentUserId],
  );

  return { messages, connectionState, sendMessage, inputText, setInputText };
}
