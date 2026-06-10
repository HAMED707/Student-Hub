import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Check,
  Clock3,
  MessageSquare,
  Search,
  User,
  X,
} from "lucide-react";

const cx = (...classes) => classes.filter(Boolean).join(" ");

const initialBookings = [
  {
    id: "b1",
    student: "Ahmed Khaled",
    property: "Shared Room - Nasr City",
    room: "Room A3",
    date: "12 March 2025",
    status: "Accepted",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "b2",
    student: "Mona Ali",
    property: "Luxury Apartment - Zamalek",
    room: "Room B2",
    date: "15 March 2025",
    status: "Pending",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "b3",
    student: "Salah K.",
    property: "Studio Near Cairo University",
    room: "Room C1",
    date: "18 March 2025",
    status: "Pending",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
  },
];

const statusStyle = {
  Accepted: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Pending: "bg-amber-50 text-amber-700 border-amber-100",
  Rejected: "bg-rose-50 text-rose-700 border-rose-100",
};

const StatusBadge = ({ status }) => (
  <span className={cx("rounded-full border px-3 py-1 text-xs font-bold", statusStyle[status] || "bg-slate-50 text-slate-600 border-slate-100")}>
    {status}
  </span>
);

export default function OwnerBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState(initialBookings);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredBookings = useMemo(() => {
    const search = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchesSearch =
        !search ||
        booking.student.toLowerCase().includes(search) ||
        booking.property.toLowerCase().includes(search) ||
        booking.room.toLowerCase().includes(search);
      const matchesStatus = statusFilter === "All" || booking.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, query, statusFilter]);

  const setStatus = (id, status) => {
    setBookings((current) => current.map((booking) => (booking.id === id ? { ...booking, status } : booking)));
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] font-sans text-[#091E42]">
      <main className="mx-auto max-w-7xl px-6 py-8">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#155BC2]">Owner bookings</p>
            <h1 className="mt-1 text-2xl font-black">Student Booking Requests</h1>
            <p className="mt-1 text-sm text-slate-500">Review student requests and keep each booking status updated.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-blue-50 px-4 py-3">
              <p className="text-lg font-black text-[#155BC2]">{bookings.length}</p>
              <p className="text-[11px] font-bold text-slate-500">Total</p>
            </div>
            <div className="rounded-xl bg-amber-50 px-4 py-3">
              <p className="text-lg font-black text-amber-700">{bookings.filter((b) => b.status === "Pending").length}</p>
              <p className="text-[11px] font-bold text-slate-500">Pending</p>
            </div>
            <div className="rounded-xl bg-emerald-50 px-4 py-3">
              <p className="text-lg font-black text-emerald-700">{bookings.filter((b) => b.status === "Accepted").length}</p>
              <p className="text-[11px] font-bold text-slate-500">Accepted</p>
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
                placeholder="Search bookings, student, property..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] pl-11 pr-4 text-sm outline-none transition focus:border-[#155BC2] focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </label>
            <div className="flex gap-2 overflow-x-auto">
              {["All", "Pending", "Accepted", "Rejected"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={cx(
                    "h-10 shrink-0 rounded-xl border px-4 text-sm font-bold transition",
                    statusFilter === status
                      ? "border-[#155BC2] bg-[#155BC2] text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-[#155BC2]/40 hover:bg-blue-50",
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
            {filteredBookings.length === 0 ? (
              <div className="grid place-items-center py-16 text-center">
                <CalendarDays className="h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-500">No bookings match your filters.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredBookings.map((booking) => (
                  <article key={booking.id} className="flex flex-col gap-4 bg-white p-4 transition hover:bg-[#F8FAFC] lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <img src={booking.avatar} alt={booking.student} className="h-12 w-12 rounded-full object-cover" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-[#091E42]">{booking.student}</h3>
                          <StatusBadge status={booking.status} />
                        </div>
                        <p className="mt-1 text-sm font-semibold text-slate-600">{booking.property}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock3 className="h-3.5 w-3.5" /> {booking.room} • Move-in {booking.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => navigate(`/owner/messages?student=${booking.id}`)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50">
                        <MessageSquare className="h-4 w-4" /> Message
                      </button>
                      <button type="button" onClick={() => navigate(`/profile/${booking.id}`)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50">
                        <User className="h-4 w-4" /> Profile
                      </button>
                      {booking.status === "Pending" && (
                        <>
                          <button type="button" onClick={() => setStatus(booking.id, "Rejected")} className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 text-xs font-bold text-rose-700 transition hover:bg-rose-100">
                            <X className="h-4 w-4" /> Reject
                          </button>
                          <button type="button" onClick={() => setStatus(booking.id, "Accepted")} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#155BC2] px-3 text-xs font-bold text-white transition hover:bg-[#0f4ca3]">
                            <Check className="h-4 w-4" /> Accept
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
