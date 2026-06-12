export const STUDENT_BOOKING_TABS = [
  "All",
  "Awaiting Payment",
  "Pending Review",
  "Confirmed",
  "Completed",
  "Cancelled",
];

export const STUDENT_STATUS_META = {
  pending_payment: {
    label: "Awaiting Payment",
    bg: "bg-amber-100",
    text: "text-amber-800",
  },
  deposit_paid: {
    label: "Pending Review",
    bg: "bg-blue-100",
    text: "text-blue-800",
  },
  confirmed: {
    label: "Confirmed",
    bg: "bg-green-100",
    text: "text-green-800",
  },
  completed: {
    label: "Completed",
    bg: "bg-emerald-100",
    text: "text-emerald-800",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-red-100",
    text: "text-red-800",
  },
  expired: {
    label: "Expired",
    bg: "bg-slate-200",
    text: "text-slate-700",
  },
};

export const getStudentStatusMeta = (status) =>
  STUDENT_STATUS_META[status] || {
    label: status || "Unknown",
    bg: "bg-slate-100",
    text: "text-slate-700",
  };

export const formatMoneyFromCents = (amountCents) =>
  Math.round(Number(amountCents || 0) / 100);

export const formatBookingDate = (value) => {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return date.toLocaleDateString();
};

export const buildBookingTimeline = (booking) => {
  const status = booking.status;
  const createdDate = booking.created_at || booking.bookingDate || null;
  const updatedDate = booking.updated_at || booking.bookingDate || null;

  return [
    {
      step: "Requested",
      completed: true,
      date: createdDate,
    },
    {
      step: "Deposit Paid",
      completed: ["deposit_paid", "confirmed", "completed"].includes(status),
      date: ["deposit_paid", "confirmed", "completed"].includes(status)
        ? updatedDate
        : null,
    },
    {
      step: "Confirmed",
      completed: ["confirmed", "completed"].includes(status),
      date: ["confirmed", "completed"].includes(status) ? updatedDate : null,
    },
    {
      step: "Completed",
      completed: status === "completed",
      date: status === "completed" ? updatedDate : null,
    },
  ];
};

export const matchesStudentBookingTab = (booking, activeTab) => {
  if (activeTab === "All") return true;
  return getStudentStatusMeta(booking.status).label === activeTab;
};
