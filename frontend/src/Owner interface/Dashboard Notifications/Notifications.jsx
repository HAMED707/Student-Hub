import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Info,
  Search,
  XCircle,
} from "lucide-react";
import { useNotifications } from "../../context/notificationsContext.js";
import {
  getNotificationActionLabel,
  resolveNotificationDestination,
} from "../../utils/notifications.js";

const cx = (...classes) => classes.filter(Boolean).join(" ");

const iconMap = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
  danger: <XCircle className="h-5 w-5 text-rose-500" />,
  info: <Info className="h-5 w-5 text-[#155BC2]" />,
};

export default function OwnerNotifications() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const {
    role,
    notifications,
    unreadCount,
    loading,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useNotifications();

  const filteredNotifications = useMemo(() => {
    const search = query.trim().toLowerCase();
    return notifications.filter((item) => {
      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search) ||
        item.desc.toLowerCase().includes(search) ||
        item.notificationType.toLowerCase().includes(search);
      const matchesFilter =
        filter === "All" ||
        (filter === "Unread"
          ? !item.read
          : item.tone === filter.toLowerCase());
      return matchesSearch && matchesFilter;
    });
  }, [filter, notifications, query]);

  const openNotification = useCallback(
    async (item) => {
      if (!item) return;
      if (!item.read) {
        await markNotificationAsRead(item.id);
      }
      const destination = resolveNotificationDestination(item, role);
      navigate(
        destination.path,
        destination.state ? { state: destination.state } : undefined,
      );
    },
    [markNotificationAsRead, navigate, role],
  );

  return (
    <div className="min-h-screen bg-[#F6F8FC] font-sans text-[#091E42]">
      <main className="mx-auto max-w-7xl px-6 py-8">
        <header className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#155BC2]">
                Notifications
              </p>
              <h1 className="mt-1 text-2xl font-black">
                Owner Notifications
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Track bookings, listing updates, payments, and platform alerts.
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 px-5 py-3 text-center">
              <p className="text-xl font-black text-[#155BC2]">{unreadCount}</p>
              <p className="text-[11px] font-bold text-slate-500">Unread</p>
            </div>
          </div>
        </header>

        <section className="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <label className="relative w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search notifications..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] pl-11 pr-4 text-sm outline-none transition focus:border-[#155BC2] focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <div className="flex gap-2 overflow-x-auto">
              {["All", "Unread", "Info", "Warning", "Success"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={cx(
                    "h-10 shrink-0 rounded-xl border px-4 text-sm font-bold transition",
                    filter === item
                      ? "border-[#155BC2] bg-[#155BC2] text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-[#155BC2]/40 hover:bg-blue-50",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="grid place-items-center py-16 text-center">
                <Bell className="h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-500">
                  Loading notifications...
                </p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="grid place-items-center py-16 text-center">
                <Bell className="h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-500">
                  No notifications match your filters.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredNotifications.map((item) => (
                  <article
                    key={item.id}
                    className={cx(
                      "flex flex-col gap-3 p-4 transition hover:bg-[#F8FAFC] md:flex-row md:items-center md:justify-between",
                      !item.read && "bg-blue-50/40",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => openNotification(item)}
                      className="flex min-w-0 flex-1 gap-3 text-left"
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-100 bg-white">
                        {iconMap[item.tone] || iconMap.info}
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-[#091E42]">
                            {item.title}
                          </span>
                          {!item.read && (
                            <span className="h-2 w-2 rounded-full bg-[#155BC2]" />
                          )}
                        </span>
                        <span className="mt-1 block text-sm text-slate-500">
                          {item.desc}
                        </span>
                        <span className="mt-1 block text-xs font-bold text-slate-400">
                          {item.time}
                        </span>
                      </span>
                    </button>
                    <div className="flex items-center gap-2">
                      {!item.read ? (
                        <button
                          type="button"
                          onClick={() => markNotificationAsRead(item.id)}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          Mark read
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => openNotification(item)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#155BC2] px-3 text-xs font-bold text-white transition hover:bg-[#0f4ca3]"
                      >
                        {getNotificationActionLabel(item)}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => markAllNotificationsAsRead()}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Mark all as read
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
