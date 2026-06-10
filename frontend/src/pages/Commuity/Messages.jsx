import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCheck,
  FileText,
  Image as ImageIcon,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Search,
  Send,
  ShieldAlert,
  Smile,
  Trash2,
  User,
  Volume2,
  X,
} from "lucide-react";

const fallbackChat = {
  id: "demo",
  name: "Community Support",
  role: "Admin",
  lastMsg: "Welcome to Student Hub messages.",
  time: "Now",
  avatar: "https://ui-avatars.com/api/?name=Support&background=0A2647&color=fff",
  active: true,
  messages: [
    {
      id: 1,
      from: "them",
      text: "Welcome to Student Hub messages.",
      time: "Now",
      status: "seen",
      type: "text",
    },
  ],
};

const currentUserAvatar =
  "https://ui-avatars.com/api/?name=Me&background=155BC2&color=fff&bold=true";

const emojis = ["😀", "😂", "😍", "👍", "🔥", "❤️", "🙏", "🎓", "🏠", "✅"];

const Messages = ({ selectedChat, onSendMessage }) => {
  const [messageText, setMessageText] = useState("");
  const [notice, setNotice] = useState("");
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [localMessages, setLocalMessages] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSharedMedia, setShowSharedMedia] = useState(false);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const chat = selectedChat || fallbackChat;

  const messages = useMemo(() => {
    const baseMessages = chat.messages?.length
      ? chat.messages.map((msg) => ({
          type: "text",
          status: "seen",
          ...msg,
        }))
      : [
          {
            id: "last",
            from: "them",
            text: chat.lastMsg,
            time: chat.time || "Now",
            status: "seen",
            type: "text",
          },
        ];

    return [...baseMessages, ...localMessages];
  }, [chat.lastMsg, chat.messages, chat.time, localMessages]);

  const filteredMessages = useMemo(() => {
    if (!searchTerm.trim()) return messages;
    return messages.filter((message) =>
      message.text?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [messages, searchTerm]);

  const sharedFiles = useMemo(
    () => messages.filter((msg) => msg.type === "file" || msg.type === "image"),
    [messages],
  );

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.id, messages.length]);

  const showNotice = (text) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 1800);
  };

  const handleSend = () => {
    const trimmedText = messageText.trim();
    if (!trimmedText) return;

    if (onSendMessage) {
      onSendMessage(chat.id, trimmedText);
    } else {
      setLocalMessages((current) => [
        ...current,
        {
          id: Date.now(),
          from: "me",
          text: trimmedText,
          time: "Just now",
          status: "seen",
          type: "text",
        },
      ]);
    }

    setMessageText("");
    setIsEmojiOpen(false);
  };

  const handleFileUpload = (event, type) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);

    setLocalMessages((current) => [
      ...current,
      {
        id: Date.now(),
        from: "me",
        text: file.name,
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        fileUrl: url,
        time: "Just now",
        status: "seen",
        type,
      },
    ]);

    showNotice(type === "image" ? "Image sent" : "File sent");
    event.target.value = "";
  };

  const handleVoiceMessage = () => {
    setLocalMessages((current) => [
      ...current,
      {
        id: Date.now(),
        from: "me",
        text: "Voice message",
        time: "Just now",
        status: "seen",
        type: "voice",
      },
    ]);

    showNotice("Voice message sent");
  };

  const handleDeleteConversation = () => {
    setLocalMessages([]);
    showNotice("Conversation cleared locally");
    setIsActionsOpen(false);
  };

  const renderStatus = (status) => (
    <span className="inline-flex items-center gap-1 text-blue-500">
      <CheckCheck className="h-3 w-3" />
      {status === "seen" ? "Seen" : "Sent"}
    </span>
  );

  return (
    <div className="relative flex h-full min-h-[520px] flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {notice && (
        <div className="absolute right-4 top-16 z-30 rounded-full bg-[#091E42] px-4 py-2 text-xs font-bold text-white shadow-lg">
          {notice}
        </div>
      )}

      <div className="flex items-center justify-between border-b border-gray-100 bg-white p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative shrink-0">
            <img
              src={chat.avatar}
              alt={chat.name}
              className="h-11 w-11 rounded-full border border-gray-100 object-cover"
            />
            {chat.active && (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
            )}
          </span>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-black text-[#091E42]">{chat.name}</h3>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-[#155BC2]">
                {chat.role || "Student"}
              </span>
              {isImportant && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-600">
                  Important
                </span>
              )}
              {isMuted && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-black text-gray-500">
                  Muted
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-gray-400">
              <span className="flex items-center gap-1 text-green-500">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {chat.active ? "Online" : "Recently active"}
              </span>
              <span>{messages.length} messages</span>
              <span>{sharedFiles.length} files</span>
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
            onClick={() => setIsActionsOpen((current) => !current)}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-50 hover:text-[#155BC2]"
            aria-label="More chat actions"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {isActionsOpen && (
            <div className="absolute right-0 top-11 z-30 w-56 rounded-2xl border border-gray-100 bg-white p-2 text-sm font-bold text-gray-600 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setShowProfile(true);
                  setIsActionsOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-gray-50"
              >
                <User className="h-4 w-4" /> View Profile
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSharedMedia(true);
                  setIsActionsOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-gray-50"
              >
                <ImageIcon className="h-4 w-4" /> Shared Media
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsImportant((current) => !current);
                  showNotice(!isImportant ? "Chat marked important" : "Important removed");
                  setIsActionsOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-gray-50"
              >
                <MessageCircle className="h-4 w-4" />
                {isImportant ? "Remove Important" : "Mark Important"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMuted((current) => !current);
                  showNotice(!isMuted ? "Chat muted" : "Chat unmuted");
                  setIsActionsOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-gray-50"
              >
                <ShieldAlert className="h-4 w-4" />
                {isMuted ? "Unmute Chat" : "Mute Chat"}
              </button>

              <button
                type="button"
                onClick={handleDeleteConversation}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" /> Delete Conversation
              </button>
            </div>
          )}
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

      <div className="hide-scrollbar flex-1 space-y-4 overflow-y-auto bg-[#F8FAFC] p-4 md:p-6">
        <div className="mx-auto mb-2 w-fit rounded-full bg-white px-3 py-1 text-[11px] font-bold text-gray-400 shadow-sm">
          Today
        </div>

        {filteredMessages.map((message, index) => {
          const isMine = message.from === "me";
          const previous = filteredMessages[index - 1];
          const isGrouped = previous && previous.from === message.from;

          return (
            <div
              key={message.id}
              className={`flex max-w-[90%] gap-3 ${
                isMine ? "ml-auto flex-row-reverse" : ""
              }`}
            >
              {!isGrouped ? (
                <img
                  src={isMine ? currentUserAvatar : chat.avatar}
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
                  {message.type === "image" ? (
                    <button
                      type="button"
                      onClick={() => setPreviewImage(message.fileUrl)}
                      className="block overflow-hidden rounded-2xl"
                    >
                      <img src={message.fileUrl} alt={message.fileName} className="max-h-64 w-full object-cover" />
                    </button>
                  ) : message.type === "file" ? (
                    <a href={message.fileUrl} download={message.fileName} className="flex items-center gap-3">
                      <FileText className="h-8 w-8 shrink-0" />
                      <div>
                        <p className="font-black">{message.fileName}</p>
                        <p className="text-xs opacity-70">{message.fileSize}</p>
                      </div>
                    </a>
                  ) : message.type === "voice" ? (
                    <div className="flex items-center gap-3">
                      <Volume2 className="h-5 w-5" />
                      <span>Voice message · 0:08</span>
                    </div>
                  ) : (
                    message.text
                  )}
                </div>

                <span className={`mt-1 block text-[10px] text-gray-400 ${isMine ? "text-right" : ""}`}>
                  {message.time}
                  {isMine && <> · {renderStatus(message.status)}</>}
                </span>
              </div>
            </div>
          );
        })}

        <div ref={scrollRef} />
      </div>

      <div className="border-t border-gray-100 bg-white p-4">
        <div className="relative flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2">
          <input ref={imageInputRef} type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "image")} className="hidden" />
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.zip,.txt" onChange={(e) => handleFileUpload(e, "file")} className="hidden" />

          <button type="button" onClick={() => imageInputRef.current?.click()} className="rounded-full p-2 text-gray-400 hover:bg-white hover:text-[#155BC2]">
            <ImageIcon className="h-5 w-5" />
          </button>

          <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-full p-2 text-gray-400 hover:bg-white hover:text-[#155BC2]">
            <Paperclip className="h-5 w-5" />
          </button>

          <input
            type="text"
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSend();
            }}
            placeholder="Type a message..."
            className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none"
          />

          <button type="button" onClick={() => setIsEmojiOpen((current) => !current)} className="rounded-full p-2 text-gray-400 hover:bg-white hover:text-[#155BC2]">
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

          <button type="button" onClick={handleVoiceMessage} className="rounded-full p-2 text-gray-400 hover:bg-white hover:text-[#155BC2]">
            <Volume2 className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={!messageText.trim()}
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
            <button onClick={() => setShowProfile(false)} className="mt-5 rounded-xl bg-[#155BC2] px-5 py-2 text-sm font-bold text-white">
              Close
            </button>
          </div>
        </div>
      )}

      {showSharedMedia && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-black text-[#091E42]">Shared Media</h3>
            <div className="mt-4 space-y-3">
              {sharedFiles.length ? (
                sharedFiles.map((file) => (
                  <div key={file.id} className="rounded-xl border border-gray-100 p-3 text-sm font-bold text-gray-600">
                    {file.fileName || file.text}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">No shared files yet.</p>
              )}
            </div>
            <button onClick={() => setShowSharedMedia(false)} className="mt-5 rounded-xl bg-[#155BC2] px-5 py-2 text-sm font-bold text-white">
              Close
            </button>
          </div>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
          <button onClick={() => setPreviewImage(null)} className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white">
            <X className="h-5 w-5" />
          </button>
          <img src={previewImage} alt="Preview" className="max-h-full max-w-full rounded-2xl object-contain" />
        </div>
      )}
    </div>
  );
};

export default Messages;
