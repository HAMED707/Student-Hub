import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  Clock3,
  CreditCard,
  Wallet,
} from "lucide-react";
import { fetchMyProfile } from "../../api/accounts.js";
import { fetchLandlordProperties } from "../../api/properties.js";
import { fetchMyBookings } from "../../api/bookings.js";

const formatMoney = (value) =>
  `EGP ${Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;

const StatCard = ({ title, value, tone = "blue", icon }) => (
  <div
    className={`rounded-2xl border bg-white p-5 shadow-sm ${
      tone === "blue"
        ? "border-blue-100"
        : tone === "green"
          ? "border-emerald-100"
          : tone === "amber"
            ? "border-amber-100"
            : "border-slate-200"
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
          {title}
        </p>
        <p className="mt-2 text-2xl font-black text-[#091E42]">{value}</p>
      </div>
      <div
        className={`grid h-12 w-12 place-items-center rounded-2xl ${
          tone === "blue"
            ? "bg-blue-50 text-blue-600"
            : tone === "green"
              ? "bg-emerald-50 text-emerald-600"
              : tone === "amber"
                ? "bg-amber-50 text-amber-600"
                : "bg-slate-50 text-slate-600"
        }`}
      >
        {icon}
      </div>
    </div>
  </div>
);

export default function OwnerPayments() {
  const [wallet, setWallet] = useState(null);
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadWallet = async () => {
      setLoading(true);
      setError("");

      try {
        const [profile, propertyRows, bookingRows] = await Promise.all([
          fetchMyProfile(),
          fetchLandlordProperties(),
          fetchMyBookings(),
        ]);

        setWallet({
          totalIncome: profile.landlord_profile?.total_income || 0,
          availableBalance: profile.landlord_profile?.available_balance || 0,
        });
        setProperties(propertyRows || []);
        setBookings(bookingRows || []);
      } catch (loadError) {
        setError(loadError.message || "Unable to load owner wallet.");
      } finally {
        setLoading(false);
      }
    };

    loadWallet();
  }, []);

  const stats = useMemo(() => {
    const confirmedBookings = bookings.filter((booking) =>
      ["confirmed", "completed"].includes(booking.status),
    ).length;
    const pendingBookings = bookings.filter(
      (booking) => booking.status === "deposit_paid",
    ).length;

    return {
      confirmedBookings,
      pendingBookings,
      activeListings: properties.filter((property) => property.status === "available")
        .length,
    };
  }, [bookings, properties]);

  return (
    <div className="min-h-screen bg-[#F6F8FC] font-sans text-[#091E42]">
      <main className="mx-auto max-w-7xl px-6 py-8">
        <header className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#155BC2]">
            Owner wallet
          </p>
          <h1 className="mt-1 text-3xl font-black">Payments & Balance</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            This page is now backed by the landlord profile totals in the backend. The current API still exposes detailed payment history only for students, so this owner dashboard shows truthful wallet totals and booking context instead of fake transactions.
          </p>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Available Balance"
            value={loading ? "..." : formatMoney(wallet?.availableBalance)}
            tone="green"
            icon={<Wallet className="h-5 w-5" />}
          />
          <StatCard
            title="Total Income"
            value={loading ? "..." : formatMoney(wallet?.totalIncome)}
            tone="blue"
            icon={<CreditCard className="h-5 w-5" />}
          />
          <StatCard
            title="Confirmed Bookings"
            value={loading ? "..." : stats.confirmedBookings}
            tone="amber"
            icon={<Clock3 className="h-5 w-5" />}
          />
          <StatCard
            title="Active Listings"
            value={loading ? "..." : stats.activeListings}
            tone="slate"
            icon={<Building2 className="h-5 w-5" />}
          />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black">Backend Status</h2>

            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-semibold text-rose-600">
                {error}
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="text-sm font-black text-[#091E42]">
                        Detailed landlord transaction feed is not available yet
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        The current backend exposes `/api/payments/my/` for student-side payments only. Landlord totals are still real here because they come from `landlord_profile.total_income` and `landlord_profile.available_balance`.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <h3 className="text-sm font-black text-[#091E42]">
                    What is live right now
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    <li>- Wallet totals come from the authenticated landlord profile.</li>
                    <li>- Booking counts come from the live landlord bookings endpoint.</li>
                    <li>- Listing counts come from the live landlord properties endpoint.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black">Booking Snapshot</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Pending Review
                </p>
                <p className="mt-2 text-2xl font-black text-amber-600">
                  {loading ? "..." : stats.pendingBookings}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Confirmed / Completed
                </p>
                <p className="mt-2 text-2xl font-black text-emerald-600">
                  {loading ? "..." : stats.confirmedBookings}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Active Listings
                </p>
                <p className="mt-2 text-2xl font-black text-blue-600">
                  {loading ? "..." : stats.activeListings}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
