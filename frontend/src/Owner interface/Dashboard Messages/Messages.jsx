import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Ban,
  Check,
  CheckCheck,
  MoreVertical,
  Phone,
  Pin,
  Search,
  SendHorizonal,
  Trash2,
  UserRound,
} from "lucide-react";
import { useMessagingInbox } from "../../hooks/useMessagingInbox.js";

const cx = (...classes) => classes.filter(Boolean).join(" ");

const connectionMeta = {
  idle: { label: "Select a conversation", tone: "text-slate-400" },
  connecting: { label: "Connecting…", tone: "text-slate-400" },
  connected: { label: "Live", tone: "text-emerald-600" },
  reconnecting: { label: "Reconnecting…", tone: "text-amber-500" },
  degraded: { label: "Offline fallback", tone: "text-rose-600" },
};

function initials(name = "") {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const value = parts.map((part) => part[0]?.toUpperCase()).join("");
  return value || "U";
}

function Avatar({ name }) {
  return (
    <div className="h-12 w-12 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-semibold">
      {initials(name)}
    </div>
  );
}

function StatusIcon({ status }) {
  if (status === "sending") return <Check className="h-4 w-4" />;
  return <CheckCheck className="h-4 w-4" />;
}

function Bubble({ message }) {
  const mine = message.from === "me";
  return (
    <div className={cx("w-full flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cx(
          "max-w-[72%] rounded-2xl px-4 py-3 shadow-sm",
          mine
            ? "bg-[#1E4FD8] text-white rounded-br-md"
            : "bg-[#2F2F2F] text-white rounded-bl-md",
        )}
      >
        <div className="whitespace-pre-wrap text-[14px] leading-6">{message.text}</div>
        <div className="mt-2 flex items-center justify-end gap-2 text-[12px] opacity-90">
          <span>{message.time}</span>
          {mine ? <StatusIcon status={message.status} /> : null}
        </div>
      </div>
    </div>
  );
}

function Menu({ open, items, onClose }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-4 top-[60px] z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className={cx(
              "flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] hover:bg-slate-50",
              item.danger ? "text-rose-600" : "text-slate-700",
            )}
          >
            <span className={item.danger ? "text-rose-600" : "text-slate-600"}>{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

export default function Messages() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const legacyStudentTarget = searchParams.get("student");
  const initialRouteState = useMemo(
    () =>
      legacyStudentTarget
        ? {
            receiverId: legacyStudentTarget,
            id: legacyStudentTarget,
            name: `Student #${legacyStudentTarget}`,
          }
        : state,
    [legacyStudentTarget, state],
  );
  const {
    activeConversation,
    activeMessages,
    connectionState,
    conversations,
    error,
    selectConversation,
    sendMessage,
    setError,
  } = useMessagingInbox(initialRouteState);

  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [text, setText] = useState("");
  const [notice, setNotice] = useState("");
  const [pinnedIds, setPinnedIds] = useState([]);
  const [blockedIds, setBlockedIds] = useState([]);

  const textareaRef = useRef(null);
  const listEndRef = useRef(null);
  const MIN_H = 44;
  const MAX_H = 140;

  const activeConversationId = activeConversation?.id || null;
  const isBlocked = activeConversationId ? blockedIds.includes(activeConversationId) : false;
  const statusMeta = connectionMeta[connectionState] || connectionMeta.idle;

  const threads = useMemo(() => {
    const mapped = conversations.map((conversation) => ({
      ...conversation,
      pinned: pinnedIds.includes(conversation.id),
      blocked: blockedIds.includes(conversation.id),
    }));

    const filtered = mapped.filter((conversation) => {
      const value = query.trim().toLowerCase();
      if (!value) return true;
      return (
        conversation.name.toLowerCase().includes(value) ||
        conversation.lastMessage.toLowerCase().includes(value)
      );
    });

    return [...filtered].sort((left, right) => {
      if (left.pinned !== right.pinned) return left.pinned ? -1 : 1;
      return 0;
    });
  }, [blockedIds, conversations, pinnedIds, query]);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "0px";
    const nextHeight = Math.min(MAX_H, Math.max(MIN_H, element.scrollHeight));
    element.style.height = `${nextHeight}px`;
  }, [text]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length, activeConversationId]);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  };

  const isPinned = activeConversationId ? pinnedIds.includes(activeConversationId) : false;
  const menuItems = [
    {
      label: "View Profile",
      icon: <UserRound className="h-4 w-4" />,
      onClick: () => {
        if (!activeConversation?.receiverId) return;
        navigate(`/profile/${activeConversation.receiverId}`);
      },
    },
    {
      label: isPinned ? "Unpin Chat" : "Pin Chat",
      icon: <Pin className="h-4 w-4" />,
      onClick: () => {
        if (!activeConversationId) return;
        setPinnedIds((current) =>
          current.includes(activeConversationId)
            ? current.filter((value) => value !== activeConversationId)
            : [...current, activeConversationId],
        );
      },
    },
    {
      label: "Clear Search",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setQuery(""),
      danger: true,
    },
    {
      label: isBlocked ? "Unblock" : "Block",
      icon: <Ban className="h-4 w-4" />,
      onClick: () => {
        if (!activeConversationId) return;
        setBlockedIds((current) =>
          current.includes(activeConversationId)
            ? current.filter((value) => value !== activeConversationId)
            : [...current, activeConversationId],
        );
      },
      danger: !isBlocked,
    },
  ];

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !activeConversation || isBlocked) return;

    try {
      await sendMessage(trimmed);
      setText("");
      requestAnimationFrame(() => {
        const element = textareaRef.current;
        if (element) element.style.height = `${MIN_H}px`;
      });
    } catch (sendError) {
      setError(sendError.message || "Failed to send message");
    }
  };

  return (
    <div className="h-screen w-full bg-[#F3F5F8]">
      {notice && (
        <div className="fixed right-6 top-6 z-[1000] rounded-xl bg-[#091E42] px-4 py-3 text-sm font-bold text-white shadow-lg">
          {notice}
        </div>
      )}
      {error && (
        <div className="fixed left-6 top-6 z-[1000] rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 shadow-lg">
          {error}
        </div>
      )}

      <div className="h-full w-full grid grid-cols-[420px_1fr]">
        <div className="flex h-full flex-col border-r border-slate-200 bg-white">
          <div className="px-8 pb-5 pt-8">
            <div className="flex items-center gap-3">
              <h1 className="text-[44px] font-extrabold leading-none text-slate-900">Messages</h1>
              <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-[#1E4FD8] px-3 text-[14px] font-semibold text-white">
                {conversations.reduce((sum, conversation) => sum + (conversation.unreadCount || 0), 0)}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-500">
              <span className={statusMeta.tone}>{statusMeta.label}</span>
              <span>•</span>
              <span>Text-only live chat</span>
            </div>

            <div className="relative mt-6">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                className="h-12 w-full rounded-full border border-transparent bg-[#F1F3F6] pl-12 pr-4 text-[14px] outline-none focus:border-[#1E4FD8]/30 focus:ring-4 focus:ring-[#1E4FD8]/10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {threads.length === 0 ? (
              <div className="px-8 py-10 text-[14px] text-slate-500">No conversations.</div>
            ) : (
              threads.map((thread) => {
                const active = thread.id === activeConversationId;
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => selectConversation(thread.id)}
                    className={cx(
                      "w-full border-t border-slate-100 px-8 py-6 text-left transition hover:bg-slate-50",
                      active ? "bg-[#F2F6FF]" : "bg-white",
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <Avatar name={thread.name} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="truncate text-[18px] font-extrabold text-slate-900">
                                {thread.name}
                              </div>
                              {thread.pinned ? (
                                <span className="text-slate-500">
                                  <Pin className="h-4 w-4" />
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-1 truncate text-[14px] text-slate-500">
                              {thread.lastMessage}
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <div className="text-[13px] text-slate-400">{thread.lastTime || ""}</div>
                            {thread.unreadCount ? (
                              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#1E4FD8] px-2 text-[12px] font-semibold text-white">
                                {thread.unreadCount}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {active ? <div className="mt-3 h-1 w-14 rounded-full bg-[#1E4FD8]" /> : null}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex h-full flex-col bg-white">
          <div className="relative flex h-[92px] items-center justify-between border-b border-slate-200 bg-[#F1F2F4] px-8">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar name={activeConversation?.name || ""} />
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="truncate text-[20px] font-extrabold text-slate-900">
                    {activeConversation?.name || "Select a chat"}
                  </div>
                  {isBlocked ? (
                    <span className="ml-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[12px] font-semibold text-rose-600">
                      Blocked
                    </span>
                  ) : null}
                </div>
                <div className="truncate text-[14px] text-slate-600">
                  {statusMeta.label}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-[#1E4FD8] transition hover:bg-slate-50 active:scale-[0.98]"
                onClick={() =>
                  activeConversation &&
                  showNotice(`Call request prepared for ${activeConversation.name}. Connect this to your calling API.`)
                }
                aria-label="Call"
              >
                <Phone className="h-5 w-5" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
                  onClick={() => setMenuOpen((current) => !current)}
                  aria-label="More"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
                <Menu open={menuOpen} items={menuItems} onClose={() => setMenuOpen(false)} />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-white px-10 py-8">
            {!activeConversation ? (
              <div className="flex h-full items-center justify-center text-slate-500">
                Select a conversation to start.
              </div>
            ) : activeMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-500">
                No messages yet.
              </div>
            ) : (
              <div className="space-y-7">
                {activeMessages.map((message) => (
                  <Bubble key={message.id} message={message} />
                ))}
                <div ref={listEndRef} />
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-white px-10 py-6">
            <div className="mb-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700">
              File, image, and voice sending stay disabled in this phase. Live text chat is active.
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1">
                <div className="rounded-2xl border border-slate-200 bg-white focus-within:border-[#1E4FD8]/40 focus-within:ring-4 focus-within:ring-[#1E4FD8]/10">
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder={isBlocked ? "You blocked this chat" : "Message"}
                    disabled={!activeConversation || isBlocked}
                    className={cx(
                      "w-full resize-none rounded-2xl bg-transparent px-5 py-3 text-[14px] outline-none",
                      !activeConversation || isBlocked ? "text-slate-400" : "text-slate-900",
                    )}
                    style={{ height: MIN_H }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSend}
                disabled={!activeConversation || isBlocked || !text.trim()}
                className={cx(
                  "flex h-12 w-12 items-center justify-center rounded-full transition active:scale-[0.99]",
                  !activeConversation || isBlocked || !text.trim()
                    ? "cursor-not-allowed bg-slate-200 text-white"
                    : "bg-[#1E4FD8] text-white hover:bg-[#1A46C0]",
                )}
                aria-label="Send"
              >
                <SendHorizonal className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
