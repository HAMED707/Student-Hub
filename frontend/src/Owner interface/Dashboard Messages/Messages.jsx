// Messages.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Phone,
  MoreVertical,
  Paperclip,
  SendHorizonal,
  CheckCheck,
  Check,
  Ban,
  Trash2,
  Pin,
  UserRound,
  Mic,
  Camera,
  X,
} from "lucide-react";

/* =========================
   Utils
========================= */
const cx = (...c) => c.filter(Boolean).join(" ");

function initials(name = "") {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const s = parts.map((p) => p[0]?.toUpperCase()).join("");
  return s || "U";
}
function nowTime() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

/* =========================
   Demo Data (بدون Backend)
========================= */
const demoThreads = [
  {
    id: "t1",
    studentId: "s1",
    name: "John Smith",
    username: "@john_smith",
    online: true,
    pinned: false,
    blocked: false,
    unread: 5,
    lastTime: "21:15",
    lastMessage: "See you later, I'll let you know.",
    messages: [
      {
        id: uid(),
        type: "text",
        from: "them",
        text: "Hey! I have a question about the room.\nIs Wi-Fi included and what’s the nearest landmark?",
        time: "21:08",
        status: "seen",
      },
      {
        id: uid(),
        type: "text",
        from: "me",
        text: "Yes, Wi-Fi is included.\nNearest landmark is Mansoura University Gate 3.",
        time: "21:09",
        status: "seen",
      },
      {
        id: uid(),
        type: "text",
        from: "them",
        text: "Great. Can I visit tomorrow afternoon?",
        time: "21:10",
        status: "delivered",
      },
    ],
  },
  {
    id: "t2",
    studentId: "s2",
    name: "Creative Minds",
    username: "@creative_minds",
    online: false,
    pinned: true,
    blocked: false,
    unread: 57,
    lastTime: "21:00",
    lastMessage: "Do you have time for a quick call?",
    messages: [
      {
        id: uid(),
        type: "text",
        from: "them",
        text: "Do you have time for a quick call?",
        time: "21:00",
        status: "seen",
      },
    ],
  },
  {
    id: "t3",
    studentId: "s3",
    name: "Anna Roberts",
    username: "@anna_roberts",
    online: false,
    pinned: false,
    blocked: false,
    unread: 2,
    lastTime: "20:40",
    lastMessage: "I'll confirm the time tomorrow.",
    messages: [
      {
        id: uid(),
        type: "text",
        from: "them",
        text: "I'll confirm the time tomorrow.",
        time: "20:40",
        status: "delivered",
      },
    ],
  },
  {
    id: "t4",
    studentId: "s4",
    name: "Charles Miller",
    username: "@charles_m",
    online: true,
    pinned: false,
    blocked: false,
    unread: 1,
    lastTime: "20:28",
    lastMessage: "Thanks for the document, everything looks good.",
    messages: [
      {
        id: uid(),
        type: "text",
        from: "them",
        text: "Thanks for the document, everything looks good.",
        time: "20:28",
        status: "seen",
      },
    ],
  },
];

/* =========================
   UI Components
========================= */
function Avatar({ name, online }) {
  return (
    <div className="relative">
      <div className="h-12 w-12 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-semibold">
        {initials(name)}
      </div>
      <span
        className={cx(
          "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white",
          online ? "bg-emerald-500" : "bg-slate-300"
        )}
      />
    </div>
  );
}

function StatusIcon({ status }) {
  if (status === "seen") return <CheckCheck className="h-4 w-4" />;
  if (status === "delivered") return <Check className="h-4 w-4" />;
  return null;
}

function Bubble({ msg }) {
  const mine = msg.from === "me";
  return (
    <div className={cx("w-full flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cx(
          "max-w-[72%] rounded-2xl px-4 py-3 shadow-sm",
          mine
            ? "bg-[#1E4FD8] text-white rounded-br-md"
            : "bg-[#2F2F2F] text-white rounded-bl-md"
        )}
      >
        {msg.type === "text" ? (
          <div className="whitespace-pre-wrap text-[14px] leading-6">{msg.text}</div>
        ) : msg.type === "file" ? (
          <div className="text-[14px] leading-6">
            Attachment: <span className="underline underline-offset-2">{msg.fileName}</span>
          </div>
        ) : msg.type === "image" ? (
          <div className="space-y-2">
            <div className="text-[13px] opacity-95">{msg.fileName}</div>
            <img
              src={msg.previewUrl}
              alt={msg.fileName}
              className="max-h-[260px] w-full rounded-xl object-cover"
            />
          </div>
        ) : (
          <div className="text-[14px] leading-6">
            Voice message: <span className="underline underline-offset-2">{msg.fileName}</span>
          </div>
        )}

        <div className="mt-2 flex items-center gap-2 text-[12px] opacity-90 justify-end">
          <span>{msg.time}</span>
          {mine ? (
            <span className="opacity-90">
              <StatusIcon status={msg.status} />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function KebabMenu({ open, onClose, items }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-4 top-[60px] z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        {items.map((it) => (
          <button
            key={it.label}
            type="button"
            onClick={() => {
              it.onClick?.();
              onClose?.();
            }}
            className={cx(
              "w-full px-4 py-3 text-left text-[13px] flex items-center gap-3 hover:bg-slate-50",
              it.danger ? "text-rose-600" : "text-slate-700"
            )}
          >
            <span className={cx("shrink-0", it.danger ? "text-rose-600" : "text-slate-600")}>{it.icon}</span>
            <span className="font-medium">{it.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function AttachPreviewBar({ items, onRemove }) {
  if (!items.length) return null;
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {items.map((a) => (
        <div
          key={a.id}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
        >
          <div className="text-[12px] text-slate-700 font-medium max-w-[260px] truncate">
            {a.name}
          </div>
          <button
            type="button"
            onClick={() => onRemove(a.id)}
            className="h-7 w-7 rounded-full hover:bg-white border border-transparent hover:border-slate-200 flex items-center justify-center"
            aria-label="Remove attachment"
            title="Remove"
          >
            <X className="h-4 w-4 text-slate-600" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* =========================
   Camera Modal
========================= */
function CameraModal({ open, onClose, onCapture, disabled }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [err, setErr] = useState("");
  const [ready, setReady] = useState(false);

  const stopStream = () => {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setReady(false);
  };

  useEffect(() => {
    if (!open) {
      stopStream();
      setErr("");
      return;
    }
    if (disabled) {
      setErr("Camera is disabled in this chat.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setErr("");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setReady(true);
      } catch (e) {
        setErr("Unable to access camera. Please allow camera permission.");
      }
    })();

    return () => {
      cancelled = true;
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, disabled]);

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `camera_${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture?.(file);
      },
      "image/jpeg",
      0.92
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999]">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-[720px] rounded-2xl bg-white shadow-2xl overflow-hidden">
          <div className="h-14 px-5 border-b border-slate-200 flex items-center justify-between">
            <div className="text-[15px] font-semibold text-slate-900">Camera</div>
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-full hover:bg-slate-100 flex items-center justify-center"
              aria-label="Close camera"
            >
              <X className="h-5 w-5 text-slate-700" />
            </button>
          </div>

          <div className="p-5">
            {err ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
                {err}
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black">
                <div className="aspect-video w-full">
                  <video
                    ref={videoRef}
                    className="h-full w-full object-cover"
                    playsInline
                    muted
                    autoPlay
                  />
                </div>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="h-11 px-5 rounded-full border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={capture}
                disabled={!ready || !!err}
                className={cx(
                  "h-11 px-6 rounded-full font-semibold text-white",
                  !ready || !!err ? "bg-slate-200 cursor-not-allowed" : "bg-[#1E4FD8] hover:bg-[#1A46C0]"
                )}
              >
                Capture
              </button>
            </div>

            <div className="mt-3 text-[12px] text-slate-500">
              Capture will add the snapshot to attachments (you can send it with the message).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Page
========================= */
export default function Messages() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [threads, setThreads] = useState(() => demoThreads);
  const [activeId, setActiveId] = useState(() => demoThreads[0]?.id || null);

  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const [text, setText] = useState("");

  // auto-resize textarea
  const textareaRef = useRef(null);
  const MIN_H = 44;
  const MAX_H = 140;

  // attachments queue
  const [queued, setQueued] = useState([]); // {id, file, kind, name, previewUrl?}

  // file ref
  const fileRef = useRef(null);

  // camera modal
  const [cameraOpen, setCameraOpen] = useState(false);

  // scroll
  const listEndRef = useRef(null);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeId) || null,
    [threads, activeId]
  );

  // فتح شات جديد من بروفايل الطالب (بدون زر New)
  useEffect(() => {
    const s = state?.openChatWith;
    if (!s) return;

    const studentId = s.id || s.studentId || s._id || s.userId || String(s);
    const name = s.name || s.fullName || "Student";
    const username = s.username || s.handle || "@student";

    setThreads((prev) => {
      const exist = prev.find((t) => t.studentId === studentId);
      if (exist) return prev;

      const newThread = {
        id: `t_${uid()}`,
        studentId,
        name,
        username,
        online: true,
        pinned: false,
        blocked: false,
        unread: 0,
        lastTime: "",
        lastMessage: "Start a conversation",
        messages: [],
      };
      return [newThread, ...prev];
    });

    try {
      window.history.replaceState({}, document.title);
    } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // بعد إضافة شات جديد: افتحه
  useEffect(() => {
    const s = state?.openChatWith;
    if (!s) return;
    const studentId = s.id || s.studentId || s._id || s.userId || String(s);
    const found = threads.find((t) => t.studentId === studentId);
    if (found) setActiveId(found.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads]);

  // unread = 0 لما تختار شات
  useEffect(() => {
    if (!activeId) return;
    setThreads((prev) =>
      prev.map((t) => (t.id === activeId ? { ...t, unread: 0 } : t))
    );
  }, [activeId]);

  // scroll bottom
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, activeThread?.messages?.length]);

  // textarea autoresize
  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(MAX_H, Math.max(MIN_H, el.scrollHeight));
    el.style.height = `${next}px`;
  };

  useEffect(() => {
    resizeTextarea();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    resizeTextarea();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  // filtered threads
  const filteredThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    const arr = !q
      ? threads
      : threads.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.username.toLowerCase().includes(q) ||
            t.lastMessage.toLowerCase().includes(q)
        );

    return [...arr].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return 0;
    });
  }, [threads, query]);

  // actions
  function viewProfile() {
    alert("View Profile (connect later)");
  }
  function togglePin() {
    if (!activeThread) return;
    setThreads((prev) =>
      prev.map((t) => (t.id === activeThread.id ? { ...t, pinned: !t.pinned } : t))
    );
  }
  function clearChat() {
    if (!activeThread) return;
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? {
              ...t,
              messages: [],
              lastMessage: "Chat cleared",
              lastTime: nowTime(),
              unread: 0,
            }
          : t
      )
    );
  }
  function toggleBlock() {
    if (!activeThread) return;
    setThreads((prev) =>
      prev.map((t) => (t.id === activeThread.id ? { ...t, blocked: !t.blocked } : t))
    );
  }

  const menuItems = useMemo(() => {
    const isPinned = !!activeThread?.pinned;
    const isBlocked = !!activeThread?.blocked;
    return [
      { label: "View Profile", icon: <UserRound className="h-4 w-4" />, onClick: viewProfile },
      {
        label: isPinned ? "Unpin Chat" : "Pin Chat",
        icon: <Pin className="h-4 w-4" />,
        onClick: togglePin,
      },
      {
        label: "Clear Chat",
        icon: <Trash2 className="h-4 w-4" />,
        onClick: clearChat,
        danger: true,
      },
      {
        label: isBlocked ? "Unblock" : "Block",
        icon: <Ban className="h-4 w-4" />,
        onClick: toggleBlock,
        danger: !isBlocked,
      },
    ];
  }, [activeThread]); // eslint-disable-line react-hooks/exhaustive-deps

  function addQueuedFiles(files, kind) {
    const arr = Array.from(files || []);
    if (!arr.length) return;

    const next = arr.map((f) => {
      const item = {
        id: uid(),
        file: f,
        kind, // "file" | "image"
        name: f.name,
        previewUrl: kind === "image" ? URL.createObjectURL(f) : undefined,
      };
      return item;
    });

    setQueued((prev) => [...prev, ...next]);
  }

  function addQueuedImageFromCamera(file) {
    const item = {
      id: uid(),
      file,
      kind: "image",
      name: file.name,
      previewUrl: URL.createObjectURL(file),
    };
    setQueued((prev) => [...prev, item]);
  }

  function removeQueued(id) {
    setQueued((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  }

  function send() {
    if (!activeThread) return;
    if (activeThread.blocked) return;

    const content = text.trim();
    const hasFiles = queued.length > 0;
    if (!content && !hasFiles) return;

    const tId = activeThread.id;
    const time = nowTime();

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== tId) return t;

        const newMsgs = [];

        for (const q of queued) {
          if (q.kind === "image") {
            newMsgs.push({
              id: uid(),
              type: "image",
              from: "me",
              fileName: q.name || "Photo",
              previewUrl: q.previewUrl,
              time,
              status: "delivered",
            });
          } else {
            newMsgs.push({
              id: uid(),
              type: "file",
              from: "me",
              fileName: q.name,
              time,
              status: "delivered",
            });
          }
        }

        if (content) {
          newMsgs.push({
            id: uid(),
            type: "text",
            from: "me",
            text: content,
            time,
            status: "delivered",
          });
        }

        const lastPreview =
          content ||
          (queued[queued.length - 1]?.kind === "image"
            ? "Photo"
            : queued[queued.length - 1]
            ? `Attachment: ${queued[queued.length - 1].name}`
            : "");

        return {
          ...t,
          lastMessage: lastPreview || t.lastMessage,
          lastTime: time,
          messages: [...t.messages, ...newMsgs],
        };
      })
    );

    // clear composer
    setText("");
    setQueued((prev) => {
      prev.forEach((x) => x.previewUrl && URL.revokeObjectURL(x.previewUrl));
      return [];
    });

    // reset textarea height
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = `${MIN_H}px`;
    });
  }

  function micAction() {
    if (!activeThread || activeThread.blocked) return;
    const time = nowTime();
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== activeThread.id) return t;
        const msg = {
          id: uid(),
          type: "voice",
          from: "me",
          fileName: "Voice message",
          time,
          status: "delivered",
        };
        return {
          ...t,
          lastMessage: "Voice message",
          lastTime: time,
          messages: [...t.messages, msg],
        };
      })
    );
  }

  const composerDisabled = !activeThread || activeThread.blocked;

  return (
    <div className="h-screen w-full bg-[#F3F5F8]">
      {/* full width, no side gaps */}
      <div className="h-full w-full grid grid-cols-[420px_1fr]">
        {/* Left: Threads */}
        <div className="h-full bg-white border-r border-slate-200 flex flex-col">
          <div className="px-8 pt-8 pb-5">
            <div className="flex items-center gap-3">
              <h1 className="text-[44px] leading-none font-extrabold text-slate-900">
                Messages
              </h1>
              <span className="h-9 min-w-9 px-3 rounded-full bg-[#1E4FD8] text-white text-[14px] font-semibold flex items-center justify-center">
                {threads.reduce((sum, t) => sum + (t.unread || 0), 0)}
              </span>
            </div>

            <div className="mt-6 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-full h-12 rounded-full bg-[#F1F3F6] pl-12 pr-4 text-[14px] outline-none border border-transparent focus:border-[#1E4FD8]/30 focus:ring-4 focus:ring-[#1E4FD8]/10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {filteredThreads.map((t) => {
              const active = t.id === activeId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveId(t.id)}
                  className={cx(
                    "w-full px-8 py-6 text-left border-t border-slate-100 hover:bg-slate-50 transition",
                    active ? "bg-[#F2F6FF]" : "bg-white"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <Avatar name={t.name} online={t.online} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="truncate font-extrabold text-[18px] text-slate-900">
                              {t.name}
                            </div>
                            {t.pinned ? (
                              <span className="text-slate-500">
                                <Pin className="h-4 w-4" />
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1 truncate text-[14px] text-slate-500">
                            {t.lastMessage}
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-col items-end gap-2">
                          <div className="text-[13px] text-slate-400">{t.lastTime || ""}</div>
                          {t.unread ? (
                            <span className="h-7 min-w-7 px-2 rounded-full bg-[#1E4FD8] text-white text-[12px] font-semibold flex items-center justify-center">
                              {t.unread}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {active ? (
                        <div className="mt-3 h-1 w-14 rounded-full bg-[#1E4FD8]" />
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredThreads.length === 0 ? (
              <div className="px-8 py-10 text-slate-500 text-[14px]">No conversations.</div>
            ) : null}
          </div>
        </div>

        {/* Right: Chat */}
        <div className="h-full flex flex-col bg-white">
          {/* top bar */}
          <div className="relative h-[92px] border-b border-slate-200 bg-[#F1F2F4] px-8 flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-12 w-12 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-semibold">
                {initials(activeThread?.name || "")}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="truncate text-[20px] font-extrabold text-slate-900">
                    {activeThread?.name || "Select a chat"}
                  </div>
                  {activeThread?.online ? (
                    <span className="text-[13px] text-emerald-600 font-medium">Online</span>
                  ) : (
                    <span className="text-[13px] text-slate-500 font-medium">Offline</span>
                  )}
                  {activeThread?.blocked ? (
                    <span className="ml-2 text-[12px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                      Blocked
                    </span>
                  ) : null}
                </div>

                <div className="truncate text-[14px] text-slate-600">{activeThread?.username || ""}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="h-11 w-11 rounded-full bg-white border border-slate-200 text-[#1E4FD8] hover:bg-slate-50 active:scale-[0.98] transition flex items-center justify-center"
                onClick={() => alert("Call action (connect later)")}
                aria-label="Call"
              >
                <Phone className="h-5 w-5" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  className="h-11 w-11 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition flex items-center justify-center"
                  onClick={() => setMenuOpen((s) => !s)}
                  aria-label="More"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>

                <KebabMenu
                  open={menuOpen}
                  onClose={() => setMenuOpen(false)}
                  items={menuItems}
                />
              </div>
            </div>
          </div>

          {/* messages area */}
          <div className="flex-1 bg-white overflow-auto px-10 py-8">
            {!activeThread ? (
              <div className="h-full flex items-center justify-center text-slate-500">
                Select a conversation to start.
              </div>
            ) : activeThread.messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500">
                No messages yet.
              </div>
            ) : (
              <div className="space-y-7">
                {activeThread.messages.map((m) => (
                  <Bubble key={m.id} msg={m} />
                ))}
                <div ref={listEndRef} />
              </div>
            )}
          </div>

          {/* composer */}
          <div className="border-t border-slate-200 bg-white px-10 py-6">
            <AttachPreviewBar
              items={queued.map((q) => ({ id: q.id, name: q.name }))}
              onRemove={removeQueued}
            />

            <div className="flex items-end gap-3">
              {/* Attach */}
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  addQueuedFiles(e.target.files, "file");
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (composerDisabled) return;
                  fileRef.current?.click();
                }}
                className={cx(
                  "h-12 w-12 rounded-full border flex items-center justify-center transition",
                  composerDisabled
                    ? "border-slate-200 text-slate-300 bg-slate-50 cursor-not-allowed"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-[0.98]"
                )}
                aria-label="Attach"
                title="Attach"
              >
                <Paperclip className="h-5 w-5" />
              </button>

              {/* Camera popup */}
              <button
                type="button"
                onClick={() => {
                  if (composerDisabled) return;
                  setCameraOpen(true);
                }}
                className={cx(
                  "h-12 w-12 rounded-full border flex items-center justify-center transition",
                  composerDisabled
                    ? "border-slate-200 text-slate-300 bg-slate-50 cursor-not-allowed"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-[0.98]"
                )}
                aria-label="Camera"
                title="Camera"
              >
                <Camera className="h-5 w-5" />
              </button>

              {/* Textarea auto grow */}
              <div className="flex-1">
                <div className="rounded-2xl border border-slate-200 bg-white focus-within:border-[#1E4FD8]/40 focus-within:ring-4 focus-within:ring-[#1E4FD8]/10">
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={activeThread?.blocked ? "You blocked this chat" : "Message"}
                    disabled={composerDisabled}
                    className={cx(
                      "w-full resize-none rounded-2xl px-5 py-3 text-[14px] outline-none bg-transparent",
                      composerDisabled ? "text-slate-400" : "text-slate-900"
                    )}
                    style={{ height: MIN_H }}
                    onInput={resizeTextarea}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                  />
                </div>
              </div>

              {/* Mic */}
              <button
                type="button"
                onClick={micAction}
                disabled={composerDisabled}
                className={cx(
                  "h-12 w-12 rounded-full border flex items-center justify-center transition",
                  composerDisabled
                    ? "border-slate-200 text-slate-300 bg-slate-50 cursor-not-allowed"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-[0.98]"
                )}
                aria-label="Mic"
                title="Mic"
              >
                <Mic className="h-5 w-5" />
              </button>

              {/* Send (دائري) */}
              <button
                type="button"
                onClick={send}
                disabled={composerDisabled || (!text.trim() && queued.length === 0)}
                className={cx(
                  "h-12 w-12 rounded-full flex items-center justify-center transition active:scale-[0.99]",
                  composerDisabled || (!text.trim() && queued.length === 0)
                    ? "bg-slate-200 text-white cursor-not-allowed"
                    : "bg-[#1E4FD8] text-white hover:bg-[#1A46C0]"
                )}
                aria-label="Send"
                title="Send"
              >
                <SendHorizonal className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      <CameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        disabled={composerDisabled}
        onCapture={(file) => {
          addQueuedImageFromCamera(file);
          setCameraOpen(false);
        }}
      />
    </div>
  );
}
