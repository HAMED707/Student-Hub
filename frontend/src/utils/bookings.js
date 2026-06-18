export const STUDENT_BOOKING_TABS = [
  "All",
  "Awaiting Payment",
  "Paid",
  "Finished",
  "Cancelled",
  "Expired",
];

export const STUDENT_STATUS_META = {
  pending_payment: {
    label: "Awaiting Payment",
    bg: "bg-amber-100",
    text: "text-amber-800",
  },
  paid: {
    label: "Paid",
    bg: "bg-blue-100",
    text: "text-blue-800",
  },
  finished: {
    label: "Finished",
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
      step: "Paid",
      completed: ["paid", "finished"].includes(status),
      date: ["paid", "finished"].includes(status) ? updatedDate : null,
    },
    {
      step: "Finished",
      completed: status === "finished",
      date: status === "finished" ? updatedDate : null,
    },
  ];
};

export const matchesStudentBookingTab = (booking, activeTab) => {
  if (activeTab === "All") return true;
  return getStudentStatusMeta(booking.status).label === activeTab;
};
