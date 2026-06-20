import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  FileText,
  Home,
  MapPin,
  MessageCircle,
  QrCode,
  Trash2,
  X,
} from "lucide-react";
import QRCode from "react-qr-code";
import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import { fetchMyBookings, updateBookingStatus } from "../../api/bookings.js";
import { createCheckoutSession, createRemainingCheckoutSession } from "../../api/payments.js";
import { fetchPropertyDetail } from "../../api/properties.js";
import { createPropertyReview } from "../../api/reviews.js";
import {
  buildBookingTimeline,
  formatBookingDate,
  formatMoneyFromCents,
  getStudentStatusMeta,
  matchesStudentBookingTab,
  STUDENT_BOOKING_TABS,
} from "../../utils/bookings.js";
import { getApiErrorMessage } from "../../utils/auth.js";
import { buildDraftChatState } from "../../utils/messaging.js";
import { withApiUrl } from "../../api/client.js";
import { notifyPropertyReviewCreated } from "../../utils/reviews.js";

const QrModal = ({ booking, onClose }) => {
  if (!booking) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-2 sm:p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl sm:rounded-3xl sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-[#091E42]">Check-in QR Code</h3>
            <p className="text-xs text-slate-500 mt-0.5">Show this to your landlord at move-in</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 transition">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="flex justify-center rounded-2xl border border-slate-100 bg-white p-3 [&>svg]:h-auto [&>svg]:max-w-full sm:p-4">
          <QRCode value={booking.qrToken} size={220} />
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 p-3 space-y-1 text-sm">
          <p className="font-bold text-[#091E42] truncate">{booking.propertyTitle}</p>
          <p className="text-slate-500 text-xs">Booking #{booking.id} · Move-in {formatBookingDate(booking.moveInDate)}</p>
        </div>

        <p className="mt-3 text-center text-xs text-slate-400">
          Your landlord scans this to confirm check-in and release the payout.
        </p>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const config = getStudentStatusMeta(status);

  return (
    <div
      className={`${config.bg} ${config.text} w-fit whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold`}
    >
      {config.label}
    </div>
  );
};

const StatusTimeline = ({ timeline }) => (
  <div className="flex flex-col gap-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-6">
    {timeline.map((item, index) => (
      <div key={item.step} className="flex min-w-0 flex-1 items-center">
        <div className="flex min-w-0 flex-1 items-center sm:flex-col sm:justify-center">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all sm:h-10 sm:w-10 ${
              item.completed
                ? "bg-green-500 text-white"
                : "bg-gray-300 text-gray-600"
            }`}
          >
            {item.completed ? <CheckCircle size={20} /> : index + 1}
          </div>
          <div className="ml-3 min-w-0 sm:ml-0">
            <p
              className={`text-sm font-semibold sm:mt-2 sm:text-center ${
                item.completed ? "text-green-600" : "text-gray-500"
              }`}
            >
              {item.step}
            </p>
            {item.date && (
              <p className="mt-0.5 text-xs text-gray-400 sm:mt-1 sm:text-center">
                {formatBookingDate(item.date)}
              </p>
            )}
          </div>
        </div>

        {index < timeline.length - 1 && (
          <div
            className={`mx-2 hidden h-1 flex-1 sm:block ${
              timeline[index + 1].completed ? "bg-green-500" : "bg-gray-300"
            }`}
          />
        )}
      </div>
    ))}
  </div>
);

const PROPERTY_REVIEW_ROLES = [
  { value: "landlord", label: "Tenant reviewing landlord/property" },
  { value: "roommate", label: "Roommate context" },
  { value: "classmate", label: "Classmate context" },
  { value: "neighbor", label: "Neighbor context" },
];

const ReviewModal = ({
  booking,
  form,
  error,
  success,
  submitting,
  onChange,
  onClose,
  onSubmit,
}) => {
  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 p-2 sm:p-4">
      <div className="max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 sm:text-2xl">Review your stay</h3>
            <p className="mt-1 text-sm text-gray-600">
              Submit feedback for {booking.propertyTitle} using booking #{booking.id}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
          >
            Close
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Rating
              </label>
              <select
                value={form.rating}
                onChange={(event) => onChange("rating", event.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900"
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} star{value > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Reviewer Role
              </label>
              <select
                value={form.reviewer_role}
                onChange={(event) =>
                  onChange("reviewer_role", event.target.value)
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900"
              >
                {PROPERTY_REVIEW_ROLES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
              Comment
            </label>
            <textarea
              value={form.comment}
              onChange={(event) => onChange("comment", event.target.value)}
              rows={5}
              maxLength={800}
              placeholder="How was the property, host, and overall stay?"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900"
            />
          </div>

          {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
          {success && <p className="text-sm font-medium text-emerald-600">{success}</p>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BookingCard = ({
  booking,
  isHighlighted,
  navigate,
  onCancel,
  onOpenReview,
  onShowQr,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [payingNow, setPayingNow] = useState(false);
  const [payingRemaining, setPayingRemaining] = useState(false);
  const statusMeta = getStudentStatusMeta(booking.status);
  const canCancel = booking.status === "pending_payment";
  const canContinuePayment = booking.status === "pending_payment";
  const canLeaveReview = Boolean(booking.canReviewProperty);
  const hasReview = Boolean(booking.hasPropertyReview);
  const reviewBlockedUntilStay =
    !hasReview &&
    !canLeaveReview &&
    booking.status === "pending_payment";
  const canPayRemaining =
    booking.remainingPaymentRequested &&
    !booking.remainingPaid &&
    booking.remainingAmountEgp > 0;

  const handlePayNow = async () => {
    try {
      setPayingNow(true);
      const session = await createCheckoutSession(booking.id);
      window.location.href = session.checkout_url;
    } catch {
      setPayingNow(false);
    }
  };

  const handlePayRemaining = async () => {
    try {
      setPayingRemaining(true);
      const session = await createRemainingCheckoutSession(booking.id);
      window.location.href = session.checkout_url;
    } catch {
      setPayingRemaining(false);
    }
  };

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md transition-shadow duration-200 hover:shadow-lg">
      <div
        id={`student-booking-${booking.id}`}
        className={isHighlighted ? "ring-2 ring-blue-500 ring-offset-2" : ""}
      >
      <div className="flex flex-col gap-4 p-3 sm:p-5 lg:flex-row lg:items-center lg:gap-6 lg:p-6">
        <div
          className="w-full flex-shrink-0 cursor-pointer transition-opacity hover:opacity-80 sm:w-auto"
          onClick={() => navigate(`/property/${booking.propertyId}`)}
        >
          <img
            src={booking.propertyImage}
            alt={booking.propertyTitle}
            className="h-48 w-full rounded-xl object-cover sm:h-32 sm:w-48 sm:rounded-lg"
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3
            className="mb-3 break-words text-lg font-bold text-gray-900 transition-colors hover:text-blue-600 sm:cursor-pointer sm:text-xl"
            onClick={() => navigate(`/property/${booking.propertyId}`)}
          >
            {booking.propertyTitle}
          </h3>
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2 text-gray-600">
              <FileText size={16} className="flex-shrink-0 text-blue-500" />
              <span>
                <strong>ID:</strong> {booking.id}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={16} className="flex-shrink-0 text-blue-500" />
              <span>
                <strong>Move-in:</strong> {formatBookingDate(booking.moveInDate)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock size={16} className="flex-shrink-0 text-blue-500" />
              <span>
                <strong>Duration:</strong> {booking.durationMonths} months
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <CreditCard size={16} className="flex-shrink-0 text-green-500" />
              <span>
                <strong>Deposit (20%):</strong> {booking.totalPrice.toLocaleString()} EGP
              </span>
            </div>
            <div className="flex min-w-0 items-start gap-2 text-gray-600 sm:col-span-2 sm:items-center">
              <MapPin size={16} className="flex-shrink-0 text-blue-500" />
              <span className="min-w-0 break-words">{booking.propertyAddress}</span>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-shrink-0 flex-col items-stretch gap-3 border-t border-gray-100 pt-4 lg:w-auto lg:items-end lg:border-0 lg:pt-0">
          <StatusBadge status={booking.status} />

          <div className="text-left lg:text-right">
            <p className="text-xs font-semibold text-gray-500">
              {statusMeta.label}
            </p>
            <p className="text-lg font-bold text-gray-900">
              {booking.totalPrice.toLocaleString()} EGP
            </p>
          </div>

          <div className="flex w-full flex-col items-stretch gap-2 [&>button]:justify-center [&>button]:text-center lg:items-end">
            {canContinuePayment && (
              <button
                onClick={handlePayNow}
                disabled={payingNow}
                className="flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2 text-white transition-colors duration-200 hover:bg-emerald-600 disabled:opacity-60"
              >
                <CreditCard size={18} />
                {payingNow ? "Redirecting…" : "Pay Now"}
              </button>
            )}

            {booking.status === "paid" && booking.qrToken && (
              <button
                onClick={() => onShowQr(booking)}
                className="flex items-center gap-2 rounded-lg bg-[#155BC2] px-6 py-2 text-white transition-colors duration-200 hover:bg-[#0f4699]"
              >
                <QrCode size={18} />
                Show QR Code
              </button>
            )}

            {canPayRemaining && (
              <button
                onClick={handlePayRemaining}
                disabled={payingRemaining}
                className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-2 text-white transition-colors duration-200 hover:bg-purple-700 disabled:opacity-60"
              >
                <CreditCard size={18} />
                {payingRemaining ? "Redirecting…" : `Pay Remaining (EGP ${booking.remainingAmountEgp.toLocaleString()})`}
              </button>
            )}

            {booking.remainingPaid && (
              <span className="flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm font-bold text-emerald-700">
                <CheckCircle size={16} /> Fully Paid
              </span>
            )}

            {canLeaveReview && (
              <button
                onClick={() => onOpenReview(booking)}
                className="flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-2 text-white transition-colors duration-200 hover:bg-amber-600"
              >
                <FileText size={18} />
                Leave Review
              </button>
            )}

            {hasReview && (
              <div className="rounded-lg bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
                Review Submitted
              </div>
            )}

            {reviewBlockedUntilStay && (
              <div className="max-w-none text-left text-xs font-medium text-slate-500 lg:max-w-[220px] lg:text-right">
                Review opens after the booking becomes confirmed or completed.
              </div>
            )}

            {canCancel ? (
              <button
                onClick={() => onCancel(booking.id)}
                className="flex items-center gap-2 rounded-lg bg-red-500 px-6 py-2 text-white transition-colors duration-200 hover:bg-red-600"
              >
                <Trash2 size={18} />
                Cancel Request
              </button>
            ) : (
              <button
                onClick={() => navigate(`/property/${booking.propertyId}`)}
                className="flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors duration-200 hover:bg-blue-600"
              >
                <Home size={18} />
                View Property
              </button>
            )}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 self-start text-sm font-semibold text-blue-600 transition-colors hover:text-blue-800 lg:self-auto"
          >
            View Details
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-3 sm:p-6">
          <div className="mb-6">
            <h4 className="mb-4 text-lg font-bold text-gray-900">
              Booking Progress
            </h4>
            <StatusTimeline timeline={booking.timeline} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h5 className="mb-3 font-semibold text-gray-900">Payment Snapshot</h5>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Deposit (20%):</strong> {booking.totalPrice.toLocaleString()} EGP
                </p>
                <p>
                  <strong>Status:</strong> {statusMeta.label}
                </p>
                {booking.expiresAt && (
                  <p>
                    <strong>Expires:</strong> {formatBookingDate(booking.expiresAt)}
                  </p>
                )}
              </div>
            </div>
            <div>
              <h5 className="mb-3 font-semibold text-gray-900">Review Status</h5>
              <div className="mb-5 space-y-2 text-sm text-gray-600">
                {booking.canReviewProperty ? (
                  <p>You can now leave a property review for this stay.</p>
                ) : booking.hasPropertyReview ? (
                  <p>Your property review has already been submitted.</p>
                ) : (
                  <p>Property review becomes available once the stay is confirmed or completed.</p>
                )}
              </div>
              <h5 className="mb-3 font-semibold text-gray-900">Contact Host</h5>
              <p className="mb-3 font-medium text-gray-600">{booking.landlordName}</p>
              <button
                onClick={() =>
                  navigate("/messages", {
                    state: buildDraftChatState({
                      receiverId: booking.landlordId,
                      name: booking.landlordName,
                      bookingId: booking.id,
                      propertyId: booking.propertyId,
                      propertyTitle: booking.propertyTitle,
                      receiverRole: "Host",
                    }),
                  })
                }
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-600 sm:w-auto"
              >
                <MessageCircle size={16} />
                Chat with Host
              </button>
            </div>
          </div>

          {booking.message && (
            <div className="mt-6 rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-gray-700">
                <strong>Booking Note:</strong> {booking.message}
              </p>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

const EmptyState = ({ tabName, navigate }) => (
  <div className="flex flex-col items-center justify-center px-3 py-12 text-center sm:px-6 sm:py-16">
    <Home size={52} className="mb-4 text-gray-300 sm:h-16 sm:w-16" />
    <h3 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">No bookings found</h3>
    <p className="mb-6 text-base text-gray-600 sm:text-lg">
      You don&apos;t have any {tabName.toLowerCase()} bookings yet.
    </p>
    <button
      onClick={() => navigate("/find-room")}
      className="w-full rounded-lg bg-blue-500 px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-600 sm:w-auto"
    >
      Explore Properties
    </button>
  </div>
);

export default function MyBookings() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("All");
  const [paymentBanner, setPaymentBanner] = useState(null); // "success" | "cancelled" | null
  const [qrBooking, setQrBooking] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    reviewer_role: "landlord",
    comment: "",
  });
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const highlightedBookingId = location.state?.bookingId
    ? String(location.state.bookingId)
    : "";

  useEffect(() => {
    if (highlightedBookingId) setActiveTab("All");
  }, [highlightedBookingId]);

  // Handle Stripe redirect back (/bookings?payment=success or /bookings/5?payment=success)
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success" || payment === "cancelled") {
      setPaymentBanner(payment);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    let cancelled = false;

    const loadBookings = async () => {
      setLoading(true);
      setError("");

      try {
        const rows = await fetchMyBookings();
        const propertyIds = [...new Set((rows || []).map((booking) => booking.property))];
        const detailResults = await Promise.allSettled(
          propertyIds.map(async (propertyId) => [
            propertyId,
            await fetchPropertyDetail(propertyId),
          ]),
        );

        if (cancelled) return;

        const propertyMap = new Map(
          detailResults
            .filter((result) => result.status === "fulfilled")
            .map((result) => result.value),
        );

        setBookings(
          (rows || []).map((booking) => {
            const property = propertyMap.get(booking.property);

            return {
              id: booking.id,
              propertyId: booking.property,
              propertyTitle: property?.title || `Property #${booking.property}`,
              propertyImage: property?.images?.[0]?.image
                ? withApiUrl(property.images[0].image)
                : "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
              moveInDate: booking.move_in_date,
              durationMonths: booking.duration_months,
              totalPrice: formatMoneyFromCents(booking.total_amount_cents),
              remainingAmountEgp: formatMoneyFromCents(booking.remaining_amount_cents),
              remainingPaymentRequested: Boolean(booking.remaining_payment_requested),
              remainingPaid: Boolean(booking.remaining_paid),
              status: booking.status,
              expiresAt: booking.expires_at,
              bookingDate: booking.created_at,
              landlordName: property?.landlord_name || "Host",
              landlordId: property?.landlord_id || null,
              propertyAddress:
                property?.address ||
                [property?.city, property?.district].filter(Boolean).join(" - ") ||
                "Address not available",
              message: booking.message || "",
              qrToken: booking.qr_token || null,
              timeline: buildBookingTimeline(booking),
              canReviewProperty: Boolean(booking.can_review_property),
              hasPropertyReview: Boolean(booking.has_property_review),
              propertyReviewId: booking.property_review_id || null,
            };
          }),
        );
      } catch (loadError) {
        if (!cancelled) {
          setError(getApiErrorMessage(loadError, "Failed to load bookings"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadBookings();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking request?")) {
      return;
    }

    const previous = bookings;

    setBookings((current) =>
      current.map((booking) =>
        booking.id === bookingId
          ? {
              ...booking,
              status: "cancelled",
              timeline: buildBookingTimeline({ ...booking, status: "cancelled" }),
            }
          : booking,
      ),
    );

    try {
      await updateBookingStatus(bookingId, "cancelled");
    } catch (cancelError) {
      setBookings(previous);
      setError(getApiErrorMessage(cancelError, "Failed to cancel booking"));
    }
  };

  const openReviewModal = (booking) => {
    setReviewTarget(booking);
    setReviewError("");
    setReviewSuccess("");
    setReviewForm({
      rating: 5,
      reviewer_role: "landlord",
      comment: "",
    });
  };

  const closeReviewModal = () => {
    if (submittingReview) return;
    setReviewTarget(null);
    setReviewError("");
    setReviewSuccess("");
  };

  const handleReviewFieldChange = (field, value) => {
    if (reviewError) setReviewError("");
    if (reviewSuccess) setReviewSuccess("");
    setReviewForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();

    if (!reviewTarget) return;

    try {
      setSubmittingReview(true);
      setReviewError("");
      setReviewSuccess("");

      await createPropertyReview(reviewTarget.propertyId, {
        booking_id: reviewTarget.id,
        rating: Number(reviewForm.rating),
        reviewer_role: reviewForm.reviewer_role,
        comment: reviewForm.comment.trim(),
      });

      setBookings((current) =>
        current.map((booking) =>
          booking.id === reviewTarget.id
            ? {
                ...booking,
                canReviewProperty: false,
                hasPropertyReview: true,
              }
            : booking,
        ),
      );
      notifyPropertyReviewCreated(reviewTarget.propertyId);
      setReviewSuccess("Review submitted successfully. The booking is now marked as reviewed.");
    } catch (submitError) {
      setReviewError(getApiErrorMessage(submitError, "Failed to submit property review"));
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredBookings = useMemo(
    () => bookings.filter((booking) => matchesStudentBookingTab(booking, activeTab)),
    [activeTab, bookings],
  );

  useEffect(() => {
    if (!highlightedBookingId || loading) return;

    const element = document.getElementById(
      `student-booking-${highlightedBookingId}`,
    );
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [filteredBookings.length, highlightedBookingId, loading]);

  return (
    <div
      className="min-h-screen bg-gray-50 font-sans text-[#0A2647]"
      style={{ scrollBehavior: "smooth" }}
    >
      <Navbar />
      <ReviewModal
        booking={reviewTarget}
        form={reviewForm}
        error={reviewError}
        success={reviewSuccess}
        submitting={submittingReview}
        onChange={handleReviewFieldChange}
        onClose={closeReviewModal}
        onSubmit={handleSubmitReview}
      />

      <main className="w-full">
        <div className="border-b border-gray-200 bg-white">
          <div className="px-4 py-6 sm:px-6 sm:py-8">
            <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-4xl">My Bookings</h1>
            <p className="text-gray-600">
              Track your booking requests and current stay status.
            </p>
          </div>

          <div className="no-scrollbar overflow-x-auto border-t border-gray-200 px-3 py-0 sm:px-6">
            <div className="flex gap-2">
              {STUDENT_BOOKING_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap border-b-4 px-4 py-3 text-sm font-semibold transition-all sm:px-6 sm:py-4 ${
                    activeTab === tab
                      ? "border-blue-500 bg-blue-50 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab}
                  {tab !== "All" && (
                    <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-bold text-gray-700">
                      {
                        bookings.filter(
                          (booking) => getStudentStatusMeta(booking.status).label === tab,
                        ).length
                      }
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-8">
          {paymentBanner === "success" && (
            <div className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-700 sm:px-4">
              <div className="flex min-w-0 items-start gap-3">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span>Payment confirmed! Your booking is now active. The landlord will be notified.</span>
              </div>
              <button type="button" onClick={() => setPaymentBanner(null)} className="shrink-0 text-emerald-500 hover:text-emerald-700">✕</button>
            </div>
          )}
          {paymentBanner === "cancelled" && (
            <div className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm font-semibold text-amber-700 sm:px-4">
              <div className="flex min-w-0 items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>Payment was cancelled. Your booking is still reserved — click "Pay Now" to try again.</span>
              </div>
              <button type="button" onClick={() => setPaymentBanner(null)} className="shrink-0 text-amber-500 hover:text-amber-700">✕</button>
            </div>
          )}
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
              <Clock className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-bold text-gray-500">
                Loading your bookings...
              </p>
            </div>
          ) : filteredBookings.length > 0 ? (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  isHighlighted={String(booking.id) === highlightedBookingId}
                  navigate={navigate}
                  onCancel={handleCancelBooking}
                  onOpenReview={openReviewModal}
                  onShowQr={setQrBooking}
                />
              ))}
            </div>
          ) : (
            <EmptyState tabName={activeTab} navigate={navigate} />
          )}
        </div>
      </main>

      <QrModal booking={qrBooking} onClose={() => setQrBooking(null)} />
    </div>
  );
}
