import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Building2,
  CalendarDays,
  CreditCard,
  Eye,
  MessageSquare,
  Plus,
  Wallet,
} from "lucide-react";
import { fetchLandlordDashboard } from "../../api/properties.js";
import { useNotifications } from "../../context/notificationsContext.js";
import { buildDraftChatState } from "../../utils/messaging.js";
import { resolveNotificationDestination } from "../../utils/notifications.js";

const formatMoney = (value) =>
  `EGP ${Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;

const StatCard = ({ icon, label, value, accent = "blue" }) => (
  <div
    className={`rounded-3xl border bg-white p-5 shadow-sm ${
      accent === "blue"
        ? "border-blue-100"
        : accent === "green"
          ? "border-emerald-100"
          : accent === "amber"
            ? "border-amber-100"
            : "border-slate-200"
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
          {label}
        </p>
        <p className="mt-2 text-2xl font-black text-[#091E42]">{value}</p>
      </div>
      <div
        className={`grid h-12 w-12 place-items-center rounded-2xl ${
          accent === "blue"
            ? "bg-blue-50 text-blue-600"
            : accent === "green"
              ? "bg-emerald-50 text-emerald-600"
              : accent === "amber"
                ? "bg-amber-50 text-amber-600"
                : "bg-slate-50 text-slate-600"
        }`}
      >
        {icon}
      </div>
    </div>
  </div>
);

const formatDate = (value) => {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return date.toLocaleDateString();
};

export default function Overview() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { notifications, unreadCount, role } = useNotifications();

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await fetchLandlordDashboard();
        setDashboard(data);
      } catch (loadError) {
        setError(loadError.message || "Unable to load owner dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const summary = dashboard?.summary || {};
  const recentNotifications = useMemo(() => notifications.slice(0, 4), [notifications]);

  const openNotification = (notification) => {
    const destination = resolveNotificationDestination(notification, role);
    navigate(
      destination.path,
      destination.state ? { state: destination.state } : undefined,
    );
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] font-sans text-[#091E42]">
      <main className="mx-auto max-w-7xl px-6 py-8">
        <header className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#155BC2]">
                Owner dashboard
              </p>
              <h1 className="mt-1 text-3xl font-black">Overview</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Listings, booking activity, and notifications now come from the live owner APIs instead of mock dashboard cards.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/owner/properties/new")}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#155BC2] px-4 text-sm font-black text-white transition hover:bg-[#0f4ca3]"
              >
                <Plus className="h-4 w-4" />
                Add property
              </button>
              <button
                type="button"
                onClick={() => navigate("/owner/bookings")}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                <CalendarDays className="h-4 w-4" />
                Open bookings
              </button>
            </div>
          </div>
        </header>

        {error ? (
          <div className="mt-6 rounded-3xl border border-rose-100 bg-white p-6 text-sm font-semibold text-rose-600 shadow-sm">
            {error}
          </div>
        ) : null}

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<Building2 className="h-5 w-5" />}
            label="Properties"
            value={loading ? "..." : summary.total_properties || 0}
            accent="blue"
          />
          <StatCard
            icon={<Eye className="h-5 w-5" />}
            label="Total Views"
            value={loading ? "..." : summary.total_views || 0}
            accent="amber"
          />
          <StatCard
            icon={<Wallet className="h-5 w-5" />}
            label="Wallet Balance"
            value={loading ? "..." : formatMoney(summary.wallet_balance)}
            accent="green"
          />
          <StatCard
            icon={<CreditCard className="h-5 w-5" />}
            label="Total Income"
            value={loading ? "..." : formatMoney(summary.total_income)}
            accent="slate"
          />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black">Performance Snapshot</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Live aggregate fields from `/api/properties/landlord/dashboard/`.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/owner/properties")}
                  className="text-sm font-black text-[#155BC2]"
                >
                  Manage listings
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <StatCard
                  icon={<Building2 className="h-5 w-5" />}
                  label="Available"
                  value={loading ? "..." : summary.available_properties || 0}
                  accent="green"
                />
                <StatCard
                  icon={<CalendarDays className="h-5 w-5" />}
                  label="Reserved"
                  value={loading ? "..." : summary.reserved_properties || 0}
                  accent="amber"
                />
                <StatCard
                  icon={<CreditCard className="h-5 w-5" />}
                  label="Rented"
                  value={loading ? "..." : summary.rented_properties || 0}
                  accent="blue"
                />
              </div>

              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm font-bold text-slate-600">
                  <span>Booked progress</span>
                  <span>{summary.booked_progress || 0}%</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[#155BC2]"
                    style={{ width: `${summary.booked_progress || 0}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  {summary.booked_units || 0} booked unit(s) · {summary.pending_requests || 0} pending request(s)
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black">Recent Bookings</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Open the related chat or booking flow directly from here.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/owner/bookings")}
                  className="text-sm font-black text-[#155BC2]"
                >
                  View all
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {(dashboard?.recent_bookings || []).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    No booking activity yet.
                  </div>
                ) : (
                  (dashboard?.recent_bookings || []).map((booking) => (
                    <article
                      key={booking.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <h3 className="font-black text-[#091E42]">
                            {booking.tenant_name} · {booking.property_title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {booking.status} · Move-in {formatDate(booking.move_in_date)} · {booking.duration_months} month(s)
                          </p>
                          {booking.message ? (
                            <p className="mt-2 text-sm text-slate-600">
                              {booking.message}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              navigate("/owner/messages", {
                                state: buildDraftChatState({
                                  receiverId: booking.tenant_id,
                                  name: booking.tenant_name,
                                  bookingId: booking.id,
                                  propertyId: booking.property_id,
                                  propertyTitle: booking.property_title,
                                  receiverRole: "Student",
                                }),
                              })
                            }
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Chat
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              navigate("/owner/bookings", {
                                state: { bookingId: String(booking.id) },
                              })
                            }
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#155BC2] px-3 text-xs font-black text-white"
                          >
                            Open booking
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black">Top Listings</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Highest-view properties from your live inventory.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/owner/properties")}
                  className="text-sm font-black text-[#155BC2]"
                >
                  Open
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {(dashboard?.top_properties || []).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    Add your first property to start seeing performance here.
                  </div>
                ) : (
                  (dashboard?.top_properties || []).map((property) => (
                    <button
                      key={property.id}
                      type="button"
                      onClick={() => navigate(`/owner/properties/edit/${property.id}`)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
                    >
                      <img
                        src={property.cover_image}
                        alt={property.title}
                        className="h-16 w-16 rounded-2xl object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-black text-[#091E42]">
                          {property.title}
                        </span>
                        <span className="mt-1 block text-sm text-slate-500">
                          {property.city} · {formatMoney(property.price)}
                        </span>
                        <span className="mt-1 block text-xs font-bold text-slate-400">
                          {property.booking_count || 0} booking(s) · {property.review_count || 0} review(s)
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black">Notifications</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Shared live notification store.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/owner/notifications")}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-[#155BC2]"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount} unread
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {recentNotifications.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    No notifications yet.
                  </div>
                ) : (
                  recentNotifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => openNotification(notification)}
                      className="block w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-black text-[#091E42]">
                          {notification.title}
                        </span>
                        {!notification.read ? (
                          <span className="h-2 w-2 rounded-full bg-[#155BC2]" />
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {notification.desc}
                      </p>
                      <p className="mt-2 text-xs font-bold text-slate-400">
                        {notification.time}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
