import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCheck,
  MessageCircle,
  Search,
  Send,
  Smile,
  User,
  X,
} from "lucide-react";
import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import { useMessagingInbox } from "../../hooks/useMessagingInbox.js";
import { getStoredUser } from "../../utils/auth.js";

const fallbackChat = {
  id: "demo",
  name: "Student Hub",
  role: "Support",
  avatar: "https://ui-avatars.com/api/?name=Student+Hub&background=0A2647&color=fff",
};

const currentUserAvatar =
  "https://ui-avatars.com/api/?name=Me&background=155BC2&color=fff&bold=true";

const emojis = ["😀", "😂", "😍", "👍", "🔥", "❤️", "🙏", "🎓", "🏠", "✅"];

const connectionMeta = {
  idle: { label: "Select a conversation", tone: "text-gray-400" },
  connecting: { label: "Connecting…", tone: "text-gray-400" },
  connected: { label: "Live", tone: "text-green-500" },
  reconnecting: { label: "Reconnecting…", tone: "text-amber-500" },
  degraded: { label: "Offline fallback", tone: "text-rose-500" },
};

export default function StudentMessages() {
  const { state } = useLocation();
  const { id: legacyChatTarget } = useParams();
  const navigate = useNavigate();
  const storedUser = getStoredUser();
  const routeState = useMemo(() => {
    if (state) return state;
    if (!legacyChatTarget) return null;

    return {
      receiverId: legacyChatTarget,
      id: legacyChatTarget,
      name: `Student #${legacyChatTarget}`,
    };
  }, [legacyChatTarget, state]);

  const {
    activeConversation,
    activeMessages,
    connectionState,
    conversations,
    error,
    selectConversation,
    sendMessage,
    setError,
  } = useMessagingInbox(routeState);

  const [messageText, setMessageText] = useState("");
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const scrollRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const chat = activeConversation || fallbackChat;
  const statusMeta = connectionMeta[connectionState] || connectionMeta.idle;

  const filteredMessages = useMemo(() => {
    if (!searchTerm.trim()) return activeMessages;
    return activeMessages.filter((message) =>
      message.text?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [activeMessages, searchTerm]);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [filteredMessages.length, chat.id]);

  const handleSend = async () => {
    const trimmedText = messageText.trim();
    if (!trimmedText) return;

    try {
      await sendMessage(trimmedText);
      setMessageText("");
      setIsEmojiOpen(false);
    } catch (sendError) {
      setError(sendError.message || "Failed to send message");
    }
  };

  const handleViewProfile = () => {
    if (!activeConversation?.receiverId) return;
    navigate(`/profile/${activeConversation.receiverId}`);
  };

  const renderStatus = (status) => (
    <span className="inline-flex items-center gap-1 text-blue-500">
      <CheckCheck className="h-3 w-3" />
      {status === "sending" ? "Sending…" : "Sent"}
    </span>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F8FAFC] font-sans text-[#0A2647]">
      <Navbar />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-hidden px-4 pb-4 pt-4 sm:px-6 lg:px-8">
        <div className="relative flex flex-1 flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <style>{`
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .hide-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>

          <div className="flex items-center justify-between border-b border-gray-100 bg-white p-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-50 hover:text-[#155BC2]"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <span className="relative shrink-0">
                <img
                  src={chat.avatar}
                  alt={chat.name}
                  className="h-11 w-11 rounded-full border border-gray-100 object-cover"
                />
              </span>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-black text-[#091E42]">{chat.name}</h3>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-[#155BC2]">
                    {chat.role || "Student"}
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-gray-400">
                  <span className={`flex items-center gap-1 ${statusMeta.tone}`}>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        connectionState === "connected"
                          ? "bg-green-500"
                          : connectionState === "degraded"
                            ? "bg-rose-500"
                            : "bg-amber-400"
                      }`}
                    />
                    {statusMeta.label}
                  </span>
                  <span>{activeMessages.length} messages</span>
                  <span>{conversations.length} threads</span>
                </div>
              </div>
            </div>

            <div className="relative flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSearchOpen((current) => !current)}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-50 hover:text-[#155BC2]"
                aria-label="Search messages"
              >
                <Search className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => setShowProfile(true)}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-50 hover:text-[#155BC2]"
                aria-label="Open participant profile"
              >
                <User className="h-5 w-5" />
              </button>
            </div>
          </div>

          {searchOpen && (
            <div className="border-b border-gray-100 bg-[#F8FAFC] p-3">
              <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-3 py-2">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search inside conversation..."
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSearchOpen(false);
                  }}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          {conversations.length > 0 && (
            <div className="hide-scrollbar flex gap-2 overflow-x-auto border-b border-gray-100 bg-white px-4 py-3">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => selectConversation(conversation.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold transition ${
                    conversation.id === activeConversation?.id
                      ? "border-[#155BC2] bg-blue-50 text-[#155BC2]"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <span>{conversation.name}</span>
                  {conversation.unreadCount ? (
                    <span className="rounded-full bg-[#155BC2] px-2 py-0.5 text-[10px] text-white">
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesContainerRef} className="hide-scrollbar flex-1 space-y-4 overflow-y-auto bg-[#F8FAFC] p-4 md:p-6">
            {filteredMessages.length === 0 ? (
              <div className="flex h-full min-h-[280px] items-center justify-center text-sm font-medium text-gray-400">
                {activeConversation ? "No messages yet." : "Select a conversation to start messaging."}
              </div>
            ) : (
              filteredMessages.map((message, index) => {
                const isMine = message.from === "me";
                const previous = filteredMessages[index - 1];
                const isGrouped = previous && previous.from === message.from;

                return (
                  <div
                    key={message.id}
                    className={`flex max-w-[90%] gap-3 ${isMine ? "ml-auto flex-row-reverse" : ""}`}
                  >
                    {!isGrouped ? (
                      <img
                        src={isMine ? storedUser?.avatarUrl || currentUserAvatar : chat.avatar}
                        className="mt-1 h-8 w-8 rounded-full object-cover"
                        alt={isMine ? "me" : chat.name}
                      />
                    ) : (
                      <div className="h-8 w-8 shrink-0" />
                    )}

                    <div className="min-w-0">
                      <div
                        className={`rounded-3xl p-3 text-sm shadow-sm ${
                          isMine
                            ? "rounded-tr-none bg-[#155BC2] text-white"
                            : "rounded-tl-none border border-gray-100 bg-white text-gray-700"
                        }`}
                      >
                        {message.text}
                      </div>

                      <span
                        className={`mt-1 block text-[10px] text-gray-400 ${isMine ? "text-right" : ""}`}
                      >
                        {message.time}
                        {isMine && <> · {renderStatus(message.status)}</>}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

          </div>

          <div className="border-t border-gray-100 bg-white p-4">
            <div className="relative flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2">
              <input
                type="text"
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSend();
                }}
                placeholder={
                  connectionState === "degraded"
                    ? "Connection degraded. REST fallback is available."
                    : "Type a message..."
                }
                className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none"
              />

              <button
                type="button"
                onClick={() => setIsEmojiOpen((current) => !current)}
                className="rounded-full p-2 text-gray-400 hover:bg-white hover:text-[#155BC2]"
              >
                <Smile className="h-5 w-5" />
              </button>

              {isEmojiOpen && (
                <div className="absolute bottom-14 right-16 z-30 grid w-52 grid-cols-5 gap-1 rounded-2xl border border-gray-100 bg-white p-3 shadow-xl">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setMessageText((current) => `${current}${emoji}`);
                        setIsEmojiOpen(false);
                      }}
                      className="rounded-xl p-2 text-lg hover:bg-gray-50"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleSend}
                disabled={!messageText.trim() || !activeConversation}
                className="rounded-full bg-[#155BC2] p-2 text-white hover:bg-[#0f4aa0] disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>

          {showProfile && (
            <div className="absolute inset-0 z-40 grid place-items-center bg-black/30 p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
                <img src={chat.avatar} alt={chat.name} className="mx-auto h-20 w-20 rounded-full" />
                <h3 className="mt-4 text-xl font-black text-[#091E42]">{chat.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{chat.role || "Student"}</p>
                <div className="mt-5 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleViewProfile}
                    className="rounded-xl bg-[#155BC2] px-5 py-2 text-sm font-bold text-white"
                  >
                    Open Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProfile(false)}
                    className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-bold text-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
