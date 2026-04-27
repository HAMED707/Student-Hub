import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import PropertyCard from "../../assets/components/PropertyCard/PropertyCard.jsx";
import { fetchPropertyById, fetchProperties, normalizeProperty } from "../../services/propertyService.js";
import { createBooking } from "../../services/bookingService.js";
import {
  MapPin, Star, Heart, Wifi, Maximize,
  CheckCircle, Wind, Coffee, Utensils, Zap, Droplet,
  Flame, Layout, Monitor, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';

// ── Amenity icon map ──────────────────────────────────────────────────────────
// Maps amenity strings from the backend JSON array to Lucide icons.
const amenityIcons = {
  "WiFi": Wifi, "Wifi": Wifi,
  "AC": Wind, "Air Conditioning": Wind,
  "Kitchen": Utensils,
  "Furnished": Layout,
  "Elevator": Maximize,
  "Study Room": Monitor,
  "Supermarket": Coffee,
  "Water": Droplet,
  "Electricity": Zap,
  "Gas": Flame,
};

const DEFAULT_ICON = CheckCircle;

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab]     = useState("Facilities");

  // ── Property data state ───────────────────────────────────────────────────
  const [property, setProperty]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  // ── Similar properties state ──────────────────────────────────────────────
  const [similar, setSimilar]         = useState([]);

  // ── Active gallery image ──────────────────────────────────────────────────
  const [activeImage, setActiveImage] = useState(0);

  // ── Booking form state ────────────────────────────────────────────────────
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError]     = useState(null);
  const [moveInDate, setMoveInDate]         = useState("");
  const [duration, setDuration]             = useState(1);

  // ── Fetch the property ────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setActiveImage(0);
      try {
        const data = await fetchPropertyById(id);
        setProperty(data);

        // Fetch similar listings from same city in background
        if (data.city) {
          const cityProps = await fetchProperties({ city: data.city });
          // Exclude the current property from similar list
          setSimilar(
            cityProps
              .filter((p) => p.id !== data.id)
              .slice(0, 3)
              .map(normalizeProperty)
          );
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // ── Booking handler ───────────────────────────────────────────────────────
  const handleBooking = async () => {
    setBookingLoading(true);
    setBookingError(null);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.access) {
        navigate("/login");
        return;
      }

      await createBooking({
        property:        property.id,
        move_in_date:    moveInDate,
        duration_months: duration,
      });

      setBookingSuccess(true);
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  // ── Loading screen ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] font-sans">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-10 h-10 text-[#0A2647] animate-spin" />
          <p className="text-gray-500 font-medium">Loading property...</p>
        </div>
      </div>
    );
  }

  // ── Error screen ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] font-sans">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <p className="text-red-500 font-bold text-xl">Could not load property</p>
          <p className="text-gray-500">{error}</p>
          <button
            onClick={() => navigate("/find-room")}
            className="mt-4 bg-[#0A2647] text-white px-6 py-2 rounded-full font-bold"
          >
            Back to listings
          </button>
        </div>
      </div>
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  // Pull images from the nested images array the backend returns
  const images = property.images?.length
    ? property.images.map((img) => img.image)
    : ["https://placehold.co/1200x600/e2e8f0/1e293b?text=No+Images"];

  const landlordName  = property.landlord_name || "Host";
  const landlordImage = property.landlord_picture
    ? property.landlord_picture
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(landlordName)}&background=1A56DB&color=fff&size=128`;

  // Build amenities list from the backend JSON array
  const amenities = Array.isArray(property.amenities) ? property.amenities : [];

  const isAvailable = property.status === "available";

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-20">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-6 max-w-7xl">

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 border-b border-gray-200 pb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-extrabold text-[#091E42] mb-3 leading-tight">
              {property.title}
            </h1>
            <div className="flex items-center text-gray-700 text-base font-medium">
              <MapPin className="w-5 h-5 mr-2 text-black shrink-0" />
              <span className="border-b border-gray-700 pb-0.5">
                {property.address || `${property.city}${property.district ? `, ${property.district}` : ""}`}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end flex-shrink-0">
            <div className="text-base font-medium text-gray-700 mb-3 whitespace-nowrap">
              From
              <span className="text-3xl font-extrabold text-[#0A2647] ml-1">
                EGP {property.price}
              </span>
              <span className="text-xl font-medium text-[#0A2647]">/month</span>
            </div>
            <button
              onClick={() => document.getElementById("booking-sidebar").scrollIntoView({ behavior: "smooth" })}
              className="bg-[#0A2647] text-white px-8 py-3 rounded-xl font-bold text-base hover:bg-[#153a69] shadow-lg transition active:scale-95"
            >
              Select Room
            </button>
          </div>
        </div>

        {/* ── GALLERY ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[400px] mb-8 rounded-2xl overflow-hidden shadow-lg">

          {/* Main image */}
          <div className="md:col-span-2 h-full relative">
            <img
              src={images[activeImage]}
              className="w-full h-full object-cover hover:scale-105 transition duration-700 cursor-pointer"
              alt="main property view"
              onError={(e) => { e.target.src = "https://placehold.co/1200x600/e2e8f0/1e293b?text=No+Image"; }}
            />
            <div className="absolute bottom-4 left-4 flex gap-2 z-10">
              <button className="flex items-center gap-2 bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white transition shadow-lg">
                <CheckCircle className="w-4 h-4" /> View {images.length} Photos
              </button>
              <button className="flex items-center gap-2 bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white transition shadow-lg">
                <MapPin className="w-4 h-4" /> Map View
              </button>
            </div>
          </div>

          {/* Thumbnail grid */}
          <div className="hidden md:flex flex-col gap-4 h-full">
            <img
              src={images[1] || images[0]}
              onClick={() => setActiveImage(1)}
              className="w-full h-[192px] object-cover cursor-pointer hover:opacity-90 transition"
              alt="view 2"
              onError={(e) => { e.target.src = "https://placehold.co/600x400/e2e8f0/1e293b?text=No+Image"; }}
            />
            <img
              src={images[2] || images[0]}
              onClick={() => setActiveImage(2)}
              className="w-full h-[192px] object-cover cursor-pointer hover:opacity-90 transition"
              alt="view 3"
              onError={(e) => { e.target.src = "https://placehold.co/600x400/e2e8f0/1e293b?text=No+Image"; }}
            />
          </div>

          <div className="hidden md:flex flex-col gap-4 h-full">
            <img
              src={images[3] || images[0]}
              onClick={() => setActiveImage(3)}
              className="w-full h-[192px] object-cover cursor-pointer hover:opacity-90 transition"
              alt="view 4"
              onError={(e) => { e.target.src = "https://placehold.co/600x400/e2e8f0/1e293b?text=No+Image"; }}
            />
            <div className="relative h-[192px] cursor-pointer" onClick={() => setActiveImage(4)}>
              <img
                src={images[4] || images[0]}
                className="w-full h-full object-cover"
                alt="view 5"
                onError={(e) => { e.target.src = "https://placehold.co/600x400/e2e8f0/1e293b?text=No+Image"; }}
              />
              {images.length > 5 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">+{images.length - 5} more</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── CONTENT GRID ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-8">

            {/* About */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-[#091E42] mb-4">About this Property</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                {property.description || "No description provided."}
              </p>

              {/* Quick stats row */}
              <div className="flex flex-wrap gap-4 mb-6">
                {[
                  { label: "Beds", value: property.num_beds },
                  { label: "Bathrooms", value: property.num_bathrooms },
                  { label: "Roommates", value: property.num_roommates },
                  property.area_sqm && { label: "Area", value: `${property.area_sqm} m²` },
                  property.floor != null && { label: "Floor", value: property.floor },
                  { label: "Min Stay", value: `${property.min_stay_months} mo` },
                ].filter(Boolean).map((stat) => (
                  <div key={stat.label} className="bg-blue-50 px-4 py-2 rounded-xl text-center">
                    <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                    <p className="text-sm font-bold text-[#091E42]">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Hosted by */}
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <img
                    src={landlordImage}
                    className="w-12 h-12 rounded-full border-2 border-white"
                    alt="landlord"
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(landlordName)}&background=1A56DB&color=fff&size=128`; }}
                  />
                  <div>
                    <p className="text-xs text-gray-500 font-bold">Hosted by</p>
                    <p className="text-sm font-bold text-[#091E42]">{landlordName}</p>
                    {property.owner_is_verified && (
                      <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                </div>
                <button className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 text-gray-700">
                  Send Inquiry
                </button>
              </div>
            </div>

            {/* Tab navigation */}
            <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
              {["Facilities", "Reviews"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition
                    ${activeTab === tab ? "bg-[#0A2647] text-white" : "text-gray-500 hover:bg-gray-100"}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Facilities tab */}
            {activeTab === "Facilities" && (
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h2 className="text-xl font-bold text-[#091E42] mb-4">Facilities & Amenities</h2>
                {amenities.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {amenities.map((name, idx) => {
                      const Icon = amenityIcons[name] || DEFAULT_ICON;
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-2 bg-blue-50 text-[#091E42] px-3 py-2 rounded-lg text-xs font-bold border border-blue-100"
                        >
                          <Icon className="w-4 h-4" /> {name}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No amenities listed.</p>
                )}

                {/* Gender preference & transport */}
                <div className="mt-4 flex flex-wrap gap-3">
                  {property.gender_preference && (
                    <div className="bg-purple-50 text-purple-700 px-3 py-2 rounded-lg text-xs font-bold border border-purple-100">
                      👥 {property.gender_preference.charAt(0).toUpperCase() + property.gender_preference.slice(1)} only
                    </div>
                  )}
                  {property.transport_type && (
                    <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-xs font-bold border border-green-100">
                      🚌 {property.transport_type} to university
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reviews tab */}
            {activeTab === "Reviews" && (
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h2 className="text-xl font-bold text-[#091E42] mb-4">
                  Student Reviews & Ratings
                </h2>
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-4xl font-extrabold text-[#091E42]">
                    {Number(property.average_rating).toFixed(1)}
                  </div>
                  <div>
                    <div className="flex text-yellow-400 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.round(property.average_rating) ? "fill-current" : "text-gray-200"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">{property.review_count} reviews</p>
                  </div>
                </div>
                {/* Reviews are loaded from /api/reviews/ — placeholder for now */}
                <p className="text-gray-500 text-sm">Reviews will appear here once the reviews app is wired.</p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN — Booking sidebar */}
          <div className="lg:col-span-1" id="booking-sidebar">
            <div className="sticky top-24 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">

              {/* Price header */}
              <div className="bg-yellow-50 p-4 rounded-xl text-center mb-4">
                <h3 className="font-bold text-lg text-[#091E42] mb-1">{property.title}</h3>
                <div className="text-sm text-gray-700">
                  From <span className="font-extrabold text-[#091E42]">EGP {property.price}</span> /month
                </div>
              </div>

              {/* Status badge */}
              <div className={`text-center text-xs font-bold py-1 px-3 rounded-full mb-4
                ${isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {isAvailable ? "✓ Available" : "Currently Rented"}
              </div>

              {/* Booking form — only show if available */}
              {isAvailable && !bookingSuccess && (
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Move-in Date</label>
                    <input
                      type="date"
                      value={moveInDate}
                      onChange={(e) => setMoveInDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0A2647]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Duration (months)</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0A2647]"
                    >
                      {[1, 2, 3, 4, 5, 6, 9, 12].map((m) => (
                        <option key={m} value={m}>{m} month{m > 1 ? "s" : ""}</option>
                      ))}
                    </select>
                  </div>
                  {bookingError && (
                    <p className="text-red-500 text-xs font-semibold">{bookingError}</p>
                  )}
                  <button
                    onClick={handleBooking}
                    disabled={bookingLoading || !moveInDate}
                    className="w-full bg-[#0A2647] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#153a69] shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {bookingLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                    ) : "Request Booking"}
                  </button>
                </div>
              )}

              {/* Success state */}
              {bookingSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="font-bold text-green-700">Booking request sent!</p>
                  <p className="text-xs text-green-600 mt-1">The landlord will review your request.</p>
                </div>
              )}

              {/* Rating summary */}
              <div className="bg-blue-50 rounded-xl p-3 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-bold text-[#091E42]">
                    {Number(property.average_rating).toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-blue-600 font-bold">
                  <Heart className="w-4 h-4" /> {property.review_count} reviews
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <MapPin className="w-4 h-4 text-[#091E42] shrink-0" />
                <span>{property.address || `${property.city}${property.district ? `, ${property.district}` : ""}`}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── SIMILAR PROPERTIES ─────────────────────────────────────────── */}
        {similar.length > 0 && (
          <div className="border-t border-gray-200 pt-10 mt-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[#091E42]">Similar properties nearby</h2>
                <p className="text-gray-500 mt-2 text-sm">More options in {property.city}</p>
              </div>
              <button
                onClick={() => navigate("/find-room")}
                className="px-4 py-2 rounded-full border border-gray-300 text-sm font-bold hover:bg-gray-50 transition"
              >
                View All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similar.map((item) => (
                <PropertyCard key={item.id} property={item} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PropertyDetails;
