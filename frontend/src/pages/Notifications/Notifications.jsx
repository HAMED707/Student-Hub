import React, { useMemo, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  CheckCircle,
  Clock,
  MessageSquare,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import Navbar from "../../assets/components/Navbar/Navbar.jsx";

const FILTER_TABS = ["All", "Unread", "Bookings", "Messages"];

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "booking_approved",
    category: "Bookings",
    title: "Booking approved",
    message:
      "Your reservation for Modern Studio - Nasr City has been approved by the landlord.",
    timestamp: "2 hours ago",
    unread: true,
    actionLabel: "Pay EGP 2,500",
  },
  {
    id: 2,
    type: "message",
    category: "Messages",
    title: "New message from Ahmed",
    message:
      "Ahmed sent more details about the move-in time and building access.",
    timestamp: "4 hours ago",
    unread: true,
    actionLabel: "Reply",
  },
  {
    id: 3,
    type: "reminder",
    category: "Bookings",
    title: "Payment reminder",
    message:
      "Your booking deposit is due tomorrow to keep Cozy Room - Dokki reserved.",
    timestamp: "Yesterday",
    unread: false,
    actionLabel: "View booking",
  },
  {
    id: 4,
    type: "system",
    category: "System",
    title: "Profile verified",
    message:
      "Your student profile was verified. You can now contact landlords faster.",
    timestamp: "3 days ago",
    unread: false,
  },
  {
    id: 5,
    type: "message",
    category: "Messages",
    title: "Landlord replied",
    message:
      "Mona answered your question about monthly utilities for the shared apartment.",
    timestamp: "1 week ago",
    unread: false,
    actionLabel: "Open chat",
  },
];

const notificationStyles = {
  booking_approved: {
    icon: CheckCircle,
    wrapper: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  },
  message: {
    icon: MessageSquare,
    wrapper: "bg-blue-50 text-blue-600 ring-blue-100",
  },
  reminder: {
    icon: Clock,
    wrapper: "bg-amber-50 text-amber-600 ring-amber-100",
  },
  system: {
    icon: ShieldCheck,
    wrapper: "bg-slate-50 text-slate-600 ring-slate-100",
  },
};

const EmptyState = ({ activeTab }) => (
  <div className="mx-auto flex min-h-[420px] max-w-xl flex-col items-center justify-center px-6 text-center">
    <div className="relative mb-6 grid h-24 w-24 place-items-center rounded-full bg-blue-50 text-blue-500 ring-8 ring-blue-100/70">
      <Bell className="h-11 w-11" />
      <span className="absolute right-5 top-5 h-3 w-3 rounded-full bg-emerald-400" />
    </div>
    <h2 className="text-2xl font-extrabold text-[#0A2647]">
      You're all caught up!
    </h2>
    <p className="mt-3 text-sm leading-6 text-slate-500">
      {activeTab === "All"
        ? "No notifications are waiting for you right now."
        : `No ${activeTab.toLowerCase()} notifications are waiting for you right now.`}
    </p>
  </div>
);

const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  const config =
    notificationStyles[notification.type] || notificationStyles.system;
  const Icon = config.icon;

  return (
    <article
      className={`group relative flex gap-4 rounded-xl border p-4 transition duration-200 sm:p-5 ${
        notification.unread
          ? "border-blue-100 bg-blue-50/70 shadow-sm"
          : "border-slate-200 bg-white hover:border-blue-100 hover:bg-slate-50"
      }`}
    >
      {notification.unread && (
        <span className="absolute left-3 top-3 h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.14)] motion-safe:animate-pulse" />
      )}

      <div
        className={`mt-1 grid h-12 w-12 flex-shrink-0 place-items-center rounded-full ring-1 ${config.wrapper}`}
      >
        <Icon className="h-6 w-6" />
      </div>

      <div className="min-w-0 flex-1 pr-0 sm:pr-24">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-extrabold text-[#0A2647]">
            {notification.title}
          </h3>
          {notification.unread && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
              New
            </span>
          )}
        </div>

        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
          {notification.message}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            {notification.timestamp}
          </span>

          {notification.actionLabel && (
            <button
              type="button"
              className="text-sm font-bold text-blue-600 transition hover:text-blue-700"
            >
              {notification.actionLabel}
            </button>
          )}
        </div>
      </div>

      <div className="absolute right-4 top-4 flex translate-y-1 gap-2 opacity-100 transition sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
        {notification.unread && (
          <button
            type="button"
            onClick={() => onMarkAsRead(notification.id)}
            className="grid h-9 w-9 place-items-center rounded-full border border-blue-100 bg-white text-blue-600 shadow-sm transition hover:bg-blue-600 hover:text-white"
            aria-label="Mark as read"
            title="Mark as read"
          >
            <Check className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(notification.id)}
          className="grid h-9 w-9 place-items-center rounded-full border border-red-100 bg-white text-red-500 shadow-sm transition hover:bg-red-500 hover:text-white"
          aria-label="Delete notification"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
};

export default function Notifications() {
  const [activeTab, setActiveTab] = useState("All");
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((item) => item.unread).length;

  const tabCounts = useMemo(
    () => ({
      All: notifications.length,
      Unread: unreadCount,
      Bookings: notifications.filter((item) => item.category === "Bookings")
        .length,
      Messages: notifications.filter((item) => item.category === "Messages")
        .length,
    }),
    [notifications, unreadCount],
  );

  const filteredNotifications = useMemo(() => {
    if (activeTab === "All") return notifications;
    if (activeTab === "Unread") {
      return notifications.filter((item) => item.unread);
    }
    return notifications.filter((item) => item.category === activeTab);
  }, [activeTab, notifications]);

  const markAsRead = (id) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, unread: false } : item,
      ),
    );
  };

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((item) => ({ ...item, unread: false })),
    );
  };

  const deleteNotification = (id) => {
    setNotifications((current) => current.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#0A2647]">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 border-b border-slate-200 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-[#0A2647] sm:text-4xl">
                  Notifications
                </h1>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-extrabold text-blue-700">
                  {unreadCount} unread
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Booking updates, landlord messages, and account alerts in one
                place.
              </p>
            </div>

            <button
              type="button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </button>
          </div>

          <div className="overflow-x-auto border-b border-slate-200 px-5 sm:px-7">
            <nav className="flex min-w-max gap-6" aria-label="Notification tabs">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`relative py-4 text-sm font-extrabold transition ${
                    activeTab === tab
                      ? "text-blue-600"
                      : "text-slate-500 hover:text-[#0A2647]"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {tab}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        activeTab === tab
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {tabCounts[tab]}
                    </span>
                  </span>
                  {activeTab === tab && (
                    <span className="absolute inset-x-0 bottom-0 h-1 rounded-t-full bg-blue-500" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-5 sm:p-7">
            {filteredNotifications.length > 0 ? (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))}
              </div>
            ) : (
              <EmptyState activeTab={activeTab} />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
