import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Home,
  RefreshCcw,
  Wallet,
} from "lucide-react";
import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import { fetchMyBookings } from "../../api/bookings.js";
import {
  fetchMyPayments,
  initiateDepositPayment,
  initiateRemainingPaymentOnline,
} from "../../api/payments.js";
import { fetchPropertyDetail } from "../../api/properties.js";
import { getApiErrorMessage } from "../../utils/auth.js";
import {
  formatBookingDate,
  formatMoneyFromCents,
  getStudentStatusMeta,
} from "../../utils/bookings.js";

const PAYMENT_STATUS_META = {
  pending: {
    label: "Pending",
    tone: "bg-amber-100 text-amber-800",
  },
  completed: {
    label: "Completed",
    tone: "bg-emerald-100 text-emerald-800",
  },
  failed: {
    label: "Failed",
    tone: "bg-rose-100 text-rose-700",
  },
  refunded: {
    label: "Refunded",
    tone: "bg-slate-200 text-slate-700",
  },
};

const getPaymentStatusMeta = (status) =>
  PAYMENT_STATUS_META[status] || {
    label: status || "Unknown",
    tone: "bg-slate-100 text-slate-700",
  };

const launchPaymentWindow = (url) => {
  if (!url || typeof window === "undefined") return false;
  const popup = window.open(url, "_blank", "noopener,noreferrer");
  return Boolean(popup);
};

const ActionCard = ({
  title,
  description,
  amount,
  actionLabel,
  onAction,
  busy = false,
  highlighted = false,
  extra,
}) => (
  <article
    className={`rounded-3xl border p-6 shadow-sm transition ${
      highlighted
        ? "border-blue-200 bg-blue-50/60"
        : "border-slate-200 bg-white"
    }`}
  >
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h3 className="text-xl font-black text-[#091E42]">{title}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
          Amount due
        </p>
        <p className="mt-2 text-2xl font-black text-[#155BC2]">
          EGP {amount.toLocaleString("en-US")}
        </p>
      </div>
    </div>

    {extra}

    <div className="mt-5 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onAction}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full bg-[#155BC2] px-6 py-3 text-sm font-black text-white transition hover:bg-[#0f4699] disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        <ExternalLink className="h-4 w-4" />
        {busy ? "Starting payment..." : actionLabel}
      </button>
      <span className="text-xs font-semibold text-slate-500">
        Opens the secure Paymob payment page in a new tab.
      </span>
    </div>
  </article>
);

export default function Payments() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightedBookingId = Number.parseInt(searchParams.get("booking") || "", 10);

  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const loadData = useCallback(async (mode = "initial") => {
    if (mode === "refresh") {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [bookingRows, paymentRows] = await Promise.all([
        fetchMyBookings(),
        fetchMyPayments(),
      ]);

      const propertyIds = [...new Set((bookingRows || []).map((booking) => booking.property))];
      const detailResults = await Promise.allSettled(
        propertyIds.map(async (propertyId) => [propertyId, await fetchPropertyDetail(propertyId)]),
      );

      const propertyMap = new Map(
        detailResults
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value),
      );

      const normalizedBookings = (bookingRows || []).map((booking) => {
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
      });

      const normalizedPayments = (paymentRows || []).map((payment) => {
        const linkedBooking = normalizedBookings.find((booking) => booking.id === payment.booking);
        return {
          ...payment,
          amount: formatMoneyFromCents(payment.amount_cents),
          bookingTitle: linkedBooking?.propertyTitle || `Booking #${payment.booking}`,
          statusMeta: getPaymentStatusMeta(payment.status),
          failureReason: payment.failure_reason || "",
        };
      });

      setBookings(normalizedBookings);
      setPayments(normalizedPayments);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Failed to load payments"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingDepositBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "pending_payment"),
    [bookings],
  );

  const pendingRemainingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "confirmed"),
    [bookings],
  );

  const recentPayments = useMemo(
    () =>
      [...payments].sort(
        (left, right) =>
          new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime(),
      ),
    [payments],
  );

  const highlightedFailedPayment = useMemo(
    () =>
      recentPayments.find(
        (payment) =>
          payment.booking === highlightedBookingId && payment.status === "failed",
      ) || null,
    [highlightedBookingId, recentPayments],
  );

  const stats = useMemo(
    () => ({
      awaitingDeposit: pendingDepositBookings.length,
      awaitingRemaining: pendingRemainingBookings.length,
      completedPayments: payments.filter((payment) => payment.status === "completed").length,
      totalPaid: payments
        .filter((payment) => payment.status === "completed")
        .reduce((sum, payment) => sum + formatMoneyFromCents(payment.amount_cents), 0),
    }),
    [payments, pendingDepositBookings.length, pendingRemainingBookings.length],
  );

  const handleLaunchPayment = useCallback(
    async (booking, paymentType) => {
      const key = `${paymentType}-${booking.id}`;
      setBusyKey(key);
      setError("");
      setSuccess("");

      try {
        const response =
          paymentType === "deposit"
            ? await initiateDepositPayment({ booking_id: booking.id })
            : await initiateRemainingPaymentOnline({ booking_id: booking.id });

        const opened = launchPaymentWindow(response?.iframe_url);

        setSuccess(
          opened
            ? "Payment page opened. Complete the transaction there, then refresh this page."
            : "Payment session created. Allow pop-ups or retry the action if the tab did not open.",
        );

        await loadData("refresh");
      } catch (paymentError) {
        setError(getApiErrorMessage(paymentError, "Unable to start payment"));
      } finally {
        setBusyKey("");
      }
    },
    [loadData],
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#091E42]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <header className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#155BC2]">
                Student payments
              </p>
              <h1 className="mt-1 text-3xl font-black">Deposits & Rental Payments</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                This page is wired to the real backend payment endpoints. Deposits work for
                `pending_payment` bookings, and remaining online payments work after landlord confirmation.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadData("refresh")}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-[#155BC2] hover:text-[#155BC2] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh status
            </button>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Awaiting Deposit</p>
            <p className="mt-2 text-2xl font-black text-amber-600">{stats.awaitingDeposit}</p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Awaiting Remaining</p>
            <p className="mt-2 text-2xl font-black text-blue-600">{stats.awaitingRemaining}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Completed Payments</p>
            <p className="mt-2 text-2xl font-black text-emerald-600">{stats.completedPayments}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Total Paid</p>
            <p className="mt-2 text-2xl font-black text-[#091E42]">EGP {stats.totalPaid.toLocaleString("en-US")}</p>
          </div>
        </section>

        {(error || success) && (
          <section className="mt-6 space-y-3">
            {error && (
              <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}
          </section>
        )}

        {highlightedFailedPayment && (
          <section className="mt-6">
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                Last payment attempt for booking #{highlightedFailedPayment.booking} failed:{" "}
                {highlightedFailedPayment.failureReason || "Payment was declined."}
              </span>
            </div>
          </section>
        )}

        <section className="mt-6 space-y-4">
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <Clock3 className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-500">Loading payment actions...</p>
            </div>
          ) : (
            <>
              {pendingDepositBookings.map((booking) => (
                <ActionCard
                  key={`deposit-${booking.id}`}
                  title={`Pay booking deposit for ${booking.propertyTitle}`}
                  description={`Your booking stays reserved for a limited time. Pay before ${formatBookingDate(
                    booking.expires_at,
                  )} so the landlord can review it.`}
                  amount={formatMoneyFromCents(booking.deposit_amount_cents)}
                  actionLabel="Pay deposit now"
                  onAction={() => handleLaunchPayment(booking, "deposit")}
                  busy={busyKey === `deposit-${booking.id}`}
                  highlighted={booking.id === highlightedBookingId}
                  extra={
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                      <span className={`rounded-full px-3 py-1 font-bold ${booking.statusMeta.bg} ${booking.statusMeta.text}`}>
                        {booking.statusMeta.label}
                      </span>
                      <span>{booking.propertyAddress}</span>
                      <button
                        type="button"
                        onClick={() => navigate(`/property/${booking.propertyId}`)}
                        className="inline-flex items-center gap-1 font-bold text-[#155BC2]"
                      >
                        View property <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </div>
                  }
                />
              ))}

              {pendingRemainingBookings.map((booking) => (
                <ActionCard
                  key={`remaining-${booking.id}`}
                  title={`Pay remaining rent for ${booking.propertyTitle}`}
                  description="The landlord has confirmed your booking. You can now complete the remaining online payment through the live backend flow."
                  amount={formatMoneyFromCents(booking.remaining_amount_cents)}
                  actionLabel="Pay remaining amount"
                  onAction={() => handleLaunchPayment(booking, "remaining")}
                  busy={busyKey === `remaining-${booking.id}`}
                  highlighted={booking.id === highlightedBookingId}
                  extra={
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                      <span className={`rounded-full px-3 py-1 font-bold ${booking.statusMeta.bg} ${booking.statusMeta.text}`}>
                        {booking.statusMeta.label}
                      </span>
                      <span>{booking.propertyAddress}</span>
                      <button
                        type="button"
                        onClick={() => navigate("/bookings")}
                        className="inline-flex items-center gap-1 font-bold text-[#155BC2]"
                      >
                        Open bookings <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </div>
                  }
                />
              ))}

              {pendingDepositBookings.length === 0 && pendingRemainingBookings.length === 0 && (
                <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                  <Wallet className="mx-auto h-12 w-12 text-slate-300" />
                  <h2 className="mt-4 text-2xl font-black">No payment action needed</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    You do not have any booking waiting for deposit or remaining online payment right now.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/find-room")}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#155BC2] px-6 py-3 text-sm font-black text-white transition hover:bg-[#0f4699]"
                  >
                    <Home className="h-4 w-4" />
                    Browse properties
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Payment history</h2>
          <p className="mt-1 text-sm text-slate-500">Live data from `GET /api/payments/my/`.</p>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr className="text-left text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  <th className="px-0 py-3">Booking</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Paid At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {recentPayments.length > 0 ? (
                  recentPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-0 py-4">
                        <div className="font-bold text-[#091E42]">{payment.bookingTitle}</div>
                        <div className="text-xs text-slate-400">Booking #{payment.booking}</div>
                        {payment.failureReason && (
                          <div className="mt-1 text-xs font-semibold text-rose-600">
                            Failure: {payment.failureReason}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 capitalize">{payment.payment_type}</td>
                      <td className="px-4 py-4 capitalize">{payment.payment_method}</td>
                      <td className="px-4 py-4 font-bold text-[#091E42]">
                        EGP {payment.amount.toLocaleString("en-US")}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${payment.statusMeta.tone}`}>
                          {payment.statusMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">{formatBookingDate(payment.paid_at || payment.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-0 py-10 text-center text-sm font-semibold text-slate-400">
                      No payment records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
