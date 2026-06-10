import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageCircle,
  FileText,
  CreditCard,
  Home,
  Trash2,
  Bed,
  Mail,
  Phone,
  Globe,
  Facebook,
  Instagram,
  Twitter,
} from "lucide-react";
import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import logoFull from "../../assets/brand/icons/logo.svg";

// Mock data
const MOCK_BOOKINGS = [
  {
    id: "BK-001",
    propertyTitle: "Cozy Studio Near Campus",
    propertyImage:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
    moveInDate: "2026-06-15",
    duration: "12 months",
    totalPrice: 7200,
    currency: "EGP",
    roomType: "Studio",
    bedType: "1 Single Bed",
    status: "Pending",
    bookingDate: "2026-05-01",
    landlordName: "John Smith",
    propertyAddress: "123 University Ave, Boston, MA",
    timeline: [
      { step: "Submitted", completed: true, date: "2026-05-01" },
      { step: "Reviewing", completed: false, date: null },
      { step: "Approved", completed: false, date: null },
      { step: "Paid", completed: false, date: null },
    ],
  },
  {
    id: "BK-002",
    propertyTitle: "Modern 2-Bedroom Apartment",
    propertyImage:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop",
    moveInDate: "2026-07-01",
    duration: "12 months",
    totalPrice: 12000,
    currency: "EGP",
    roomType: "Master Bedroom",
    bedType: "1 Double Bed",
    status: "Approved",
    bookingDate: "2026-04-20",
    landlordName: "Sarah Johnson",
    propertyAddress: "456 College Street, Boston, MA",
    timeline: [
      { step: "Submitted", completed: true, date: "2026-04-20" },
      { step: "Reviewing", completed: true, date: "2026-04-25" },
      { step: "Approved", completed: true, date: "2026-05-01" },
      { step: "Paid", completed: false, date: null },
    ],
  },
  {
    id: "BK-003",
    propertyTitle: "Shared House with Garden",
    propertyImage:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
    moveInDate: "2026-05-15",
    duration: "6 months",
    totalPrice: 4800,
    currency: "EGP",
    roomType: "Shared Room",
    bedType: "1 Single Bed (Shared)",
    status: "Active",
    bookingDate: "2026-03-10",
    landlordName: "Michael Chen",
    propertyAddress: "789 Student Lane, Boston, MA",
    timeline: [
      { step: "Submitted", completed: true, date: "2026-03-10" },
      { step: "Reviewing", completed: true, date: "2026-03-15" },
      { step: "Approved", completed: true, date: "2026-03-20" },
      { step: "Paid", completed: true, date: "2026-04-01" },
    ],
  },
  {
    id: "BK-004",
    propertyTitle: "Luxury Penthouse Suite",
    propertyImage:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop",
    moveInDate: "2026-03-01",
    duration: "3 months",
    totalPrice: 6000,
    currency: "EGP",
    roomType: "Penthouse Suite",
    bedType: "2 Double Beds + Sofa",
    status: "Cancelled",
    bookingDate: "2026-02-15",
    landlordName: "Emma Wilson",
    propertyAddress: "321 Elite Ave, Boston, MA",
    timeline: [
      { step: "Submitted", completed: true, date: "2026-02-15" },
      { step: "Reviewing", completed: true, date: "2026-02-20" },
      { step: "Approved", completed: true, date: "2026-02-25" },
      { step: "Paid", completed: false, date: null },
    ],
  },
  {
    id: "BK-005",
    propertyTitle: "Cozy Single Room",
    propertyImage:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
    moveInDate: "2026-08-01",
    duration: "12 months",
    totalPrice: 5400,
    currency: "EGP",
    roomType: "Single Room",
    bedType: "1 Single Bed",
    status: "Pending",
    bookingDate: "2026-05-03",
    landlordName: "David Brown",
    propertyAddress: "555 Dorm Street, Boston, MA",
    timeline: [
      { step: "Submitted", completed: true, date: "2026-05-03" },
      { step: "Reviewing", completed: false, date: null },
      { step: "Approved", completed: false, date: null },
      { step: "Paid", completed: false, date: null },
    ],
  },
];

const FILTER_TABS = ["All", "Pending", "Approved", "Active", "Cancelled"];

// StatusBadge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    Pending: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      icon: AlertCircle,
    },
    Approved: {
      bg: "bg-green-100",
      text: "text-green-800",
      icon: CheckCircle,
    },
    Active: {
      bg: "bg-green-100",
      text: "text-green-800",
      icon: CheckCircle,
    },
    Cancelled: {
      bg: "bg-red-100",
      text: "text-red-800",
      icon: XCircle,
    },
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <div
      className={`${config.bg} ${config.text} px-4 py-2 rounded-full flex items-center gap-2 font-semibold text-sm`}
    >
      <IconComponent size={18} />
      <span>{status}</span>
    </div>
  );
};

// CTAButton Component
const CTAButton = ({ status, bookingId, navigate, onAction }) => {
  const buttonConfig = {
    Pending: {
      label: "Cancel Request",
      bgColor: "bg-red-500",
      hoverColor: "hover:bg-red-600",
      action: "cancel",
      onClick: () => {
        if (confirm("Are you sure you want to cancel this booking request?")) {
          onAction("delete", bookingId);
        }
      },
    },
    Approved: {
      label: "Pay Now",
      bgColor: "bg-green-500",
      hoverColor: "hover:bg-green-600",
      action: "pay",
      onClick: () => navigate("/payments", { state: { bookingId } }),
    },
    Active: {
      label: "View Contract",
      bgColor: "bg-blue-500",
      hoverColor: "hover:bg-blue-600",
      action: "contract",
      onClick: () => navigate(`/booking/${bookingId}`),
    },
    Cancelled: {
      label: "Book Again",
      bgColor: "bg-gray-500",
      hoverColor: "hover:bg-gray-600",
      action: "rebook",
      onClick: () => navigate("/find-room"),
    },
  };

  const config = buttonConfig[status];

  return (
    <button
      onClick={config.onClick}
      className={`${config.bgColor} ${config.hoverColor} text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2`}
    >
      {status === "Pending" && <Trash2 size={18} />}
      {status === "Approved" && <CreditCard size={18} />}
      {status === "Active" && <FileText size={18} />}
      {status === "Cancelled" && <Home size={18} />}
      {config.label}
    </button>
  );
};

// StatusTimeline Component
const StatusTimeline = ({ timeline }) => {
  return (
    <div className="flex items-center justify-between gap-4 py-6 px-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
      {timeline.map((item, index) => (
        <div key={index} className="flex items-center flex-1">
          {/* Timeline Step */}
          <div className="flex flex-col items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                item.completed
                  ? "bg-green-500 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              {item.completed ? <CheckCircle size={20} /> : index + 1}
            </div>
            <p
              className={`text-sm font-semibold mt-2 ${item.completed ? "text-green-600" : "text-gray-500"}`}
            >
              {item.step}
            </p>
            {item.date && (
              <p className="text-xs text-gray-400 mt-1">
                {new Date(item.date).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Connector Line */}
          {index < timeline.length - 1 && (
            <div
              className={`flex-1 h-1 mx-2 ${
                timeline[index + 1].completed ? "bg-green-500" : "bg-gray-300"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// BookingCard Component
const BookingCard = ({ booking, navigate, onAction }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden mb-4">
      {/* Main Card Content */}
      <div className="flex items-center gap-6 p-6">
        {/* Left: Property Image */}
        <div
          className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate(`/property/${booking.id}`)}
        >
          <img
            src={booking.propertyImage}
            alt={booking.propertyTitle}
            className="w-48 h-32 object-cover rounded-lg"
          />
        </div>

        {/* Middle: Property Details */}
        <div className="flex-1 min-w-0">
          <h3
            className="text-xl font-bold text-gray-900 mb-3 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => navigate(`/property/${booking.id}`)}
          >
            {booking.propertyTitle}
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <FileText size={16} className="text-blue-500 flex-shrink-0" />
              <span>
                <strong>ID:</strong> {booking.id}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={16} className="text-blue-500 flex-shrink-0" />
              <span>
                <strong>Move-in:</strong>{" "}
                {new Date(booking.moveInDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock size={16} className="text-blue-500 flex-shrink-0" />
              <span>
                <strong>Duration:</strong> {booking.duration}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <DollarSign size={16} className="text-green-500 flex-shrink-0" />
              <span>
                <strong>Total:</strong> {booking.totalPrice.toLocaleString()}{" "}
                {booking.currency}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Bed size={16} className="text-purple-500 flex-shrink-0" />
              <span>
                <strong>Room:</strong> {booking.roomType}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Bed size={16} className="text-purple-500 flex-shrink-0" />
              <span>
                <strong>Bed:</strong> {booking.bedType}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Status & CTA */}
        <div className="flex flex-col items-end gap-4 flex-shrink-0">
          <StatusBadge status={booking.status} />
          <CTAButton
            status={booking.status}
            bookingId={booking.id}
            navigate={navigate}
            onAction={onAction}
          />
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors"
          >
            View Details
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Expandable Section */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          {/* Status Timeline */}
          <div className="mb-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4">
              Booking Progress
            </h4>
            <StatusTimeline timeline={booking.timeline} />
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-2 gap-6 mt-6">
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">
                Property Address
              </h5>
              <div className="flex items-start gap-2 text-gray-600">
                <MapPin
                  size={16}
                  className="text-blue-500 mt-1 flex-shrink-0"
                />
                <p>{booking.propertyAddress}</p>
              </div>
            </div>
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Contact Host</h5>
              <p className="text-gray-600 font-medium mb-3">
                {booking.landlordName}
              </p>
              <button
                onClick={() =>
                  navigate("/messages", {
                    state: {
                      landlordId: booking.id,
                      landlordName: booking.landlordName,
                    },
                  })
                }
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                <MessageCircle size={16} />
                Chat with Host
              </button>
            </div>
          </div>

          {/* Booking Date Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Booking Date:</strong>{" "}
              {new Date(booking.bookingDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// EmptyState Component
const EmptyState = ({ tabName, navigate }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <Home size={64} className="text-gray-300 mb-4" />
      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        No bookings found
      </h3>
      <p className="text-gray-600 text-lg mb-6">
        You don't have any {tabName.toLowerCase()} bookings yet.
      </p>
      <button
        onClick={() => navigate("/find-room")}
        className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
      >
        Explore Properties
      </button>
    </div>
  );
};

// Main Component
export default function MyBookings() {
  const [activeTab, setActiveTab] = useState("All");
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);
  const navigate = useNavigate();

  // Handle booking actions (delete, etc.)
  const handleBookingAction = (action, bookingId) => {
    if (action === "delete") {
      // Remove booking from list
      setBookings(bookings.filter((b) => b.id !== bookingId));
      console.log(`Booking ${bookingId} has been cancelled and removed`);
    } else {
      console.log(`Action: ${action} for booking ${bookingId}`);
    }
  };

  // Filter bookings based on active tab
  const filteredBookings =
    activeTab === "All"
      ? bookings
      : bookings.filter((booking) => booking.status === activeTab);

  return (
    <div
      className="min-h-screen bg-gray-50 font-sans text-[#0A2647]"
      style={{ scrollBehavior: "smooth" }}
    >
      <Navbar />

      {/* Main Content */}
      <main className="w-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              My Bookings
            </h1>
            <p className="text-gray-600">
              Manage and track all your accommodation bookings
            </p>
          </div>

          {/* Filter Tabs - Sticky Navigation */}
          <div className="border-t border-gray-200 px-6 py-0 overflow-x-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-100">
            <div className="flex gap-2">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 font-semibold text-sm transition-all border-b-4 whitespace-nowrap ${
                    activeTab === tab
                      ? "border-blue-500 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab}
                  {tab !== "All" && (
                    <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs font-bold">
                      {bookings.filter((b) => b.status === tab).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="w-full px-6 py-8 overflow-y-auto">
          {filteredBookings.length > 0 ? (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  navigate={navigate}
                  onAction={handleBookingAction}
                />
              ))}
            </div>
          ) : (
            <EmptyState tabName={activeTab} navigate={navigate} />
          )}
        </div>
      </main>

      {/* Footer */}
      {Boolean(import.meta.env.VITE_SHOW_LEGACY_FOOTER) && (
      <footer className="bg-[#091E42] px-4 py-12 text-white">
        <div className="mx-auto grid w-full max-w-[1500px] gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <img
              src={logoFull}
              alt="StudentHub"
              className="h-12 w-auto rounded-lg bg-white px-3 py-2"
            />
            <p className="mt-4 text-sm leading-6 text-white/70">
              Find trusted student accommodation near universities across Egypt.
            </p>
            <div className="mt-6 flex gap-3">
              {[Facebook, Instagram, Twitter].map((Icon, index) => (
                <a
                  key={index}
                  href="https://studenthub.com"
                  target="_blank"
                  rel="noreferrer"
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
                  aria-label="Social link"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-extrabold">Quick Links</h3>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/70">
              <button
                type="button"
                onClick={() => navigate("/home")}
                className="text-left transition hover:text-white"
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => navigate("/find-room")}
                className="text-left transition hover:text-white"
              >
                Find Room
              </button>
              <button
                type="button"
                onClick={() => navigate("/my-bookings")}
                className="text-left transition hover:text-white"
              >
                My Bookings
              </button>
              <button
                type="button"
                onClick={() => navigate("/favorites")}
                className="text-left transition hover:text-white"
              >
                Favorites
              </button>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-extrabold">Contact</h3>
            <div className="mt-5 space-y-4 text-sm text-white/70">
              <p className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#A0C4FF]" />{" "}
                support@studenthub.com
              </p>
              <p className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-[#A0C4FF]" /> +20 100 000 0000
              </p>
              <p className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-[#A0C4FF]" /> www.studenthub.com
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-extrabold">Newsletter</h3>
            <p className="mt-4 text-sm leading-6 text-white/70">
              Get new rooms and student offers in your inbox.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="h-11 rounded-xl border border-white/10 bg-white/10 px-4 text-sm text-white outline-none placeholder:text-white/50"
              />
              <button
                type="button"
                className="h-11 rounded-xl bg-[#155BC2] text-sm font-bold transition hover:bg-[#0f4699]"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 flex w-full max-w-[1500px] flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/55 md:flex-row md:items-center md:justify-between">
          <p>© 2026 StudentHub. All rights reserved.</p>
          <div className="flex gap-5">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
}
