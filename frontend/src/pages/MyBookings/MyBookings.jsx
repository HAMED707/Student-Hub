import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  Trash2,
} from "lucide-react";
import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import { fetchMyBookings, updateBookingStatus } from "../../api/bookings.js";
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

const StatusBadge = ({ status }) => {
  const config = getStudentStatusMeta(status);

  return (
    <div
      className={`${config.bg} ${config.text} rounded-full px-4 py-2 text-sm font-semibold`}
    >
      {config.label}
    </div>
  );
};

const StatusTimeline = ({ timeline }) => (
  <div className="flex items-center justify-between gap-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-6">
    {timeline.map((item, index) => (
      <div key={item.step} className="flex flex-1 items-center">
        <div className="flex flex-1 flex-col items-center">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
              item.completed
                ? "bg-green-500 text-white"
                : "bg-gray-300 text-gray-600"
            }`}
          >
            {item.completed ? <CheckCircle size={20} /> : index + 1}
          </div>
          <p
            className={`mt-2 text-center text-sm font-semibold ${
              item.completed ? "text-green-600" : "text-gray-500"
            }`}
          >
            {item.step}
          </p>
          {item.date && (
            <p className="mt-1 text-xs text-gray-400">
              {formatBookingDate(item.date)}
            </p>
          )}
        </div>

        {index < timeline.length - 1 && (
          <div
            className={`mx-2 h-1 flex-1 ${
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Review your stay</h3>
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

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusMeta = getStudentStatusMeta(booking.status);
  const canCancel = ["pending_payment", "deposit_paid"].includes(booking.status);
  const canContinuePayment = ["pending_payment", "confirmed"].includes(booking.status);
  const canLeaveReview = Boolean(booking.canReviewProperty);
  const hasReview = Boolean(booking.hasPropertyReview);
  const reviewBlockedUntilStay =
    !hasReview &&
    !canLeaveReview &&
    ["pending_payment", "deposit_paid"].includes(booking.status);

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md transition-shadow duration-200 hover:shadow-lg">
      <div
        id={`student-booking-${booking.id}`}
        className={isHighlighted ? "ring-2 ring-blue-500 ring-offset-2" : ""}
      >
      <div className="flex items-center gap-6 p-6">
        <div
          className="flex-shrink-0 cursor-pointer transition-opacity hover:opacity-80"
          onClick={() => navigate(`/property/${booking.propertyId}`)}
        >
          <img
            src={booking.propertyImage}
            alt={booking.propertyTitle}
            className="h-32 w-48 rounded-lg object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3
            className="mb-3 cursor-pointer text-xl font-bold text-gray-900 transition-colors hover:text-blue-600"
            onClick={() => navigate(`/property/${booking.propertyId}`)}
          >
            {booking.propertyTitle}
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
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
                <strong>Deposit:</strong> {booking.depositAmount.toLocaleString()} EGP
              </span>
            </div>
            <div className="col-span-2 flex items-center gap-2 text-gray-600">
              <MapPin size={16} className="flex-shrink-0 text-blue-500" />
              <span>{booking.propertyAddress}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-shrink-0 flex-col items-end gap-4">
          <StatusBadge status={booking.status} />

          <div className="text-right">
            <p className="text-xs font-semibold text-gray-500">
              {statusMeta.label}
            </p>
            <p className="text-lg font-bold text-gray-900">
              {booking.totalPrice.toLocaleString()} EGP
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {canContinuePayment && (
              <button
                onClick={() => navigate(`/payments?booking=${booking.id}`)}
                className="flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2 text-white transition-colors duration-200 hover:bg-emerald-600"
              >
                <CreditCard size={18} />
                {booking.status === "pending_payment" ? "Pay Deposit" : "Pay Remaining"}
              </button>
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
              <div className="max-w-[220px] text-right text-xs font-medium text-slate-500">
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
            className="flex items-center gap-1 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-800"
          >
            View Details
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <div className="mb-6">
            <h4 className="mb-4 text-lg font-bold text-gray-900">
              Booking Progress
            </h4>
            <StatusTimeline timeline={booking.timeline} />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6">
            <div>
              <h5 className="mb-3 font-semibold text-gray-900">Payment Snapshot</h5>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Total:</strong> {booking.totalPrice.toLocaleString()} EGP
                </p>
                <p>
                  <strong>Deposit:</strong> {booking.depositAmount.toLocaleString()} EGP
                </p>
                <p>
                  <strong>Remaining:</strong> {booking.remainingAmount.toLocaleString()} EGP
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
                className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-600"
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
  <div className="flex flex-col items-center justify-center px-6 py-16">
    <Home size={64} className="mb-4 text-gray-300" />
    <h3 className="mb-2 text-2xl font-bold text-gray-900">No bookings found</h3>
    <p className="mb-6 text-lg text-gray-600">
      You don&apos;t have any {tabName.toLowerCase()} bookings yet.
    </p>
    <button
      onClick={() => navigate("/find-room")}
      className="rounded-lg bg-blue-500 px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-600"
    >
      Explore Properties
    </button>
  </div>
);

export default function MyBookings() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("All");
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
    if (highlightedBookingId) {
      setActiveTab("All");
    }
  }, [highlightedBookingId]);

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
              depositAmount: formatMoneyFromCents(booking.deposit_amount_cents),
              remainingAmount: formatMoneyFromCents(booking.remaining_amount_cents),
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
          <div className="px-6 py-8">
            <h1 className="mb-2 text-4xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-600">
              Track your booking requests and current stay status.
            </p>
          </div>

          <div className="overflow-x-auto border-t border-gray-200 px-6 py-0 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-blue-400">
            <div className="flex gap-2">
              {STUDENT_BOOKING_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap border-b-4 px-6 py-4 text-sm font-semibold transition-all ${
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

        <div className="w-full overflow-y-auto px-6 py-8">
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
                />
              ))}
            </div>
          ) : (
            <EmptyState tabName={activeTab} navigate={navigate} />
          )}
        </div>
      </main>
    </div>
  );
}
