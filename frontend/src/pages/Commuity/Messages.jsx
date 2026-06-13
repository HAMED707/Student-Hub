import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCheck, Search, Send, Users } from "lucide-react";
import { useCommunityGroupChat } from "../../hooks/useCommunityGroupChat.jsx";

const connectionMeta = {
  idle: { label: "Select a group", tone: "text-gray-400" },
  connecting: { label: "Connecting…", tone: "text-gray-400" },
  connected: { label: "Live", tone: "text-green-500" },
  reconnecting: { label: "Reconnecting…", tone: "text-amber-500" },
  degraded: { label: "Offline fallback", tone: "text-rose-500" },
};

const renderStatus = (status) => (
  <span className="inline-flex items-center gap-1 text-blue-500">
    <CheckCheck className="h-3 w-3" />
    {status === "sending" ? "Sending…" : "Sent"}
  </span>
);

export default function Messages({ selectedGroupId = "", onSelectGroup }) {
  const navigate = useNavigate();
  const {
    chats,
    activeChat,
    activeMessages,
    connectionState,
    error,
    setError,
    loadingChats,
    loadingMessages,
    selectGroup,
    sendMessage,
  } = useCommunityGroupChat(selectedGroupId);

  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const scrollRef = useRef(null);

  const statusMeta = connectionMeta[connectionState] || connectionMeta.idle;

  const filteredChats = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return chats;
    return chats.filter((chat) => chat.name.toLowerCase().includes(search));
  }, [chats, searchTerm]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length, activeChat?.id]);

  const handleSend = async () => {
    const trimmed = messageText.trim();
    if (!trimmed) return;

    try {
      await sendMessage(trimmed);
      setMessageText("");
    } catch (sendError) {
      setError(sendError.message || "Failed to send message");
    }
  };

  return (
    <div className="grid min-h-[640px] gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-lg font-black text-[#091E42]">Group Chats</h2>
          <p className="mt-1 text-sm text-slate-500">
            Joined group summaries from `/api/community/chats/`.
          </p>
          <label className="relative mt-4 block">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search groups"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] pl-11 pr-4 text-sm outline-none focus:border-[#155BC2] focus:bg-white"
            />
          </label>
        </div>

        <div className="max-h-[560px] space-y-2 overflow-y-auto p-4">
          {loadingChats ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
              Loading group chats...
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Join a group to unlock community chat.
            </div>
          ) : (
            filteredChats.map((chat) => (
              <button
                key={chat.id}
                type="button"
                onClick={() => {
                  selectGroup(chat.id);
                  onSelectGroup?.(chat.id);
                }}
                className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                  chat.id === activeChat?.id
                    ? "border-blue-200 bg-blue-50"
                    : "border-slate-100 bg-white hover:bg-slate-50"
                }`}
              >
                <img
                  src={chat.coverImage}
                  alt={chat.name}
                  className="h-14 w-14 rounded-2xl object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-black text-[#091E42]">{chat.name}</span>
                    {chat.unreadCount ? (
                      <span className="rounded-full bg-[#155BC2] px-2 py-0.5 text-[10px] font-black text-white">
                        {chat.unreadCount}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 block truncate text-sm text-slate-500">
                    {chat.lastMessagePreview}
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-slate-400">
                    {chat.memberCount} members · {chat.lastMessageTime || chat.latestActivityLabel}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="relative flex min-h-[640px] flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              {activeChat ? (
                <img
                  src={activeChat.coverImage}
                  alt={activeChat.name}
                  className="h-12 w-12 rounded-2xl object-cover"
                />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                  <Users className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="truncate text-lg font-black text-[#091E42]">
                  {activeChat?.name || "Community group chat"}
                </h2>
                <p className={`mt-1 text-xs font-bold ${statusMeta.tone}`}>
                  {statusMeta.label}
                  {activeChat ? ` · ${activeChat.memberCount} members` : ""}
                </p>
              </div>
            </div>
          </div>

          {activeChat ? (
            <button
              type="button"
              onClick={() => navigate(`/community/groups/${activeChat.id}`)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
            >
              <Users className="h-4 w-4" />
              Group details
            </button>
          ) : null}
        </div>

        {error ? (
          <div className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="flex-1 space-y-4 overflow-y-auto bg-[#F8FAFC] p-4 md:p-6">
          {loadingMessages ? (
            <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-slate-500">
              Loading messages...
            </div>
          ) : activeMessages.length === 0 ? (
            <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-slate-400">
              {activeChat
                ? "No messages yet in this group."
                : "Select a joined group to open its live chat."}
            </div>
          ) : (
            activeMessages.map((message, index) => {
              const isMine = message.from === "me";
              const previous = activeMessages[index - 1];
              const isGrouped = previous && previous.from === message.from;

              return (
                <div
                  key={message.id}
                  className={`flex max-w-[90%] gap-3 ${isMine ? "ml-auto flex-row-reverse" : ""}`}
                >
                  {!isGrouped ? (
                    <img
                      src={message.avatar}
                      alt={message.senderName}
                      className="mt-1 h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 shrink-0" />
                  )}

                  <div className="min-w-0">
                    {!isMine && !isGrouped ? (
                      <p className="mb-1 text-xs font-bold text-slate-400">
                        {message.senderName}
                      </p>
                    ) : null}
                    <div
                      className={`rounded-3xl p-3 text-sm shadow-sm ${
                        isMine
                          ? "rounded-tr-none bg-[#155BC2] text-white"
                          : "rounded-tl-none border border-gray-100 bg-white text-gray-700"
                      }`}
                    >
                      {message.text}
                    </div>

                    <span className={`mt-1 block text-[10px] text-gray-400 ${isMine ? "text-right" : ""}`}>
                      {message.time}
                      {isMine && <> · {renderStatus(message.status)}</>}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          <div ref={scrollRef} />
        </div>

        <div className="border-t border-gray-100 bg-white p-4">
          <div className="mb-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700">
            Community chat is text-only in this pass. Attachments, voice, and local-only reactions stay disabled until backend support exists.
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2">
            <input
              type="text"
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSend();
              }}
              placeholder={
                connectionState === "degraded"
                  ? "Connection degraded. HTTP fallback is available."
                  : "Type a group message..."
              }
              disabled={!activeChat}
              className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none disabled:cursor-not-allowed"
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={!messageText.trim() || !activeChat}
              className="rounded-full bg-[#155BC2] p-2 text-white hover:bg-[#0f4aa0] disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
