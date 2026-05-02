import React, { useMemo, useState } from "react";
import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import {
  CalendarCheck,
  CheckCircle2,
  Clock3,
  CreditCard,
  Home,
  MessageSquare,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

const bookings = [
  {
    id: "BK-2048",
    property: "Modern Studio - Nasr City",
    address: "Nasr City, Cairo",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    owner: "Ahmed Hassan",
    moveIn: "May 18, 2026",
    rent: "EGP 3,200 / month",
    status: "approved",
    paid: true,
    nextAction: "Pay deposit before May 7",
    updatedAt: "Today, 10:20 AM",
    steps: ["Request sent", "Owner review", "Approved", "Deposit"],
    currentStep: 2,
  },
  {
    id: "BK-2031",
    property: "Cozy Room - Dokki",
    address: "Dokki, Giza",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
    owner: "Mona Adel",
    moveIn: "June 1, 2026",
    rent: "EGP 1,800 / month",
    status: "pending",
    paid: false,
    nextAction: "Waiting for owner confirmation",
    updatedAt: "Yesterday, 8:15 PM",
    steps: ["Request sent", "Owner review", "Approved", "Deposit"],
    currentStep: 1,
  },
  {
    id: "BK-1995",
    property: "Furnished Apartment - El Hamra",
    address: "El Hamra, Cairo",
    image: "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80",
    owner: "Youssef Ali",
    moveIn: "April 20, 2026",
    rent: "EGP 2,500 / month",
    status: "completed",
    paid: true,
    nextAction: "Booking completed",
    updatedAt: "Apr 22, 2026",
    steps: ["Request sent", "Owner review", "Approved", "Deposit"],
    currentStep: 3,
  },
  {
    id: "BK-1988",
    property: "Shared Room - Maadi",
    address: "Maadi, Cairo",
    image: "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=800&q=80",
    owner: "Karim Nabil",
    moveIn: "April 12, 2026",
    rent: "EGP 2,100 / month",
    status: "cancelled",
    paid: false,
    nextAction: "Request was cancelled",
    updatedAt: "Apr 10, 2026",
    steps: ["Request sent", "Owner review", "Approved", "Deposit"],
    currentStep: 1,
  },
];

const statusConfig = {
  all: { label: "All", color: "bg-slate-100 text-slate-700", icon: CalendarCheck },
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: Clock3 },
  approved: { label: "Approved", color: "bg-blue-100 text-blue-700", icon: ShieldCheck },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: XCircle },
};

const filters = ["all", "pending", "approved", "completed", "cancelled"];

const Booking = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState(bookings[0].id);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesFilter = activeFilter === "all" || booking.status === activeFilter;
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !query ||
        booking.property.toLowerCase().includes(query) ||
        booking.address.toLowerCase().includes(query) ||
        booking.id.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, searchTerm]);

  const selectedBooking =
    filteredBookings.find((booking) => booking.id === selectedBookingId) || filteredBookings[0] || bookings[0];

  const summary = {
    total: bookings.length,
    pending: bookings.filter((booking) => booking.status === "pending").length,
    approved: bookings.filter((booking) => booking.status === "approved").length,
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-12 font-sans">
      <Navbar />

      <main className="container mx-auto px-4 py-8 md:px-8">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.14em] text-[#155BC2]">Student bookings</p>
            <h1 className="text-3xl font-extrabold text-[#091E42] md:text-4xl">Track your booking requests</h1>
            <p className="mt-2 max-w-2xl text-gray-500">
              Follow every housing request from review to deposit confirmation.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="px-4 py-2">
              <p className="text-xs font-semibold text-gray-500">Total</p>
              <p className="text-2xl font-extrabold text-[#091E42]">{summary.total}</p>
            </div>
            <div className="px-4 py-2">
              <p className="text-xs font-semibold text-gray-500">Pending</p>
              <p className="text-2xl font-extrabold text-amber-600">{summary.pending}</p>
            </div>
            <div className="px-4 py-2">
              <p className="text-xs font-semibold text-gray-500">Approved</p>
              <p className="text-2xl font-extrabold text-blue-600">{summary.approved}</p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by booking, room, or location"
              className="w-full rounded-xl bg-gray-50 py-3 pl-12 pr-4 text-sm text-gray-700 outline-none ring-1 ring-gray-200 transition focus:bg-white focus:ring-[#155BC2]"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {filters.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
                    isActive ? "bg-[#0A2647] text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {statusConfig[filter].label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.85fr]">
          <section className="space-y-4">
            {filteredBookings.map((booking) => {
              const config = statusConfig[booking.status];
              const StatusIcon = config.icon;
              const isSelected = selectedBooking.id === booking.id;

              return (
                <button
                  key={booking.id}
                  onClick={() => setSelectedBookingId(booking.id)}
                  className={`w-full overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                    isSelected ? "border-[#155BC2] ring-2 ring-blue-100" : "border-gray-200"
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-[190px_1fr]">
                    <img src={booking.image} alt={booking.property} className="h-48 w-full object-cover md:h-full" />

                    <div className="p-5">
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-gray-400">{booking.id}</p>
                          <h2 className="mt-1 text-xl font-extrabold text-[#091E42]">{booking.property}</h2>
                          <p className="mt-1 text-sm font-medium text-gray-500">{booking.address}</p>
                        </div>
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${config.color}`}>
                          <StatusIcon className="h-4 w-4" />
                          {config.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 text-sm text-gray-600 sm:grid-cols-3">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-[#155BC2]" />
                          <span>{booking.rent}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarCheck className="h-4 w-4 text-[#155BC2]" />
                          <span>{booking.moveIn}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-[#155BC2]" />
                          <span>{booking.paid ? "Payment recorded" : "Payment pending"}</span>
                        </div>
                      </div>

                      <div className="mt-5">
                        <div className="mb-2 flex justify-between text-xs font-bold text-gray-500">
                          <span>{booking.nextAction}</span>
                          <span>{booking.updatedAt}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {booking.steps.map((step, index) => {
                            const isDone = index <= booking.currentStep && booking.status !== "cancelled";
                            return (
                              <div key={step} className="min-w-0">
                                <div className={`h-2 rounded-full ${isDone ? "bg-[#155BC2]" : "bg-gray-200"}`} />
                                <p className="mt-2 truncate text-xs font-semibold text-gray-500">{step}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredBookings.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                <CalendarCheck className="mx-auto h-10 w-10 text-gray-300" />
                <h2 className="mt-4 text-lg font-bold text-gray-800">No bookings found</h2>
                <p className="mt-1 text-sm text-gray-500">Try another status or search keyword.</p>
              </div>
            )}
          </section>

          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm xl:sticky xl:top-6">
            <div className="flex items-start gap-4">
              <img src={selectedBooking.image} alt={selectedBooking.property} className="h-20 w-20 rounded-xl object-cover" />
              <div>
                <p className="text-xs font-bold text-gray-400">{selectedBooking.id}</p>
                <h2 className="text-xl font-extrabold text-[#091E42]">{selectedBooking.property}</h2>
                <p className="text-sm font-medium text-gray-500">{selectedBooking.address}</p>
              </div>
            </div>

            <div className="mt-6 space-y-3 border-t border-gray-100 pt-5">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-gray-500">Owner</span>
                <span className="font-bold text-gray-800">{selectedBooking.owner}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-gray-500">Move-in date</span>
                <span className="font-bold text-gray-800">{selectedBooking.moveIn}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-gray-500">Rent</span>
                <span className="font-bold text-gray-800">{selectedBooking.rent}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-gray-500">Last update</span>
                <span className="font-bold text-gray-800">{selectedBooking.updatedAt}</span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-blue-50 p-4">
              <p className="text-sm font-bold text-[#0A2647]">Current action</p>
              <p className="mt-1 text-sm text-blue-700">{selectedBooking.nextAction}</p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <button className="flex items-center justify-center gap-2 rounded-xl bg-[#155BC2] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0f4699]">
                <MessageSquare className="h-4 w-4" />
                Message owner
              </button>
              <button className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50">
                View property
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Booking;
