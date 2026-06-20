import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUp,
  Loader2,
  BadgeCheck,
  Banknote,
  Bath,
  Bed,
  Building2,
  Bus,
  CalendarDays,
  Camera,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Droplet,
  Dumbbell,
  ExternalLink,
  Flame,
  GraduationCap,
  Heart,
  Home,
  Hospital,
  IdCard,
  Landmark,
  LocateFixed,
  MapPin,
  MessageSquare,
  Monitor,
  Navigation,
  Phone,
  Pill,
  Ruler,
  Search,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Snowflake,
  Star,
  User,
  Users,
  Users2,
  Utensils,
  Wifi,
  Wind,
  X,
  Zap,
} from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import PropertyCard from "../../assets/components/PropertyCard/PropertyCard.jsx";
import { fetchProperties, fetchPropertyDetail } from "../../api/properties.js";
import { fetchPropertyReviews } from "../../api/reviews.js";
import { fetchMyProfile } from "../../api/accounts.js";
import { createBooking } from "../../api/bookings.js";
import { createCheckoutSession } from "../../api/payments.js";
import { fetchNearbyPlaces } from "../../api/services.js";
import { useFavorites } from "../../hooks/useFavorites.js";
import { useGlobalMessaging } from "../../context/messagingContext.js";
import {
  isPropertyAvailable,
  normalizePropertyCard,
  normalizePropertyDetail,
} from "../../utils/properties.js";
import { TRANSPORT_OPTIONS } from "../../utils/propertyConstants.js";
import {
  consumePropertyReviewUpdate,
  PROPERTY_REVIEW_CREATED_EVENT,
} from "../../utils/reviews.js";
import {
  getApiErrorMessage,
  getStoredUser,
} from "../../utils/auth.js";
import { buildDraftChatState } from "../../utils/messaging.js";

// ── Fallback data (used when API is unavailable) ──────────────────────────────
const propertyData = {
  id: 1,
  title: "Cozy room near Cairo University",
  price: 2500,
  deposit: 500,
  serviceFee: 150,
  address: "Khalifa Al Maamon Street, Abbasiya, Cairo",
  lat: 30.0731,
  lng: 31.2838,
  rating: 4.7,
  reviewCount: 28,
  distance: "14 mins from university",
  description:
    "A modern, fully furnished student home with private and shared room options near major universities. The apartment includes fast Wi-Fi, quiet study spaces, secure access, and flexible booking options for students.",
  landlord: {
    name: "Mohamed Ahmed",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    response: "Usually replies within 2 hours",
    isVerified: false,
    isTopRated: false,
  },
  images: [
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&q=80",
    "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1200&q=80",
    "https://images.unsplash.com/photo-1522771753035-4850d32f7041?w=1200&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80",
    "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80",
  ],
  rooms: [
    {
      id: "room-a",
      name: "Room A",
      type: "Private room",
      price: 3200,
      status: "AVAILABLE",
      capacity: 1,
      beds: [{ id: "room-a-private", name: "Private room", status: "AVAILABLE", price: 3200 }],
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80",
    },
    {
      id: "room-b",
      name: "Room B",
      type: "Twin room",
      price: 2500,
      status: "AVAILABLE",
      capacity: 2,
      beds: [
        { id: "bed-b1", name: "Bed B1", status: "AVAILABLE", price: 2500 },
        { id: "bed-b2", name: "Bed B2", status: "BOOKED", price: 2500 },
      ],
      image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&q=80",
    },
    {
      id: "room-c",
      name: "Room C",
      type: "Shared room",
      price: 1900,
      status: "AVAILABLE",
      capacity: 3,
      beds: [
        { id: "bed-c1", name: "Bed C1", status: "AVAILABLE", price: 1900 },
        { id: "bed-c2", name: "Bed C2", status: "AVAILABLE", price: 1900 },
        { id: "bed-c3", name: "Bed C3", status: "BOOKED", price: 1900 },
      ],
      image: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600&q=80",
    },
  ],
  services: [
    { name: "High-speed Wi-Fi", icon: Wifi },
    { name: "Air conditioning", icon: Snowflake },
    { name: "Study area", icon: Monitor },
    { name: "Equipped kitchen", icon: Utensils },
    { name: "Secure building", icon: ShieldCheck },
    { name: "Maintenance support", icon: Wind },
  ],
  bills: [
    { name: "Water", icon: Droplet, included: true },
    { name: "Electricity", icon: Zap, included: false },
    { name: "Gas", icon: Flame, included: true },
    { name: "Internet", icon: Wifi, included: true },
  ],
  reviews: [
    {
      id: 1,
      user: "Kim Jhone",
      date: "March 2026",
      rating: 5,
      text: "The room was clean, the building felt safe, and the commute to campus was simple.",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    {
      id: 2,
      user: "Ruri Kyla",
      date: "February 2026",
      rating: 4,
      text: "Good location and helpful landlord. The shared kitchen was well maintained.",
      avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    },
    {
      id: 3,
      user: "Ahmed Nabil",
      date: "January 2026",
      rating: 5,
      text: "The booking was clear and the room matched the photos. Great for students.",
      avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    },
  ],
  numRooms: 3,
  numBeds: 4,
  numBathrooms: 2,
  propertyType: "apartment",
  genderPreference: "",
  nearbyUniversity: "Cairo University",
  distanceToUniversity: "14 min walk",
  transportTypes: ["walk"],
  minStayMonths: 3,
  maxStayMonths: 12,
  status: "available",
  isAvailable: true,
};

const similarProperties = [
  {
    id: 101,
    title: "Furnished Apartment - El Hamra",
    location: "Cairo - El Hamra",
    distance: "10 mins from university",
    city: "Cairo",
    roommates: 2,
    price: 2500,
    rating: 4.5,
    reviews: 10,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
    availabilityStatus: "available",
  },
  {
    id: 102,
    title: "Modern Studio - Dokki",
    location: "Giza - Dokki",
    distance: "Walking distance",
    city: "Giza",
    roommates: 1,
    price: 2800,
    rating: 4.8,
    reviews: 15,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    availabilityStatus: "available",
  },
  {
    id: 103,
    title: "Shared Room - Nasr City",
    location: "Cairo - Nasr City",
    distance: "5 mins by bus",
    city: "Cairo",
    roommates: 3,
    price: 1900,
    rating: 4.2,
    reviews: 8,
    image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80",
    availabilityStatus: "booked",
  },
  {
    id: 104,
    title: "Private Room - Zamalek",
    location: "Cairo - Zamalek",
    distance: "12 mins from campus",
    city: "Cairo",
    roommates: 1,
    price: 3600,
    rating: 4.7,
    reviews: 18,
    image: "https://images.unsplash.com/photo-1501183638710-841dd1904471?w=800&q=80",
    availabilityStatus: "available",
  },
];

// ── Nearby services configuration ─────────────────────────────────────────────
const SERVICE_CATEGORIES = [
  { id: "supermarket", label: "Supermarkets", icon: ShoppingCart },
  { id: "restaurant",  label: "Restaurants",  icon: Coffee },
  { id: "hospital",    label: "Hospitals",    icon: Hospital },
  { id: "pharmacy",    label: "Pharmacies",   icon: Pill },
  { id: "mosque",      label: "Mosques",      icon: Landmark },
  { id: "bus_station", label: "Bus Stations", icon: Bus },
  { id: "gym",         label: "GYM",          icon: Dumbbell },
  { id: "atm",         label: "ATM",          icon: Banknote },
];

function NearbyMapController({ activePlace, propertyCenter }) {
  const map = useMap();

  useEffect(() => {
    const resizeMap = () => map.invalidateSize({ pan: false });
    const frame = window.requestAnimationFrame(resizeMap);
    const container = map.getContainer();
    const observer = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(resizeMap)
      : null;

    observer?.observe(container);
    window.addEventListener("resize", resizeMap);

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", resizeMap);
    };
  }, [map]);

  useEffect(() => {
    if (activePlace) {
      map.flyTo([activePlace.lat, activePlace.lng], 16, { animate: true, duration: 1 });
    } else {
      map.flyTo(propertyCenter, 14, { animate: true, duration: 0.6 });
    }
  }, [activePlace, map, propertyCenter]);
  return null;
}

const normalizePlaces = (payload) =>
  (payload?.results || []).map((p) => ({
    id: p.id || `${p.latitude}-${p.longitude}`,
    name: p.name,
    lat: Number(p.latitude),
    lng: Number(p.longitude),
    hours:
      p.open_now == null
        ? "Hours unavailable"
        : p.open_now
          ? "Open now"
          : "Currently closed",
    address: p.address || "Address unavailable",
    rating: p.rating ? `${p.rating}/5` : "No rating",
    distance: p.distance_m ? `${p.distance_m} m away` : "",
  }));

// ── Icon maps ──────────────────────────────────────────────────────────────────
const DETAIL_ICON_MAP = {
  wifi: Wifi,
  snowflake: Snowflake,
  utensils: Utensils,
  shield: ShieldCheck,
  wind: Wind,
  home: Home,
  droplet: Droplet,
  monitor: Monitor,
  check: CheckCircle,
  zap: Zap,
  flame: Flame,
};

// ── Leaflet map pin factory ────────────────────────────────────────────────────
const createPin = (color = "#155BC2") =>
  L.divIcon({
    html: `<div class="details-map-pin" style="background:${color}"><span></span></div>`,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -34],
  });

const mapIcon     = createPin("#155BC2");
const userLocIcon = createPin("#10B981");

// ── Generate fallback similar properties ──────────────────────────────────────
const generateProperties = () => {
  const images = [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1522771753035-4850d32f7041?auto=format&fit=crop&w=800&q=80",
  ];
  const locations = [
    { city: "Cairo", area: "Maadi" },
    { city: "Cairo", area: "Zamalek" },
    { city: "Giza", area: "Dokki" },
    { city: "Cairo", area: "Nasr City" },
    { city: "New Cairo", area: "5th Settlement" },
    { city: "Giza", area: "6th October" },
  ];
  const typesList = ["Studio", "Apartment", "Private Room", "Shared Room"];

  return Array.from({ length: 24 }, (_, i) => {
    const loc = locations[i % locations.length];
    const type = typesList[i % typesList.length];
    return {
      id: i,
      title: `${type === "Shared Room" || type === "Private Room" ? "Cozy" : "Modern"} ${type} in ${loc.area}`,
      location: `${loc.city} - ${loc.area}`,
      city: loc.city,
      area: loc.area,
      universityDistance: `${5 + (i % 20)} mins`,
      distance: `${5 + (i % 20)} mins`,
      campusMinutes: 5 + (i % 20),
      price: 1500 + (i % 10) * 200,
      rating: 3.5 + (i % 5) * 0.3,
      reviews: 4 + (i % 20),
      roommates: i % 4,
      image: images[i % images.length],
      availabilityStatus: i % 5 === 0 ? "booked" : "available",
      isAvailable: i % 5 !== 0,
      amenities: [],
      lat: 30.0444 + (i * 0.003),
      lng: 31.2357 + (i * 0.003),
      createdAt: Date.now() - i * 86400000,
      description: "",
      images: [images[i % images.length]],
      type,
    };
  });
};

// ── Sub-components ────────────────────────────────────────────────────────────
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[#F8FAFC] font-sans">
    <div className="animate-pulse">
      <div className="h-16 bg-slate-200" />
      <div className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-6">
        <div className="h-8 w-2/3 rounded bg-slate-200" />
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="h-[420px] rounded-3xl bg-slate-200" />
          <div className="h-[420px] rounded-3xl bg-slate-200" />
        </div>
        <div className="h-[600px] rounded-2xl bg-slate-200" />
      </div>
    </div>
  </div>
);

const NotFoundState = ({ navigate }) => (
  <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4 font-sans">
    <div className="max-w-md rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-blue-50">
        <Home className="h-10 w-10 text-[#155BC2]" />
      </div>
      <h2 className="text-2xl font-black text-[#091E42]">Property not found</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">The property you&apos;re looking for doesn&apos;t exist or has been removed.</p>
      <button type="button" onClick={() => navigate("/find-room")} className="mt-6 rounded-full bg-[#155BC2] px-8 py-3 text-sm font-bold text-white transition hover:bg-[#0f4699]">
        Browse Properties
      </button>
    </div>
  </div>
);

const Stars = ({ value, size = "h-4 w-4" }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }, (_, index) => (
      <Star key={index} className={`${size} ${index < Math.round(value) ? "fill-[#F59E0B] text-[#F59E0B]" : "text-slate-300"}`} />
    ))}
  </div>
);

const SectionTitle = ({ title, subtitle }) => (
  <div className="mb-3">
    <h2 className="text-lg font-black text-[#091E42]">{title}</h2>
    {subtitle && <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">{subtitle}</p>}
  </div>
);

const getRoomStatus = (room) => {
  const availableBeds = room.beds.filter((b) => b.status === "AVAILABLE").length;
  if (availableBeds === 0) return { label: "Fully Booked", className: "bg-rose-50 text-rose-700 border-rose-100" };
  if (availableBeds <= 1 && room.beds.length > 1) return { label: "Few Beds Left", className: "bg-amber-50 text-amber-700 border-amber-100" };
  return { label: "Available", className: "bg-emerald-50 text-emerald-700 border-emerald-100" };
};

// ── Property type labels ───────────────────────────────────────────────────────
const PROPERTY_TYPE_LABELS = {
  apartment: "Apartment",
  studio: "Studio",
  room: "Private Room",
  shared: "Shared Room",
};

const TRANSPORT_LABELS = {
  walk: "Walking",
  metro: "Metro",
  transport: "Public Transport",
  bus: "Bus / minibus",
  "tuk-tuk": "Tuk-tuk",
};

const GENDER_LABELS = {
  male: "Males Only",
  female: "Females Only",
};

// ─────────────────────────────────────────────────────────────────────────────
const PropertyDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { openChat, conversations } = useGlobalMessaging();

  // ── Core state ──
  const [isLoading, setIsLoading] = useState(true);
  const [dynamicProperty, setDynamicProperty] = useState(null);
  const [liveSimilarProperties, setLiveSimilarProperties] = useState(similarProperties);
  const [notFound, setNotFound] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [visibleReviews, setVisibleReviews] = useState(3);
  const [notice, setNotice] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [paymentLaunchUrl, setPaymentLaunchUrl] = useState("");
  const { favoriteIdSet, toggleFavorite } = useFavorites();
  const similarScrollRef = useRef(null);
  const sectionRefs = useRef({});
  const tabScrollLockRef = useRef(null);
  const tabScrollTimerRef = useRef(null);
  const bookingCardRef = useRef(null);
  const [showBookingCta, setShowBookingCta] = useState(false);

  const [bookingStep, setBookingStep] = useState(1);
  const [bookingUnit, setBookingUnit] = useState("whole");
  const [bookingData, setBookingData] = useState({
    selectedRoomId: "",
    selectedBedId: "",
    moveInDate: "",
    duration: "6",
  });

  // ── Nearby services state ──
  const [serviceCategory, setServiceCategory] = useState("restaurant");
  const [servicePlaces, setServicePlaces]     = useState([]);
  const [serviceLoading, setServiceLoading]   = useState(false);
  const [serviceError, setServiceError]       = useState("");
  const [activePlaceId, setActivePlaceId]     = useState(null);
  const [userCoords, setUserCoords]           = useState(null);
  const [serviceSearch, setServiceSearch]     = useState("");

  // ── Data loading ──
  const loadProperty = useCallback(async () => {
    setDynamicProperty(null);
    setIsLoading(true);
    setNotFound(false);

    try {
      const detail = await fetchPropertyDetail(id);
      setDynamicProperty(normalizePropertyDetail(detail, null));
      setIsLoading(false);

      fetchPropertyReviews(id)
        .then((reviewsPayload) => {
          setDynamicProperty(normalizePropertyDetail(detail, reviewsPayload));
        })
        .catch(() => {});

      const firstUni = Array.isArray(detail.nearby_universities) ? detail.nearby_universities[0]?.name : null;
      fetchProperties({
        city: detail.city,
        university: firstUni,
        status: "available",
        limit: 5,
      })
        .then((similar) => {
          if (!Array.isArray(similar)) return;
          const normalized = similar
            .filter((p) => p.id !== detail.id)
            .slice(0, 4)
            .map(normalizePropertyCard);
          if (normalized.length > 0) setLiveSimilarProperties(normalized);
        })
        .catch(() => {});
    } catch (error) {
      if (error?.response?.status === 404) {
        setNotFound(true);
      } else {
        const numericId = parseInt(id, 10);
        const fallback = generateProperties().find((p) => p.id === numericId);
        if (fallback) {
          setDynamicProperty({
            ...propertyData,
            id: fallback.id,
            title: fallback.title,
            price: fallback.price,
            rating: fallback.rating,
            reviewCount: fallback.reviews,
            address: fallback.location,
            distance: fallback.universityDistance,
            images: fallback.image ? [fallback.image, ...propertyData.images.slice(1)] : propertyData.images,
          });
        } else {
          setNotFound(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadProperty();
  }, [id, loadProperty]);

  useEffect(() => {
    const handleReviewCreated = (event) => {
      if (String(event?.detail?.propertyId || "") === String(id)) loadProperty();
    };
    const handleFocus = () => {
      if (consumePropertyReviewUpdate(id)) loadProperty();
    };
    window.addEventListener(PROPERTY_REVIEW_CREATED_EVENT, handleReviewCreated);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener(PROPERTY_REVIEW_CREATED_EVENT, handleReviewCreated);
      window.removeEventListener("focus", handleFocus);
    };
  }, [id, loadProperty]);

  useEffect(() => {
    let cancelled = false;
    const fillStudentProfile = async () => {
      const user = getStoredUser();
      if (!user || user.role !== "student") return;
      try {
        const profile = await fetchMyProfile();
        if (cancelled) return;
        setBookingData((prev) => ({
          ...prev,
          fullName: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || prev.fullName,
          university: profile.student_profile?.university || prev.university,
          faculty: profile.student_profile?.faculty || prev.faculty,
        }));
      } catch {
        // keep manual entry
      }
    };
    fillStudentProfile();
    return () => { cancelled = true; };
  }, []);

  // ── Nearby services loader ──
  const currentProperty = useMemo(
    () => (dynamicProperty ? { ...propertyData, ...dynamicProperty } : propertyData),
    [dynamicProperty],
  );

  useEffect(() => {
    // Do not query nearby services for the hard-coded fallback coordinates while
    // the real property is still loading.
    if (!dynamicProperty || !currentProperty.lat) return;
    const lat = userCoords?.lat ?? currentProperty.lat;
    const lng = userCoords?.lng ?? currentProperty.lng;
    setServiceLoading(true);
    setServiceError("");
    fetchNearbyPlaces({ lat, lng, type: serviceCategory })
      .then((payload) => {
        const places = normalizePlaces(payload);
        setServicePlaces(places);
        setActivePlaceId(places[0]?.id || null);
      })
      .catch((err) => {
        setServicePlaces([]);
        setServiceError(err.message || "Unable to load nearby services.");
      })
      .finally(() => setServiceLoading(false));
  }, [serviceCategory, currentProperty.lat, currentProperty.lng, dynamicProperty, userCoords]);

  // ── Memos ──
  const availableRooms = useMemo(
    () => currentProperty.rooms.filter((room) => room.beds.some((b) => b.status === "AVAILABLE")),
    [currentProperty.rooms],
  );

  const availableBeds = useMemo(
    () => currentProperty.rooms.reduce((sum, room) => sum + room.beds.filter((b) => b.status === "AVAILABLE").length, 0),
    [currentProperty.rooms],
  );

  const filteredServicePlaces = useMemo(() => {
    if (!serviceSearch.trim()) return servicePlaces;
    return servicePlaces.filter((p) =>
      `${p.name} ${p.address}`.toLowerCase().includes(serviceSearch.toLowerCase()),
    );
  }, [servicePlaces, serviceSearch]);

  const activeServicePlace = useMemo(
    () => filteredServicePlaces.find((p) => p.id === activePlaceId) || filteredServicePlaces[0] || null,
    [activePlaceId, filteredServicePlaces],
  );

  const activeBookingOption = useMemo(
    () =>
      (currentProperty.bookingOptions ?? []).find((o) => o.id === bookingUnit) ??
      (currentProperty.bookingOptions ?? [])[0] ??
      { id: "whole", label: "Whole", price: currentProperty.price },
    [bookingUnit, currentProperty.bookingOptions, currentProperty.price],
  );

  const canBook = useMemo(() => {
    if (bookingUnit === "whole") return currentProperty.isAvailable;
    if (bookingUnit === "room") return availableRooms.length > 0;
    return availableBeds > 0;
  }, [bookingUnit, currentProperty.isAvailable, availableRooms.length, availableBeds]);

  const visibleRooms = useMemo(() => {
    if (bookingUnit === "room") return availableRooms.filter((r) => r.capacity === 1);
    return availableRooms.filter((r) => r.beds.some((b) => b.status === "AVAILABLE"));
  }, [availableRooms, bookingUnit]);

  const selectedRoom = currentProperty.rooms.find((r) => r.id === bookingData.selectedRoomId);

  const tabs = useMemo(
    () => [
      { id: "details",    label: "Details" },
      { id: "nearby",     label: "Nearby" },
      { id: "reviews",    label: "Reviews" },
    ],
    [],
  );

  const propertyCenter = useMemo(
    () => [currentProperty.lat, currentProperty.lng],
    [currentProperty.lat, currentProperty.lng],
  );

  const canSubmit = useMemo(() => {
    if (!bookingData.moveInDate || !bookingData.duration) return false;
    if (bookingUnit === "room") return Boolean(bookingData.selectedRoomId);
    if (bookingUnit === "bed") return Boolean(bookingData.selectedRoomId && bookingData.selectedBedId);
    return true;
  }, [bookingData, bookingUnit]);

  // ── Intersection observer for tab highlight ──
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (tabScrollLockRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveTab(visible.target.id);
      },
      { rootMargin: "-80px 0px -40% 0px", threshold: [0, 0.1, 0.25] },
    );
    tabs.forEach((tab) => {
      const section = sectionRefs.current[tab.id];
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, [tabs]);

  useEffect(() => () => {
    if (tabScrollTimerRef.current) window.clearTimeout(tabScrollTimerRef.current);
  }, []);

  useEffect(() => {
    const card = bookingCardRef.current;
    if (!card) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowBookingCta(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, [isLoading]);

  useEffect(() => {
    document.body.style.overflow = isBookingOpen || isGalleryOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isBookingOpen, isGalleryOpen]);

  // ── Callbacks ──
  const setSectionRef = useCallback(
    (idName) => (node) => { sectionRefs.current[idName] = node; },
    [],
  );

  const scrollToSection = useCallback((sectionId) => {
    const section = sectionRefs.current[sectionId];
    if (!section) return;

    setActiveTab(sectionId);
    tabScrollLockRef.current = sectionId;

    if (tabScrollTimerRef.current) window.clearTimeout(tabScrollTimerRef.current);

    const stickyNavOffset = window.innerWidth < 640 ? 76 : 92;
    const top = section.getBoundingClientRect().top + window.scrollY - stickyNavOffset;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });

    tabScrollTimerRef.current = window.setTimeout(() => {
      tabScrollLockRef.current = null;
      setActiveTab(sectionId);
    }, 700);
  }, []);

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % currentProperty.images.length);
  }, [currentProperty.images.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev === 0 ? currentProperty.images.length - 1 : prev - 1));
  }, [currentProperty.images.length]);

  const showNotice = useCallback((message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }, []);

  const openBooking = useCallback((roomId = "") => {
    const user = getStoredUser();
    if (!user) {
      navigate("/login", { state: { from: { pathname: `/find-room/${id}` } } });
      return;
    }
    if (user.role !== "student") {
      showNotice("Only students can create bookings");
      return;
    }
    const firstOption = (currentProperty.bookingOptions ?? [])[0]?.id ?? "whole";
    setBookingUnit(firstOption);
    setBookingStep(1);
    setBookingError("");
    setBookingData({
      selectedRoomId: roomId,
      selectedBedId: "",
      moveInDate: currentProperty.availableFrom || "",
      duration: "6",
    });
    setPaymentLaunchUrl("");
    setIsBookingOpen(true);
  }, [id, navigate, showNotice, currentProperty.availableFrom, currentProperty.bookingOptions]);

  const updateBooking = useCallback((patch) => {
    if (bookingError) setBookingError("");
    setBookingData((prev) => ({ ...prev, ...patch }));
  }, [bookingError]);

  const handleSubmitBooking = useCallback(async () => {
    const unitLabel = { whole: "Whole property", room: "Full room", bed: "Bed" };
    try {
      setIsSubmittingBooking(true);
      setBookingError("");
      setPaymentLaunchUrl("");

      // Step 1 — create the booking
      const createdBooking = await createBooking({
        property: currentProperty.id,
        move_in_date: bookingData.moveInDate,
        duration_months: Number.parseInt(bookingData.duration, 10) || 6,
        booking_unit: bookingUnit,
        message: [
          unitLabel[bookingUnit] || "Whole property",
          bookingData.selectedRoomId ? `Room: ${bookingData.selectedRoomId}` : null,
          bookingData.selectedBedId ? `Bed: ${bookingData.selectedBedId}` : null,
        ].filter(Boolean).join(" | "),
      });
      setBookingStep(4); // show "redirecting…" screen

      // Step 2 — get Stripe checkout URL
      const session = await createCheckoutSession(createdBooking.id);
      setPaymentLaunchUrl(session.checkout_url);

      // Step 3 — redirect to Stripe
      window.location.href = session.checkout_url;

    } catch (error) {
      setBookingError(getApiErrorMessage(error, "Booking failed. Please try again."));
      setBookingStep(1);
    } finally {
      setIsSubmittingBooking(false);
    }
  }, [bookingData, bookingUnit, currentProperty.id]);

  const handleShare = useCallback(async () => {
    const shareData = { title: currentProperty.title, text: `Check this student accommodation: ${currentProperty.title}`, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showNotice("Property link copied");
      }
    } catch {
      showNotice("Share cancelled");
    }
  }, [currentProperty.title, showNotice]);

  const isSaved = favoriteIdSet.has(currentProperty.id);

  const handleSave = useCallback(async () => {
    if (!isPropertyAvailable(currentProperty)) {
      showNotice("Only available properties can be added to favorites");
      return;
    }
    const wasSaved = favoriteIdSet.has(currentProperty.id);
    const next = await toggleFavorite(currentProperty, {
      onRequireAuth: () => navigate("/login", { state: { from: { pathname: `/find-room/${id}` } } }),
      onError: (message) => showNotice(message),
    });
    if (next !== wasSaved) showNotice(next ? "Property saved" : "Property removed from saved");
  }, [currentProperty, favoriteIdSet, id, navigate, showNotice, toggleFavorite]);

  // Chat with owner — uses ChatWindow popup if existing conversation, else navigates to /messages
  const handleMessageOwner = useCallback(() => {
    const existing = conversations.find((c) => String(c.receiverId) === String(currentProperty.landlord.id));
    if (existing) {
      openChat({ conversationId: existing.id });
    } else {
      openChat(
        buildDraftChatState({
          receiverId: currentProperty.landlord.id,
          name: currentProperty.landlord.name,
          avatar: currentProperty.landlord.image,
          propertyId: currentProperty.id,
          propertyTitle: currentProperty.title,
          receiverRole: "Host",
        }),
      );
    }
  }, [conversations, currentProperty, openChat]);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator?.geolocation) {
      setServiceError("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setServiceError("Unable to access your current location."),
    );
  }, []);

  const handleGetDirections = useCallback(() => {
    const dest = `${currentProperty.lat},${currentProperty.lng}`;
    const originPart = userCoords ? `&origin=${userCoords.lat},${userCoords.lng}` : "";
    window.open(
      `https://www.google.com/maps/dir/?api=1${originPart}&destination=${dest}&travelmode=transit`,
      "_blank",
      "noreferrer",
    );
  }, [currentProperty.lat, currentProperty.lng, userCoords]);

  const openGoogleMaps = useCallback(() => {
    window.open(`https://www.google.com/maps?q=${currentProperty.lat},${currentProperty.lng}`, "_blank", "noreferrer");
  }, [currentProperty.lat, currentProperty.lng]);

  const scrollSimilar = useCallback((direction) => {
    similarScrollRef.current?.scrollBy({ left: direction === "left" ? -390 : 390, behavior: "smooth" });
  }, []);

  if (isLoading) return <LoadingSkeleton />;
  if (notFound) return <NotFoundState navigate={navigate} />;

  return (
    <div className="min-h-screen overflow-x-clip bg-[#F8FAFC] font-sans text-[#091E42]">
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeInUp .4s ease-out both; }
        .details-map .leaflet-container { width: 100%; height: 100%; border-radius: 18px; z-index: 1; }
        .nearby-map .leaflet-container { width: 100%; height: 100%; border-radius: 18px; z-index: 1; }
        .nearby-map .leaflet-control-attribution { max-width: 78%; white-space: normal; font-size: 8px; line-height: 1.2; }
        .nearby-map .leaflet-popup-content { max-width: min(220px, calc(100vw - 5rem)); margin: 12px 16px; overflow-wrap: anywhere; }
        .details-map-pin {
          width: 38px; height: 38px; border-radius: 999px; border: 4px solid white;
          box-shadow: 0 14px 28px rgba(9, 30, 66, .24); display: grid; place-items: center;
        }
        .details-map-pin span { width: 10px; height: 10px; border-radius: 999px; background: #fff; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <Navbar />

      {notice && (
        <div className="fixed right-4 top-20 z-[130] rounded-full bg-[#091E42] px-5 py-3 text-sm font-bold text-white shadow-xl">
          {notice}
        </div>
      )}

      <main className="mx-auto w-full max-w-[1500px] px-4 py-5 md:px-6">

        {/* ── Header ── */}
        <section className="mb-5">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" /> {currentProperty.rating}
            </span>
            <span>({currentProperty.reviewCount} reviews)</span>
            <span className="text-slate-300">|</span>
            <button type="button" onClick={() => scrollToSection("nearby")} className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-[#155BC2]">
              <MapPin className="h-4 w-4" /> {currentProperty.address}
            </button>
          </div>
          <h1 className="text-2xl font-black leading-tight text-[#091E42] md:text-4xl">{currentProperty.title}</h1>
        </section>

        {/* ── Gallery (2/3) + Booking card (1/3) ── */}
        <section ref={bookingCardRef} className="grid gap-4 lg:grid-cols-[2fr_1fr] lg:items-start">

          {/* Photos */}
          <div className="grid gap-2 overflow-hidden rounded-3xl md:h-[450px] md:grid-cols-4 md:grid-rows-2">
            <button
              type="button"
              onClick={() => { setIsGalleryOpen(true); setCurrentImageIndex(0); }}
              className="group relative h-[330px] overflow-hidden bg-slate-200 md:col-span-2 md:row-span-2 md:h-full"
            >
              <img src={currentProperty.images[0]} alt="Main property" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="eager" />
              <div className="absolute bottom-4 left-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-[#091E42] shadow-lg">
                  <Camera className="h-4 w-4" /> View all photos
                </span>
              </div>
            </button>
            {currentProperty.images.slice(1, 5).map((image, index) => (
              <button key={image} type="button" onClick={() => { setIsGalleryOpen(true); setCurrentImageIndex(index + 1); }} className="group hidden overflow-hidden bg-slate-200 md:block">
                <img src={image} alt={`Property ${index + 2}`} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              </button>
            ))}
          </div>

          {/* Booking card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  {activeBookingOption.id === "whole" ? "Monthly rent" : activeBookingOption.id === "room" ? "Per room / month" : "Per bed / month"}
                </p>
                <p className="mt-1 text-3xl font-black text-[#091E42]">
                  EGP {activeBookingOption.price.toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handleShare} className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95" aria-label="Share">
                  <Share2 className="h-4 w-4" />
                </button>
                <button type="button" onClick={handleSave} className={`grid h-10 w-10 place-items-center rounded-full border shadow-sm transition active:scale-95 ${isSaved ? "border-rose-200 bg-rose-50 text-rose-600" : "border-slate-200 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-600"}`} aria-label="Save">
                  <Heart className={`h-4 w-4 ${isSaved ? "fill-rose-500" : ""}`} />
                </button>
              </div>
            </div>

            {(currentProperty.bookingOptions ?? []).length > 1 && (
              <div className="mt-3 flex gap-1 rounded-2xl bg-slate-100 p-1">
                {(currentProperty.bookingOptions ?? []).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setBookingUnit(opt.id)}
                    className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition ${
                      bookingUnit === opt.id ? "bg-white text-[#155BC2] shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 space-y-3 rounded-2xl bg-[#F8FAFC] p-4 text-sm font-bold text-slate-600">
              <p className="flex justify-between">
                <span>Deposit (20%)</span>
                <strong className="text-[#091E42]">EGP {Math.round(activeBookingOption.price * 0.2).toLocaleString()}</strong>
              </p>
              <p className="flex justify-between text-slate-400">
                <span>Remaining (80%)</span>
                <span>EGP {Math.round(activeBookingOption.price * 0.8).toLocaleString()}</span>
              </p>
              <p className="flex justify-between">
                <span>Available From</span>
                <strong className={currentProperty.isAvailable ? "text-emerald-600" : "text-amber-600"}>
                  {currentProperty.availableFrom
                    ? new Date(currentProperty.availableFrom).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                    : currentProperty.isAvailable ? "Now" : currentProperty.status || "Check with owner"}
                </strong>
              </p>
              {bookingUnit === "whole" && (
                <p className="flex justify-between">
                  <span>Entire property</span>
                  <strong className="text-[#091E42]">{currentProperty.numRooms || currentProperty.rooms.length} rooms · {currentProperty.numBeds || currentProperty.rooms.reduce((s, r) => s + r.beds.length, 0)} beds</strong>
                </p>
              )}
              {bookingUnit === "room" && (
                <p className="flex justify-between">
                  <span>Rooms available</span>
                  <strong className="text-[#091E42]">{availableRooms.length} of {currentProperty.numRooms || currentProperty.rooms.length}</strong>
                </p>
              )}
              {bookingUnit === "bed" && (
                <>
                  <p className="flex justify-between">
                    <span>Beds available</span>
                    <strong className="text-[#091E42]">{availableBeds} of {currentProperty.numBeds || currentProperty.rooms.reduce((s, r) => s + r.beds.length, 0)}</strong>
                  </p>
                  {currentProperty.propertyType === "apartment" && (
                    <p className="flex justify-between">
                      <span>Rooms</span>
                      <strong className="text-[#091E42]">{currentProperty.numRooms || currentProperty.rooms.length} rooms</strong>
                    </p>
                  )}
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => canBook && openBooking()}
              disabled={!canBook}
              className={`mt-5 h-12 w-full rounded-full text-sm font-black text-white shadow-md transition active:scale-95 ${
                canBook ? "bg-[#155BC2] hover:bg-[#0f4699]" : "cursor-not-allowed bg-slate-300"
              }`}
            >
              {canBook ? "Book Now" : "Not Available"}
            </button>

            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#F8FAFC] p-4">
              <Link
                to={`/profile/${currentProperty.landlord.id}`}
                className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-80"
              >
                <img src={currentProperty.landlord.image} alt={currentProperty.landlord.name} className="h-10 w-10 shrink-0 rounded-full object-cover" loading="lazy" />
                <div className="min-w-0">
                  <p className="text-sm font-black text-[#091E42]">{currentProperty.landlord.name}</p>
                  <p className="truncate text-xs text-slate-500">{currentProperty.landlord.response}</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={handleMessageOwner}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-500 text-white shadow-md transition hover:bg-emerald-600 active:scale-95"
                aria-label="Message owner"
              >
                <MessageSquare className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>

        {/* ── Tab nav ── */}
        <nav className="sticky top-0 z-30 -mx-4 mt-6 border-y border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur md:-mx-6 md:px-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className={`shrink-0 grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-300 hover:border-[#155BC2] hover:text-[#155BC2] active:scale-95 ${
                showBookingCta ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none"
              }`}
              aria-label="Back to top"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <div className="scrollbar-hide flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-1 shadow-sm">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => scrollToSection(tab.id)}
                  aria-current={activeTab === tab.id ? "page" : undefined}
                  className={`h-9 shrink-0 rounded-xl px-4 text-xs font-black transition active:scale-95 sm:text-sm ${
                    activeTab === tab.id
                      ? "bg-[#155BC2] text-white shadow-sm"
                      : "text-slate-600 hover:bg-white hover:text-[#155BC2]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => canBook && openBooking()}
              disabled={!canBook}
              className={`shrink-0 h-9 rounded-full px-5 text-xs font-black text-white shadow-md transition-all duration-300 active:scale-95 ${
                canBook ? "bg-[#155BC2] hover:bg-[#0f4699]" : "bg-slate-300 cursor-not-allowed"
              } ${showBookingCta ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none"}`}
            >
              {canBook ? "Book Now" : "Unavailable"}
            </button>
          </div>
        </nav>

        {/* ── Main content (single column) ── */}
        <div className="mt-6 space-y-6">

          {/* Property Details — compact multi-column */}
          <section id="details" ref={setSectionRef("details")} className="scroll-mt-28">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-5">

                {/* Column 1 — Property */}
                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Property</p>
                  <ul className="space-y-1.5">
                    {[
                      { label: "Type",   value: PROPERTY_TYPE_LABELS[currentProperty.propertyType] || currentProperty.propertyType || "—", icon: Building2 },
                      { label: "Floor",  value: currentProperty.floor != null ? `Floor ${currentProperty.floor}` : "Ground", icon: Home },
                      { label: "Area",   value: currentProperty.areaSqm ? `${currentProperty.areaSqm} m²` : "—", icon: Ruler },
                      { label: "Gender", value: GENDER_LABELS[currentProperty.genderPreference] || "Any", icon: Users2 },
                    ].map(({ label, value, icon }) => (
                      <li key={label} className="flex items-center gap-2">
                        {React.createElement(icon, { className: "h-3.5 w-3.5 shrink-0 text-[#155BC2]" })}
                        <span className="text-xs text-slate-500">{label}:</span>
                        <span className="text-xs font-bold text-[#091E42]">{value}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 2 — Rooms */}
                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Rooms</p>
                  <ul className="space-y-1.5">
                    {[
                      { label: "Rooms",     value: `${currentProperty.numRooms || currentProperty.rooms.length}`, icon: Bed },
                      { label: "Beds",      value: `${currentProperty.numBeds || currentProperty.rooms.reduce((s, r) => s + r.beds.length, 0)}`, icon: Bed },
                      { label: "Bathrooms", value: `${currentProperty.numBathrooms || 1}`, icon: Bath },
                    ].map(({ label, value, icon }) => (
                      <li key={label} className="flex items-center gap-2">
                        {React.createElement(icon, { className: "h-3.5 w-3.5 shrink-0 text-[#155BC2]" })}
                        <span className="text-xs text-slate-500">{label}:</span>
                        <span className="text-xs font-bold text-[#091E42]">{value}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 3 — Location & Stay */}
                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Location & Stay</p>
                  <ul className="space-y-1.5">
                    {[
                      { label: "University", value: currentProperty.nearbyUniversity || "—", icon: GraduationCap },
                      { label: "Distance",   value: currentProperty.distanceToUniversity || currentProperty.distance || "—", icon: Clock },
                      { label: "Min stay",   value: `${currentProperty.minStayMonths || 1} mo`, icon: CalendarDays },
                      { label: "Max stay",   value: currentProperty.maxStayMonths ? `${currentProperty.maxStayMonths} mo` : "Flexible", icon: CalendarDays },
                    ].map(({ label, value, icon }) => (
                      <li key={label} className="flex items-center gap-2">
                        {React.createElement(icon, { className: "h-3.5 w-3.5 shrink-0 text-[#155BC2]" })}
                        <span className="text-xs text-slate-500">{label}:</span>
                        <span className="text-xs font-bold text-[#091E42]">{value}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 4 — Transport */}
                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Transport</p>
                  <ul className="space-y-1.5">
                    {TRANSPORT_OPTIONS.filter(({ value }) =>
                      (Array.isArray(currentProperty.transportTypes) ? currentProperty.transportTypes : []).includes(value)
                    ).map(({ value, label }) => (
                      <li key={value} className="flex items-center gap-2">
                        <Bus className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        <span className="text-xs font-semibold text-[#091E42]">{label}</span>
                      </li>
                    ))}
                    {!(Array.isArray(currentProperty.transportTypes) && currentProperty.transportTypes.length > 0) && (
                      <li className="text-xs text-slate-400">Not specified</li>
                    )}
                  </ul>
                </div>

                {/* Column 5 — Bills */}
                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Bills</p>
                  <ul className="space-y-1.5">
                    {currentProperty.bills.map((bill) => {
                      const Icon = bill.icon || DETAIL_ICON_MAP[bill.iconKey] || Zap;
                      return (
                        <li key={bill.name} className="flex items-center gap-2">
                          <Icon className={`h-3.5 w-3.5 shrink-0 ${bill.included ? "text-emerald-500" : "text-amber-500"}`} />
                          <span className="text-xs text-slate-600">{bill.name}</span>
                          <span className={`text-[10px] font-bold ${bill.included ? "text-emerald-600" : "text-amber-600"}`}>
                            {bill.included ? "Incl." : "Extra"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

              </div>
            </div>
          </section>

          {/* Nearby services + map */}
          <section id="nearby" ref={setSectionRef("nearby")} className="scroll-mt-28">
            <SectionTitle title="Location & nearby services" subtitle="Explore the property location and find essential spots around your accommodation." />

            {/* Controls */}
            <div className="mb-4 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={handleUseMyLocation}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition active:scale-95 sm:w-auto ${
                  userCoords
                    ? "border-[#155BC2] bg-[#155BC2] text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-[#155BC2] hover:text-[#155BC2]"
                }`}
              >
                <LocateFixed className="h-4 w-4" />
                {userCoords ? "My Location Active" : "Use My Location"}
              </button>
              <button
                type="button"
                onClick={handleGetDirections}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-[#155BC2] hover:text-[#155BC2] active:scale-95 sm:w-auto"
              >
                <Navigation className="h-4 w-4" /> Get Directions to Property
              </button>
              <button
                type="button"
                onClick={openGoogleMaps}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-[#155BC2] hover:text-[#155BC2] active:scale-95 sm:w-auto"
              >
                <ExternalLink className="h-4 w-4" /> Open in Google Maps
              </button>
            </div>

            {/* Category pills */}
            <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
              {SERVICE_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = serviceCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => { setServiceCategory(cat.id); setServiceSearch(""); setActivePlaceId(null); }}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-all active:scale-95 ${
                      isActive
                        ? "border-[#155BC2] bg-[#155BC2] text-white shadow-md"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Map + places list */}
            <div className="grid min-w-0 gap-4 lg:h-[520px] lg:grid-cols-[2fr_1fr]">

              {/* Map */}
              <div className="nearby-map h-[340px] min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:h-[420px] sm:rounded-3xl lg:h-full">
                <MapContainer
                  center={propertyCenter}
                  zoom={14}
                  style={{ width: "100%", height: "100%" }}
                  zoomControl
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  />
                  <NearbyMapController activePlace={activeServicePlace} propertyCenter={propertyCenter} />

                  {/* Property marker */}
                  <Marker position={propertyCenter} icon={mapIcon}>
                    <Popup>
                      <strong>{currentProperty.title}</strong>
                      <br />{currentProperty.address}
                    </Popup>
                  </Marker>

                  {/* User location marker */}
                  {userCoords && (
                    <Marker position={[userCoords.lat, userCoords.lng]} icon={userLocIcon}>
                      <Popup>Your current location</Popup>
                    </Marker>
                  )}

                  {/* Nearby place markers */}
                  {filteredServicePlaces.map((place) => (
                    <Marker
                      key={place.id}
                      position={[place.lat, place.lng]}
                      eventHandlers={{ click: () => setActivePlaceId(place.id) }}
                    >
                      <Popup className="font-sans font-semibold text-sm">{place.name}</Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              {/* Places list */}
              <div className="flex h-[360px] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:h-[420px] sm:rounded-3xl lg:h-full">
                {/* Search */}
                <div className="border-b border-slate-100 p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      placeholder="Find a place..."
                      className="w-full rounded-2xl bg-slate-50 py-2.5 pl-10 pr-4 text-base font-semibold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 sm:text-sm"
                    />
                  </div>
                </div>

                {/* List */}
                <div className="no-scrollbar flex-1 space-y-2 overflow-y-auto p-3">
                  {serviceLoading ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-400">
                      Loading nearby places...
                    </div>
                  ) : serviceError ? (
                    <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50 p-6 text-center text-sm font-semibold text-rose-500">
                      {serviceError}
                    </div>
                  ) : filteredServicePlaces.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-400">
                      No places found in this category.
                    </div>
                  ) : (
                    filteredServicePlaces.map((place) => {
                      const isActive = activeServicePlace?.id === place.id;
                      return (
                        <button
                          key={place.id}
                          type="button"
                          onClick={() => setActivePlaceId(place.id)}
                          className={`w-full rounded-2xl border p-3 text-left transition-all ${
                            isActive
                              ? "border-[#155BC2] bg-blue-50/70 shadow-sm"
                              : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-black text-[#091E42]">{place.name}</p>
                            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{place.rating}</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{place.distance}</p>
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                            <Clock className="h-3 w-3" /> {place.hours}
                          </div>
                          <div className="mt-1 flex items-start gap-1.5 text-xs text-slate-400">
                            <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                            <span className="line-clamp-2">{place.address}</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Reviews — simplified */}
          <section id="reviews" ref={setSectionRef("reviews")} className="scroll-mt-28">
            <SectionTitle
              title="Student reviews"
              subtitle={`${currentProperty.reviewCount} verified student review${currentProperty.reviewCount !== 1 ? "s" : ""}`}
            />
            {currentProperty.reviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-400">
                No reviews yet — be the first to review this property.
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {currentProperty.reviews.slice(0, visibleReviews).map((review) => (
                    <article key={review.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <img src={review.avatar} alt={review.user} loading="lazy" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-[#091E42]">{review.user}</p>
                          <p className="text-xs font-semibold text-slate-500">{review.date}</p>
                          <Stars value={review.rating} size="h-3 w-3" />
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-slate-600">&ldquo;{review.text}&rdquo;</p>
                    </article>
                  ))}
                </div>
                {visibleReviews < currentProperty.reviews.length && (
                  <button
                    type="button"
                    onClick={() => setVisibleReviews((prev) => prev + 3)}
                    className="mt-5 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-black transition hover:border-[#155BC2] hover:text-[#155BC2]"
                  >
                    Load more reviews
                  </button>
                )}
              </>
            )}
          </section>

        </div>

        {/* ── Similar properties ── */}
        <section className="mt-14">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-black text-[#091E42]">Similar Properties</h2>
              <p className="mt-2 text-lg font-semibold text-slate-500">Near This University</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => navigate("/find-room")} className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-black transition hover:border-[#155BC2] hover:text-[#155BC2]">
                View All
              </button>
              <button type="button" onClick={() => scrollSimilar("left")} className="grid h-11 w-11 place-items-center rounded-full border border-slate-300 bg-white transition hover:border-[#155BC2] hover:text-[#155BC2]" aria-label="Previous homes">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => scrollSimilar("right")} className="grid h-11 w-11 place-items-center rounded-full border border-slate-300 bg-white transition hover:border-[#155BC2] hover:text-[#155BC2]" aria-label="Next homes">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div ref={similarScrollRef} className="scrollbar-hide flex gap-6 overflow-x-auto pb-6 scroll-smooth">
            {liveSimilarProperties.map((item) => (
              <div key={item.id} className="w-[320px] shrink-0 sm:w-[360px]">
                <PropertyCard
                  property={item}
                  isFavorite={favoriteIdSet.has(item.id)}
                  favoriteDisabled={!isPropertyAvailable(item)}
                  onFavoriteDisabled={() => showNotice("Only available properties can be added to favorites")}
                  onFavoriteToggle={(property) =>
                    toggleFavorite(property, {
                      onRequireAuth: () => navigate("/login", { state: { from: { pathname: `/find-room/${id}` } } }),
                      onError: (message) => showNotice(message),
                    })
                  }
                />
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Mobile CTA bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] lg:hidden">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-500">{activeBookingOption.label}</p>
            <p className="text-lg font-black text-[#091E42]">EGP {activeBookingOption.price.toLocaleString()}<span className="text-xs text-slate-400"> /month</span></p>
          </div>
          <button
            type="button"
            onClick={() => canBook && openBooking()}
            disabled={!canBook}
            className={`h-12 rounded-full px-6 text-sm font-black text-white shadow-md ${canBook ? "bg-[#155BC2]" : "bg-slate-300 cursor-not-allowed"}`}
          >
            {canBook ? "Book Now" : "Unavailable"}
          </button>
        </div>
      </div>

      {/* ── Gallery modal ── */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 p-4 text-white">
          <div className="flex items-center justify-between py-3">
            <p className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold">{currentImageIndex + 1} / {currentProperty.images.length}</p>
            <button type="button" onClick={() => setIsGalleryOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20" aria-label="Close gallery">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center">
            <button type="button" onClick={prevImage} className="absolute left-2 grid h-12 w-12 place-items-center rounded-full bg-black/50 transition hover:bg-black/70" aria-label="Previous image">
              <ChevronLeft className="h-7 w-7" />
            </button>
            <img src={currentProperty.images[currentImageIndex]} alt="Property gallery" className="max-h-full max-w-full rounded-2xl object-contain" />
            <button type="button" onClick={nextImage} className="absolute right-2 grid h-12 w-12 place-items-center rounded-full bg-black/50 transition hover:bg-black/70" aria-label="Next image">
              <ChevronRight className="h-7 w-7" />
            </button>
          </div>
        </div>
      )}

      {/* ── Booking modal ── */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-900/45 p-0 backdrop-blur-sm md:items-center md:p-4">
          <div className="flex max-h-[94vh] w-full max-w-[980px] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl md:rounded-3xl">
            <div className="border-b border-slate-200 bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <button type="button" onClick={() => setIsBookingOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200" aria-label="Close booking">
                  <X className="h-5 w-5" />
                </button>
                <div className="text-right">
                  <h2 className="text-xl font-black text-[#091E42]">
                    {bookingStep === 4 ? "Payment in progress" : `Book ${currentProperty.title}`}
                  </h2>
                  {bookingStep !== 4 && (
                    <p className="mt-0.5 text-xs font-bold text-slate-400">
                      {activeBookingOption.label} · EGP {activeBookingOption.price.toLocaleString()}/month
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] p-5">
              {bookingStep === 1 && (
                <div className="mx-auto max-w-2xl space-y-4">
                  {/* Booking summary */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                      <img src={currentProperty.images[0]} alt={currentProperty.title} className="h-20 w-28 shrink-0 rounded-xl object-cover" />
                      <div className="min-w-0">
                        <p className="font-black text-[#091E42] truncate">{currentProperty.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500 truncate">{currentProperty.address}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#155BC2]">{activeBookingOption.label}</span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">EGP {activeBookingOption.price.toLocaleString()}/mo</span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">Deposit (20%): EGP {Math.round(activeBookingOption.price * 0.2).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 font-black text-[#091E42]"><CalendarDays className="h-4 w-4 text-[#155BC2]" /> Stay details</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-bold text-slate-500">Move-in date</span>
                        <input
                          type="date"
                          value={bookingData.moveInDate}
                          onChange={(e) => updateBooking({ moveInDate: e.target.value })}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-[#155BC2] focus:ring-2 focus:ring-blue-100"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-bold text-slate-500">Stay duration</span>
                        <select
                          value={bookingData.duration}
                          onChange={(e) => updateBooking({ duration: e.target.value })}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-[#155BC2] focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="1">1 month</option>
                          <option value="3">3 months</option>
                          <option value="6">6 months</option>
                          <option value="12">12 months</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  {/* Room selection (room or bed booking) */}
                  {bookingUnit !== "whole" && (
                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="flex items-center gap-2 font-black text-[#091E42]">
                          <Building2 className="h-4 w-4 text-[#155BC2]" /> Choose a room
                        </h3>
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#155BC2]">
                          {bookingUnit === "room" ? `${availableRooms.length} rooms available` : `${availableBeds} beds available`}
                        </span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                        {visibleRooms.map((room) => {
                          const active = bookingData.selectedRoomId === room.id;
                          const roomStatus = getRoomStatus(room);
                          return (
                            <button
                              key={room.id}
                              type="button"
                              onClick={() => updateBooking({ selectedRoomId: room.id, selectedBedId: bookingUnit === "room" ? room.beds[0]?.id || "" : "" })}
                              className={`overflow-hidden rounded-xl border bg-white text-left transition active:scale-[0.99] ${active ? "border-[#155BC2] shadow-[0_0_0_2px_rgba(21,91,194,0.14)]" : "border-slate-200 hover:border-[#155BC2]/50"}`}
                            >
                              <div className="relative h-28">
                                <img src={room.image} alt={room.name} className="h-full w-full object-cover" />
                                {active && <span className="absolute right-2 top-2 rounded-full bg-[#155BC2] px-2 py-0.5 text-[10px] font-bold text-white">Selected</span>}
                              </div>
                              <div className="p-3">
                                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${roomStatus.className}`}>{roomStatus.label}</span>
                                <p className="mt-2 text-sm font-black text-[#091E42]">{room.type}</p>
                                <p className="mt-0.5 text-xs text-slate-500">{room.beds.length} beds · {room.capacity} people</p>
                                <p className="mt-2 text-sm font-black text-[#155BC2]">EGP {activeBookingOption.price.toLocaleString()}/mo</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Bed selection */}
                  {bookingUnit === "bed" && selectedRoom && (
                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                      <h3 className="mb-4 flex items-center gap-2 font-black text-[#091E42]"><Bed className="h-4 w-4 text-[#F59E0B]" /> Choose a bed</h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {selectedRoom.beds.map((bedItem) => {
                          const available = bedItem.status === "AVAILABLE";
                          const active = bookingData.selectedBedId === bedItem.id;
                          return (
                            <button
                              key={bedItem.id}
                              type="button"
                              disabled={!available}
                              onClick={() => updateBooking({ selectedBedId: bedItem.id })}
                              className={`flex items-center justify-between rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${active ? "border-[#155BC2] bg-blue-50" : "border-slate-200 bg-white hover:border-[#155BC2]/50"}`}
                            >
                              <span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-black text-white ${available ? "bg-[#155BC2]" : "bg-slate-300"}`}>
                                {bedItem.name.replace(/[^0-9]/g, "") || "—"}
                              </span>
                              <div className="text-right">
                                <p className="font-black text-[#091E42]">{bedItem.name}</p>
                                <p className="text-xs text-slate-500">{available ? "Available" : "Taken"}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {bookingError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{bookingError}</div>
                  )}
                </div>
              )}

              {bookingStep === 4 && (
                <div className="mx-auto flex min-h-[380px] max-w-md flex-col items-center justify-center rounded-2xl bg-white p-8 text-center shadow-sm">
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-blue-50 text-[#155BC2]">
                    <Loader2 className="h-10 w-10 animate-spin" />
                  </div>
                  <h3 className="mt-5 text-2xl font-black text-[#091E42]">
                    {paymentLaunchUrl ? "Redirecting to payment…" : "Setting up payment…"}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    You will be redirected to Stripe to complete your payment securely.
                  </p>
                  {paymentLaunchUrl && (
                    <a
                      href={paymentLaunchUrl}
                      className="mt-6 h-12 w-full inline-flex items-center justify-center rounded-full bg-[#155BC2] font-black text-white shadow-md transition hover:bg-[#0f4699]"
                    >
                      Open Payment Page
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate("/bookings")}
                    className="mt-3 text-sm font-bold text-slate-400 hover:text-slate-600"
                  >
                    Go to my bookings
                  </button>
                </div>
              )}
            </div>

            {bookingStep === 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-4">
                <button type="button" onClick={() => setIsBookingOpen(false)} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-black text-slate-500 transition hover:bg-slate-100">
                  <ChevronLeft className="h-4 w-4" /> Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitBooking}
                  disabled={!canSubmit || isSubmittingBooking}
                  className="inline-flex items-center gap-2 rounded-full bg-[#155BC2] px-7 py-3 font-black text-white shadow-lg transition hover:bg-[#0f4699] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                  {isSubmittingBooking ? "Submitting…" : "Submit Booking Request"} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;
