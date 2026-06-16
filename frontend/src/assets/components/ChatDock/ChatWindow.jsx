import { useEffect, useRef, useState } from "react";
import { CheckCheck, Minimize2, Send, Smile, X } from "lucide-react";
import { withApiUrl } from "../../../api/client.js";
import { useGlobalMessaging } from "../../../context/messagingContext.js";
import { useChatWindow } from "../../../hooks/useChatWindow.js";
import { getStoredUser } from "../../../utils/auth.js";
import { markConversationRead, startConversation } from "../../../api/messaging.js";
import { mapConversation } from "../../../utils/messaging.js";

const emojis = ["😀", "😂", "😍", "👍", "🔥", "❤️", "🙏", "🎓", "🏠", "✅"];

const connectionDot = {
  idle: "bg-gray-400",
  connecting: "bg-gray-400",
  connected: "bg-green-500",
  reconnecting: "bg-amber-400",
  degraded: "bg-rose-500",
};

const connectionLabel = {
  idle: "Loading…",
  connecting: "Connecting…",
  connected: "Live",
  reconnecting: "Reconnecting…",
  degraded: "Offline",
};

function MessageStatus({ status }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-blue-300">
      <CheckCheck className="h-3 w-3" />
      {status === "sending" ? "Sending…" : "Sent"}
    </span>
  );
}

export function ChatWindow({ conversationId, minimized, onMinimize, onClose, index }) {
  const { conversations, currentUserId, upgradeWindow, refreshConversations, updateConversationPreview } = useGlobalMessaging();
  const storedUser = getStoredUser();
  const isDraft = String(conversationId).startsWith("draft-");

  const myAvatar = storedUser?.profile_picture
    ? withApiUrl(storedUser.profile_picture)
    : storedUser?.avatarUrl
      ? withApiUrl(storedUser.avatarUrl) || storedUser.avatarUrl
      : `https://ui-avatars.com/api/?name=Me&background=155BC2&color=fff&bold=true`;

  const conversation = conversations.find((c) => c.id === String(conversationId));
  const displayName = conversation?.name || "Chat";
  const displayAvatar =
    conversation?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0A2647&color=fff`;
  const unreadCount = conversation?.unreadCount || 0;

  const messagesContainerRef = useRef(null);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);

  const { messages, connectionState, sendMessage, inputText, setInputText } = useChatWindow(
    conversationId,
    { currentUserId, onPreviewUpdate: updateConversationPreview },
  );

  // Mark as read when window is restored from minimized
  useEffect(() => {
    if (!minimized && conversationId && /^\d+$/.test(String(conversationId))) {
      markConversationRead(conversationId).catch(() => {});
      updateConversationPreview(conversationId, { unreadCount: 0 });
    }
  }, [minimized, conversationId, updateConversationPreview]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!minimized && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages.length, minimized]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText("");
    setIsEmojiOpen(false);

    if (isDraft) {
      const draft = conversations.find((c) => c.id === String(conversationId));
      if (!draft) return;
      try {
        const created = await startConversation({ receiver_id: draft.receiverId, message: text });
        const mapped = mapConversation(created, currentUserId);
        await refreshConversations();
        upgradeWindow(conversationId, mapped.id);
      } catch {
        // best-effort
      }
      return;
    }

    try {
      await sendMessage(text);
    } catch {
      // best-effort
    }
  };

  const positionStyle = { right: `${100 + index * 344}px` };

  if (minimized) {
    return (
      <div
        className="fixed bottom-0 z-[120] flex w-72 cursor-pointer items-center justify-between rounded-t-2xl border border-b-0 border-gray-200 bg-white px-3 py-2.5 shadow-lg"
        style={positionStyle}
        onClick={onMinimize}
      >
        <div className="flex min-w-0 items-center gap-2">
          <img
            src={displayAvatar}
            alt={displayName}
            className="h-8 w-8 shrink-0 rounded-full object-cover"
          />
          <span className="truncate text-sm font-bold text-gray-900">{displayName}</span>
          {unreadCount > 0 && (
            <span className="shrink-0 rounded-full bg-[#155BC2] px-2 py-0.5 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-0 z-[120] flex w-80 flex-col overflow-hidden rounded-t-2xl border border-b-0 border-gray-200 bg-white shadow-xl"
      style={{ ...positionStyle, height: "420px" }}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <img
            src={displayAvatar}
            alt={displayName}
            className="h-8 w-8 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight text-gray-900">{displayName}</p>
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <span className={`h-1.5 w-1.5 rounded-full ${isDraft ? "bg-emerald-500" : (connectionDot[connectionState] || connectionDot.idle)}`} />
              {isDraft ? "Send first message" : (connectionLabel[connectionState] || connectionLabel.idle)}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={onMinimize}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 space-y-3 overflow-y-auto bg-[#F8FAFC] p-3"
        style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
      >
        <style>{`.chat-window-scroll::-webkit-scrollbar { display: none; }`}</style>
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            No messages yet.
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMine = msg.from === "me";
            const prev = messages[i - 1];
            const isGrouped = prev && prev.from === msg.from;
            return (
              <div
                key={msg.id}
                className={`flex max-w-[90%] gap-2 ${isMine ? "ml-auto flex-row-reverse" : ""}`}
              >
                {!isGrouped ? (
                  <img
                    src={isMine ? myAvatar : displayAvatar}
                    className="mt-1 h-6 w-6 shrink-0 rounded-full object-cover"
                    alt={isMine ? "me" : displayName}
                  />
                ) : (
                  <div className="h-6 w-6 shrink-0" />
                )}
                <div className="min-w-0">
                  <div
                    className={`rounded-2xl px-3 py-2 text-xs shadow-sm ${
                      isMine
                        ? "rounded-tr-none bg-[#155BC2] text-white"
                        : "rounded-tl-none border border-gray-100 bg-white text-gray-700"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span
                    className={`mt-0.5 block text-[9px] text-gray-400 ${isMine ? "text-right" : ""}`}
                  >
                    {msg.time}
                    {isMine && (
                      <>
                        {" "}
                        · <MessageStatus status={msg.status} />
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-gray-100 bg-white p-2">
        <div className="relative flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-gray-50 px-2.5 py-1.5">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            placeholder="Aa"
            className="min-w-0 flex-1 bg-transparent text-xs text-gray-700 outline-none"
          />
          <button
            type="button"
            onClick={() => setIsEmojiOpen((o) => !o)}
            className="rounded-full p-1 text-gray-400 hover:text-[#155BC2]"
          >
            <Smile className="h-4 w-4" />
          </button>

          {isEmojiOpen && (
            <div className="absolute bottom-10 right-0 z-30 grid w-44 grid-cols-5 gap-1 rounded-2xl border border-gray-100 bg-white p-2.5 shadow-xl">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setInputText((t) => `${t}${emoji}`);
                    setIsEmojiOpen(false);
                  }}
                  className="rounded-xl p-1 text-base hover:bg-gray-50"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="rounded-full bg-[#155BC2] p-1.5 text-white hover:bg-[#0f4aa0] disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
