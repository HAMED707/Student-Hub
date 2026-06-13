import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createGroup as createGroupRequest,
  createPost as createPostRequest,
  fetchGroupChats,
  fetchGroupDetail,
  fetchGroupMessages,
  fetchGroups,
  fetchMyGroups,
  fetchPosts,
  joinGroup as joinGroupRequest,
  leaveGroup as leaveGroupRequest,
  markGroupMessagesRead,
} from "../api/community.js";
import { CommunityContext } from "../context/communityContext.js";
import { AUTH_CHANGE_EVENT, getAuthSnapshot } from "../utils/auth.js";
import {
  formatCommunityClock,
  formatCommunityRelative,
  mapCommunityGroup,
  mapCommunityMessage,
  mapCommunityPost,
  sortCommunityMessages,
  upsertCommunityMessage,
} from "../utils/community.js";

const LIST_CACHE_TTL = 30_000;
const CHAT_CACHE_TTL = 15_000;
const MESSAGE_CACHE_TTL = 20_000;

const dedupeIds = (ids = []) => [...new Set(ids.map((value) => String(value || "")).filter(Boolean))];

const getActivityTime = (group) =>
  new Date(
    group?.lastMessageAt ||
      group?.latestActivityAt ||
      group?.updatedAt ||
      group?.createdAt ||
      0,
  ).getTime();

const sortGroupIdsByActivity = (ids, groupsById) =>
  dedupeIds(ids).sort(
    (left, right) => getActivityTime(groupsById[right]) - getActivityTime(groupsById[left]),
  );

const isFresh = (timestamp, ttl) => Boolean(timestamp) && Date.now() - timestamp < ttl;

const patchGroupActivity = (group, updates) => {
  if (!group) return group;

  const nextLatestActivityAt = updates.latestActivityAt || group.latestActivityAt;
  const nextLastMessageAt = updates.lastMessageAt ?? group.lastMessageAt;

  return {
    ...group,
    ...updates,
    latestActivityAt: nextLatestActivityAt,
    latestActivityLabel: formatCommunityRelative(nextLatestActivityAt),
    lastMessageAt: nextLastMessageAt,
    lastMessageTime: nextLastMessageAt
      ? formatCommunityClock(nextLastMessageAt)
      : group.lastMessageTime,
  };
};

export function CommunityProvider({ children }) {
  const [authState, setAuthState] = useState(() => getAuthSnapshot());
  const [groupsById, setGroupsById] = useState({});
  const [catalogGroupIds, setCatalogGroupIds] = useState([]);
  const [joinedGroupIds, setJoinedGroupIds] = useState([]);
  const [chatGroupIds, setChatGroupIds] = useState([]);
  const [postsByGroup, setPostsByGroup] = useState({});
  const [messagesByGroup, setMessagesByGroup] = useState({});
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [loadingJoinedGroups, setLoadingJoinedGroups] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingPostsByGroup, setLoadingPostsByGroup] = useState({});
  const [loadingMessagesByGroup, setLoadingMessagesByGroup] = useState({});

  const freshnessRef = useRef({
    catalog: 0,
    joined: 0,
    chats: 0,
    details: {},
    posts: {},
    messages: {},
  });
  const readInFlightRef = useRef({});
  const groupsByIdRef = useRef({});
  const catalogGroupIdsRef = useRef([]);
  const joinedGroupIdsRef = useRef([]);
  const chatGroupIdsRef = useRef([]);
  const postsByGroupRef = useRef({});
  const messagesByGroupRef = useRef({});

  const token = authState.token;
  const user = authState.user;

  useEffect(() => {
    const syncAuth = () => setAuthState(getAuthSnapshot());

    window.addEventListener("storage", syncAuth);
    window.addEventListener(AUTH_CHANGE_EVENT, syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener(AUTH_CHANGE_EVENT, syncAuth);
    };
  }, []);

  const clearState = useCallback(() => {
    setGroupsById({});
    setCatalogGroupIds([]);
    setJoinedGroupIds([]);
    setChatGroupIds([]);
    setPostsByGroup({});
    setMessagesByGroup({});
    setLoadingCatalog(false);
    setLoadingJoinedGroups(false);
    setLoadingChats(false);
    setLoadingPostsByGroup({});
    setLoadingMessagesByGroup({});
    freshnessRef.current = {
      catalog: 0,
      joined: 0,
      chats: 0,
      details: {},
      posts: {},
      messages: {},
    };
    readInFlightRef.current = {};
  }, []);

  useEffect(() => {
    if (!token || !user) {
      clearState();
    }
  }, [clearState, token, user]);

  useEffect(() => {
    groupsByIdRef.current = groupsById;
  }, [groupsById]);

  useEffect(() => {
    catalogGroupIdsRef.current = catalogGroupIds;
  }, [catalogGroupIds]);

  useEffect(() => {
    joinedGroupIdsRef.current = joinedGroupIds;
  }, [joinedGroupIds]);

  useEffect(() => {
    chatGroupIdsRef.current = chatGroupIds;
  }, [chatGroupIds]);

  useEffect(() => {
    postsByGroupRef.current = postsByGroup;
  }, [postsByGroup]);

  useEffect(() => {
    messagesByGroupRef.current = messagesByGroup;
  }, [messagesByGroup]);

  const mergeGroups = useCallback((items, options = {}) => {
    const mappedItems = items.map((item) => mapCommunityGroup(item));

    setGroupsById((current) => {
      const next = { ...current };
      mappedItems.forEach((item) => {
        next[item.id] = {
          ...next[item.id],
          ...item,
        };
      });
      return next;
    });

    if (options.replaceCatalog) {
      setCatalogGroupIds(mappedItems.map((item) => item.id));
    } else if (options.prependCatalog) {
      setCatalogGroupIds((current) =>
        dedupeIds([...mappedItems.map((item) => item.id), ...current]),
      );
    }

    if (options.replaceJoined) {
      setJoinedGroupIds(mappedItems.filter((item) => item.isMember).map((item) => item.id));
    } else if (options.mergeJoined) {
      setJoinedGroupIds((current) =>
        dedupeIds([
          ...current,
          ...mappedItems.filter((item) => item.isMember).map((item) => item.id),
        ]),
      );
    }

    if (options.replaceChats) {
      setChatGroupIds(() =>
        sortGroupIdsByActivity(
          mappedItems.map((item) => item.id),
          {
            ...groupsByIdRef.current,
            ...Object.fromEntries(mappedItems.map((item) => [item.id, item])),
          },
        ),
      );
    } else if (options.mergeChats) {
      setChatGroupIds((current) =>
        sortGroupIdsByActivity(
          [...current, ...mappedItems.filter((item) => item.isMember).map((item) => item.id)],
          {
            ...groupsByIdRef.current,
            ...Object.fromEntries(mappedItems.map((item) => [item.id, item])),
          },
        ),
      );
    }

    return mappedItems;
  }, []);

  const ensureCatalog = useCallback(
    async ({ force = false } = {}) => {
      if (!token || !user) return [];
      if (
        !force &&
        catalogGroupIdsRef.current.length &&
        isFresh(freshnessRef.current.catalog, LIST_CACHE_TTL)
      ) {
        return catalogGroupIdsRef.current
          .map((id) => groupsByIdRef.current[id])
          .filter(Boolean);
      }

      setLoadingCatalog(true);
      try {
        const data = await fetchGroups();
        const mapped = mergeGroups(Array.isArray(data) ? data : [], { replaceCatalog: true });
        freshnessRef.current.catalog = Date.now();
        return mapped;
      } finally {
        setLoadingCatalog(false);
      }
    },
    [mergeGroups, token, user],
  );

  const ensureJoinedGroups = useCallback(
    async ({ force = false } = {}) => {
      if (!token || !user) return [];
      if (
        !force &&
        joinedGroupIdsRef.current.length &&
        isFresh(freshnessRef.current.joined, LIST_CACHE_TTL)
      ) {
        return joinedGroupIdsRef.current
          .map((id) => groupsByIdRef.current[id])
          .filter(Boolean);
      }

      setLoadingJoinedGroups(true);
      try {
        const data = await fetchMyGroups();
        const mapped = mergeGroups(Array.isArray(data) ? data : [], {
          replaceJoined: true,
          mergeChats: true,
        });
        freshnessRef.current.joined = Date.now();
        return mapped;
      } finally {
        setLoadingJoinedGroups(false);
      }
    },
    [mergeGroups, token, user],
  );

  const ensureGroupDetail = useCallback(
    async (groupId, { force = false } = {}) => {
      const normalizedId = String(groupId || "");
      if (!normalizedId || !token || !user) return null;

      if (
        !force &&
        groupsByIdRef.current[normalizedId] &&
        isFresh(freshnessRef.current.details[normalizedId], LIST_CACHE_TTL)
      ) {
        return groupsByIdRef.current[normalizedId];
      }

      const data = await fetchGroupDetail(normalizedId);
      const [mapped] = mergeGroups([data], { mergeJoined: true, mergeChats: true });
      freshnessRef.current.details[normalizedId] = Date.now();
      return mapped || null;
    },
    [mergeGroups, token, user],
  );

  const ensurePosts = useCallback(
    async (groupId, { force = false } = {}) => {
      const normalizedId = String(groupId || "");
      if (!normalizedId || !token || !user) return [];

      if (
        !force &&
        postsByGroupRef.current[normalizedId] &&
        isFresh(freshnessRef.current.posts[normalizedId], LIST_CACHE_TTL)
      ) {
        return postsByGroupRef.current[normalizedId];
      }

      setLoadingPostsByGroup((current) => ({ ...current, [normalizedId]: true }));
      try {
        const data = await fetchPosts(normalizedId);
        const mapped = Array.isArray(data) ? data.map((item) => mapCommunityPost(item)) : [];
        setPostsByGroup((current) => ({ ...current, [normalizedId]: mapped }));
        freshnessRef.current.posts[normalizedId] = Date.now();
        return mapped;
      } finally {
        setLoadingPostsByGroup((current) => ({ ...current, [normalizedId]: false }));
      }
    },
    [token, user],
  );

  const ensureChats = useCallback(
    async ({ force = false } = {}) => {
      if (!token || !user) return [];
      if (
        !force &&
        chatGroupIdsRef.current.length &&
        isFresh(freshnessRef.current.chats, CHAT_CACHE_TTL)
      ) {
        return chatGroupIdsRef.current
          .map((id) => groupsByIdRef.current[id])
          .filter(Boolean);
      }

      setLoadingChats(true);
      try {
        const data = await fetchGroupChats();
        const mapped = mergeGroups(Array.isArray(data) ? data : [], {
          replaceChats: true,
          mergeJoined: true,
        });
        freshnessRef.current.chats = Date.now();
        return mapped;
      } finally {
        setLoadingChats(false);
      }
    },
    [mergeGroups, token, user],
  );

  const ensureMessages = useCallback(
    async (groupId, { force = false } = {}) => {
      const normalizedId = String(groupId || "");
      if (!normalizedId || !token || !user) return [];

      if (
        !force &&
        messagesByGroupRef.current[normalizedId] &&
        isFresh(freshnessRef.current.messages[normalizedId], MESSAGE_CACHE_TTL)
      ) {
        return messagesByGroupRef.current[normalizedId];
      }

      setLoadingMessagesByGroup((current) => ({ ...current, [normalizedId]: true }));
      try {
        const data = await fetchGroupMessages(normalizedId);
        const mapped = Array.isArray(data)
          ? data.map((item) => mapCommunityMessage(item, user?.id))
          : [];
        setMessagesByGroup((current) => ({ ...current, [normalizedId]: mapped }));
        freshnessRef.current.messages[normalizedId] = Date.now();
        return mapped;
      } finally {
        setLoadingMessagesByGroup((current) => ({ ...current, [normalizedId]: false }));
      }
    },
    [token, user],
  );

  const updateGroupLocally = useCallback((groupId, updater) => {
    const normalizedId = String(groupId || "");
    if (!normalizedId) return;

    setGroupsById((current) => {
      const existing = current[normalizedId];
      if (!existing) return current;
      return {
        ...current,
        [normalizedId]: updater(existing),
      };
    });
  }, []);

  const moveChatToFront = useCallback((groupId) => {
    const normalizedId = String(groupId || "");
    if (!normalizedId) return;
    setChatGroupIds((current) => sortGroupIdsByActivity([normalizedId, ...current], groupsById));
  }, [groupsById]);

  const joinGroup = useCallback(
    async (groupId) => {
      const data = await joinGroupRequest(groupId);
      const [mapped] = mergeGroups([data], {
        mergeJoined: true,
        mergeChats: true,
        prependCatalog: true,
      });
      freshnessRef.current.joined = Date.now();
      freshnessRef.current.details[String(groupId)] = Date.now();
      return mapped || null;
    },
    [mergeGroups],
  );

  const leaveGroup = useCallback(async (groupId) => {
    const normalizedId = String(groupId || "");
    await leaveGroupRequest(normalizedId);

    setJoinedGroupIds((current) => current.filter((id) => id !== normalizedId));
    setChatGroupIds((current) => current.filter((id) => id !== normalizedId));
    updateGroupLocally(normalizedId, (group) => ({
      ...group,
      isMember: false,
      memberRole: "",
      unreadCount: 0,
      memberCount: Math.max(0, Number(group.memberCount || 0) - 1),
    }));

    freshnessRef.current.joined = Date.now();
    freshnessRef.current.chats = 0;
    return true;
  }, [updateGroupLocally]);

  const createGroup = useCallback(
    async (payload) => {
      const data = await createGroupRequest(payload);
      const [mapped] = mergeGroups([data], {
        prependCatalog: true,
        mergeJoined: true,
        mergeChats: true,
      });

      setChatGroupIds((current) => sortGroupIdsByActivity([mapped?.id, ...current], {
        ...groupsByIdRef.current,
        ...(mapped ? { [mapped.id]: mapped } : {}),
      }));

      freshnessRef.current.catalog = Date.now();
      freshnessRef.current.joined = Date.now();
      freshnessRef.current.chats = Date.now();
      return mapped || null;
    },
    [mergeGroups],
  );

  const createPost = useCallback(
    async ({ groupId, content, image }) => {
      const data = await createPostRequest({
        group: groupId,
        content,
        image,
      });
      const mapped = mapCommunityPost(data);
      const normalizedId = String(groupId || mapped.groupId || "");

      setPostsByGroup((current) => ({
        ...current,
        [normalizedId]: [mapped, ...(current[normalizedId] || [])],
      }));

      updateGroupLocally(normalizedId, (group) =>
        patchGroupActivity(group, {
          recentPostsCount: Number(group.recentPostsCount || 0) + 1,
          latestPostExcerpt: mapped.content.slice(0, 140),
          latestActivityAt: mapped.createdAt,
        }),
      );

      freshnessRef.current.posts[normalizedId] = Date.now();
      freshnessRef.current.details[normalizedId] = 0;
      return mapped;
    },
    [updateGroupLocally],
  );

  const markGroupRead = useCallback(
    async (groupId, { remote = true } = {}) => {
      const normalizedId = String(groupId || "");
      if (!normalizedId) return 0;

      updateGroupLocally(normalizedId, (group) => ({
        ...group,
        unreadCount: 0,
      }));

      if (!remote) return 0;
      if (readInFlightRef.current[normalizedId]) {
        return readInFlightRef.current[normalizedId];
      }

      const promise = markGroupMessagesRead(normalizedId)
        .then((response) => Number(response?.marked_read || 0))
        .finally(() => {
          delete readInFlightRef.current[normalizedId];
        });

      readInFlightRef.current[normalizedId] = promise;
      return promise;
    },
    [updateGroupLocally],
  );

  const setMessagesForGroup = useCallback((groupId, nextMessages) => {
    const normalizedId = String(groupId || "");
    if (!normalizedId) return;
    setMessagesByGroup((current) => ({
      ...current,
      [normalizedId]: sortCommunityMessages(nextMessages),
    }));
    freshnessRef.current.messages[normalizedId] = Date.now();
  }, []);

  const appendOptimisticMessage = useCallback((groupId, message) => {
    const normalizedId = String(groupId || "");
    if (!normalizedId) return;

    setMessagesByGroup((current) => ({
      ...current,
      [normalizedId]: sortCommunityMessages([...(current[normalizedId] || []), message]),
    }));

    updateGroupLocally(normalizedId, (group) =>
      patchGroupActivity(group, {
        lastMessageText: message.text,
        lastMessagePreview: `You: ${message.text}`,
        lastMessageAt: message.createdAt,
        latestActivityAt: message.createdAt,
        unreadCount: 0,
      }),
    );
    moveChatToFront(normalizedId);
  }, [moveChatToFront, updateGroupLocally]);

  const replaceMessage = useCallback((groupId, tempId, nextMessage) => {
    const normalizedId = String(groupId || "");
    setMessagesByGroup((current) => ({
      ...current,
      [normalizedId]: sortCommunityMessages(
        (current[normalizedId] || []).map((message) =>
          message.id === tempId ? nextMessage : message,
        ),
      ),
    }));

    updateGroupLocally(normalizedId, (group) =>
      patchGroupActivity(group, {
        lastMessageText: nextMessage.text,
        lastMessagePreview: `You: ${nextMessage.text}`,
        lastMessageAt: nextMessage.createdAt,
        latestActivityAt: nextMessage.createdAt,
        unreadCount: 0,
      }),
    );
    moveChatToFront(normalizedId);
  }, [moveChatToFront, updateGroupLocally]);

  const removeMessage = useCallback((groupId, messageId) => {
    const normalizedId = String(groupId || "");
    setMessagesByGroup((current) => ({
      ...current,
      [normalizedId]: (current[normalizedId] || []).filter(
        (message) => message.id !== messageId,
      ),
    }));
  }, []);

  const applyIncomingMessage = useCallback((groupId, incomingMessage, { isActive = false } = {}) => {
    const normalizedId = String(groupId || "");
    if (!normalizedId) return;

    setMessagesByGroup((current) => ({
      ...current,
      [normalizedId]: upsertCommunityMessage(current[normalizedId] || [], incomingMessage),
    }));

    updateGroupLocally(normalizedId, (group) =>
      patchGroupActivity(group, {
        lastMessageText: incomingMessage.text,
        lastMessagePreview: `${incomingMessage.senderName}: ${incomingMessage.text}`,
        lastMessageAt: incomingMessage.createdAt,
        latestActivityAt: incomingMessage.createdAt,
        unreadCount:
          incomingMessage.from === "me" || isActive
            ? 0
            : Number(group.unreadCount || 0) + 1,
      }),
    );

    moveChatToFront(normalizedId);
  }, [moveChatToFront, updateGroupLocally]);

  const catalogGroups = useMemo(
    () => catalogGroupIds.map((id) => groupsById[id]).filter(Boolean),
    [catalogGroupIds, groupsById],
  );

  const joinedGroups = useMemo(() => {
    const ids = dedupeIds([
      ...joinedGroupIds,
      ...catalogGroups.filter((group) => group.isMember).map((group) => group.id),
    ]);
    return ids.map((id) => groupsById[id]).filter(Boolean);
  }, [catalogGroups, groupsById, joinedGroupIds]);

  const chatSummaries = useMemo(() => {
    const ids = sortGroupIdsByActivity(
      dedupeIds([...chatGroupIds, ...joinedGroups.map((group) => group.id)]),
      groupsById,
    );
    return ids.map((id) => groupsById[id]).filter((group) => group?.isMember);
  }, [chatGroupIds, groupsById, joinedGroups]);

  const value = useMemo(
    () => ({
      catalogGroups,
      joinedGroups,
      chatSummaries,
      groupsById,
      postsByGroup,
      messagesByGroup,
      loadingCatalog,
      loadingJoinedGroups,
      loadingChats,
      loadingPostsByGroup,
      loadingMessagesByGroup,
      ensureCatalog,
      ensureJoinedGroups,
      ensureGroupDetail,
      ensurePosts,
      ensureChats,
      ensureMessages,
      createGroup,
      joinGroup,
      leaveGroup,
      createPost,
      markGroupRead,
      setMessagesForGroup,
      appendOptimisticMessage,
      replaceMessage,
      removeMessage,
      applyIncomingMessage,
    }),
    [
      appendOptimisticMessage,
      applyIncomingMessage,
      catalogGroups,
      chatSummaries,
      createGroup,
      createPost,
      ensureCatalog,
      ensureChats,
      ensureGroupDetail,
      ensureJoinedGroups,
      ensureMessages,
      ensurePosts,
      groupsById,
      joinGroup,
      joinedGroups,
      leaveGroup,
      loadingCatalog,
      loadingChats,
      loadingJoinedGroups,
      loadingMessagesByGroup,
      loadingPostsByGroup,
      markGroupRead,
      messagesByGroup,
      postsByGroup,
      removeMessage,
      replaceMessage,
      setMessagesForGroup,
    ],
  );

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
}
