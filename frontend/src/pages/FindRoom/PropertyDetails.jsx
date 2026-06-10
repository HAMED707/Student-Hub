import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Bed,
  Building2,
  CalendarDays,
  Camera,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Droplet,
  ExternalLink,
  Flame,
  Heart,
  Home,
  IdCard,
  MapPin,
  MessageSquare,
  Monitor,
  Phone,
  PlayCircle,
  Share2,
  ShieldCheck,
  Snowflake,
  Star,
  UploadCloud,
  User,
  Users,
  Utensils,
  Video,
  Wifi,
  Wind,
  X,
  Zap,
} from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import PropertyCard from "../../assets/components/PropertyCard/PropertyCard.jsx";

const propertyData = {
  id: 1,
  title: "Cozy room near Cairo University",
  price: 2500,
  deposit: 2500,
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

const nearbyPlaces = [
  { name: "Cairo University", type: "University", latOffset: 0.006, lngOffset: -0.006, color: "#155BC2" },
  { name: "City Pharmacy", type: "Pharmacy", latOffset: -0.004, lngOffset: 0.005, color: "#10B981" },
  { name: "Fresh Market", type: "Supermarket", latOffset: 0.004, lngOffset: 0.006, color: "#F59E0B" },
  { name: "Main Bus Station", type: "Bus Station", latOffset: -0.005, lngOffset: -0.004, color: "#7C3AED" },
  { name: "Metro Station", type: "Metro Station", latOffset: 0.002, lngOffset: 0.008, color: "#EF4444" },
];

const ratingBreakdown = [
  { label: "Communication", value: 82, score: 4.1 },
  { label: "Safety", value: 88, score: 4.4 },
  { label: "Cleanliness", value: 76, score: 3.8 },
  { label: "Amenities", value: 80, score: 4.0 },
  { label: "Location", value: 92, score: 4.6 },
  { label: "Value", value: 84, score: 4.2 },
];

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
      type,
      location: `${loc.city} - ${loc.area}`,
      universityDistance: `${Math.floor(Math.random() * 20) + 5} mins to campus`,
      price: Math.floor(Math.random() * (12000 - 1500) + 1500),
      rating: parseFloat((Math.random() * (5 - 3.5) + 3.5).toFixed(1)),
      reviews: Math.floor(Math.random() * 80) + 5,
      roommates: type === "Shared Room" ? Math.floor(Math.random() * 3) + 1 : 0,
      image: images[i % images.length],
      city: loc.city,
      availabilityStatus: i % 8 === 0 ? "unavailable" : i % 5 === 0 ? "booked" : "available",
    };
  });
};

const createPin = (color = "#155BC2") =>
  L.divIcon({
    html: `<div class="details-map-pin" style="background:${color}"><span></span></div>`,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -34],
  });

const mapIcon = createPin("#155BC2");

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[#F8FAFC] font-sans">
    <div className="animate-pulse">
      <div className="h-16 bg-slate-200" />
      <div className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-6">
        <div className="h-8 w-2/3 rounded bg-slate-200" />
        <div className="h-[420px] rounded-2xl bg-slate-200" />
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="h-[700px] rounded-2xl bg-slate-200" />
          <div className="h-[420px] rounded-2xl bg-slate-200" />
        </div>
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
      <p className="mt-2 text-sm leading-6 text-slate-500">The property you're looking for doesn't exist or has been removed.</p>
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
  <div className="mb-5">
    <h2 className="text-2xl font-black text-[#091E42] md:text-3xl">{title}</h2>
    {subtitle && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{subtitle}</p>}
  </div>
);

const getRoomStatus = (room) => {
  const availableBeds = room.beds.filter((bedItem) => bedItem.status === "AVAILABLE").length;
  if (availableBeds === 0) return { label: "Fully Booked", className: "bg-rose-50 text-rose-700 border-rose-100" };
  if (availableBeds <= 1 && room.beds.length > 1) return { label: "Few Beds Left", className: "bg-amber-50 text-amber-700 border-amber-100" };
  return { label: "Available", className: "bg-emerald-50 text-emerald-700 border-emerald-100" };
};

const PropertyDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [dynamicProperty, setDynamicProperty] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("rooms");
  const [visibleReviews, setVisibleReviews] = useState(2);
  const [isSaved, setIsSaved] = useState(false);
  const [notice, setNotice] = useState("");
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const similarScrollRef = useRef(null);
  const sectionRefs = useRef({});

  const [bookingStep, setBookingStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    bookingType: "bed",
    selectedRoomId: "",
    selectedBedId: "",
    moveInDate: "",
    duration: "6 months",
    paymentMethod: "card",
    fullName: "",
    age: "",
    university: "",
    faculty: "",
    idUploaded: false,
    agreed: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (id) {
        const numericId = parseInt(id, 10);
        const found = generateProperties().find((property) => property.id === numericId);
        if (found) {
          setDynamicProperty(found);
          setNotFound(false);
        } else {
          setNotFound(true);
        }
      }
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [id]);

  const currentProperty = useMemo(() => {
    if (!dynamicProperty) return propertyData;
    return {
      ...propertyData,
      id: dynamicProperty.id,
      title: dynamicProperty.title,
      price: dynamicProperty.price,
      rating: dynamicProperty.rating,
      reviewCount: dynamicProperty.reviews,
      address: dynamicProperty.location || propertyData.address,
      images: dynamicProperty.image ? [dynamicProperty.image, ...propertyData.images.slice(1)] : propertyData.images,
      distance: dynamicProperty.universityDistance || propertyData.distance,
    };
  }, [dynamicProperty]);

  const nearbyMarkers = useMemo(
    () =>
      nearbyPlaces.map((place) => ({
        ...place,
        lat: currentProperty.lat + place.latOffset,
        lng: currentProperty.lng + place.lngOffset,
      })),
    [currentProperty.lat, currentProperty.lng]
  );

  const availableRooms = useMemo(
    () => currentProperty.rooms.filter((room) => room.beds.some((bedItem) => bedItem.status === "AVAILABLE")),
    [currentProperty.rooms]
  );

  const bookingTypeOptions = useMemo(
    () => [
      { id: "bed", label: "Bed", icon: Bed, description: "Book one available bed in a shared room." },
      { id: "room", label: "Room", icon: Home, description: "Book a full private room when available." },
    ],
    []
  );

  const visibleRooms = useMemo(() => {
    if (bookingData.bookingType === "room") {
      return availableRooms.filter((room) => room.capacity === 1);
    }
    return availableRooms.filter((room) => room.beds.some((bedItem) => bedItem.status === "AVAILABLE"));
  }, [availableRooms, bookingData.bookingType]);

  const selectedRoom = currentProperty.rooms.find((room) => room.id === bookingData.selectedRoomId);
  const selectedBed = selectedRoom?.beds.find((bedItem) => bedItem.id === bookingData.selectedBedId);
  const selectedPrice = selectedBed?.price || selectedRoom?.price || currentProperty.price;

  const highlights = useMemo(
    () => [
      { label: "Distance to University", value: currentProperty.distance, icon: Clock },
      { label: "Available Rooms", value: `${availableRooms.length} options`, icon: Bed },
      { label: "High-speed WiFi", value: "Included", icon: Wifi },
      { label: "Security", value: "Secure access", icon: ShieldCheck },
      { label: "Furnished", value: "Move-in ready", icon: Home },
      { label: "Utilities", value: "Mostly included", icon: Zap },
    ],
    [availableRooms.length, currentProperty.distance]
  );

  const tabs = useMemo(
    () => [
      { id: "rooms", label: "Rooms" },
      { id: "facilities", label: "Facilities" },
      { id: "bills", label: "Bills" },
      { id: "reviews", label: "Reviews" },
      { id: "location", label: "Location" },
    ],
    []
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveTab(visible.target.id);
      },
      { rootMargin: "-130px 0px -55% 0px", threshold: [0.15, 0.35, 0.6] }
    );

    tabs.forEach((tab) => {
      const section = sectionRefs.current[tab.id];
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [tabs]);

  useEffect(() => {
    document.body.style.overflow = isBookingOpen || isGalleryOpen || isVideoOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isBookingOpen, isGalleryOpen, isVideoOpen]);

  const setSectionRef = useCallback(
    (idName) => (node) => {
      sectionRefs.current[idName] = node;
    },
    []
  );

  const scrollToSection = useCallback((sectionId) => {
    sectionRefs.current[sectionId]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % currentProperty.images.length);
  }, [currentProperty.images.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev === 0 ? currentProperty.images.length - 1 : prev - 1));
  }, [currentProperty.images.length]);

  const openBooking = useCallback((roomId = "") => {
    setBookingStep(1);
    setBookingData({
      bookingType: "bed",
      selectedRoomId: roomId,
      selectedBedId: "",
      moveInDate: "",
      duration: "6 months",
      paymentMethod: "card",
      fullName: "",
      age: "",
      university: "",
      faculty: "",
      idUploaded: false,
      agreed: false,
    });
    setIsBookingOpen(true);
  }, []);

  const updateBooking = useCallback((patch) => {
    setBookingData((prev) => ({ ...prev, ...patch }));
  }, []);

  const canContinue = useMemo(() => {
    if (bookingStep === 1) {
      return Boolean(
        bookingData.selectedRoomId &&
          bookingData.moveInDate &&
          bookingData.duration &&
          (bookingData.bookingType === "room" || bookingData.selectedBedId)
      );
    }
    if (bookingStep === 2) return Boolean(bookingData.fullName && bookingData.age && bookingData.university && bookingData.faculty && bookingData.idUploaded);
    if (bookingStep === 3) return Boolean(bookingData.paymentMethod && bookingData.agreed);
    return true;
  }, [bookingData, bookingStep]);

  const handleNextBooking = useCallback(() => {
    setBookingStep((prev) => Math.min(prev + 1, 4));
  }, []);

  const showNotice = useCallback((message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }, []);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: currentProperty.title,
      text: `Check this student accommodation: ${currentProperty.title}`,
      url: window.location.href,
    };
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

  const handleSave = useCallback(() => {
    setIsSaved((prev) => {
      const next = !prev;
      showNotice(next ? "Property saved" : "Property removed from saved");
      return next;
    });
  }, [showNotice]);

  const handleContactOwner = useCallback(() => {
    navigate("/owner/messages", {
      state: {
        ownerName: currentProperty.landlord.name,
        ownerAvatar: currentProperty.landlord.image,
        propertyId: currentProperty.id,
        propertyTitle: currentProperty.title,
      },
    });
  }, [currentProperty.id, currentProperty.landlord.image, currentProperty.landlord.name, currentProperty.title, navigate]);

  const openOwnerProfile = useCallback(() => {
    navigate("/owner/profile", {
      state: {
        ownerName: currentProperty.landlord.name,
        ownerAvatar: currentProperty.landlord.image,
        propertyId: currentProperty.id,
      },
    });
  }, [currentProperty.id, currentProperty.landlord.image, currentProperty.landlord.name, navigate]);

  const openGoogleMaps = useCallback(() => {
    window.open(`https://www.google.com/maps?q=${currentProperty.lat},${currentProperty.lng}`, "_blank", "noreferrer");
  }, [currentProperty.lat, currentProperty.lng]);

  const scrollSimilar = useCallback((direction) => {
    similarScrollRef.current?.scrollBy({ left: direction === "left" ? -390 : 390, behavior: "smooth" });
  }, []);

  if (isLoading) return <LoadingSkeleton />;
  if (notFound) return <NotFoundState navigate={navigate} />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#091E42]">
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeInUp .4s ease-out both; }
        .details-map .leaflet-container { width: 100%; height: 100%; border-radius: 18px; z-index: 1; }
        .details-map-pin {
          width: 38px; height: 38px; border-radius: 999px; border: 4px solid white;
          box-shadow: 0 14px 28px rgba(9, 30, 66, .24); display: grid; place-items: center;
        }
        .details-map-pin span { width: 10px; height: 10px; border-radius: 999px; background: #fff; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <Navbar />

      {notice && (
        <div className="fixed right-4 top-20 z-[130] rounded-full bg-[#091E42] px-5 py-3 text-sm font-bold text-white shadow-xl">
          {notice}
        </div>
      )}

      <main className="mx-auto w-full max-w-[1500px] px-4 py-5 md:px-6">
        <section className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-600">
              <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" /> {currentProperty.rating}</span>
              <span>({currentProperty.reviewCount} reviews)</span>
              <span className="text-slate-300">|</span>
              <button type="button" onClick={() => scrollToSection("location")} className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-[#155BC2]">
                <MapPin className="h-4 w-4" /> {currentProperty.address}
              </button>
            </div>
            <h1 className="text-2xl font-black leading-tight text-[#091E42] md:text-4xl">{currentProperty.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-bold text-slate-600">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-200"><Clock className="h-4 w-4 text-[#155BC2]" /> {currentProperty.distance}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-200">From <strong className="text-[#155BC2]">EGP {currentProperty.price}</strong> /month</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={handleShare} className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95">
              <Share2 className="h-4 w-4" /> Share
            </button>
            <button type="button" onClick={handleSave} className={`inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-bold shadow-sm transition active:scale-95 ${isSaved ? "border-rose-200 bg-rose-50 text-rose-600" : "border-slate-200 bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-600"}`}>
              <Heart className={`h-4 w-4 ${isSaved ? "fill-rose-500" : ""}`} /> {isSaved ? "Saved" : "Save"}
            </button>
          </div>
        </section>

        <section className="grid gap-2 overflow-hidden rounded-3xl md:h-[450px] md:grid-cols-4 md:grid-rows-2">
          <button type="button" onClick={() => { setIsGalleryOpen(true); setCurrentImageIndex(0); }} className="group relative h-[330px] overflow-hidden bg-slate-200 md:col-span-2 md:row-span-2 md:h-full">
            <img src={currentProperty.images[0]} alt="Main property" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="eager" />
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-[#091E42] shadow-lg">
                <Camera className="h-4 w-4" /> View all photos
              </span>
              <button type="button" onClick={(event) => { event.stopPropagation(); setIsVideoPlaying(false); setIsVideoOpen(true); }} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-[#091E42] shadow-lg">
                <Video className="h-4 w-4" /> Video tour
              </button>
            </div>
          </button>
          {currentProperty.images.slice(1, 5).map((image, index) => (
            <button key={image} type="button" onClick={() => { setIsGalleryOpen(true); setCurrentImageIndex(index + 1); }} className="group hidden overflow-hidden bg-slate-200 md:block">
              <img src={image} alt={`Property ${index + 2}`} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
            </button>
          ))}
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-[#155BC2]">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
                <p className="mt-1 text-sm font-black text-[#091E42]">{item.value}</p>
              </div>
            );
          })}
        </section>

        <nav className="sticky top-0 z-30 -mx-4 mt-6 border-y border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur md:-mx-6 md:px-6">
          <div className="scrollbar-hide flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-1 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => scrollToSection(tab.id)}
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
        </nav>

        <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-10">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
              <SectionTitle title="About this property" subtitle={currentProperty.description} />
              <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-[#F8FAFC] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <img src={currentProperty.landlord.image} alt={currentProperty.landlord.name} className="h-12 w-12 rounded-full object-cover" loading="lazy" />
                  <div>
                    <p className="font-black text-[#091E42]">{currentProperty.landlord.name}</p>
                    <p className="text-xs font-semibold text-slate-500">{currentProperty.landlord.response}</p>
                  </div>
                </div>
                <button type="button" onClick={openOwnerProfile} className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold transition hover:border-[#155BC2] hover:text-[#155BC2] active:scale-95">
                  View Profile
                </button>
              </div>
            </section>

            <section id="rooms" ref={setSectionRef("rooms")} className="scroll-mt-28">
              <SectionTitle title="Choose your room" subtitle="Compare room types, beds, capacity, status, and monthly rent before booking." />
              <div className="grid gap-4">
                {currentProperty.rooms.map((room) => {
                  const status = getRoomStatus(room);
                  const availableBeds = room.beds.filter((bedItem) => bedItem.status === "AVAILABLE").length;
                  return (
                    <article key={room.id} className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md md:p-4">
                      <div className="grid gap-4 md:grid-cols-[190px_1fr_auto] md:items-center">
                        <img src={room.image} alt={room.name} loading="lazy" className="h-44 w-full rounded-2xl object-cover md:h-32" />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black text-[#091E42]">{room.type}</h3>
                            <span className={`rounded-full border px-3 py-1 text-xs font-black ${status.className}`}>{status.label}</span>
                          </div>
                          <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-600 sm:grid-cols-3">
                            <span className="inline-flex items-center gap-2"><Bed className="h-4 w-4 text-[#155BC2]" /> {room.beds.length} beds</span>
                            <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-[#155BC2]" /> {room.capacity} people</span>
                            <span className="inline-flex items-center gap-2"><CheckCircle className="h-4 w-4 text-[#10B981]" /> {availableBeds} available</span>
                          </div>
                          <p className="mt-3 text-xl font-black text-[#155BC2]">EGP {room.price}<span className="text-xs font-semibold text-slate-400"> /month</span></p>
                        </div>
                        <button type="button" onClick={() => openBooking(room.id)} className="h-11 rounded-full bg-[#155BC2] px-6 text-sm font-black text-white transition hover:bg-[#0f4699] active:scale-95">
                          Select Room
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section id="facilities" ref={setSectionRef("facilities")} className="scroll-mt-28">
              <SectionTitle title="Facilities and nearby services" subtitle="Everything students need day to day, from study comfort to essentials around the building." />
              <div className="rounded-lg bg-slate-100 p-6 shadow-sm ring-1 ring-slate-200">
                <h3 className="mb-4 text-xl font-bold text-[#091E42]">Property Facilities</h3>
                <div className="flex flex-wrap gap-3 border-b border-slate-400/70 pb-5">
                  {currentProperty.services.map((service) => {
                    const Icon = service.icon;
                    return (
                      <span key={service.name} className="inline-flex items-center gap-2 rounded-full bg-[#155BC2] px-4 py-2 text-xs font-bold text-white shadow-sm">
                        <Icon className="h-4 w-4" /> {service.name}
                      </span>
                    );
                  })}
                </div>
                <h3 className="mb-4 mt-5 text-xl font-bold text-[#091E42]">Nearby Services</h3>
                <div className="flex flex-wrap gap-3">
                  {nearbyPlaces.map((place) => (
                    <button key={place.name} type="button" onClick={() => scrollToSection("location")} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#091E42] shadow-sm ring-1 ring-slate-200 transition hover:text-[#155BC2] active:scale-95">
                      <MapPin className="h-4 w-4" /> {place.type}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section id="bills" ref={setSectionRef("bills")} className="scroll-mt-28">
              <SectionTitle title="Bills and utilities" subtitle="Transparent monthly utility expectations before you send a booking request." />
              <div className="rounded-lg bg-slate-100 p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex flex-wrap gap-3">
                {currentProperty.bills.map((bill) => {
                  const Icon = bill.icon;
                  return (
                    <span key={bill.name} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm ${bill.included ? "bg-[#155BC2]" : "bg-[#F59E0B]"}`}>
                      <Icon className="h-4 w-4" /> {bill.name}
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">
                        {bill.included ? "Included" : "Not Included"}
                      </span>
                    </span>
                  );
                })}
                </div>
              </div>
            </section>

            <section id="reviews" ref={setSectionRef("reviews")} className="scroll-mt-28">
              <SectionTitle title="Student reviews" subtitle="A Booking-style overview of what students say about the property." />
              <div className="space-y-6">
                <div className="rounded-lg bg-slate-100 p-6 shadow-sm ring-1 ring-slate-200">
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-[#091E42]">Average Rating</h3>
                      <p className="mt-1 text-sm font-bold text-slate-600">{currentProperty.reviewCount} verified student reviews</p>
                    </div>
                    <div className="rounded-full bg-[#155BC2] px-5 py-2 text-xl font-black text-white">
                      {currentProperty.rating}
                    </div>
                  </div>
                  <div className="space-y-5">
                    {ratingBreakdown.map((item) => (
                      <div key={item.label} className="grid gap-3 md:grid-cols-[220px_1fr_70px] md:items-center">
                        <span className="text-lg font-medium text-slate-800">{item.label}</span>
                        <div className="h-3 overflow-hidden rounded-full bg-white">
                          <div className="h-full rounded-full bg-[#155BC2]" style={{ width: `${item.value}%` }} />
                        </div>
                        <span className="text-sm font-black text-slate-600">{item.score.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {currentProperty.reviews.slice(0, visibleReviews).map((review) => (
                    <article key={review.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img src={review.avatar} alt={review.user} loading="lazy" className="h-10 w-10 rounded-full object-cover" />
                          <div>
                            <p className="text-sm font-black text-[#091E42]">{review.user}</p>
                            <p className="text-xs font-semibold text-slate-500">{review.date}</p>
                            <Stars value={review.rating} size="h-3 w-3" />
                          </div>
                        </div>
                        <span className="rounded-full bg-[#155BC2] px-3 py-1 text-xs font-black text-white">{review.rating}.0</span>
                      </div>
                      <p className="mt-4 min-h-[96px] text-sm leading-7 text-slate-600">"{review.text}"</p>
                    </article>
                  ))}
                </div>
                {visibleReviews < currentProperty.reviews.length && (
                  <button type="button" onClick={() => setVisibleReviews((prev) => prev + 2)} className="mt-5 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-black transition hover:border-[#155BC2] hover:text-[#155BC2]">
                    Load More Reviews
                  </button>
                )}
              </div>
            </section>

            <section id="location" ref={setSectionRef("location")} className="scroll-mt-28">
              <SectionTitle title="Location and nearby essentials" subtitle="See the property, university, transport, and daily services around the accommodation." />
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="details-map h-[380px] overflow-hidden rounded-[18px]">
                  <MapContainer center={[currentProperty.lat, currentProperty.lng]} zoom={15} scrollWheelZoom={false}>
                    <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[currentProperty.lat, currentProperty.lng]} icon={mapIcon}>
                      <Popup>
                        <strong>{currentProperty.title}</strong>
                        <br />
                        {currentProperty.address}
                      </Popup>
                    </Marker>
                    {nearbyMarkers.map((place) => (
                      <Marker key={place.name} position={[place.lat, place.lng]} icon={createPin(place.color)}>
                        <Popup>
                          <strong>{place.name}</strong>
                          <br />
                          {place.type}
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {nearbyPlaces.map((place) => (
                      <span key={place.name} className="rounded-full bg-[#F8FAFC] px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-slate-200">{place.type}</span>
                    ))}
                  </div>
                  <button type="button" onClick={openGoogleMaps} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#155BC2] px-5 text-sm font-black text-white transition hover:bg-[#0f4699]">
                    <ExternalLink className="h-4 w-4" /> Open In Google Maps
                  </button>
                </div>
              </div>
            </section>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-20 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Monthly rent from</p>
                  <p className="mt-1 text-3xl font-black text-[#091E42]">EGP {currentProperty.price}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Available</span>
              </div>
              <div className="mt-5 space-y-3 rounded-2xl bg-[#F8FAFC] p-4 text-sm font-bold text-slate-600">
                <p className="flex justify-between"><span>Deposit</span><strong className="text-[#091E42]">EGP {currentProperty.deposit}</strong></p>
                <p className="flex justify-between"><span>Move In</span><strong className="text-[#091E42]">Flexible</strong></p>
                <p className="flex justify-between"><span>Rooms</span><strong className="text-[#091E42]">{availableRooms.length} available</strong></p>
              </div>
              <button type="button" onClick={() => openBooking()} className="mt-5 h-12 w-full rounded-full bg-[#155BC2] text-sm font-black text-white shadow-md transition hover:bg-[#0f4699] active:scale-95">
                Book Now
              </button>
              <button type="button" onClick={handleContactOwner} className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white text-sm font-black text-[#091E42] transition hover:border-[#155BC2] hover:text-[#155BC2] active:scale-95">
                <MessageSquare className="h-4 w-4" /> Contact Owner
              </button>
              <p className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500"><Phone className="h-4 w-4" /> Owner replies fast</p>
            </div>
          </aside>
        </div>

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
            {similarProperties.map((item) => (
              <div key={item.id} className="w-[320px] shrink-0 sm:w-[360px]">
                <PropertyCard property={item} />
              </div>
            ))}
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] lg:hidden">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-500">From</p>
            <p className="text-lg font-black text-[#091E42]">EGP {currentProperty.price}<span className="text-xs text-slate-400"> /month</span></p>
          </div>
          <button type="button" onClick={() => openBooking()} className="h-12 rounded-full bg-[#155BC2] px-6 text-sm font-black text-white shadow-md">
            Book Now
          </button>
        </div>
      </div>

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

      {isVideoOpen && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="flex items-center gap-2 text-lg font-black text-[#091E42]">
                <PlayCircle className="h-5 w-5 text-[#155BC2]" /> Property video tour
              </h3>
              <button type="button" onClick={() => setIsVideoOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200" aria-label="Close video">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative aspect-video bg-slate-900">
              <img src={currentProperty.images[4]} alt="Video preview" className="h-full w-full object-cover opacity-70" />
              <div className="absolute inset-0 grid place-items-center">
                {isVideoPlaying ? (
                  <div className="rounded-full bg-white/90 px-6 py-3 text-sm font-black text-[#155BC2] shadow-lg">
                    Playing video tour
                  </div>
                ) : (
                  <button type="button" onClick={() => setIsVideoPlaying(true)} className="grid h-20 w-20 place-items-center rounded-full bg-white/90 text-[#155BC2] shadow-lg transition hover:scale-105 active:scale-95" aria-label="Play video tour">
                    <PlayCircle className="h-10 w-10" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isBookingOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-900/45 p-0 backdrop-blur-sm md:items-center md:p-4">
          <div className="flex max-h-[94vh] w-full max-w-[980px] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl md:rounded-3xl">
            <div className="border-b border-slate-200 bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <button type="button" onClick={() => setIsBookingOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200" aria-label="Close booking">
                  <X className="h-5 w-5" />
                </button>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-500">Step {Math.min(bookingStep, 3)} of 3</p>
                  <h2 className="mt-1 text-xl font-black text-[#091E42]">
                    {bookingStep === 1 && "Residence details"}
                    {bookingStep === 2 && "Personal and ID information"}
                    {bookingStep === 3 && "Booking confirmation"}
                    {bookingStep === 4 && "Request sent"}
                  </h2>
                </div>
              </div>
              {bookingStep !== 4 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {["Residence", "Personal info", "Payment"].map((label, index) => (
                  <div key={label}>
                    <div className={`h-2 rounded-full ${bookingStep >= index + 1 ? "bg-[#155BC2]" : "bg-slate-200"}`} />
                    <p className="mt-2 hidden text-xs font-bold text-slate-500 sm:block">{label}</p>
                  </div>
                ))}
              </div>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] p-5">
              {bookingStep === 1 && (
                <div className="space-y-5">
                  <div className="rounded-lg bg-white p-5 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-[#091E42]"><CalendarDays className="h-5 w-5 text-[#155BC2]" /> Move-in and stay dates</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-xs font-bold text-slate-500">Move-in date</span>
                        <input type="date" value={bookingData.moveInDate} onChange={(event) => updateBooking({ moveInDate: event.target.value })} className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-[#155BC2] focus:ring-2 focus:ring-blue-100" />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-bold text-slate-500">Stay duration</span>
                        <select value={bookingData.duration} onChange={(event) => updateBooking({ duration: event.target.value })} className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-[#155BC2] focus:ring-2 focus:ring-blue-100">
                          <option>1 month</option>
                          <option>3 months</option>
                          <option>6 months</option>
                          <option>12 months</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className="rounded-lg bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#155BC2]">{visibleRooms.length} available options</span>
                      <h3 className="flex items-center gap-2 text-lg font-black text-[#091E42]">Choose accommodation <Building2 className="h-5 w-5 text-[#155BC2]" /></h3>
                    </div>
                    <div className="mb-4 grid gap-3 sm:grid-cols-2">
                      {bookingTypeOptions.map((option) => {
                        const Icon = option.icon;
                        const active = bookingData.bookingType === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => updateBooking({ bookingType: option.id, selectedRoomId: "", selectedBedId: "" })}
                            className={`rounded-lg border p-4 text-left transition active:scale-[0.99] ${active ? "border-[#155BC2] bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-[#155BC2]/50"}`}
                          >
                            <Icon className="h-5 w-5 text-[#155BC2]" />
                            <p className="mt-2 font-black text-[#091E42]">{option.label}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">{option.description}</p>
                          </button>
                        );
                      })}
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      {visibleRooms.map((room) => {
                        const active = bookingData.selectedRoomId === room.id;
                        const status = getRoomStatus(room);
                        return (
                          <button
                            key={room.id}
                            type="button"
                            onClick={() =>
                              updateBooking({
                                selectedRoomId: room.id,
                                selectedBedId: bookingData.bookingType === "room" ? room.beds[0]?.id || "" : "",
                              })
                            }
                            className={`overflow-hidden rounded-lg border bg-white text-left transition active:scale-[0.99] ${active ? "border-[#155BC2] shadow-[0_0_0_2px_rgba(21,91,194,0.14)]" : "border-slate-200 hover:border-[#155BC2]/50"}`}
                          >
                            <div className="relative h-32">
                              <img src={room.image} alt={room.name} className="h-full w-full object-cover" />
                              {active && <span className="absolute right-3 top-3 rounded-full bg-[#155BC2] px-2 py-1 text-[10px] font-bold text-white">Selected</span>}
                            </div>
                            <div className="p-4">
                              <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${status.className}`}>{status.label}</span>
                              <p className="mt-3 font-black text-[#091E42]">{room.type}</p>
                              <p className="mt-1 text-xs font-bold text-slate-500">{room.beds.length} beds | {room.capacity} people</p>
                              <p className="mt-3 text-lg font-black text-[#155BC2]">EGP {room.price}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {bookingData.bookingType === "bed" && selectedRoom && (
                    <div className="rounded-lg bg-white p-5 shadow-sm">
                      <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-[#091E42]">Choose bed <Bed className="h-5 w-5 text-[#F59E0B]" /></h3>
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
                              className={`flex items-center justify-between rounded-lg border p-4 text-left transition disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${active ? "border-[#155BC2] bg-blue-50" : "border-slate-200 hover:border-[#155BC2]/50"}`}
                            >
                              <span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-black text-white ${available ? "bg-[#155BC2]" : "bg-slate-300"}`}>
                                {bedItem.name.split(" ").pop()?.replace("B", "").replace("C", "")}
                              </span>
                              <div className="text-right">
                                <p className="font-black">{bedItem.name}</p>
                                <p className="text-xs text-slate-500">{bedItem.status}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {bookingStep === 2 && (
                <div className="mx-auto max-w-3xl space-y-4">
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <h3 className="mb-5 flex items-center gap-2 text-lg font-black"><User className="h-5 w-5 text-[#155BC2]" /> Student information</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <input value={bookingData.fullName} onChange={(event) => updateBooking({ fullName: event.target.value })} placeholder="Full name" className="h-12 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-[#155BC2] focus:ring-4 focus:ring-blue-100" />
                      <input type="number" min="16" max="80" value={bookingData.age} onChange={(event) => updateBooking({ age: event.target.value })} placeholder="Age" className="h-12 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-[#155BC2] focus:ring-4 focus:ring-blue-100" />
                      <select value={bookingData.university} onChange={(event) => updateBooking({ university: event.target.value })} className="h-12 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-[#155BC2] focus:ring-4 focus:ring-blue-100">
                        <option value="">Choose university</option>
                        <option>Cairo University</option>
                        <option>Ain Shams University</option>
                        <option>Al-Azhar University</option>
                        <option>American University in Cairo</option>
                      </select>
                      <input value={bookingData.faculty} onChange={(event) => updateBooking({ faculty: event.target.value })} placeholder="Faculty / major" className="h-12 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-[#155BC2] focus:ring-4 focus:ring-blue-100" />
                    </div>
                  </div>
                  <button type="button" onClick={() => updateBooking({ idUploaded: true })} className={`flex min-h-[150px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${bookingData.idUploaded ? "border-emerald-300 bg-emerald-50" : "border-slate-300 bg-white hover:border-[#155BC2]/50"}`}>
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-blue-100 text-[#155BC2]">
                      {bookingData.idUploaded ? <Check className="h-7 w-7" /> : <UploadCloud className="h-7 w-7" />}
                    </span>
                    <p className="mt-4 font-black text-[#091E42]">{bookingData.idUploaded ? "Document uploaded" : "Upload student ID"}</p>
                    <p className="mt-1 text-xs text-slate-500">PNG, JPG, or PDF up to 5MB</p>
                  </button>
                </div>
              )}

              {bookingStep === 3 && (
                <div className="mx-auto max-w-3xl space-y-4">
                  <div className="rounded-lg bg-white p-5 shadow-sm">
                    <h3 className="mb-5 flex items-center gap-2 text-lg font-black text-[#091E42]">Booking summary</h3>
                    <div className="grid gap-5 md:grid-cols-[120px_1fr]">
                      <img src={currentProperty.images[0]} alt={currentProperty.title} className="h-28 w-full rounded-lg object-cover" />
                      <div>
                        <h4 className="font-black text-[#091E42]">{currentProperty.title}</h4>
                        <p className="mt-1 text-sm text-slate-500">{currentProperty.address}</p>
                        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                          <p className="font-bold text-slate-600"><CalendarDays className="mr-1 inline h-4 w-4" /> {bookingData.moveInDate}</p>
                          <p className="font-bold text-slate-600"><Clock className="mr-1 inline h-4 w-4" /> {bookingData.duration}</p>
                          <p className="font-bold text-slate-600"><Bed className="mr-1 inline h-4 w-4" /> {selectedRoom?.type || "Room"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <h3 className="mb-5 flex items-center gap-2 text-lg font-black"><CreditCard className="h-5 w-5 text-[#155BC2]" /> Payment method</h3>
                    <div className="grid gap-3 md:grid-cols-3">
                      {[{ id: "card", label: "Credit Card" }, { id: "wallet", label: "E-Wallet" }, { id: "instapay", label: "InstaPay" }].map((method) => (
                        <button key={method.id} type="button" onClick={() => updateBooking({ paymentMethod: method.id })} className={`rounded-2xl border p-4 font-black transition ${bookingData.paymentMethod === method.id ? "border-[#155BC2] bg-blue-50 text-[#155BC2]" : "border-slate-200 bg-white text-slate-600 hover:border-[#155BC2]/50"}`}>
                          {method.label}
                        </button>
                      ))}
                    </div>
                    {bookingData.paymentMethod === "card" && (
                      <div className="mt-4 rounded-lg bg-[#F3F6FA] p-4">
                        <div className="grid gap-4">
                          <input placeholder="Cardholder name" className="h-11 rounded-md border border-slate-200 px-4 text-sm outline-none focus:border-[#155BC2]" />
                          <input placeholder="0000 0000 0000 0000" className="h-11 rounded-md border border-slate-200 px-4 text-sm outline-none focus:border-[#155BC2]" />
                          <div className="grid gap-4 sm:grid-cols-2">
                            <input placeholder="MM/YY" className="h-11 rounded-md border border-slate-200 px-4 text-sm outline-none focus:border-[#155BC2]" />
                            <input placeholder="CVV" className="h-11 rounded-md border border-slate-200 px-4 text-sm outline-none focus:border-[#155BC2]" />
                          </div>
                        </div>
                      </div>
                    )}
                    {bookingData.paymentMethod === "wallet" && (
                      <div className="mt-4 rounded-lg bg-[#F3F6FA] p-4">
                        <div className="grid gap-4">
                          <select className="h-11 rounded-md border border-slate-200 px-4 text-sm outline-none focus:border-[#155BC2]">
                            <option>Choose wallet provider</option>
                            <option>Vodafone Cash</option>
                            <option>Orange Cash</option>
                            <option>Etisalat Cash</option>
                            <option>WE Pay</option>
                          </select>
                          <input placeholder="Wallet account number" className="h-11 rounded-md border border-slate-200 px-4 text-sm outline-none focus:border-[#155BC2]" />
                          <input placeholder="Transaction reference number" className="h-11 rounded-md border border-slate-200 px-4 text-sm outline-none focus:border-[#155BC2]" />
                        </div>
                      </div>
                    )}
                    {bookingData.paymentMethod === "instapay" && (
                      <div className="mt-4 rounded-lg bg-[#F3F6FA] p-4">
                        <div className="grid gap-4">
                          <input placeholder="InstaPay IPA or username" className="h-11 rounded-md border border-slate-200 px-4 text-sm outline-none focus:border-[#155BC2]" />
                          <input placeholder="Bank account holder name" className="h-11 rounded-md border border-slate-200 px-4 text-sm outline-none focus:border-[#155BC2]" />
                          <input placeholder="Transaction reference number" className="h-11 rounded-md border border-slate-200 px-4 text-sm outline-none focus:border-[#155BC2]" />
                        </div>
                      </div>
                    )}
                    <div className="mt-5 rounded-2xl bg-[#F8FAFC] p-4">
                      <div className="flex justify-between text-sm"><span className="text-slate-500">Deposit due today</span><span className="font-black">EGP {selectedPrice}</span></div>
                      <div className="mt-2 flex justify-between text-sm"><span className="text-slate-500">Monthly rent</span><span className="font-black text-slate-400">Paid after approval</span></div>
                    </div>
                  </div>
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-white p-4 shadow-sm">
                    <input type="checkbox" checked={bookingData.agreed} onChange={(event) => updateBooking({ agreed: event.target.checked })} className="mt-1 h-5 w-5 accent-[#155BC2]" />
                    <span className="text-sm leading-6 text-slate-600">I agree to the booking terms and understand that the request will be sent to the owner after payment confirmation.</span>
                  </label>
                </div>
              )}

              {bookingStep === 4 && (
                <div className="mx-auto flex min-h-[420px] max-w-xl flex-col items-center justify-center rounded-2xl bg-white p-8 text-center shadow-sm">
                  <div className="grid h-24 w-24 place-items-center rounded-full bg-emerald-50 text-[#10B981]">
                    <Check className="h-12 w-12" />
                  </div>
                  <h3 className="mt-6 text-3xl font-black">Booking request sent</h3>
                  <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">Your request has been sent to {currentProperty.landlord.name}. The owner will review it and reply soon.</p>
                  <button type="button" onClick={() => setIsBookingOpen(false)} className="mt-8 rounded-full bg-[#155BC2] px-8 py-3 font-black text-white transition hover:bg-[#0f4699]">Close</button>
                </div>
              )}
            </div>

            {bookingStep !== 4 && (
              <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-4">
                <button type="button" onClick={() => (bookingStep === 1 ? setIsBookingOpen(false) : setBookingStep((prev) => prev - 1))} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-black text-[#155BC2] transition hover:bg-blue-50">
                  <ChevronLeft className="h-4 w-4" /> {bookingStep === 1 ? "Cancel" : "Back"}
                </button>
                <button type="button" onClick={handleNextBooking} disabled={!canContinue} className="inline-flex items-center gap-2 rounded-full bg-[#155BC2] px-7 py-3 font-black text-white shadow-lg transition hover:bg-[#0f4699] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none">
                  {bookingStep === 3 ? "Submit booking request" : "Next"} <ArrowRight className="h-4 w-4" />
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
