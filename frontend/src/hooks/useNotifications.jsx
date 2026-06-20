import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications.js";
import { AUTH_CHANGE_EVENT, getApiErrorMessage, getAuthSnapshot } from "../utils/auth.js";
import {
  buildNotificationSocketUrl,
  countUnreadNotifications,
  mapNotification,
  sortNotifications,
  upsertNotification,
} from "../utils/notifications.js";
import { NotificationsContext } from "../context/notificationsContext.js";
const MAX_RECONNECT_ATTEMPTS = 4;

export function NotificationsProvider({ children }) {
  const [authState, setAuthState] = useState(() => getAuthSnapshot());
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectionState, setConnectionState] = useState("idle");
  const [latestNotification, setLatestNotification] = useState(null);

  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const hasOpenedSocketRef = useRef(false);
  const isMountedRef = useRef(true);

  const token = authState.token;
  const user = authState.user;
  const role = user?.role || null;

  const clearState = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    setLoading(false);
    setError("");
    setConnectionState("idle");
    setLatestNotification(null);
  }, []);

  useEffect(() => {
    const syncAuth = () => setAuthState(getAuthSnapshot());

    window.addEventListener("storage", syncAuth);
    window.addEventListener(AUTH_CHANGE_EVENT, syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener(AUTH_CHANGE_EVENT, syncAuth);
    };
  }, []);

  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  const applyNotificationList = useCallback((items, apiUnreadCount = null) => {
    const mapped = sortNotifications(items.map((item) => mapNotification(item)));
    setNotifications(mapped);
    setUnreadCount(
      typeof apiUnreadCount === "number"
        ? apiUnreadCount
        : countUnreadNotifications(mapped),
    );
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!token || !user) {
      clearState();
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await fetchNotifications();
      applyNotificationList(data?.notifications || [], data?.unread_count);
    } catch (loadError) {
      if (isMountedRef.current) {
        setError(getApiErrorMessage(loadError, "Failed to load notifications"));
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [applyNotificationList, clearState, token, user]);

  useEffect(() => {
    if (!token || !user) {
      hasOpenedSocketRef.current = false;
      clearState();
      return;
    }

    refreshNotifications();
  }, [clearState, refreshNotifications, token, user]);

  useEffect(() => {
    if (!token || !user) {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      return undefined;
    }

    let isCancelled = false;

    const connect = () => {
      const socketUrl = buildNotificationSocketUrl();
      if (!socketUrl) {
        setConnectionState("idle");
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

        const shouldRefresh = hasOpenedSocketRef.current;
        hasOpenedSocketRef.current = true;
        reconnectAttemptsRef.current = 0;
        setConnectionState("connected");

        if (shouldRefresh) {
          refreshNotifications();
        }
      };

      socket.onmessage = (event) => {
        if (isCancelled) return;

        try {
          const payload = JSON.parse(event.data);
          const mapped = mapNotification(payload);

          setNotifications((current) => {
            const next = upsertNotification(current, mapped);
            setUnreadCount(countUnreadNotifications(next));
            return next;
          });
          setLatestNotification(mapped);
        } catch {
          // ignore malformed notification events
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
        // onclose fires immediately after every error and owns reconnect/degraded logic
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
  }, [refreshNotifications, token, user]);

  const markNotificationAsRead = useCallback(
    async (notificationId) => {
      const normalizedId = String(notificationId || "");
      if (!normalizedId) return null;

      let didChange = false;
      setNotifications((current) => {
        const next = current.map((notification) => {
          if (String(notification.id) !== normalizedId || notification.read) {
            return notification;
          }

          didChange = true;
          return { ...notification, read: true };
        });

        setUnreadCount(countUnreadNotifications(next));
        return next;
      });

      if (!didChange) {
        return notifications.find(
          (notification) => String(notification.id) === normalizedId,
        );
      }

      try {
        const data = await markNotificationRead(normalizedId);
        const mapped = mapNotification(data);

        setNotifications((current) => {
          const next = upsertNotification(current, mapped);
          setUnreadCount(countUnreadNotifications(next));
          return next;
        });

        return mapped;
      } catch {
        refreshNotifications();
        return null;
      }
    },
    [notifications, refreshNotifications],
  );

  const markAllNotificationsAsRead = useCallback(async () => {
    const hadUnread = unreadCount > 0;

    if (hadUnread) {
      setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
      setUnreadCount(0);
    }

    try {
      await markAllNotificationsRead();
    } catch {
      refreshNotifications();
    }
  }, [refreshNotifications, unreadCount]);

  const value = useMemo(
    () => ({
      user,
      role,
      notifications,
      unreadCount,
      loading,
      error,
      connectionState,
      latestNotification,
      refreshNotifications,
      markNotificationAsRead,
      markAllNotificationsAsRead,
    }),
    [
      connectionState,
      error,
      latestNotification,
      loading,
      markAllNotificationsAsRead,
      markNotificationAsRead,
      notifications,
      refreshNotifications,
      role,
      unreadCount,
      user,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}
