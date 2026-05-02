import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  LifeBuoy,
  Lock,
  ShieldAlert,
  Trash2,
  UploadCloud,
  X,
  XCircle,
  Clock,
  AlertTriangle,
  Paperclip,
} from "lucide-react";

/**
 * Owner Settings (Single File)
 * Improvements included:
 * - Tab persistence (localStorage)
 * - Documents badge count on tab
 * - Toasts (no external libs)
 * - Notifications: master toggle + dirty state + save only when changed
 * - Change password: show/hide + strength + live rules + disabled until valid
 * - Documents: rejection reason visible, file preview, upload progress (simulated), re-upload pre-fills form
 * - Delete account: stronger confirmation phrase + checkbox + can be blocked if active bookings exist
 * - Support: modal to report an issue (type, description, attachment)
 */

const cx = (...c) => c.filter(Boolean).join(" ");

const COLORS = {
  pageBg: "#F3F6FB",
  cardBorder: "#E7ECF5",
  primary: "#0B5ED7",
};

function Card({ title, subtitle, right, children, className }) {
  return (
    <div className={cx("rounded-xl bg-white border", className)} style={{ borderColor: COLORS.cardBorder }}>
      {(title || right) && (
        <div
          className="px-6 py-5 border-b flex items-start justify-between gap-4"
          style={{ borderColor: COLORS.cardBorder }}
        >
          <div>
            {title ? <div className="text-[15px] font-extrabold text-slate-900">{title}</div> : null}
            {subtitle ? <div className="mt-1 text-[12px] text-slate-500">{subtitle}</div> : null}
          </div>
          {right ? <div>{right}</div> : null}
        </div>
      )}
      <div className="px-6 py-6">{children}</div>
    </div>
  );
}

function Modal({ open, title, children, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-[760px] rounded-2xl bg-white shadow-2xl overflow-hidden">
          <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: COLORS.cardBorder }}>
            <div className="text-[16px] font-extrabold text-slate-900">{title}</div>
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-full hover:bg-slate-100 flex items-center justify-center"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-slate-700" />
            </button>
          </div>
          <div className="px-6 py-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  icon,
  right,
  error,
  hint,
  disabled,
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-[12px] font-semibold text-slate-700">{label}</div>
        {hint ? <div className="text-[11px] text-slate-500">{hint}</div> : null}
      </div>

      <div
        className={cx(
          "h-11 rounded-md border bg-white px-3 flex items-center gap-2",
          disabled ? "opacity-60" : ""
        )}
        style={{ borderColor: error ? "#FCA5A5" : COLORS.cardBorder }}
      >
        {icon ? <span className="text-slate-500">{icon}</span> : null}
        <input
          className="h-full w-full bg-transparent outline-none text-[13px] text-slate-900 placeholder:text-slate-400"
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>

      {error ? <div className="mt-2 text-[11px] text-red-600 font-semibold">{error}</div> : null}
    </div>
  );
}

function Toggle({ label, desc, checked, onChange, disabled }) {
  return (
    <div
      className={cx(
        "flex items-start justify-between gap-4 py-4 border-b last:border-b-0",
        disabled ? "opacity-60" : ""
      )}
      style={{ borderColor: COLORS.cardBorder }}
    >
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-slate-900">{label}</div>
        {desc ? <div className="mt-1 text-[12px] text-slate-500">{desc}</div> : null}
      </div>

      <button
        type="button"
        onClick={() => !disabled && onChange?.(!checked)}
        className={cx(
          "relative inline-flex h-6 w-11 items-center rounded-full transition border",
          checked ? "bg-blue-600 border-blue-600" : "bg-slate-200 border-slate-200",
          disabled ? "cursor-not-allowed" : ""
        )}
        aria-pressed={checked}
      >
        <span
          className={cx(
            "inline-block h-5 w-5 transform rounded-full bg-white transition",
            checked ? "translate-x-5" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

function StatusPill({ status }) {
  const s = String(status || "").toLowerCase();
  const cfg =
    s === "approved"
      ? { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-4 w-4" /> }
      : s === "rejected"
      ? { cls: "bg-red-50 text-red-700 border-red-200", icon: <XCircle className="h-4 w-4" /> }
      : { cls: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="h-4 w-4" /> };

  return (
    <span className={cx("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-semibold", cfg.cls)}>
      {cfg.icon}
      {status}
    </span>
  );
}

function DocumentRow({ doc, onView, onReupload }) {
  const rejected = String(doc.status).toLowerCase() === "rejected";
  return (
    <div className="rounded-xl bg-slate-50 border px-4 py-4 flex items-center justify-between gap-4" style={{ borderColor: COLORS.cardBorder }}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 rounded-lg bg-white border flex items-center justify-center" style={{ borderColor: COLORS.cardBorder }}>
          <FileText className="h-5 w-5 text-slate-600" />
        </div>

        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-slate-900 truncate">{doc.title}</div>

          <div className="mt-1 text-[12px] text-slate-500 truncate">{doc.note || "—"}</div>

          {rejected && doc.reason ? (
            <div className="mt-2 inline-flex items-center gap-2 text-[12px] font-semibold text-red-700">
              <AlertTriangle className="h-4 w-4" />
              {doc.reason}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap justify-end">
        <StatusPill status={doc.status} />

        <button
          type="button"
          onClick={() => onView?.(doc)}
          className="h-9 px-4 rounded-full border text-[12px] font-semibold text-slate-700 hover:bg-white inline-flex items-center gap-2"
          style={{ borderColor: "#CBD5E1" }}
        >
          <Eye className="h-4 w-4" />
          View
        </button>

        <button
          type="button"
          onClick={() => onReupload?.(doc)}
          className="h-9 px-4 rounded-full text-[12px] font-semibold text-white hover:opacity-95"
          style={{ backgroundColor: COLORS.primary }}
        >
          Re-upload
        </button>
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options, placeholder = "Select...", disabled }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (!open) return;
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={wrapRef} className={disabled ? "opacity-60" : ""}>
      <div className="text-[12px] font-semibold text-slate-700 mb-2">{label}</div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cx(
          "h-11 w-full rounded-md border bg-white px-3 flex items-center justify-between",
          disabled ? "cursor-not-allowed" : "hover:bg-slate-50"
        )}
        style={{ borderColor: COLORS.cardBorder }}
      >
        <span className={cx("text-[13px]", selected ? "text-slate-900 font-semibold" : "text-slate-400")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </button>

      {open && !disabled && (
        <div className="mt-2 w-full rounded-xl border bg-white shadow-lg overflow-hidden" style={{ borderColor: COLORS.cardBorder }}>
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange?.(o.value);
                setOpen(false);
              }}
              className={cx(
                "w-full px-3 py-3 text-left text-[13px] hover:bg-slate-50",
                o.value === value ? "font-semibold text-slate-900" : "text-slate-700"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** ---------- Toasts (no external libs) ---------- */
function useToasts() {
  const [toasts, setToasts] = useState([]);

  const push = (t) => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const toast = { id, type: t.type || "info", title: t.title || "", message: t.message || "", ttl: t.ttl ?? 2600 };
    setToasts((s) => [toast, ...s].slice(0, 5));
    window.setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), toast.ttl);
  };

  const Toasts = () => (
    <div className="fixed top-4 right-4 z-[99999] space-y-2 w-[360px] max-w-[calc(100vw-2rem)]">
      {toasts.map((t) => {
        const cfg =
          t.type === "success"
            ? { bg: "bg-emerald-600", icon: <CheckCircle2 className="h-4 w-4 text-white" /> }
            : t.type === "error"
            ? { bg: "bg-red-600", icon: <XCircle className="h-4 w-4 text-white" /> }
            : { bg: "bg-slate-900", icon: <HelpCircle className="h-4 w-4 text-white" /> };

        return (
          <div key={t.id} className="rounded-xl shadow-xl overflow-hidden border" style={{ borderColor: "rgba(255,255,255,0.18)" }}>
            <div className={cx("px-4 py-3 flex items-start gap-3", cfg.bg)}>
              <div className="mt-0.5">{cfg.icon}</div>
              <div className="min-w-0">
                {t.title ? <div className="text-[12px] font-extrabold text-white">{t.title}</div> : null}
                <div className="text-[12px] text-white/90">{t.message}</div>
              </div>
              <button
                type="button"
                onClick={() => setToasts((s) => s.filter((x) => x.id !== t.id))}
                className="ml-auto h-7 w-7 rounded-full hover:bg-white/10 flex items-center justify-center"
                aria-label="Close toast"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  return { push, Toasts };
}

/** ---------- Utils ---------- */
function fmtDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "2-digit" });
}

function passwordScore(pw) {
  const s = String(pw || "");
  const rules = {
    length: s.length >= 8,
    lower: /[a-z]/.test(s),
    upper: /[A-Z]/.test(s),
    number: /[0-9]/.test(s),
    symbol: /[^A-Za-z0-9]/.test(s),
  };
  const score = Object.values(rules).filter(Boolean).length;
  const label =
    score <= 2 ? "Weak" : score === 3 ? "Good" : score === 4 ? "Strong" : "Very strong";
  return { rules, score, label };
}

function deepEqual(a, b) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function TabButton({ active, children, onClick, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "h-9 px-4 rounded-md text-[12px] font-semibold border transition inline-flex items-center gap-2",
        active ? "bg-white text-blue-700 border-blue-200" : "bg-white text-slate-500 border-transparent hover:text-slate-700"
      )}
    >
      <span>{children}</span>
      {typeof badge === "number" ? (
        <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-700 border"
          style={{ borderColor: COLORS.cardBorder }}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export default function OwnerSettings() {
  const { push, Toasts } = useToasts();

  // Demo owner
  const owner = useMemo(
    () => ({
      name: "Mathew Perry",
      email: "mathewperry@xyz.com",
      avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=256&q=80",
      lastUpdated: "2026-02-20",
    }),
    []
  );

  // Simulated condition: if true, block delete account
  const activeBookings = true;

  // Tab persistence
  const TAB_KEY = "owner_settings_tab";
  const [tab, setTab] = useState(() => {
    const v = window.localStorage.getItem(TAB_KEY);
    return v === "documents" ? "documents" : "profile";
  });
  useEffect(() => window.localStorage.setItem(TAB_KEY, tab), [tab]);

  // Avatar upload
  const fileRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(owner.avatar);
  const [avatarDirty, setAvatarDirty] = useState(false);

  const onPickAvatar = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
    setAvatarDirty(true);
    push({ type: "success", title: "Photo selected", message: "Preview updated. Click Save Photo to apply." });
  };

  const saveAvatar = () => {
    // TODO: upload avatar API
    setAvatarDirty(false);
    push({ type: "success", title: "Saved", message: "Profile photo updated." });
  };

  // Notifications (master + dirty state)
  const initialNotif = useMemo(
    () => ({
      bookingRequests: true,
      newMessages: true,
      bookingUpdates: true,
      paymentIssues: false,
      email: true,
      sms: false,
      inApp: true,
    }),
    []
  );

  const [notif, setNotif] = useState(initialNotif);
  const notifDirty = !deepEqual(notif, initialNotif);

  const allEventsOn = notif.bookingRequests && notif.newMessages && notif.bookingUpdates && notif.paymentIssues;
  const toggleAllEvents = (v) => setNotif((s) => ({ ...s, bookingRequests: v, newMessages: v, bookingUpdates: v, paymentIssues: v }));

  const saveNotifications = () => {
    // TODO: save notifications API
    push({ type: "success", title: "Saved", message: "Notification preferences updated." });
  };

  // Password change (show/hide + strength + validation)
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });

  const pw = passwordScore(pwd.next);
  const confirmOk = pwd.next && pwd.confirm && pwd.next === pwd.confirm;
  const canUpdatePassword = Boolean(pwd.current && pwd.next && pwd.confirm && confirmOk && pw.score >= 3);

  const handleSavePassword = () => {
    if (!canUpdatePassword) {
      push({ type: "error", title: "Cannot update", message: "Please meet the password requirements and confirm it correctly." });
      return;
    }
    // TODO: call API
    setPwd({ current: "", next: "", confirm: "" });
    push({ type: "success", title: "Updated", message: "Password updated successfully." });
  };

  // Documents
  const docs = useMemo(
    () => [
      { id: "d1", type: "ownership", title: "Property Ownership Contract", status: "Approved", note: "Verified successfully", reason: "" },
      { id: "d2", type: "commercial", title: "Commercial Registration", status: "Rejected", note: "Needs re-upload", reason: "Image is blurry. Please upload a clearer scan." },
      { id: "d3", type: "nid", title: "National ID", status: "Pending", note: "Under review (24–48 hours)", reason: "" },
    ],
    []
  );

  const docTypes = useMemo(
    () => [
      { value: "ownership", label: "Property Ownership Contract" },
      { value: "commercial", label: "Commercial Registration" },
      { value: "nid", label: "National ID" },
    ],
    []
  );

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadType, setUploadType] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState(null);

  useEffect(() => {
    if (!uploadFile) {
      setUploadPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(uploadFile);
    setUploadPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [uploadFile]);

  const handleUpload = () => {
    if (!uploadFile) return push({ type: "error", title: "Missing file", message: "Please choose a file first." });
    if (!uploadType) return push({ type: "error", title: "Missing type", message: "Please select a document type." });

    // Simulate upload progress
    setUploading(true);
    setUploadProgress(0);
    push({ type: "info", title: "Uploading", message: "Upload started..." });

    const start = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, Math.round((elapsed / 1400) * 100));
      setUploadProgress(p);
      if (p >= 100) {
        window.clearInterval(timer);
        setTimeout(() => {
          setUploading(false);
          setUploadFile(null);
          setUploadType("");
          setUploadProgress(0);
          push({ type: "success", title: "Uploaded", message: "Document uploaded successfully (connect API later)." });
        }, 250);
      }
    }, 80);
  };

  const [viewDoc, setViewDoc] = useState(null);

  const handleReupload = (doc) => {
    setTab("documents");
    setUploadType(doc.type);
    push({ type: "info", title: "Re-upload", message: `Selected type: ${doc.title}. Choose a new file to upload.` });
  };

  // Delete account (stronger confirmation)
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleteChecked, setDeleteChecked] = useState(false);
  const DELETE_PHRASE = "DELETE MY ACCOUNT";
  const canDelete = deleteText === DELETE_PHRASE && deleteChecked && !activeBookings;

  // Support: report issue modal
  const [supportOpen, setSupportOpen] = useState(false);
  const [issue, setIssue] = useState({ type: "bug", desc: "", attachment: null });
  const [issuePreview, setIssuePreview] = useState(null);

  useEffect(() => {
    if (!issue.attachment) {
      setIssuePreview(null);
      return;
    }
    const url = URL.createObjectURL(issue.attachment);
    setIssuePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [issue.attachment]);

  const submitIssue = () => {
    if (!issue.desc.trim()) {
      push({ type: "error", title: "Missing details", message: "Please describe the issue." });
      return;
    }
    // TODO: submit issue API
    setSupportOpen(false);
    setIssue({ type: "bug", desc: "", attachment: null });
    push({ type: "success", title: "Sent", message: "Your support request was submitted." });
  };

  const docsBadge = docs.length;

  return (
    <div className="min-h-screen w-full" style={{ background: COLORS.pageBg }}>
      <Toasts />

      <div className="w-full max-w-[1240px] mx-auto px-6 py-6">
        {/* Banner */}
        <div className="h-[160px] w-full rounded-xl bg-gradient-to-r from-fuchsia-500 via-sky-500 to-indigo-500" />

        {/* Header card */}
        <div className="-mt-[56px]">
          <div className="rounded-xl bg-white border" style={{ borderColor: COLORS.cardBorder }}>
            <div className="px-6 py-5 flex items-center gap-4">
              <div className="h-[64px] w-[64px] rounded-full bg-white border overflow-hidden" style={{ borderColor: COLORS.cardBorder }}>
                <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[18px] font-extrabold text-slate-900">Settings</div>
                <div className="text-[12px] text-slate-500 truncate">
                  {owner.name} • {owner.email} • Last updated {fmtDate(owner.lastUpdated)}
                </div>

                {/* Tabs */}
                <div className="mt-4 rounded-lg bg-slate-50 border px-2 py-2 inline-flex gap-1" style={{ borderColor: COLORS.cardBorder }}>
                  <TabButton active={tab === "profile"} onClick={() => setTab("profile")}>
                    Profile
                  </TabButton>
                  <TabButton active={tab === "documents"} onClick={() => setTab("documents")} badge={docsBadge}>
                    Documents
                  </TabButton>
                </div>
              </div>
            </div>

            <div className="h-px w-full" style={{ backgroundColor: COLORS.cardBorder }} />
          </div>
        </div>

        {/* Content */}
        <div className="mt-6 space-y-6">
          {/* PROFILE */}
          {tab === "profile" && (
            <>
              {/* Avatar */}
              <Card
                title="Profile picture"
                subtitle="Change the photo shown across your owner dashboard."
                right={
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="h-10 px-4 rounded-md text-white text-[12px] font-semibold inline-flex items-center gap-2 hover:opacity-95"
                      style={{ backgroundColor: COLORS.primary }}
                    >
                      <ImageIcon className="h-4 w-4" />
                      Change photo
                    </button>

                    <button
                      type="button"
                      disabled={!avatarDirty}
                      onClick={saveAvatar}
                      className={cx(
                        "h-10 px-4 rounded-md text-[12px] font-semibold border",
                        avatarDirty ? "bg-white text-slate-800 hover:bg-slate-50" : "bg-white text-slate-400 cursor-not-allowed"
                      )}
                      style={{ borderColor: COLORS.cardBorder }}
                    >
                      Save photo
                    </button>
                  </div>
                }
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickAvatar(e.target.files?.[0])}
                />

                <div className="flex items-center gap-4">
                  <div className="h-[84px] w-[84px] rounded-full border overflow-hidden" style={{ borderColor: COLORS.cardBorder }}>
                    <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                  </div>

                  <div className="min-w-0">
                    <div className="text-[14px] font-extrabold text-slate-900">{owner.name}</div>
                    <div className="mt-1 text-[12px] text-slate-500">PNG/JPG recommended • square image</div>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="mt-3 h-9 px-4 rounded-full border text-[12px] font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2"
                      style={{ borderColor: COLORS.cardBorder }}
                    >
                      <UploadCloud className="h-4 w-4" />
                      Upload new photo
                    </button>
                  </div>
                </div>
              </Card>

              {/* Notifications */}
              <Card
                title="Notifications"
                subtitle="Control which alerts you receive and where we notify you."
                right={
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!notifDirty}
                      onClick={saveNotifications}
                      className={cx(
                        "h-10 px-5 rounded-md text-[12px] font-semibold",
                        notifDirty ? "text-white hover:opacity-95" : "bg-slate-200 text-slate-500 cursor-not-allowed"
                      )}
                      style={{ backgroundColor: notifDirty ? COLORS.primary : undefined }}
                    >
                      Save
                    </button>
                  </div>
                }
              >
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: COLORS.cardBorder }}>
                  <div className="px-5 py-4 bg-slate-50 border-b" style={{ borderColor: COLORS.cardBorder }}>
                    <div className="text-[13px] font-extrabold text-slate-900">Events</div>
                    <div className="text-[12px] text-slate-500">Choose what triggers a notification.</div>
                  </div>

                  <div className="px-5">
                    <Toggle
                      label="Enable all event notifications"
                      desc="Toggle all event notifications at once."
                      checked={allEventsOn}
                      onChange={toggleAllEvents}
                    />

                    <Toggle
                      label="Booking requests"
                      desc="When a student requests a booking."
                      checked={notif.bookingRequests}
                      onChange={(v) => setNotif((s) => ({ ...s, bookingRequests: v }))}
                    />
                    <Toggle
                      label="New messages"
                      desc="When you receive a new message."
                      checked={notif.newMessages}
                      onChange={(v) => setNotif((s) => ({ ...s, newMessages: v }))}
                    />
                    <Toggle
                      label="Booking updates"
                      desc="Approvals, cancellations, and changes."
                      checked={notif.bookingUpdates}
                      onChange={(v) => setNotif((s) => ({ ...s, bookingUpdates: v }))}
                    />
                    <Toggle
                      label="Payment issues"
                      desc="Payment failures or overdue payments."
                      checked={notif.paymentIssues}
                      onChange={(v) => setNotif((s) => ({ ...s, paymentIssues: v }))}
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-xl border overflow-hidden" style={{ borderColor: COLORS.cardBorder }}>
                  <div className="px-5 py-4 bg-slate-50 border-b" style={{ borderColor: COLORS.cardBorder }}>
                    <div className="text-[13px] font-extrabold text-slate-900">Channels</div>
                    <div className="text-[12px] text-slate-500">Choose where you receive notifications.</div>
                  </div>

                  <div className="px-5">
                    <Toggle
                      label="Email"
                      desc="Receive notifications via email."
                      checked={notif.email}
                      onChange={(v) => setNotif((s) => ({ ...s, email: v }))}
                    />
                    <Toggle
                      label="SMS"
                      desc="Receive urgent notifications via SMS."
                      checked={notif.sms}
                      onChange={(v) => setNotif((s) => ({ ...s, sms: v }))}
                    />
                    <Toggle
                      label="In-app"
                      desc="Show notifications inside the dashboard."
                      checked={notif.inApp}
                      onChange={(v) => setNotif((s) => ({ ...s, inApp: v }))}
                    />
                  </div>
                </div>

                {notifDirty ? (
                  <div className="mt-4 text-[12px] text-slate-600 font-semibold">
                    You have unsaved changes.
                  </div>
                ) : (
                  <div className="mt-4 text-[12px] text-slate-500">All changes saved.</div>
                )}
              </Card>

              {/* Change Password */}
              <Card title="Change password" subtitle="Update your password to keep your account secure.">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Current password"
                    type={showPwd.current ? "text" : "password"}
                    value={pwd.current}
                    onChange={(v) => setPwd((s) => ({ ...s, current: v }))}
                    placeholder="••••••••"
                    icon={<Lock className="h-4 w-4" />}
                    right={
                      <button
                        type="button"
                        onClick={() => setShowPwd((s) => ({ ...s, current: !s.current }))}
                        className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
                        aria-label="Toggle current password visibility"
                      >
                        {showPwd.current ? <EyeOff className="h-4 w-4 text-slate-600" /> : <Eye className="h-4 w-4 text-slate-600" />}
                      </button>
                    }
                  />

                  <Input
                    label="New password"
                    type={showPwd.next ? "text" : "password"}
                    value={pwd.next}
                    onChange={(v) => setPwd((s) => ({ ...s, next: v }))}
                    placeholder="••••••••"
                    icon={<Lock className="h-4 w-4" />}
                    hint={`Strength: ${pw.label}`}
                    right={
                      <button
                        type="button"
                        onClick={() => setShowPwd((s) => ({ ...s, next: !s.next }))}
                        className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
                        aria-label="Toggle new password visibility"
                      >
                        {showPwd.next ? <EyeOff className="h-4 w-4 text-slate-600" /> : <Eye className="h-4 w-4 text-slate-600" />}
                      </button>
                    }
                  />

                  <Input
                    label="Confirm new password"
                    type={showPwd.confirm ? "text" : "password"}
                    value={pwd.confirm}
                    onChange={(v) => setPwd((s) => ({ ...s, confirm: v }))}
                    placeholder="••••••••"
                    icon={<Lock className="h-4 w-4" />}
                    error={pwd.confirm && !confirmOk ? "Passwords do not match." : ""}
                    right={
                      <button
                        type="button"
                        onClick={() => setShowPwd((s) => ({ ...s, confirm: !s.confirm }))}
                        className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
                        aria-label="Toggle confirm password visibility"
                      >
                        {showPwd.confirm ? <EyeOff className="h-4 w-4 text-slate-600" /> : <Eye className="h-4 w-4 text-slate-600" />}
                      </button>
                    }
                  />
                </div>

                {/* Password rules */}
                <div className="mt-5 rounded-xl border bg-slate-50 px-5 py-4" style={{ borderColor: COLORS.cardBorder }}>
                  <div className="text-[13px] font-extrabold text-slate-900">Requirements</div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Rule ok={pw.rules.length} label="At least 8 characters" />
                    <Rule ok={pw.rules.lower} label="Lowercase letter (a-z)" />
                    <Rule ok={pw.rules.upper} label="Uppercase letter (A-Z)" />
                    <Rule ok={pw.rules.number} label="Number (0-9)" />
                    <Rule ok={pw.rules.symbol} label="Symbol (!@#$...)" />
                    <Rule ok={confirmOk} label="Confirmation matches" />
                  </div>
                  <div className="mt-3 text-[12px] text-slate-500">
                    Tip: A strong password includes uppercase, lowercase, numbers, and symbols.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSavePassword}
                  disabled={!canUpdatePassword}
                  className={cx(
                    "mt-5 h-10 px-6 rounded-md text-[12px] font-semibold",
                    canUpdatePassword ? "text-white hover:opacity-95" : "bg-slate-200 text-slate-500 cursor-not-allowed"
                  )}
                  style={{ backgroundColor: canUpdatePassword ? COLORS.primary : undefined }}
                >
                  Update password
                </button>
              </Card>

              {/* Delete Account */}
              <Card
                title="Delete account"
                subtitle="This action is permanent. Proceed carefully."
                right={
                  <span className="text-[12px] text-red-600 font-semibold inline-flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    Danger zone
                  </span>
                }
              >
                <div className="rounded-xl border bg-red-50/40 p-4" style={{ borderColor: "#FECACA" }}>
                  {activeBookings ? (
                    <div className="mb-3 inline-flex items-center gap-2 text-[12px] font-semibold text-red-700">
                      <AlertTriangle className="h-4 w-4" />
                      Account deletion is disabled while you have active bookings.
                    </div>
                  ) : null}

                  <div className="text-[13px] font-extrabold text-slate-900">Before deleting</div>
                  <ul className="mt-2 text-[12px] text-slate-700 list-disc pl-5 space-y-1">
                    <li>This will permanently remove your account data.</li>
                    <li>You may lose access to documents and listings.</li>
                    <li>If you have active bookings, deletion is not allowed.</li>
                  </ul>

                  <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    className={cx(
                      "mt-4 h-10 px-5 rounded-md text-white text-[12px] font-semibold inline-flex items-center gap-2",
                      activeBookings ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:opacity-95"
                    )}
                    disabled={activeBookings}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete account
                  </button>
                </div>
              </Card>

              {/* Support & Help */}
              <Card title="Support & help" subtitle="Need assistance? Contact us or report an issue.">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => push({ type: "info", title: "FAQ", message: "Open your FAQ page route here." })}
                    className="rounded-xl border p-4 text-left hover:bg-slate-50 transition"
                    style={{ borderColor: COLORS.cardBorder }}
                  >
                    <div className="flex items-center gap-2 text-slate-900 font-extrabold text-[13px]">
                      <HelpCircle className="h-4 w-4" />
                      FAQs
                    </div>
                    <div className="mt-1 text-[12px] text-slate-500">Browse common questions and answers.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => push({ type: "info", title: "Support", message: "Open your support chat route here." })}
                    className="rounded-xl border p-4 text-left hover:bg-slate-50 transition"
                    style={{ borderColor: COLORS.cardBorder }}
                  >
                    <div className="flex items-center gap-2 text-slate-900 font-extrabold text-[13px]">
                      <LifeBuoy className="h-4 w-4" />
                      Contact support
                    </div>
                    <div className="mt-1 text-[12px] text-slate-500">Start a chat or send a support request.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSupportOpen(true)}
                    className="rounded-xl border p-4 text-left hover:bg-slate-50 transition"
                    style={{ borderColor: COLORS.cardBorder }}
                  >
                    <div className="flex items-center gap-2 text-slate-900 font-extrabold text-[13px]">
                      <ShieldAlert className="h-4 w-4" />
                      Report an issue
                    </div>
                    <div className="mt-1 text-[12px] text-slate-500">Describe the problem and attach a screenshot.</div>
                  </button>
                </div>
              </Card>
            </>
          )}

          {/* DOCUMENTS */}
          {tab === "documents" && (
            <>
              <Card
                title="Documents"
                subtitle="Upload and manage documents required to verify ownership and property listings."
              >
                <div className="text-[14px] font-extrabold text-slate-900">Uploaded documents</div>

                <div className="mt-4 space-y-4">
                  {docs.map((d) => (
                    <DocumentRow
                      key={d.id}
                      doc={d}
                      onView={(doc) => setViewDoc(doc)}
                      onReupload={(doc) => handleReupload(doc)}
                    />
                  ))}
                </div>
              </Card>

              <Card title="Upload document" subtitle="Choose a file, select the type, then upload.">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Upload form */}
                  <div className="lg:col-span-7 space-y-4">
                    <div>
                      <div className="text-[12px] font-semibold text-slate-700 mb-2">Choose file</div>
                      <label
                        className={cx(
                          "h-11 w-full rounded-md border bg-white px-3 flex items-center justify-between cursor-pointer",
                          uploading ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-50"
                        )}
                        style={{ borderColor: COLORS.cardBorder }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <UploadCloud className="h-4 w-4 text-slate-500" />
                          <span className="text-[13px] text-slate-700 font-semibold truncate">
                            {uploadFile ? uploadFile.name : "Choose file"}
                          </span>
                        </div>
                        <span className="text-[12px] text-slate-400">PDF / JPG / PNG</span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,image/*"
                          disabled={uploading}
                          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>

                    <Select
                      label="Document type"
                      value={uploadType}
                      onChange={setUploadType}
                      options={docTypes}
                      placeholder="Select document type"
                      disabled={uploading}
                    />

                    {/* Progress */}
                    {uploading ? (
                      <div className="rounded-xl border bg-slate-50 p-4" style={{ borderColor: COLORS.cardBorder }}>
                        <div className="flex items-center justify-between">
                          <div className="text-[12px] font-extrabold text-slate-900">Uploading…</div>
                          <div className="text-[12px] font-semibold text-slate-600">{uploadProgress}%</div>
                        </div>
                        <div className="mt-3 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full bg-blue-600" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={uploading}
                      className={cx(
                        "h-10 px-8 rounded-md text-[12px] font-semibold",
                        uploading ? "bg-slate-200 text-slate-500 cursor-not-allowed" : "text-white hover:opacity-95"
                      )}
                      style={{ backgroundColor: uploading ? undefined : COLORS.primary }}
                    >
                      Upload
                    </button>
                  </div>

                  {/* Preview */}
                  <div className="lg:col-span-5">
                    <div className="text-[12px] font-semibold text-slate-700 mb-2">Preview</div>
                    <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: COLORS.cardBorder }}>
                      {uploadPreviewUrl ? (
                        uploadFile?.type?.includes("pdf") ? (
                          <div className="p-5">
                            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-[13px]">
                              <FileText className="h-4 w-4" />
                              PDF selected
                            </div>
                            <div className="mt-2 text-[12px] text-slate-500">
                              Preview placeholder. Render a PDF preview with a PDF viewer library if needed.
                            </div>
                          </div>
                        ) : (
                          <img src={uploadPreviewUrl} alt="Preview" className="h-[220px] w-full object-cover" />
                        )
                      ) : (
                        <div className="h-[220px] w-full bg-slate-50 flex items-center justify-center text-slate-400">
                          <div className="text-center">
                            <UploadCloud className="h-7 w-7 mx-auto" />
                            <div className="mt-2 text-[12px] font-semibold">No file selected</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 text-[12px] text-slate-500">
                      Ensure the document is clear and readable. Review may take 24–48 hours.
                    </div>
                  </div>
                </div>
              </Card>

              <Card
                title="Document requirements"
                subtitle="All documents must be clear, valid, and in PDF or image format."
              >
                <ul className="text-[12px] text-slate-700 list-disc pl-5 space-y-1">
                  <li>Make sure text and edges are not cropped.</li>
                  <li>Provide high-resolution scans when possible.</li>
                  <li>PDF recommended for contracts, JPG/PNG for IDs.</li>
                  <li>Typical review time: 24–48 hours.</li>
                </ul>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* View document modal */}
      <Modal open={!!viewDoc} title="Document preview" onClose={() => setViewDoc(null)}>
        <div className="text-[13px] text-slate-700">
          <div className="font-extrabold text-slate-900">{viewDoc?.title}</div>
          <div className="mt-2 text-[12px] text-slate-500">{viewDoc?.note || "—"}</div>

          {String(viewDoc?.status).toLowerCase() === "rejected" && viewDoc?.reason ? (
            <div className="mt-4 rounded-xl border bg-red-50/40 p-4" style={{ borderColor: "#FECACA" }}>
              <div className="inline-flex items-center gap-2 text-[12px] font-extrabold text-red-700">
                <AlertTriangle className="h-4 w-4" />
                Rejection reason
              </div>
              <div className="mt-2 text-[12px] text-slate-700">{viewDoc.reason}</div>
            </div>
          ) : null}

          <div className="mt-4 h-[260px] rounded-xl border bg-slate-50 flex items-center justify-center" style={{ borderColor: COLORS.cardBorder }}>
            <FileText className="h-10 w-10 text-slate-400" />
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => setViewDoc(null)}
              className="h-10 px-6 rounded-md border text-[12px] font-semibold hover:bg-slate-50"
              style={{ borderColor: COLORS.cardBorder }}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal open={deleteOpen} title="Confirm account deletion" onClose={() => setDeleteOpen(false)}>
        <div className="rounded-xl border bg-red-50/40 p-4" style={{ borderColor: "#FECACA" }}>
          {activeBookings ? (
            <div className="mb-3 inline-flex items-center gap-2 text-[12px] font-semibold text-red-700">
              <AlertTriangle className="h-4 w-4" />
              You have active bookings. Account deletion is disabled.
            </div>
          ) : null}

          <div className="text-[13px] font-extrabold text-slate-900">This action is irreversible</div>
          <div className="mt-1 text-[12px] text-slate-700">
            Type <span className="font-extrabold">{DELETE_PHRASE}</span> to confirm.
          </div>

          <div className="mt-4">
            <Input
              label="Confirmation phrase"
              value={deleteText}
              onChange={setDeleteText}
              placeholder={DELETE_PHRASE}
              icon={<Trash2 className="h-4 w-4" />}
              disabled={activeBookings}
            />
          </div>

          <label className={cx("mt-4 flex items-start gap-3 text-[12px] text-slate-700", activeBookings ? "opacity-60" : "")}>
            <input
              type="checkbox"
              className="mt-1"
              disabled={activeBookings}
              checked={deleteChecked}
              onChange={(e) => setDeleteChecked(e.target.checked)}
            />
            <span>I understand this is permanent and cannot be undone.</span>
          </label>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteText("");
                setDeleteChecked(false);
              }}
              className="h-10 px-5 rounded-md border text-[12px] font-semibold hover:bg-slate-50"
              style={{ borderColor: COLORS.cardBorder }}
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!canDelete}
              onClick={() => {
                // TODO: delete account API
                setDeleteOpen(false);
                setDeleteText("");
                setDeleteChecked(false);
                push({ type: "success", title: "Deleted", message: "Account deleted (connect API later)." });
              }}
              className={cx(
                "h-10 px-5 rounded-md text-white text-[12px] font-semibold",
                canDelete ? "bg-red-600 hover:opacity-95" : "bg-red-300 cursor-not-allowed"
              )}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Support modal */}
      <Modal open={supportOpen} title="Report an issue" onClose={() => setSupportOpen(false)}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Issue type"
              value={issue.type}
              onChange={(v) => setIssue((s) => ({ ...s, type: v }))}
              options={[
                { value: "bug", label: "Bug" },
                { value: "billing", label: "Billing" },
                { value: "verification", label: "Verification" },
                { value: "other", label: "Other" },
              ]}
            />

            <div>
              <div className="text-[12px] font-semibold text-slate-700 mb-2">Attachment (optional)</div>
              <label
                className="h-11 w-full rounded-md border bg-white px-3 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                style={{ borderColor: COLORS.cardBorder }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Paperclip className="h-4 w-4 text-slate-500" />
                  <span className="text-[13px] text-slate-700 font-semibold truncate">
                    {issue.attachment ? issue.attachment.name : "Choose file"}
                  </span>
                </div>
                <span className="text-[12px] text-slate-400">PNG/JPG</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => setIssue((s) => ({ ...s, attachment: e.target.files?.[0] || null }))}
                />
              </label>
            </div>
          </div>

          <div>
            <div className="text-[12px] font-semibold text-slate-700 mb-2">Description</div>
            <textarea
              value={issue.desc}
              onChange={(e) => setIssue((s) => ({ ...s, desc: e.target.value }))}
              className="w-full min-h-[120px] rounded-xl border p-3 text-[13px] text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
              style={{ borderColor: COLORS.cardBorder }}
              placeholder="Describe what happened and how to reproduce it..."
            />
          </div>

          {issuePreview ? (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: COLORS.cardBorder }}>
              <img src={issuePreview} alt="Attachment preview" className="h-[220px] w-full object-cover" />
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSupportOpen(false)}
              className="h-10 px-5 rounded-md border text-[12px] font-semibold hover:bg-slate-50"
              style={{ borderColor: COLORS.cardBorder }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={submitIssue}
              className="h-10 px-5 rounded-md text-white text-[12px] font-semibold hover:opacity-95"
              style={{ backgroundColor: COLORS.primary }}
            >
              Submit
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Rule({ ok, label }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cx(
          "h-5 w-5 rounded-full inline-flex items-center justify-center border",
          ok ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"
        )}
      >
        {ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-slate-400" />}
      </span>
      <div className={cx("text-[12px] font-semibold", ok ? "text-slate-900" : "text-slate-500")}>{label}</div>
    </div>
  );
}