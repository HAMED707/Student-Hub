import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  Info,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MoreHorizontal,
  ChevronDown,
  X,
  MessageSquare,
  User,
  AlertTriangle,
  Building2,
  Eye,
  ClipboardList,
  TrendingUp,
} from "lucide-react";

/* =========================
   Constants
========================= */
const EMPTY_STATES = {
  noBookings: "No student bookings yet. When students apply, they'll appear here.",
  noNotifications: "You're all caught up! No new notifications.",
  noAnalytics: "Analytics data will appear once properties receive views.",
};

/* =========================
   Helpers
========================= */
const cx = (...c) => c.filter(Boolean).join(" ");

const Wave = ({ opacity = 0.12 }) => (
  <svg
    className="absolute right-0 bottom-0 pointer-events-none"
    width="240"
    height="130"
    viewBox="0 0 240 130"
    fill="none"
    aria-hidden="true"
    style={{ opacity }}
  >
    <path d="M0 92C75 50 140 135 240 84V130H0V114C0 104 0 98 0 92Z" fill="#ffffff" />
  </svg>
);

const ProgressRing = ({ value = 85 }) => {
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value / 100);
  return (
    <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
      <svg className="-rotate-90" width="56" height="56">
        <circle cx="28" cy="28" r={r} stroke="#E9D8FF" strokeWidth="5" fill="transparent" />
        <circle
          cx="28"
          cy="28"
          r={r}
          stroke="#5B4CE6"
          strokeWidth="5"
          fill="transparent"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[11px] font-extrabold text-[#5B4CE6]">{value}%</span>
    </div>
  );
};

const useOutside = (refs, onOutside, enabled = true) => {
  // refs يجب يكون memoized array
  useEffect(() => {
    if (!enabled) return;
    const handler = (e) => {
      const inside = refs.some((r) => r.current && r.current.contains(e.target));
      if (!inside) onOutside?.();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [refs, onOutside, enabled]);
};

/* =========================
   Header + Alert
========================= */
const DashboardHeaderSection = ({
  userName,
  searchValue,
  onSearchChange,
  notifications = [],
  unreadCount = 0,
  onDismissNotification,
  onClearNotifications,
  onOpenNotification,
  onViewAllNotifications,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);

  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const outsideRefs = useMemo(() => [btnRef, panelRef], []);
  useOutside(outsideRefs, () => setNotifOpen(false), notifOpen);

  const NotifIcon = ({ type }) => {
    if (type === "success") return <CheckCircle2 size={18} className="text-green-500" />;
    if (type === "warning") return <AlertCircle size={18} className="text-yellow-500" />;
    if (type === "danger") return <XCircle size={18} className="text-red-500" />;
    return <Info size={18} className="text-orange-500" />;
  };

  const preview = notifications.slice(0, 6);

  return (
    <section className="w-full">
      {/* Top Row */}
      <div className="flex items-center gap-6">
        <h1 className="text-[24px] leading-none text-[#2D31A6] font-medium">
          Welcome back, <span className="font-extrabold text-[#3A2CB8]">{userName}</span>
        </h1>

        <div className="flex-1 max-w-[620px] mx-auto">
          <div className="relative">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search"
              className={cx(
                "w-full h-12 rounded-full bg-white",
                "border border-slate-200 shadow-sm",
                "pl-12 pr-6 text-[14px] text-slate-700",
                "placeholder:text-slate-400",
                "focus:outline-none focus:ring-2 focus:ring-[#E6E0FF]"
              )}
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            ref={btnRef}
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            className={cx(
              "relative w-12 h-12 rounded-2xl flex items-center justify-center",
              "bg-white border border-slate-100 shadow-sm",
              "hover:bg-slate-50 transition active:scale-[0.98]",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E6E0FF]"
            )}
            aria-label="Notifications"
          >
            <Bell size={24} className="text-slate-900" />
            {unreadCount > 0 && (
              <span className="absolute top-[6px] right-[6px] w-5 h-5 rounded-full bg-[#FF4D4F] text-white text-[11px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              ref={panelRef}
              className={cx(
                "absolute right-0 mt-3 w-[392px] z-50",
                "bg-white border border-slate-100 rounded-2xl",
                "shadow-[0_18px_60px_rgba(15,23,42,0.18)] overflow-hidden"
              )}
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-extrabold text-slate-900">Notifications</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {unreadCount > 0 ? `${unreadCount} unread` : "No unread notifications"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onClearNotifications?.()}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition"
                >
                  Clear
                </button>
              </div>

              <div className="p-4 space-y-3 max-h-72 overflow-auto">
                {preview.length === 0 ? (
                  <div className="text-sm text-slate-400">{EMPTY_STATES.noNotifications}</div>
                ) : (
                  preview.map((n) => (
                    <div
                      key={n.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setNotifOpen(false);
                        onOpenNotification?.(n);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setNotifOpen(false);
                          onOpenNotification?.(n);
                        }
                      }}
                      className={cx(
                        "relative w-full text-left p-3 rounded-2xl",
                        "border border-slate-100 bg-white",
                        "shadow-sm hover:shadow-[0_12px_30px_rgba(15,23,42,0.10)] transition",
                        "cursor-pointer"
                      )}
                      title="Open notification"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDismissNotification?.(n.id);
                        }}
                        className="absolute right-3 top-3 text-slate-300 hover:text-slate-500 transition"
                        aria-label="Dismiss"
                      >
                        <X size={14} />
                      </button>

                      <div className="flex gap-3 items-start">
                        <div className="mt-0.5 w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                          <NotifIcon type={n.type} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-[13px] font-extrabold text-slate-900">
                              {n.title} {!n.read && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-[#2D31A6]" />}
                            </p>
                            <p className="text-[10px] text-slate-300 whitespace-nowrap">{n.time}</p>
                          </div>
                          <p className="text-[12px] text-slate-500 mt-1 leading-snug">{n.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-3 border-t border-slate-100 bg-[#FBFCFF]">
                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen(false);
                    onViewAllNotifications?.();
                  }}
                  className="w-full h-10 rounded-xl bg-[#2D31A6] text-white font-semibold hover:bg-[#23279A] transition"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alert */}
      <div className="mt-6 bg-[#F8FAFF] border border-slate-100 rounded-2xl px-6 py-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#FFF7ED] flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={18} className="text-[#F59E0B]" />
        </div>
        <p className="text-slate-700 font-medium text-[15px]">
          Your property <span className="font-extrabold text-slate-900">'Nasr City Apartment'</span> needs updated photos
          to remain listed.
        </p>
      </div>
    </section>
  );
};

/* =========================
   Stats Row
========================= */
const StatShell = ({ className, children }) => (
  <div
    className={cx(
      "relative overflow-hidden rounded-2xl h-[104px] px-6 py-5",
      "border border-white/40",
      "shadow-[0_10px_26px_rgba(15,23,42,0.06)]",
      "transition hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)] hover:-translate-y-[1px]",
      className
    )}
  >
    <Wave />
    {children}
  </div>
);

const Label = ({ children, className }) => (
  <p className={cx("text-[13px] font-semibold tracking-tight leading-none", className)}>{children}</p>
);

const Value = ({ children, className }) => (
  <p className={cx("mt-3 text-[30px] font-extrabold leading-none tracking-tight", className)}>{children}</p>
);

const StatTop = ({ icon, hint }) => (
  <div className="flex items-center justify-between">
    <div className="w-10 h-10 rounded-2xl bg-white/55 border border-white/60 flex items-center justify-center">
      {icon}
    </div>
    <p className="text-[11px] font-semibold text-white/85">{hint}</p>
  </div>
);

const DashboardStatsRow = ({ totalProperties, bookedUnits, bookedProgress, totalViews, pendingRequests }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
    <StatShell className="bg-gradient-to-br from-[#9EC1FF] to-[#87B6FF]">
      <StatTop icon={<Building2 size={18} className="text-[#0B2A66]" />} hint="Portfolio" />
      <Label className="text-white/90 mt-3">Total Properties</Label>
      <Value className="text-white">{totalProperties}</Value>
    </StatShell>

    <StatShell className="bg-gradient-to-br from-[#F6F3FF] to-[#EFE7FF]">
      <div className="flex items-center justify-between gap-4">
        <ProgressRing value={bookedProgress} />
        <div className="min-w-0">
          <Label className="text-[#5B4CE6] text-[14px]">Booked Units</Label>
          <Value className="text-[#5B4CE6]">{bookedUnits}</Value>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-white/70 border border-white/70 flex items-center justify-center">
          <ClipboardList size={18} className="text-[#5B4CE6]" />
        </div>
      </div>
    </StatShell>

    <StatShell className="bg-gradient-to-br from-[#EEF6FF] to-[#E6F0FF]">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-slate-900 text-[14px]">Total Views</Label>
          <Value className="text-[#0B2A66]">{totalViews}</Value>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-white/70 border border-white/70 flex items-center justify-center">
          <Eye size={18} className="text-[#0B2A66]" />
        </div>
      </div>
    </StatShell>

    <StatShell className="bg-gradient-to-br from-[#FDEFD2] to-[#FBE3B4]">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-[#A16207] text-[14px]">Pending Requests</Label>
          <Value className="text-[#A16207]">{pendingRequests}</Value>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-white/70 border border-white/70 flex items-center justify-center">
          <TrendingUp size={18} className="text-[#A16207]" />
        </div>
      </div>
    </StatShell>
  </div>
);

/* =========================
   Bookings (نفس كودك)
========================= */
const StatusBadge = ({ status }) => {
  const s = (status || "").toLowerCase();
  if (s === "pending") return <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold bg-[#F7D9A4] text-[#7A4B00]">Pending</span>;
  if (s === "rejected") return <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold bg-[#FFE4E6] text-[#9F1239]">Rejected</span>;
  if (s === "accepted") return <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold bg-[#DBEAFE] text-[#1D4ED8]">Accepted</span>;
  return <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold bg-[#CFEFDB] text-[#0F7A43]">Available</span>;
};

const BookingDetailsModal = ({ open, booking, onClose, onMessage, onViewProfile, onAccept, onReject }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !booking) return null;
  const isPending = (booking.status || "").toLowerCase() === "pending";

  return (
    <div className="fixed inset-0 z-[999]">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-[600px] rounded-2xl bg-white border border-slate-100 shadow-[0_20px_70px_rgba(15,23,42,0.25)] overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400">Booking details</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">{booking.name}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-100 overflow-hidden flex items-center justify-center">
                {booking.avatarUrl ? (
                  <img src={booking.avatarUrl} alt={booking.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-slate-300/80" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <StatusBadge status={booking.status} />
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-100 bg-[#FAFBFD] p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Room / Unit</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{booking.room}</p>
                    <p className="text-xs text-slate-400">{booking.beds}</p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-[#FAFBFD] p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Check-in</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{booking.date}</p>
                    <p className="text-xs text-slate-400">Start date</p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-slate-100 bg-white p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Useful info</p>
                  <ul className="mt-2 text-sm text-slate-600 space-y-1">
                    <li>• Booking status: <span className="font-semibold text-slate-800">{booking.status}</span></li>
                    <li>• Request created: <span className="font-semibold text-slate-800">{booking.requestDate}</span></li>
                    <li>• Lease start: <span className="font-semibold text-slate-800">{booking.leaseStart}</span></li>
                    <li>• Lease term: <span className="font-semibold text-slate-800">{booking.term}</span></li>
                  </ul>
                </div>

                {booking.note && (
                  <div className="mt-3 rounded-xl border border-slate-100 bg-white p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Note</p>
                    <p className="mt-1 text-sm text-slate-600">{booking.note}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-5 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onMessage?.(booking)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition"
              >
                <MessageSquare size={16} />
                Message
              </button>
              <button
                type="button"
                onClick={() => onViewProfile?.(booking)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition"
              >
                <User size={16} />
                View Profile
              </button>
            </div>

            {isPending ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onReject?.(booking)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-red-600 hover:bg-red-50 transition"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => onAccept?.(booking)}
                  className="px-4 py-2 rounded-xl bg-[#2D31A6] text-white hover:bg-[#23279A] transition"
                >
                  Accept
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#F3F4FF] text-[#2D31A6] font-semibold hover:bg-[#E9E9FF] transition"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AllStudentsModal = ({ open, onClose, bookings = [], onOpenBooking }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999]">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-[720px] rounded-2xl bg-white border border-slate-100 shadow-[0_20px_70px_rgba(15,23,42,0.25)] overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400">Students</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">All Student Bookings</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-6 py-5 space-y-3 max-h-[60vh] overflow-auto">
            {bookings.length === 0 ? (
              <div className="text-sm text-slate-400">{EMPTY_STATES.noBookings}</div>
            ) : (
              bookings.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onOpenBooking?.(b)}
                  className="w-full text-left rounded-2xl border border-slate-100 bg-white p-4 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-100 overflow-hidden flex items-center justify-center">
                        {b.avatarUrl ? (
                          <img src={b.avatarUrl} alt={b.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-300/80" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-900 truncate">{b.name}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {b.room} — {b.beds} • Check-in: {b.date}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="px-6 py-5 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#F3F4FF] text-[#2D31A6] font-semibold hover:bg-[#E9E9FF] transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BookingCard = ({ booking, onOpen }) => {
  const isPending = (booking.status || "").toLowerCase() === "pending";
  return (
    <button
      type="button"
      onClick={() => onOpen(booking)}
      className={cx(
        "p-5 rounded-2xl w-full text-left border border-white/60",
        "shadow-[0_10px_26px_rgba(15,23,42,0.06)]",
        "transition hover:shadow-[0_16px_36px_rgba(15,23,42,0.10)] hover:-translate-y-[1px]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B46FF]/30 focus-visible:ring-offset-2",
        isPending ? "bg-gradient-to-br from-[#FFF6E8] to-[#FFEDD2]" : "bg-gradient-to-br from-[#E9FBF1] to-[#DDF7E8]"
      )}
      title="Open booking details"
    >
      <div className="flex items-start justify-between">
        <div className="w-11 h-11 rounded-full bg-white/80 border border-white/70 overflow-hidden flex items-center justify-center">
          {booking.avatarUrl ? (
            <img src={booking.avatarUrl} alt={booking.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-300/70" />
          )}
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <h4 className="mt-4 text-[16px] font-extrabold text-slate-900 leading-tight">{booking.name}</h4>
      <p className="mt-2 text-[12px] text-slate-400">
        {booking.room} — {booking.beds}
      </p>
      <p className="mt-2 text-[12px] text-slate-400">
        Check-in: <span className="text-slate-600 font-medium">{booking.date}</span>
      </p>
    </button>
  );
};

const LatestStudentBookings = ({ bookings = [], onSeeAll, onOpenBooking }) => (
  <section className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-xl font-extrabold text-slate-900">Latest Student Bookings</h3>
        <p className="text-sm text-slate-400 mt-1">Check the most recent room reservations and their status.</p>
      </div>

      <button
        type="button"
        onClick={onSeeAll}
        className="flex items-center gap-2 text-sm font-semibold text-[#6B46FF] hover:text-[#3A2CB8] transition"
      >
        See All <ChevronDown size={18} className="text-slate-400" />
      </button>
    </div>

    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {bookings.length === 0 ? (
        <div className="col-span-3 text-sm text-slate-400">{EMPTY_STATES.noBookings}</div>
      ) : (
        bookings.slice(0, 3).map((b) => <BookingCard key={b.id} booking={b} onOpen={onOpenBooking} />)
      )}
    </div>
  </section>
);

/* =========================
   Performance Analytics
========================= */
const AnalyticsItem = ({ item, onOpen }) => (
  <button
    type="button"
    onClick={() => onOpen?.(item)}
    className={cx(
      "w-full text-left rounded-2xl px-5 py-4",
      "bg-[#F4F5F7] hover:bg-[#EEF2FF] transition",
      "border border-transparent hover:border-[#E7E3FF]"
    )}
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[16px] font-extrabold text-slate-900 leading-tight">{item.title}</p>
        <p className="text-sm text-slate-400 mt-1">{item.location}</p>
      </div>

      <div className="text-right pt-1">
        <p className="text-sm font-extrabold text-slate-900">{item.views} views</p>
        <p className="text-sm text-slate-400 mt-1">{item.bookings} bookings</p>
      </div>
    </div>
  </button>
);

const PerformanceAnalytics = ({ items = [], onOpen, onSeeMore }) => (
  <section className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
    <h3 className="text-xl font-extrabold text-slate-900">Performance Analytics</h3>
    <p className="text-sm text-slate-400 mt-1">Summary of listings with views, bookings, and occupancy rates</p>

    <div className="mt-5 space-y-4">
      {items.length === 0 ? (
        <div className="text-sm text-slate-400">{EMPTY_STATES.noAnalytics}</div>
      ) : (
        items.map((it) => <AnalyticsItem key={it.id} item={it} onOpen={onOpen} />)
      )}
    </div>

    <div className="mt-4 flex justify-center">
      <button
        type="button"
        onClick={onSeeMore}
        className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
        aria-label="See more"
      >
        <ChevronDown size={18} />
      </button>
    </div>
  </section>
);

/* =========================
   Right Column (Earnings + Notifs)
========================= */
const EarningsCard = ({ amountUSD = 1500 }) => (
  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#BFF7E4] to-[#A6F3D8] p-6 shadow-sm transition hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)] hover:-translate-y-[1px]">
    <Wave opacity={0.12} />
    <div className="relative">
      <p className="text-center text-[16px] font-semibold text-[#064E3B]">Total Earnings</p>
      <p className="mt-2 text-center text-4xl font-extrabold text-[#064E3B]">${amountUSD.toLocaleString("en-US")}</p>
      <p className="mt-2 text-center text-[12px] text-[#064E3B]/70 font-medium">Last 30 days</p>
    </div>
  </div>
);

const NotifIconSmall = ({ type }) => {
  if (type === "success") return <CheckCircle2 size={16} className="text-green-500" />;
  if (type === "warning") return <AlertCircle size={16} className="text-yellow-500" />;
  if (type === "danger") return <XCircle size={16} className="text-red-500" />;
  return <Info size={16} className="text-orange-500" />;
};

const NotificationRow = ({ n, onDismiss, onOpen }) => (
  <div
    role="button"
    tabIndex={0}
    onClick={() => onOpen?.(n)}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") onOpen?.(n);
    }}
    className="relative w-full text-left rounded-2xl border border-slate-100 bg-white p-3 shadow-sm hover:shadow-[0_12px_30px_rgba(15,23,42,0.10)] hover:bg-slate-50 transition cursor-pointer"
    title="Open notification"
  >
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onDismiss?.(n.id);
      }}
      className="absolute right-3 top-3 text-slate-300 hover:text-slate-500"
      aria-label="Dismiss"
    >
      <X size={14} />
    </button>

    <div className="flex gap-3 items-start">
      <div className="mt-0.5 w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
        <NotifIconSmall type={n.type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-extrabold leading-tight text-slate-900">
          {n.title} {!n.read && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-[#2D31A6]" />}
        </p>
        <p className="mt-1 text-[11px] text-slate-500 leading-snug">{n.desc}</p>
        <p className="mt-2 text-[9px] font-bold uppercase tracking-tight text-slate-300">{n.time}</p>
      </div>
    </div>
  </div>
);

const ImportantNotifications = ({ items = [], onDismiss, onOpen, onAction, unreadCount }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const outsideRefs = useMemo(() => [btnRef, panelRef], []);
  useOutside(outsideRefs, () => setMenuOpen(false), menuOpen);

  const preview = items.slice(0, 4);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-900">Important Notifications</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {items.length ? `${items.length} items • ${unreadCount} unread` : "No items"}
          </p>
        </div>

        <div className="relative">
          <button
            ref={btnRef}
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-50"
            aria-label="More"
          >
            <MoreHorizontal size={16} />
          </button>

          {menuOpen && (
            <div
              ref={panelRef}
              className="absolute right-0 mt-2 w-44 rounded-xl bg-white border border-slate-100 shadow-[0_16px_50px_rgba(15,23,42,0.15)] p-2 z-50"
            >
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onAction?.("mark_all_read");
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
              >
                Mark all as read
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onAction?.("clear_all");
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {preview.length === 0 ? (
          <div className="text-sm text-slate-400">{EMPTY_STATES.noNotifications}</div>
        ) : (
          preview.map((n) => <NotificationRow key={n.id} n={n} onDismiss={onDismiss} onOpen={onOpen} />)
        )}
      </div>

      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={() => onAction?.("see_more")}
          className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
          aria-label="See more"
        >
          <ChevronDown size={18} />
        </button>
      </div>
    </div>
  );
};

/* =========================
   Page
========================= */
export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState([
    {
      id: "n1",
      title: "New booking request",
      desc: "Mona Ali requested Room B2 and is waiting for your approval.",
      time: "5 min ago",
      type: "warning",
      read: false,
      action: { path: "/owner/bookings" },
    },
    {
      id: "n2",
      title: "Listing needs attention",
      desc: "Nasr City Apartment needs updated photos to stay visible.",
      time: "1 hour ago",
      type: "danger",
      read: false,
      action: { path: "/owner/properties" },
    },
    {
      id: "n3",
      title: "Payment received",
      desc: "Your latest payout was processed successfully.",
      time: "Today",
      type: "success",
      read: true,
      action: { path: "/owner/payments" },
    },
  ]);

  // Bookings
  const [bookings, setBookings] = useState([
    {
      id: "b1",
      name: "Ahmed Khaled",
      status: "Available",
      date: "12 March 2025",
      room: "Room A3",
      beds: "2 Beds",
      requestDate: "10 March 2025",
      leaseStart: "12 March 2025",
      term: "Short stay",
      avatarUrl:
        "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80",
      note: "Student requested a quiet room preference.",
    },
    {
      id: "b2",
      name: "Mona Ali",
      status: "Pending",
      date: "15 March 2025",
      room: "Room B2",
      beds: "1 Bed",
      requestDate: "12 March 2025",
      leaseStart: "15 March 2025",
      term: "Monthly",
      avatarUrl:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
      note: "Pending approval — review details and accept/reject.",
    },
    {
      id: "b3",
      name: "Salah K.",
      status: "Available",
      date: "18 March 2025",
      room: "Room C1",
      beds: "2 Beds",
      requestDate: "16 March 2025",
      leaseStart: "18 March 2025",
      term: "Monthly",
      avatarUrl:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
      note: "Has previous good history on the platform.",
    },
  ]);

  const analyticsItems = useMemo(
    () => [
      { id: "a1", title: "Shared Room - Nasr City", location: "Cairo - Nasr City", views: 124, bookings: 8 },
      { id: "a2", title: "Luxury Apartment - Zamalek", location: "Cairo - Zamalek", views: 98, bookings: 5 },
    ],
    []
  );

  // Modals
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [allStudentsOpen, setAllStudentsOpen] = useState(false);
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const openBooking = (b) => {
    setSelectedBooking(b);
    setBookingModalOpen(true);
  };

  const closeBooking = () => {
    setBookingModalOpen(false);
    setSelectedBooking(null);
  };

  const acceptBooking = (b) => {
    setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, status: "Accepted" } : x)));
    setSelectedBooking((s) => (s?.id === b.id ? { ...s, status: "Accepted" } : s));
  };

  const rejectBooking = (b) => {
    setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, status: "Rejected" } : x)));
    setSelectedBooking((s) => (s?.id === b.id ? { ...s, status: "Rejected" } : s));
  };

  const markRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismiss = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Open notification: mark as read + navigate to its action, else go to notifications page
  const openNotification = useCallback(
    (n) => {
      if (!n) return;
      markRead(n.id);
      if (n.action?.path) navigate(n.action.path);
      else navigate("/owner/notifications");
    },
    [navigate, markRead]
  );

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-slate-700 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header + Alert */}
        <DashboardHeaderSection
          userName="Owner"
          searchValue={search}
          onSearchChange={setSearch}
          notifications={notifications}
          unreadCount={unreadCount}
          onDismissNotification={dismiss}
          onClearNotifications={clearAll}
          onOpenNotification={openNotification}
          onViewAllNotifications={() => navigate("/owner/notifications")}
        />

        {/* Stats */}
        <div className="mt-6">
          <DashboardStatsRow
            totalProperties={5}
            bookedUnits={4}
            bookedProgress={85}
            totalViews={1500}
            pendingRequests={15}
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Left */}
          <div className="lg:col-span-9 space-y-6">
            <LatestStudentBookings
              bookings={bookings}
              onSeeAll={() => setAllStudentsOpen(true)}
              onOpenBooking={openBooking}
            />

            <PerformanceAnalytics
              items={analyticsItems}
              onOpen={() => navigate("/owner/properties")}
              onSeeMore={() => navigate("/owner/properties")}
            />
          </div>

          {/* Right */}
          <aside className="lg:col-span-3 space-y-6">
            <EarningsCard amountUSD={1500} />

            <ImportantNotifications
              items={notifications}
              unreadCount={unreadCount}
              onDismiss={dismiss}
              onOpen={(n) => openNotification(n)}
              onAction={(action) => {
                if (action === "clear_all") clearAll();
                if (action === "mark_all_read") markAllRead();
                if (action === "see_more") navigate("/owner/notifications");
              }}
            />
          </aside>
        </div>
      </div>

      {/* Booking Details */}
      <BookingDetailsModal
        open={bookingModalOpen}
        booking={selectedBooking}
        onClose={closeBooking}
        onMessage={(b) => navigate(`/owner/messages?student=${b.id}`)}
        onViewProfile={(b) => navigate(`/profile/${b.id}`)}
        onAccept={acceptBooking}
        onReject={rejectBooking}
      />

      {/* All Students */}
      <AllStudentsModal
        open={allStudentsOpen}
        onClose={() => setAllStudentsOpen(false)}
        bookings={bookings}
        onOpenBooking={(b) => {
          setAllStudentsOpen(false);
          openBooking(b);
        }}
      />
    </div>
  );
}
