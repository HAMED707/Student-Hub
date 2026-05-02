import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bath,
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
  Facebook,
  Flame,
  Heart,
  Home,
  Instagram,
  IdCard,
  KeyRound,
  Mail,
  MapPin,
  MessageSquare,
  Monitor,
  Phone,
  PlayCircle,
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
import logoFull from "../../assets/brand/icons/logo.svg";

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
    { name: "Water", icon: Droplet },
    { name: "Electricity", icon: Zap },
    { name: "Gas", icon: Flame },
    { name: "Internet", icon: Wifi },
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
  },
  {
    id: 105,
    title: "Student Studio - New Cairo",
    location: "New Cairo - 5th Settlement",
    distance: "Near AUC",
    city: "New Cairo",
    roommates: 0,
    price: 5200,
    rating: 4.9,
    reviews: 22,
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
  },
  {
    id: 106,
    title: "Shared Flat - Maadi",
    location: "Cairo - Maadi",
    distance: "Metro nearby",
    city: "Cairo",
    roommates: 3,
    price: 2200,
    rating: 4.4,
    reviews: 14,
    image: "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800&q=80",
  },
];

const mapIcon = L.divIcon({
  html: `<div class="details-map-pin"><span></span></div>`,
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -34],
});

const SectionTitle = ({ title, subtitle }) => (
  <div className="mb-5">
    <h2 className="text-2xl font-extrabold text-[#091E42]">{title}</h2>
    {subtitle && <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>}
  </div>
);

const Stars = ({ value, size = "h-4 w-4" }) => (
  <div className="flex items-center gap-0.5">
    {[...Array(5)].map((_, index) => (
      <Star key={index} className={`${size} ${index < Math.round(value) ? "fill-[#F59E0B] text-[#F59E0B]" : "text-slate-300"}`} />
    ))}
  </div>
);

const ratingBreakdown = [
  { label: "Landlord Communication", value: 82, score: 4.1 },
  { label: "Safety & Security", value: 88, score: 4.4 },
  { label: "Cleanliness", value: 76, score: 3.8 },
  { label: "Amenities & Services", value: 80, score: 4.0 },
  { label: "Location Convenience", value: 92, score: 4.6 },
  { label: "Value for Money", value: 84, score: 4.2 },
];

const Footer = ({ navigate }) => (
  <footer className="mt-16 bg-[#091E42] px-4 py-12 text-white">
    <div className="mx-auto grid w-full max-w-[1500px] gap-10 md:grid-cols-2 lg:grid-cols-4">
      <div>
        <img src={logoFull} alt="StudentHub" className="h-12 w-auto rounded-lg bg-white px-3 py-2" />
        <p className="mt-4 text-sm leading-6 text-white/70">Trusted student accommodation near universities across Egypt.</p>
        <div className="mt-6 flex gap-3">
          {[Facebook, Instagram, MessageSquare].map((Icon, index) => (
            <a key={index} href="https://studenthub.com" target="_blank" rel="noreferrer" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20" aria-label="Social link">
              <Icon className="h-5 w-5" />
            </a>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-extrabold">Quick Links</h3>
        <div className="mt-5 flex flex-col gap-3 text-sm text-white/70">
          <button type="button" onClick={() => navigate("/home")} className="text-left transition hover:text-white">Home</button>
          <button type="button" onClick={() => navigate("/find-room")} className="text-left transition hover:text-white">Find Room</button>
          <button type="button" onClick={() => navigate("/services")} className="text-left transition hover:text-white">Services</button>
          <button type="button" onClick={() => navigate("/roommate")} className="text-left transition hover:text-white">Roommate</button>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-extrabold">Contact</h3>
        <div className="mt-5 space-y-4 text-sm text-white/70">
          <p className="flex items-center gap-3"><Mail className="h-5 w-5 text-[#A0C4FF]" /> support@studenthub.com</p>
          <p className="flex items-center gap-3"><Phone className="h-5 w-5 text-[#A0C4FF]" /> +20 100 000 0000</p>
          <p className="flex items-center gap-3"><MapPin className="h-5 w-5 text-[#A0C4FF]" /> Cairo, Egypt</p>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-extrabold">For Students</h3>
        <p className="mt-4 text-sm leading-6 text-white/70">Book with clear room options, deposit details, and landlord approval before final move-in.</p>
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
);

const PropertyDetails = () => {
  const navigate = useNavigate();
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const similarScrollRef = useRef(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    moveInDate: "",
    duration: "6 months",
    bookingType: "bed",
    selectedRoomId: "",
    selectedBedId: "",
    paymentMethod: "card",
    fullName: "",
    age: "",
    university: "",
    faculty: "",
    idUploaded: false,
    agreed: false,
  });

  const selectedRoom = propertyData.rooms.find((room) => room.id === bookingData.selectedRoomId);
  const selectedBed = selectedRoom?.beds.find((bedItem) => bedItem.id === bookingData.selectedBedId);
  const selectedPrice = selectedBed?.price || selectedRoom?.price || propertyData.price;
  const depositAmount = selectedPrice;
  const totalDueToday = depositAmount;

  const availableRooms = propertyData.rooms.filter((room) => room.status === "AVAILABLE");

  const bookingTypeOptions = [
    { id: "bed", label: "Bed", icon: Bed, description: "Book one available bed in a shared room." },
    { id: "room", label: "Room", icon: Home, description: "Book a full private room when available." },
  ];

  const visibleRooms = useMemo(() => {
    if (bookingData.bookingType === "room") {
      return availableRooms.filter((room) => room.capacity === 1);
    }
    return availableRooms.filter((room) => room.beds.some((bedItem) => bedItem.status === "AVAILABLE"));
  }, [bookingData.bookingType, availableRooms]);

  const isStep1Valid = Boolean(
    bookingData.moveInDate &&
      bookingData.duration &&
      bookingData.selectedRoomId &&
      (bookingData.bookingType === "room" || bookingData.selectedBedId)
  );
  const isStep2Valid = Boolean(
    bookingData.fullName &&
      bookingData.age &&
      bookingData.university &&
      bookingData.faculty &&
      bookingData.idUploaded
  );
  const isStep3Valid = Boolean(bookingData.paymentMethod && bookingData.agreed);

  const resetBooking = () => {
    setBookingStep(1);
    setBookingData({
      moveInDate: "",
      duration: "6 months",
      bookingType: "bed",
      selectedRoomId: "",
      selectedBedId: "",
      paymentMethod: "card",
      fullName: "",
      age: "",
      university: "",
      faculty: "",
      idUploaded: false,
      agreed: false,
    });
  };

  const openBooking = () => {
    resetBooking();
    setIsBookingOpen(true);
  };

  useEffect(() => {
    if (isBookingOpen || isGalleryOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isBookingOpen, isGalleryOpen]);

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % propertyData.images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev === 0 ? propertyData.images.length - 1 : prev - 1));
  const nextReview = () => setReviewIndex((prev) => (prev + 1) % propertyData.reviews.length);
  const prevReview = () => setReviewIndex((prev) => (prev === 0 ? propertyData.reviews.length - 1 : prev - 1));
  const scrollToMap = () => document.getElementById("property-map")?.scrollIntoView({ behavior: "smooth", block: "center" });
  const scrollSimilar = (direction) => {
    similarScrollRef.current?.scrollBy({ left: direction === "left" ? -390 : 390, behavior: "smooth" });
  };

  const handleNextBooking = () => {
    if (bookingStep === 3) {
      setBookingStep(4);
      return;
    }
    setBookingStep((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans text-[#091E42]">
      <style>{`
        .details-map .leaflet-container {
          width: 100%;
          height: 100%;
          border-radius: 16px;
          z-index: 1;
        }
        .details-map-pin {
          width: 38px;
          height: 38px;
          border-radius: 999px;
          background: #155BC2;
          border: 4px solid white;
          box-shadow: 0 14px 28px rgba(9, 30, 66, 0.3);
          display: grid;
          place-items: center;
        }
        .details-map-pin span {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #ffffff;
        }
      `}</style>

      <Navbar />

      <main className="mx-auto w-full max-w-[1500px] px-5 py-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="max-w-4xl text-[34px] font-black leading-tight text-black">{propertyData.title}</h1>
            <button type="button" className="mt-5 flex items-center gap-2 text-left text-[13px] font-bold text-slate-600 underline underline-offset-2 transition hover:text-[#0A4AA2]">
              <MapPin className="h-5 w-5 text-slate-700 fill-slate-700" />
              {propertyData.address}
            </button>
          </div>

          <div className="flex flex-col items-start gap-5 pt-1 lg:items-end">
            <p className="text-xl font-black text-slate-500">
              From <span className="text-[#0A4AA2]">EGP {propertyData.price}</span><span className="text-base"> /month</span>
            </p>
            <button type="button" onClick={openBooking} className="rounded-full bg-[#003B8E] px-11 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-[#002d6d] active:scale-95">
              Select Room
            </button>
          </div>
        </div>

        <section className="grid h-auto gap-5 md:h-[425px] md:grid-cols-4 md:grid-rows-2">
          <button type="button" onClick={() => { setIsGalleryOpen(true); setCurrentImageIndex(0); }} className="group relative h-[320px] overflow-hidden rounded-lg md:col-span-2 md:row-span-2 md:h-full">
            <img src={propertyData.images[0]} alt="Main property" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-black text-slate-800 shadow">
                <Camera className="h-4 w-4" /> View {propertyData.images.length} Photos
              </span>
              <button type="button" onClick={(event) => { event.stopPropagation(); setIsVideoOpen(true); }} className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-black text-slate-800 shadow">
                <Video className="h-4 w-4" /> View Videos
              </button>
              <button type="button" onClick={(event) => { event.stopPropagation(); scrollToMap(); }} className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-black text-slate-800 shadow">
                <MapPin className="h-4 w-4" /> Map View
              </button>
            </div>
          </button>
          {propertyData.images.slice(1, 5).map((image, index) => (
            <button key={image} type="button" onClick={() => { setIsGalleryOpen(true); setCurrentImageIndex(index + 1); }} className="group hidden overflow-hidden rounded-lg md:block">
              <img src={image} alt={`Property ${index + 2}`} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
            </button>
          ))}
        </section>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_380px]">
          <div className="space-y-7">
            <section>
              <h2 className="text-3xl font-black text-black">About this Property</h2>
              <p className="mt-5 max-w-4xl text-sm leading-6 text-slate-600">{propertyData.description}</p>
              <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <img src={propertyData.landlord.image} alt={propertyData.landlord.name} className="h-10 w-10 rounded-full object-cover" />
                  <div>
                    <p className="font-extrabold">{propertyData.landlord.name}</p>
                  </div>
                </div>
                <button type="button" onClick={() => navigate(`/profile/${propertyData.landlord.name.toLowerCase().replaceAll(" ", "-")}`)} className="rounded-full border border-slate-700 bg-white px-8 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100">
                  View Profile
                </button>
              </div>
            </section>

            <div className="flex rounded-full bg-slate-200 p-1 text-sm font-bold text-slate-700">
              {["Rooms", "Facilities", "Bills", "Reviews"].map((tab) => (
                <button key={tab} type="button" className="flex-1 rounded-full px-4 py-2 transition hover:bg-white">{tab}</button>
              ))}
            </div>

            <section>
              <h2 className="mb-5 text-2xl font-black text-black">Choose Your Room</h2>
              <div className="space-y-4">
                {propertyData.rooms.map((room) => (
                  <div key={room.id} className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
                    <img src={room.image} alt={room.name} className="h-32 w-full rounded-md object-cover sm:w-44" />
                    <div className="flex flex-1 flex-col">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-xl font-black text-black">{room.type === "Twin room" ? "Twin Room - 2 Persons" : room.type === "Private room" ? "Single Room - Private Space" : "Shared Room - 3 Persons"}</h3>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                        <span className="rounded-full bg-[#6EA8FF] px-3 py-1 font-bold text-white">{room.beds.length} Bed</span>
                        <span className="rounded-full bg-[#6EA8FF] px-3 py-1 font-bold text-white">Desk</span>
                        <span className="rounded-full bg-[#6EA8FF] px-3 py-1 font-bold text-white">Air Conditioning</span>
                        <span className="rounded-full bg-[#6EA8FF] px-3 py-1 font-bold text-white">Closet</span>
                      </div>
                      <div className="mt-auto flex items-end justify-end pt-4">
                        <button type="button" onClick={openBooking} className="rounded-full bg-[#003B8E] px-9 py-3 text-sm font-bold text-white transition hover:bg-[#002d6d]">Enquire</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-5 text-2xl font-black text-black">Facilities & Services</h2>
              <div className="rounded-lg bg-slate-200 p-6 shadow-sm">
                <h3 className="mb-4 text-xl font-bold">Facilities</h3>
                <div className="flex flex-wrap gap-3 border-b border-slate-500 pb-5">
                  {propertyData.services.slice(0, 5).map((service) => {
                    const Icon = service.icon;
                    return (
                      <span key={service.name} className="inline-flex items-center gap-2 rounded-full bg-[#6EA8FF] px-4 py-2 text-xs font-bold text-white">
                        <Icon className="h-4 w-4" /> {service.name}
                      </span>
                    );
                  })}
                </div>
                <h3 className="mb-4 mt-5 text-xl font-bold">Services</h3>
                <div className="flex flex-wrap gap-3">
                  {["Restaurants", "Pharmacies", "Supermarkets", "14 mins from university", "Bus Stations"].map((service) => (
                    <span key={service} className="inline-flex items-center gap-2 rounded-full bg-[#6EA8FF] px-4 py-2 text-xs font-bold text-white">
                      <CheckCircle className="h-4 w-4" /> {service}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-5 text-2xl font-black text-black">Your Bills</h2>
              <div className="rounded-lg bg-slate-200 p-6 shadow-sm">
                <div className="flex flex-wrap gap-3">
                  {propertyData.bills.map((bill) => {
                    const Icon = bill.icon;
                    return (
                      <span key={bill.name} className="inline-flex items-center gap-2 rounded-full bg-[#6EA8FF] px-4 py-2 text-xs font-bold text-white">
                        <Icon className="h-4 w-4" /> {bill.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-5 text-2xl font-black text-black">Student Reviews & Ratings</h2>
              <div className="rounded-lg bg-slate-200 p-6 shadow-sm">
                {ratingBreakdown.map((item) => (
                  <div key={item.label} className="mb-5 grid gap-3 last:mb-0 md:grid-cols-[220px_1fr_70px] md:items-center">
                    <span className="text-lg font-medium text-slate-800">{item.label}</span>
                    <div className="h-3 overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-[#3B82F6]" style={{ width: `${item.value}%` }} />
                    </div>
                    <span className="text-sm font-black text-slate-600">{item.score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <div className="overflow-hidden">
                  <div className="flex transition-transform duration-300" style={{ transform: `translateX(-${reviewIndex * 100}%)` }}>
                    {propertyData.reviews.map((review) => (
                      <div key={review.id} className="w-full shrink-0 px-1 md:w-1/2 lg:w-1/3">
                        <div className="rounded-lg bg-[#3B82F6] p-6 text-white shadow-sm">
                          <p className="min-h-[110px] text-sm leading-7 text-white/90">"{review.text}"</p>
                          <div className="mt-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img src={review.avatar} alt={review.user} className="h-10 w-10 rounded-full object-cover" />
                              <div>
                                <p className="text-sm font-black">{review.user}</p>
                                <p className="text-xs text-white/60">{review.date}</p>
                              </div>
                            </div>
                            <span className="text-4xl font-black text-yellow-300">“</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-center gap-3">
                  <button type="button" onClick={prevReview} className="grid h-9 w-9 place-items-center rounded-full bg-white text-slate-700 shadow" aria-label="Previous review">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {propertyData.reviews.map((review, index) => (
                    <button key={review.id} type="button" onClick={() => setReviewIndex(index)} className={`h-3 rounded-full transition ${reviewIndex === index ? "w-7 bg-[#3B82F6]" : "w-3 bg-slate-400"}`} aria-label={`Show review ${index + 1}`} />
                  ))}
                  <button type="button" onClick={nextReview} className="grid h-9 w-9 place-items-center rounded-full bg-white text-slate-700 shadow" aria-label="Next review">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>
          </div>

          <aside>
            <div className="sticky top-5 rounded-lg border border-slate-800 bg-white p-6">
              <h3 className="text-xl font-black text-black">{propertyData.title}</h3>
              <div className="mt-5 rounded-lg bg-[#FFD98A] p-4">
                <p className="text-sm font-bold text-slate-600">From <span className="font-black text-[#0A4AA2]">EGP {propertyData.price}</span> /month</p>
                <button type="button" onClick={openBooking} className="mt-4 w-full rounded-full bg-[#003B8E] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#002d6d]">
                  Select Room
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-lg bg-[#74A9FF] px-4 py-3 text-white">
                <span className="text-lg font-black">Reviews Yet</span>
                <span className="flex items-center gap-1 text-sm font-bold"><Heart className="h-5 w-5" /> 1 person saved this</span>
              </div>
              <div className="mt-5 space-y-4 text-sm font-bold text-slate-700">
                <p className="flex items-start gap-2 underline underline-offset-2"><MapPin className="mt-0.5 h-5 w-5" /> {propertyData.address}</p>
                <p className="flex items-center gap-2"><Clock className="h-5 w-5" /> 14 mins from university</p>
              </div>
              <div id="property-map" className="details-map mt-6 h-[330px] overflow-hidden rounded-lg border border-slate-200">
                <MapContainer center={[propertyData.lat, propertyData.lng]} zoom={15} scrollWheelZoom={false}>
                  <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[propertyData.lat, propertyData.lng]} icon={mapIcon}>
                    <Popup>
                      <strong>{propertyData.title}</strong>
                      <br />
                      {propertyData.address}
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-16">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-black text-black">Find your perfect student home easily</h2>
              <p className="mt-3 text-xl font-medium text-slate-500">From shared rooms to private apartments near your university</p>
            </div>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => navigate("/find-room")} className="rounded-full border border-slate-800 bg-white px-7 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-100">
                View All
              </button>
              <button type="button" onClick={() => scrollSimilar("left")} className="grid h-12 w-12 place-items-center rounded-full border border-slate-800 bg-white text-slate-800 transition hover:bg-slate-100" aria-label="Previous homes">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => scrollSimilar("right")} className="grid h-12 w-12 place-items-center rounded-full border border-slate-800 bg-white text-slate-800 transition hover:bg-slate-100" aria-label="Next homes">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div ref={similarScrollRef} className="flex gap-8 overflow-x-auto pb-6 scroll-smooth">
            {similarProperties.map((item) => (
              <div key={item.id} className="w-[360px] shrink-0">
                <PropertyCard property={item} />
              </div>
            ))}
          </div>
        </section>
      </main>

      {isGalleryOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 p-4 text-white">
          <div className="flex items-center justify-between py-3">
            <p className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold">{currentImageIndex + 1} / {propertyData.images.length}</p>
            <button type="button" onClick={() => setIsGalleryOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20" aria-label="Close gallery">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center">
            <button type="button" onClick={prevImage} className="absolute left-2 grid h-12 w-12 place-items-center rounded-full bg-black/50 transition hover:bg-black/70" aria-label="Previous image">
              <ChevronLeft className="h-7 w-7" />
            </button>
            <img src={propertyData.images[currentImageIndex]} alt="Property gallery" className="max-h-full max-w-full rounded-2xl object-contain" />
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
                <PlayCircle className="h-5 w-5 text-[#003B8E]" /> Property video tour
              </h3>
              <button type="button" onClick={() => setIsVideoOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200" aria-label="Close video">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative aspect-video bg-slate-900">
              <img src={propertyData.images[4]} alt="Video preview" className="h-full w-full object-cover opacity-70" />
              <div className="absolute inset-0 grid place-items-center">
                <button type="button" className="grid h-20 w-20 place-items-center rounded-full bg-white/90 text-[#003B8E] shadow-lg">
                  <PlayCircle className="h-10 w-10" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isBookingOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/45 p-3 backdrop-blur-sm">
          <div className="flex max-h-[94vh] w-full max-w-[930px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <button type="button" onClick={() => setIsBookingOpen(false)} className="grid h-8 w-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100" aria-label="Close booking">
                  <X className="h-5 w-5" />
                </button>
                <div className="flex-1 text-right">
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
                      <div className={`h-2 rounded-full ${bookingStep >= index + 1 ? "bg-[#003B8E]" : "bg-slate-200"}`} />
                      <p className="mt-2 hidden text-xs font-bold text-slate-500 sm:block">{label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-[#F3F6FA] p-5">
              {bookingStep === 1 && (
                <div className="space-y-5">
                  <div className="rounded-lg bg-white p-5 shadow-sm">
                    <h3 className="mb-4 flex items-center justify-end gap-2 text-lg font-black text-[#091E42]">
                      Move-in and stay dates <CalendarDays className="h-5 w-5 text-[#003B8E]" />
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-right text-xs font-bold text-slate-500">Move-in date</span>
                        <input type="date" value={bookingData.moveInDate} onChange={(event) => setBookingData((prev) => ({ ...prev, moveInDate: event.target.value }))} className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-[#003B8E] focus:ring-2 focus:ring-blue-100" />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-right text-xs font-bold text-slate-500">Stay duration</span>
                        <select value={bookingData.duration} onChange={(event) => setBookingData((prev) => ({ ...prev, duration: event.target.value }))} className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-[#003B8E] focus:ring-2 focus:ring-blue-100">
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
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#003B8E]">{visibleRooms.length} available options</span>
                      <h3 className="flex items-center gap-2 text-lg font-black text-[#091E42]">Choose accommodation <Building2 className="h-5 w-5 text-[#003B8E]" /></h3>
                    </div>

                    <div className="mb-4 grid gap-3 sm:grid-cols-2">
                      {bookingTypeOptions.map((option) => {
                        const Icon = option.icon;
                        const active = bookingData.bookingType === option.id;
                        return (
                          <button key={option.id} type="button" onClick={() => setBookingData((prev) => ({ ...prev, bookingType: option.id, selectedRoomId: "", selectedBedId: "" }))} className={`rounded-lg border p-4 text-left transition ${active ? "border-[#003B8E] bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-[#003B8E]/50"}`}>
                            <Icon className="h-5 w-5 text-[#003B8E]" />
                            <p className="mt-2 font-black text-[#091E42]">{option.label}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">{option.description}</p>
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      {visibleRooms.map((room) => {
                        const roomActive = bookingData.selectedRoomId === room.id;
                        return (
                          <button key={room.id} type="button" onClick={() => setBookingData((prev) => ({ ...prev, selectedRoomId: room.id, selectedBedId: prev.bookingType === "room" ? room.beds[0].id : "" }))} className={`overflow-hidden rounded-lg border bg-white text-left transition ${roomActive ? "border-[#003B8E] shadow-[0_0_0_2px_rgba(0,59,142,0.12)]" : "border-slate-200 hover:border-[#003B8E]/50"}`}>
                            <div className="relative h-32">
                              <img src={room.image} alt={room.name} className="h-full w-full object-cover" />
                              {roomActive && <span className="absolute right-3 top-3 rounded-full bg-[#003B8E] px-2 py-1 text-[10px] font-bold text-white">Selected</span>}
                            </div>
                            <div className="p-4">
                              <p className="font-black text-[#091E42]">{room.name}</p>
                              <p className="mt-1 text-xs font-bold text-slate-500">{room.type}</p>
                              <p className="mt-3 text-lg font-black text-[#003B8E]">EGP {room.price}<span className="text-xs text-slate-400"> / month</span></p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {bookingData.bookingType === "bed" && selectedRoom && (
                    <div className="rounded-lg bg-white p-5 shadow-sm">
                      <h3 className="mb-4 flex items-center justify-end gap-2 text-lg font-black text-[#091E42]">Choose bed <Bed className="h-5 w-5 text-[#F59E0B]" /></h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {selectedRoom.beds.map((bedItem) => {
                          const available = bedItem.status === "AVAILABLE";
                          const active = bookingData.selectedBedId === bedItem.id;
                          return (
                            <button key={bedItem.id} type="button" disabled={!available} onClick={() => setBookingData((prev) => ({ ...prev, selectedBedId: bedItem.id }))} className={`flex items-center justify-between rounded-lg border p-4 text-left transition disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${active ? "border-[#003B8E] bg-blue-50" : "border-slate-200 hover:border-[#003B8E]/50"}`}>
                              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#003B8E] text-sm font-black text-white">{bedItem.name.split(" ").pop()?.replace("B", "").replace("C", "")}</span>
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
                <div className="space-y-5">
                  <div className="rounded-lg bg-white p-5 shadow-sm">
                    <h3 className="mb-1 flex items-center justify-end gap-2 text-lg font-black text-[#091E42]">Basic information <User className="h-5 w-5 text-[#003B8E]" /></h3>
                    <p className="mb-5 text-right text-sm text-slate-500">This information is shared with the owner after you submit the request.</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <input value={bookingData.fullName} onChange={(event) => setBookingData((prev) => ({ ...prev, fullName: event.target.value }))} placeholder="Full name" className="h-12 rounded-md border border-slate-200 px-4 text-sm outline-none transition focus:border-[#003B8E] focus:ring-2 focus:ring-blue-100" />
                      <input type="number" min="16" max="80" value={bookingData.age} onChange={(event) => setBookingData((prev) => ({ ...prev, age: event.target.value }))} placeholder="Age" className="h-12 rounded-md border border-slate-200 px-4 text-sm outline-none transition focus:border-[#003B8E] focus:ring-2 focus:ring-blue-100" />
                      <select value={bookingData.university} onChange={(event) => setBookingData((prev) => ({ ...prev, university: event.target.value }))} className="h-12 rounded-md border border-slate-200 px-4 text-sm outline-none transition focus:border-[#003B8E] focus:ring-2 focus:ring-blue-100">
                        <option value="">Choose university</option>
                        <option>Cairo University</option>
                        <option>Ain Shams University</option>
                        <option>Al-Azhar University</option>
                        <option>American University in Cairo</option>
                      </select>
                      <input value={bookingData.faculty} onChange={(event) => setBookingData((prev) => ({ ...prev, faculty: event.target.value }))} placeholder="Faculty / major" className="h-12 rounded-md border border-slate-200 px-4 text-sm outline-none transition focus:border-[#003B8E] focus:ring-2 focus:ring-blue-100" />
                    </div>
                  </div>

                  <div className="rounded-lg bg-white p-5 shadow-sm">
                    <h3 className="mb-1 flex items-center justify-end gap-2 text-lg font-black text-[#091E42]">Identity verification <IdCard className="h-5 w-5 text-[#003B8E]" /></h3>
                    <p className="mb-5 text-right text-sm text-slate-500">Upload student ID, national ID, or passport for owner verification.</p>
                    <button type="button" onClick={() => setBookingData((prev) => ({ ...prev, idUploaded: true }))} className={`flex min-h-[160px] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition ${bookingData.idUploaded ? "border-emerald-300 bg-emerald-50" : "border-slate-300 bg-[#F8FAFC] hover:border-[#003B8E]/50"}`}>
                      <span className="grid h-14 w-14 place-items-center rounded-full bg-blue-100 text-[#003B8E]">
                        {bookingData.idUploaded ? <Check className="h-7 w-7" /> : <UploadCloud className="h-7 w-7" />}
                      </span>
                      <p className="mt-4 font-black text-[#091E42]">{bookingData.idUploaded ? "Document uploaded" : "Choose file"}</p>
                      <p className="mt-1 text-xs text-slate-500">PNG, JPG, or PDF up to 5MB</p>
                    </button>
                  </div>
                </div>
              )}

              {bookingStep === 3 && (
                <div className="space-y-5">
                  <div className="rounded-lg bg-white p-5 shadow-sm">
                    <h3 className="mb-5 flex items-center justify-end gap-2 text-lg font-black text-[#091E42]">Booking summary <KeyRound className="h-5 w-5 text-[#F59E0B]" /></h3>
                    <div className="grid gap-5 md:grid-cols-[120px_1fr]">
                      <img src={propertyData.images[0]} alt={propertyData.title} className="h-28 w-full rounded-lg object-cover" />
                      <div>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h4 className="font-black text-[#091E42]">{propertyData.title}</h4>
                            <p className="mt-1 text-sm text-slate-500">{propertyData.address}</p>
                          </div>
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">Available</span>
                        </div>
                        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                          <p className="font-bold text-slate-600"><CalendarDays className="mr-1 inline h-4 w-4" /> {bookingData.moveInDate}</p>
                          <p className="font-bold text-slate-600"><Clock className="mr-1 inline h-4 w-4" /> {bookingData.duration}</p>
                          <p className="font-bold text-slate-600"><Bed className="mr-1 inline h-4 w-4" /> {selectedBed?.name || selectedRoom?.name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
                      <div className="flex justify-between text-sm"><span className="text-slate-500">Security deposit</span><span className="font-black">EGP {depositAmount}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-500">Monthly rent</span><span className="font-black text-slate-400">Paid after approval</span></div>
                      <div className="flex justify-between text-xl"><span className="font-black">Deposit due today</span><span className="font-black text-[#F59E0B]">EGP {totalDueToday}</span></div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-white p-5 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 font-black text-[#003B8E]"><CreditCard className="h-5 w-5" /> Select payment method</h3>
                    <div className="grid gap-3 md:grid-cols-3">
                      {[
                        { id: "card", label: "Credit Card" },
                        { id: "wallet", label: "E-Wallet" },
                        { id: "instapay", label: "InstaPay" },
                      ].map((method) => (
                        <button key={method.id} type="button" onClick={() => setBookingData((prev) => ({ ...prev, paymentMethod: method.id }))} className={`rounded-lg border p-4 font-black transition ${bookingData.paymentMethod === method.id ? "border-[#003B8E] bg-blue-50 text-[#003B8E]" : "border-slate-200 text-slate-600 hover:border-[#003B8E]/50"}`}>
                          {method.label}
                        </button>
                      ))}
                    </div>
                    {bookingData.paymentMethod === "card" && (
                      <div className="mt-4 rounded-lg bg-[#F3F6FA] p-4">
                        <div className="grid gap-4">
                          <input placeholder="Cardholder name" className="h-11 rounded-md border border-slate-200 px-4 text-sm outline-none focus:border-[#003B8E]" />
                          <input placeholder="0000 0000 0000 0000" className="h-11 rounded-md border border-slate-200 px-4 text-sm outline-none focus:border-[#003B8E]" />
                          <div className="grid gap-4 sm:grid-cols-2">
                            <input placeholder="MM/YY" className="h-11 rounded-md border border-slate-200 px-4 text-sm outline-none focus:border-[#003B8E]" />
                            <input placeholder="CVV" className="h-11 rounded-md border border-slate-200 px-4 text-sm outline-none focus:border-[#003B8E]" />
                          </div>
                        </div>
                      </div>
                    )}
                    {bookingData.paymentMethod === "wallet" && (
                      <div className="mt-4 rounded-lg bg-[#F3F6FA] p-4">
                        <div className="grid gap-4">
                          <select className="h-11 rounded-md border border-slate-200 px-4 text-sm outline-none focus:border-[#003B8E]">
                            <option>Choose wallet provider</option>
                            <option>Vodafone Cash</option>
                            <option>Orange Cash</option>
                            <option>Etisalat Cash</option>
                            <option>WE Pay</option>
                          </select>
                          <input placeholder="Wallet account number" className="h-11 rounded-md border border-slate-200 px-4 text-sm outline-none focus:border-[#003B8E]" />
                          <input placeholder="Transaction reference number" className="h-11 rounded-md border border-slate-200 px-4 text-sm outline-none focus:border-[#003B8E]" />
                        </div>
                      </div>
                    )}
                    {bookingData.paymentMethod === "instapay" && (
                      <div className="mt-4 rounded-lg bg-[#F3F6FA] p-4">
                        <div className="grid gap-4">
                          <input placeholder="InstaPay IPA or username" className="h-11 rounded-md border border-slate-200 px-4 text-sm outline-none focus:border-[#003B8E]" />
                          <input placeholder="Bank account holder name" className="h-11 rounded-md border border-slate-200 px-4 text-sm outline-none focus:border-[#003B8E]" />
                          <input placeholder="Transaction reference number" className="h-11 rounded-md border border-slate-200 px-4 text-sm outline-none focus:border-[#003B8E]" />
                        </div>
                      </div>
                    )}
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-white p-4 shadow-sm">
                    <input type="checkbox" checked={bookingData.agreed} onChange={(event) => setBookingData((prev) => ({ ...prev, agreed: event.target.checked }))} className="mt-1 h-5 w-5 accent-[#003B8E]" />
                    <span className="text-sm leading-6 text-slate-600">I agree to the booking terms and understand that the request will be sent to the owner after paying the deposit.</span>
                  </label>
                </div>
              )}

              {bookingStep === 4 && (
                <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg bg-white p-8 text-center shadow-sm">
                  <div className="grid h-24 w-24 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                    <Check className="h-12 w-12" />
                  </div>
                  <h3 className="mt-6 text-3xl font-black">Booking request sent</h3>
                  <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">The deposit step is complete and your request has been sent to {propertyData.landlord.name}. The owner will review it and reply soon.</p>
                  <button type="button" onClick={() => setIsBookingOpen(false)} className="mt-8 rounded-lg bg-[#003B8E] px-8 py-3 font-extrabold text-white transition hover:bg-[#002d6d]">Close</button>
                </div>
              )}
            </div>

            {bookingStep !== 4 && (
              <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-4">
                <button type="button" onClick={() => bookingStep === 1 ? setIsBookingOpen(false) : setBookingStep((prev) => prev - 1)} className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 font-extrabold text-[#003B8E] transition hover:bg-blue-50">
                  <ChevronLeft className="h-4 w-4" /> {bookingStep === 1 ? "Cancel" : "Back"}
                </button>
                <button type="button" onClick={handleNextBooking} disabled={(bookingStep === 1 && !isStep1Valid) || (bookingStep === 2 && !isStep2Valid) || (bookingStep === 3 && !isStep3Valid)} className="inline-flex items-center gap-2 rounded-md bg-[#003B8E] px-7 py-3 font-extrabold text-white shadow-lg transition hover:bg-[#002d6d] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none">
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
