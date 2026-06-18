import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Home,
  Loader2,
  RefreshCcw,
  Wallet,
} from "lucide-react";
import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import { fetchMyBookings } from "../../api/bookings.js";
import { createCheckoutSession } from "../../api/payments.js";
import { fetchPropertyDetail } from "../../api/properties.js";
import { getApiErrorMessage } from "../../utils/auth.js";
import {
  formatBookingDate,
  formatMoneyFromCents,
  getStudentStatusMeta,
} from "../../utils/bookings.js";

export default function Payments() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightedBookingId = Number.parseInt(searchParams.get("booking") || "", 10);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const loadData = useCallback(async (mode = "initial") => {
    if (mode === "refresh") setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const bookingRows = await fetchMyBookings();
      const propertyIds = [...new Set((bookingRows || []).map((b) => b.property))];
      const detailResults = await Promise.allSettled(
        propertyIds.map(async (id) => [id, await fetchPropertyDetail(id)]),
      );
      const propertyMap = new Map(
        detailResults.filter((r) => r.status === "fulfilled").map((r) => r.value),
      );

      setBookings(
        (bookingRows || []).map((booking) => {
          const property = propertyMap.get(booking.property);
          return {
            ...booking,
            propertyId: booking.property,
            propertyTitle: property?.title || `Property #${booking.property}`,
            propertyAddress:
              property?.address ||
              [property?.city, property?.district].filter(Boolean).join(" - ") ||
              "Address not available",
            statusMeta: getStudentStatusMeta(booking.status),
          };
        }),
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load bookings"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const pendingPaymentBookings = useMemo(
    () => bookings.filter((b) => b.status === "pending_payment"),
    [bookings],
  );

  const handlePayNow = async (bookingId) => {
    try {
      setBusyId(bookingId);
      const session = await createCheckoutSession(bookingId);
      window.location.href = session.checkout_url;
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not start payment. Please try again."));
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#091E42]">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-8">
        <header className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#155BC2]">
                Payments
              </p>
              <h1 className="mt-1 text-3xl font-black">Pay for your booking</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Bookings awaiting payment are shown below. You'll be redirected to
                Stripe's secure checkout to complete the transaction.
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadData("refresh")}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-[#155BC2] hover:text-[#155BC2] disabled:opacity-60"
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <section className="mt-6 space-y-4">
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-500">Loading…</p>
            </div>
          ) : pendingPaymentBookings.length > 0 ? (
            pendingPaymentBookings.map((booking) => (
              <article
                key={booking.id}
                className={`rounded-3xl border p-6 shadow-sm transition ${
                  booking.id === highlightedBookingId
                    ? "border-blue-200 bg-blue-50/60"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-[#091E42]">
                      {booking.propertyTitle}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">{booking.propertyAddress}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                      <span className={`rounded-full px-3 py-1 font-bold ${booking.statusMeta.bg} ${booking.statusMeta.text}`}>
                        {booking.statusMeta.label}
                      </span>
                      <span>Duration: {booking.duration_months} month(s)</span>
                      <span>Move-in: {formatBookingDate(booking.move_in_date)}</span>
                      {booking.expires_at && (
                        <span className="text-amber-600 font-bold">
                          Expires: {formatBookingDate(booking.expires_at)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                      Deposit due
                    </p>
                    <p className="mt-1 text-2xl font-black text-[#155BC2]">
                      {formatMoneyFromCents(booking.total_amount_cents).toLocaleString()} EGP
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handlePayNow(booking.id)}
                    disabled={busyId === booking.id}
                    className="inline-flex items-center gap-2 rounded-full bg-[#155BC2] px-6 py-3 text-sm font-black text-white transition hover:bg-[#0f4699] disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {busyId === booking.id
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting…</>
                      : <><CreditCard className="h-4 w-4" /> Pay Now</>
                    }
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/property/${booking.propertyId}`)}
                    className="inline-flex items-center gap-1 text-sm font-bold text-[#155BC2] hover:underline"
                  >
                    View property <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <Wallet className="mx-auto h-12 w-12 text-slate-300" />
              <h2 className="mt-4 text-2xl font-black">No payments pending</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                All your bookings are paid or you have no active bookings.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/bookings")}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm font-black text-slate-700 transition hover:border-[#155BC2] hover:text-[#155BC2]"
                >
                  <CheckCircle2 className="h-4 w-4" /> My Bookings
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/find-room")}
                  className="inline-flex items-center gap-2 rounded-full bg-[#155BC2] px-6 py-3 text-sm font-black text-white transition hover:bg-[#0f4699]"
                >
                  <Home className="h-4 w-4" /> Browse properties
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
