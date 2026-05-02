import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Facebook,
  FileText,
  Globe,
  Instagram,
  Mail,
  Map,
  MapPin,
  Phone,
  Star,
  Twitter,
} from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import Navbar from "../../assets/components/Navbar/navbar.jsx";
import PropertyCard from "../../assets/components/PropertyCard/PropertyCard.jsx";
import logoFull from "../../assets/brand/icons/logo.svg";
import heroBanner from "../../assets/images/banners/hero_banner.png";
import studentsGroupImage from "../../assets/images/banners/image.png";

const partnerLogos = [
  { name: "EELU", src: "https://upload.wikimedia.org/wikipedia/commons/e/e6/Eelu_logo.png", link: "https://www.eelu.edu.eg/" },
  { name: "Sohag University", src: "https://upload.wikimedia.org/wikipedia/ar/9/98/Sohag_University_logo.png", link: "https://www.sohag-univ.edu.eg/" },
  { name: "Helwan University", src: "https://upload.wikimedia.org/wikipedia/ar/d/d0/Helwan_University_Logo.png", link: "https://www.helwan.edu.eg/" },
  { name: "Galala University", src: "https://upload.wikimedia.org/wikipedia/commons/0/06/Galala_University_Logo.png", link: "https://gu.edu.eg/" },
  { name: "Suez University", src: "https://upload.wikimedia.org/wikipedia/ar/6/62/Suez_University_Logo.png", link: "https://suezuniv.edu.eg/" },
  { name: "Mansoura University", src: "https://upload.wikimedia.org/wikipedia/ar/e/e1/Mansoura_University_logo.png", link: "https://www.mans.edu.eg/" },
  { name: "Cairo University", src: "https://upload.wikimedia.org/wikipedia/ar/9/9c/Cairo_University_logo.png", link: "https://cu.edu.eg/" },
  { name: "Ain Shams University", src: "https://upload.wikimedia.org/wikipedia/ar/6/64/Ain_Shams_University_logo.png", link: "https://www.asu.edu.eg/" },
];

const testimonialsData = [
  {
    id: 1,
    quote: "The process was very fast and efficient.",
    text: "It took us just a few hours to settle the booking. The support team was attentive and made sure our requests were fulfilled.",
    rating: 4,
    user: {
      name: "Amaaney Zulqarnain",
      location: "Cairo, EG",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    },
  },
  {
    id: 2,
    quote: "Best accommodation experience.",
    text: "I was struggling to find a place near my university, but StudentHub made it easy and answered every question clearly.",
    rating: 5,
    user: {
      name: "Sarah Johnson",
      location: "London, UK",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
    },
  },
  {
    id: 3,
    quote: "Highly recommended service.",
    text: "The booking confirmation was quick, the listing details were clear, and I found a room that matched my budget.",
    rating: 5,
    user: {
      name: "Michael Chen",
      location: "Sydney, AU",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    },
  },
];

const propertiesList = [
  {
    id: 1,
    title: "Furnished Apartment - El Hamra",
    location: "Cairo - El Hamra",
    distance: "14 mins from Cairo University",
    city: "Cairo",
    roommates: 2,
    price: 2500,
    rating: 4.5,
    reviews: 10,
    lat: 30.0444,
    lng: 31.2357,
    image: "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1470&q=80",
  },
  {
    id: 2,
    title: "Modern Studio - Nasr City",
    location: "Cairo - Nasr City",
    distance: "5 mins from Al-Azhar University",
    city: "Cairo",
    roommates: 1,
    price: 3200,
    rating: 4.8,
    reviews: 25,
    lat: 30.0561,
    lng: 31.33,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1180&q=80",
  },
  {
    id: 3,
    title: "Cozy Room - Dokki",
    location: "Giza - Dokki",
    distance: "10 mins from Cairo University",
    city: "Giza",
    roommates: 3,
    price: 1800,
    rating: 4.2,
    reviews: 8,
    lat: 30.0384,
    lng: 31.2107,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1170&q=80",
  },
  {
    id: 4,
    title: "Luxury Flat - New Cairo",
    location: "Cairo - 5th Settlement",
    distance: "Near AUC",
    city: "New Cairo",
    roommates: 2,
    price: 5000,
    rating: 4.9,
    reviews: 15,
    lat: 30.0284,
    lng: 31.4913,
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1170&q=80",
  },
  {
    id: 5,
    title: "Private Room - Zamalek",
    location: "Cairo - Zamalek",
    distance: "Near Helwan Fine Arts",
    city: "Cairo",
    roommates: 0,
    price: 6000,
    rating: 5,
    reviews: 4,
    lat: 30.0626,
    lng: 31.2197,
    image: "https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1170&q=80",
  },
];

const mapHousingPlaces = [
  ...propertiesList,
  {
    id: 1001,
    title: "Student Room - Abbasiya",
    location: "Cairo - Abbasiya",
    distance: "4 mins from Ain Shams University",
    city: "Cairo",
    roommates: 2,
    price: 2100,
    rating: 4.4,
    reviews: 13,
    lat: 30.0731,
    lng: 31.2838,
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 1002,
    title: "Shared Apartment - Maadi",
    location: "Cairo - Maadi",
    distance: "Near metro station",
    city: "Cairo",
    roommates: 3,
    price: 2600,
    rating: 4.6,
    reviews: 19,
    lat: 29.9602,
    lng: 31.2569,
    image: "https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 1003,
    title: "Room near Engineering",
    location: "Giza - Bein El-Sarayat",
    distance: "3 mins from Cairo University",
    city: "Giza",
    roommates: 2,
    price: 1700,
    rating: 4.3,
    reviews: 11,
    lat: 30.0299,
    lng: 31.2077,
    image: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 1004,
    title: "Alexandria Student Studio",
    location: "Alexandria - Shatby",
    distance: "Opposite Alexandria University",
    city: "Alexandria",
    roommates: 1,
    price: 2400,
    rating: 4.7,
    reviews: 22,
    lat: 31.2089,
    lng: 29.9187,
    image: "https://images.unsplash.com/photo-1502005229766-939cb93c59a5?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 1005,
    title: "Mansoura Campus Flat",
    location: "Mansoura - El Gamaa",
    distance: "7 mins from Mansoura University",
    city: "Mansoura",
    roommates: 3,
    price: 1600,
    rating: 4.2,
    reviews: 9,
    lat: 31.0431,
    lng: 31.3765,
    image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 1006,
    title: "Ismailia Student Housing",
    location: "Ismailia - Circular Road",
    distance: "10 mins from Suez Canal University",
    city: "Ismailia",
    roommates: 4,
    price: 1300,
    rating: 4.1,
    reviews: 8,
    lat: 30.5965,
    lng: 32.2715,
    image: "https://images.unsplash.com/photo-1555854743-e3c2f6f58951?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 1007,
    title: "Suez Private Room",
    location: "Suez - University District",
    distance: "8 mins from Suez University",
    city: "Suez",
    roommates: 1,
    price: 1500,
    rating: 4.2,
    reviews: 7,
    lat: 29.9668,
    lng: 32.5498,
    image: "https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 1008,
    title: "Helwan Shared Room",
    location: "Cairo - Helwan",
    distance: "6 mins from Helwan University",
    city: "Cairo",
    roommates: 3,
    price: 1400,
    rating: 4.0,
    reviews: 6,
    lat: 29.8414,
    lng: 31.3008,
    image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80",
  },
];

const egyptUniversities = [
  "Cairo University",
  "Ain Shams University",
  "Alexandria University",
  "Al-Azhar University",
  "Helwan University",
  "Mansoura University",
  "Suez Canal University",
  "American University in Cairo (AUC)",
];

const uniPropertiesData = [
  { id: 101, title: "Walking distance to Campus", location: "Giza - Dokki", university: "Cairo University", distance: "5 mins walk", city: "Giza", roommates: 2, price: 2000, rating: 4.6, reviews: 12, image: "https://images.unsplash.com/photo-1522771753035-4850d32f7041?auto=format&fit=crop&w=800&q=80" },
  { id: 102, title: "Cozy Room in Bein El-Sarayat", location: "Giza - Bein El-Sarayat", university: "Cairo University", distance: "2 mins walk", city: "Giza", roommates: 3, price: 1500, rating: 4.2, reviews: 8, image: "https://images.unsplash.com/photo-1596276020587-8044fe049813?auto=format&fit=crop&w=800&q=80" },
  { id: 201, title: "Luxury Apartment near Gate 3", location: "Cairo - Abbasiya", university: "Ain Shams University", distance: "2 mins walk", city: "Cairo", roommates: 1, price: 3500, rating: 4.8, reviews: 20, image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80" },
  { id: 202, title: "Student Residence - Khalifa", location: "Cairo - El Khalifa", university: "Ain Shams University", distance: "5 mins walk", city: "Cairo", roommates: 3, price: 2200, rating: 4.5, reviews: 9, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80" },
  { id: 301, title: "Sea View Apartment - Shatby", location: "Alexandria - Shatby", university: "Alexandria University", distance: "Opposite Campus", city: "Alexandria", roommates: 2, price: 2800, rating: 4.9, reviews: 30, image: "https://images.unsplash.com/photo-1502005229766-939cb93c59a5?auto=format&fit=crop&w=800&q=80" },
  { id: 401, title: "Student Housing Complex", location: "Ismailia - Circular Rd", university: "Suez Canal University", distance: "10 mins bus ride", city: "Ismailia", roommates: 3, price: 1200, rating: 4.3, reviews: 8, image: "https://images.unsplash.com/photo-1555854743-e3c2f6f58951?auto=format&fit=crop&w=800&q=80" },
  { id: 501, title: "Al-Azhar Special Housing", location: "Nasr City - Tayran St", university: "Al-Azhar University", distance: "5 mins walk", city: "Cairo", roommates: 4, price: 800, rating: 4.1, reviews: 50, image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80" },
  { id: 601, title: "Studio near AUC Gate 4", location: "New Cairo - The Spot", university: "American University in Cairo (AUC)", distance: "Across the street", city: "New Cairo", roommates: 0, price: 7000, rating: 4.9, reviews: 30, image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80" },
];

const createPropertyIcon = (property) =>
  L.divIcon({
    html: `
      <button class="home-map-marker" type="button" aria-label="${property.title}">
        <img src="${property.image}" alt="" />
      </button>
    `,
    className: "",
    iconSize: [76, 76],
    iconAnchor: [38, 76],
    popupAnchor: [0, -72],
  });

const SectionHeader = ({ title, highlight, subtitle, action }) => (
  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div>
      <h2 className="text-2xl font-extrabold text-[#091E42] md:text-3xl">
        {title} {highlight && <span className="text-[#155BC2]">{highlight}</span>}
      </h2>
      {subtitle && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">{subtitle}</p>}
    </div>
    {action}
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const featuredScrollRef = useRef(null);
  const uniScrollRef = useRef(null);
  const [selectedUniversity, setSelectedUniversity] = useState("Cairo University");
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const filteredUniProperties = useMemo(
    () => uniPropertiesData.filter((item) => item.university === selectedUniversity),
    [selectedUniversity]
  );
  const currentTestimonial = testimonialsData[testimonialIndex];

  const scroll = (ref, direction) => {
    ref.current?.scrollBy({ left: direction === "left" ? -380 : 380, behavior: "smooth" });
  };

  const nextTestimonial = () => setTestimonialIndex((prev) => (prev + 1) % testimonialsData.length);
  const prevTestimonial = () => setTestimonialIndex((prev) => (prev === 0 ? testimonialsData.length - 1 : prev - 1));

  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-sans text-[#091E42]">
      <style>{`
        @keyframes homeMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .home-marquee { animation: homeMarquee 30s linear infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .home-map .leaflet-container { width: 100%; height: 100%; border-radius: 16px; z-index: 1; }
        .home-map-marker {
          width: 70px;
          height: 70px;
          padding: 0;
          overflow: hidden;
          border-radius: 999px;
          border: 4px solid #ffffff;
          background: #ffffff;
          box-shadow: 0 14px 30px rgba(9, 30, 66, 0.26);
          cursor: pointer;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .home-map-marker:hover {
          transform: translateY(-4px) scale(1.06);
          box-shadow: 0 18px 36px rgba(9, 30, 66, 0.32);
        }
        .home-map-marker img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
      `}</style>

      <Navbar />

      <main>
        <section className="mx-auto mt-6 w-full max-w-[1500px] px-4">
          <div className="relative h-[380px] overflow-hidden rounded-2xl shadow-sm md:h-[500px]">
            <img src={heroBanner} alt="Students finding rooms" className="h-full w-full object-cover object-top brightness-95" />
            <div className="absolute inset-0 flex items-center bg-gradient-to-r from-black/35 via-black/10 to-transparent px-6 md:px-16">
              <div>
                <h1 className="max-w-2xl text-3xl font-extrabold leading-tight text-white drop-shadow-md md:text-5xl lg:text-6xl">
                  Search, explore and book your <span className="text-[#A0C4FF]">Room</span>!
                </h1>
                <button
                  type="button"
                  onClick={() => navigate("/find-room")}
                  className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#155BC2] px-7 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#0f4699] active:scale-95"
                >
                  Start searching <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-12 w-full max-w-[1500px] px-4">
          <SectionHeader
            title="Featured"
            highlight="Properties"
            subtitle="Top rated rooms and apartments recommended for students."
            action={
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/find-room")}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2 text-sm font-bold transition hover:border-[#155BC2] hover:text-[#155BC2]"
                >
                  View All <ArrowRight className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => scroll(featuredScrollRef, "left")} className="grid h-10 w-10 place-items-center rounded-full border border-slate-300 transition hover:border-[#155BC2] hover:text-[#155BC2]" aria-label="Previous properties">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => scroll(featuredScrollRef, "right")} className="grid h-10 w-10 place-items-center rounded-full border border-slate-300 transition hover:border-[#155BC2] hover:text-[#155BC2]" aria-label="Next properties">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            }
          />
          <div ref={featuredScrollRef} className="scrollbar-hide mt-6 flex gap-6 overflow-x-auto pb-4 scroll-smooth">
            {propertiesList.map((item) => (
              <div key={item.id} className="w-[320px] flex-shrink-0 sm:w-[360px]">
                <PropertyCard property={item} />
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-14 w-full max-w-[1500px] px-4">
          <SectionHeader
            title="Find homes by"
            highlight="University"
            subtitle="Choose your university and browse homes close to campus."
            action={
              <div className="flex gap-2">
                <button type="button" onClick={() => scroll(uniScrollRef, "left")} className="grid h-10 w-10 place-items-center rounded-full border border-slate-300 transition hover:border-[#155BC2] hover:text-[#155BC2]" aria-label="Previous university homes">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => scroll(uniScrollRef, "right")} className="grid h-10 w-10 place-items-center rounded-full border border-slate-300 transition hover:border-[#155BC2] hover:text-[#155BC2]" aria-label="Next university homes">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            }
          />

          <div className="scrollbar-hide mt-5 flex gap-3 overflow-x-auto pb-5">
            {egyptUniversities.map((uni) => (
              <button
                key={uni}
                type="button"
                onClick={() => setSelectedUniversity(uni)}
                className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold transition ${
                  selectedUniversity === uni ? "bg-[#091E42] text-white shadow-md" : "bg-[#EAF2FF] text-[#155BC2] hover:bg-[#D8E8FF]"
                }`}
              >
                {uni}
              </button>
            ))}
          </div>

          <div ref={uniScrollRef} className="scrollbar-hide flex gap-6 overflow-x-auto pb-4 scroll-smooth">
            {filteredUniProperties.length > 0 ? (
              filteredUniProperties.map((item) => (
                <div key={item.id} className="w-[320px] flex-shrink-0 sm:w-[360px]">
                  <PropertyCard property={item} />
                </div>
              ))
            ) : (
              <div className="w-full rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                <MapPin className="mx-auto h-8 w-8 text-[#155BC2]" />
                <h3 className="mt-3 text-lg font-extrabold">No listings yet near {selectedUniversity}</h3>
                <p className="mt-1 text-sm text-slate-500">Try another university.</p>
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto mt-14 w-full max-w-[1500px] px-4">
          <SectionHeader
            title="Housing"
            highlight="Map"
            subtitle="Move around the map or zoom in to discover more available housing places."
          />
          <div className="mt-6">
            <div className="home-map h-[440px] overflow-hidden rounded-2xl border border-slate-200 shadow-sm md:h-[600px]">
              <MapContainer
                center={[30.0444, 31.2357]}
                zoom={7}
                scrollWheelZoom={true}
                dragging={true}
                doubleClickZoom={true}
              >
                <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {mapHousingPlaces.map((property) => (
                  <Marker
                    key={property.id}
                    position={[property.lat, property.lng]}
                    icon={createPropertyIcon(property)}
                  >
                    <Popup>
                      <div className="w-[250px]">
                        <img src={property.image} alt={property.title} className="mb-3 h-[135px] w-full rounded-xl object-cover" />
                        <h3 className="text-sm font-extrabold text-[#091E42]">{property.title}</h3>
                        <p className="mt-1 text-xs text-slate-500">{property.location}</p>
                        <p className="mt-2 text-xs text-slate-500">{property.distance}</p>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="font-extrabold text-[#155BC2]">{property.price} EGP</span>
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <Star className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" /> {property.rating}
                          </span>
                        </div>
                        <button type="button" onClick={() => navigate(`/find-room/${property.id}`)} className="mt-4 w-full rounded-lg bg-[#155BC2] py-2 text-sm font-bold text-white transition hover:bg-[#0f4699]">
                          View property
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </section>

        <section className="mt-16 overflow-hidden bg-[#A0C4FF] py-12">
          <h2 className="text-center text-3xl font-extrabold text-white drop-shadow-sm">University Partners</h2>
          <div className="mt-8 flex overflow-hidden">
            <div className="home-marquee flex min-w-max items-center gap-12 px-6">
              {[...partnerLogos, ...partnerLogos].map((partner, index) => (
                <a
                  key={`${partner.name}-${index}`}
                  href={partner.link}
                  target="_blank"
                  rel="noreferrer"
                  title={partner.name}
                  className="grid h-24 w-24 flex-shrink-0 place-items-center rounded-full border border-white/40 bg-white/25 p-4 backdrop-blur transition hover:scale-110 hover:bg-white/40 md:h-32 md:w-32"
                >
                  <img src={partner.src} alt={partner.name} className="h-full w-full object-contain grayscale transition hover:grayscale-0" />
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto mt-16 w-full max-w-[1500px] px-4">
          <div className="rounded-t-2xl bg-[#E6FBF6] px-6 py-12 md:px-12">
            <h2 className="text-3xl font-extrabold md:text-4xl">
              Booking <span className="text-[#155BC2]">Process</span>
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {[
                { icon: Map, step: "Step 1", title: "Explore your city", text: "Discover rooms and apartments around the neighborhoods closest to your campus." },
                { icon: FileText, step: "Step 2", title: "Submit an application", text: "Apply for the properties that match your budget, commute, and roommate needs." },
                { icon: CheckCircle, step: "Step 3", title: "Confirm your booking", text: "Finish the agreement and get ready for your next student-life chapter." },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.step}>
                    <div className="grid h-32 w-32 place-items-center rounded-full bg-white/70 text-[#155BC2] shadow-sm">
                      <Icon className="h-14 w-14" />
                    </div>
                    <p className="mt-5 text-sm font-bold text-[#155BC2]">{item.step}</p>
                    <h3 className="mt-1 text-xl font-extrabold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                  </div>
                );
              })}
            </div>
            <button type="button" onClick={() => navigate("/find-room")} className="mx-auto mt-10 flex items-center gap-2 rounded-full bg-[#155BC2] px-8 py-3 font-bold text-white shadow-lg transition hover:bg-[#0f4699] active:scale-95">
              Start Now <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1500px] px-4">
          <div className="rounded-b-2xl bg-[#EEF2FF] px-6 py-14 md:px-12">
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-6">
                <h2 className="text-3xl font-extrabold leading-tight md:text-5xl">
                  We Will Help You Find Your <span className="text-[#155BC2]">Perfect Room!</span>
                </h2>
              </div>
              <div className="rounded-2xl bg-[#A0C4FF] p-7 lg:col-span-3">
                <h3 className="text-xl font-extrabold">Perfect Home Guarantee</h3>
                <p className="mt-3 text-sm leading-6 text-[#091E42]/75">Trusted partners and clear details give students peace of mind before booking.</p>
              </div>
              <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80" alt="Students relaxing" className="h-48 w-full rounded-2xl object-cover lg:col-span-3" />
              <div className="rounded-2xl bg-[#FBBF24] p-7 lg:col-span-4">
                <h3 className="text-xl font-extrabold">Price Match Promise</h3>
                <p className="mt-3 text-sm leading-6">If you find your accommodation at a lower price, we help match it at booking time.</p>
              </div>
              <img src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80" alt="Student with headphones" className="h-48 w-full rounded-2xl object-cover lg:col-span-3" />
              <div className="rounded-2xl bg-[#047857] p-7 text-white lg:col-span-5">
                <h3 className="text-xl font-extrabold">Instant Book Available</h3>
                <p className="mt-3 text-sm leading-6 text-white/85">Secure homes that are ready for fast booking and matched to your needs.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-16 grid w-full max-w-[1500px] gap-6 px-4 md:grid-cols-2">
          {[
            { title: "Partner With Us", text: "Offer students a seamless booking process and reliable housing support.", action: "Partner With Us" },
            { title: "List With Us", text: "List your properties efficiently and reach students looking near universities.", action: "List With Us" },
          ].map((card) => (
            <div key={card.title} className="overflow-hidden rounded-2xl bg-[#D2E6FA] p-8 shadow-sm md:p-10">
              <h3 className="text-2xl font-extrabold md:text-3xl">{card.title}</h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-[#091E42]/70">{card.text}</p>
              <button type="button" className="mt-6 rounded-full bg-[#155BC2] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#0f4699]">
                {card.action}
              </button>
            </div>
          ))}
        </section>

        <section className="mx-auto mt-16 w-full max-w-[1500px] px-4 pb-20">
          <h2 className="text-3xl font-extrabold md:text-4xl">
            What <span className="text-[#155BC2]">Students</span> Say About Us?
          </h2>
          <div className="mt-10 grid items-center gap-10 lg:grid-cols-2">
            <img src={studentsGroupImage} alt="Happy students" className="mx-auto w-full max-w-[500px] object-contain" />
            <div>
              <div className="rounded-[28px] bg-[#FEF6E0] p-7 shadow-sm md:p-10">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-5xl font-black leading-none text-[#F59E0B]">"</span>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-5 w-5 ${i < currentTestimonial.rating ? "fill-[#F59E0B] text-[#F59E0B]" : "text-slate-300"}`} />
                    ))}
                  </div>
                </div>
                <h3 className="mt-6 text-xl font-extrabold">{currentTestimonial.quote}</h3>
                <p className="mt-3 text-sm leading-7 text-[#091E42]/75">{currentTestimonial.text}</p>
                <div className="mt-8 flex items-center gap-3">
                  <img src={currentTestimonial.user.image} alt={currentTestimonial.user.name} className="h-11 w-11 rounded-full object-cover ring-2 ring-white" />
                  <div>
                    <h4 className="text-sm font-extrabold">{currentTestimonial.user.name}</h4>
                    <p className="flex items-center gap-1 text-xs font-medium text-[#091E42]/60">
                      <MapPin className="h-3 w-3" /> {currentTestimonial.user.location}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-center gap-5">
                <button type="button" onClick={prevTestimonial} className="grid h-12 w-12 place-items-center rounded-full border-2 border-[#8BA3C8]/50 text-[#155BC2] transition hover:border-[#155BC2] hover:bg-blue-50" aria-label="Previous testimonial">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <div className="flex gap-2">
                  {testimonialsData.map((item, index) => (
                    <button key={item.id} type="button" onClick={() => setTestimonialIndex(index)} className={`h-3 rounded-full transition ${index === testimonialIndex ? "w-8 bg-[#091E42]" : "w-3 border-2 border-[#091E42]"}`} aria-label={`Show testimonial ${index + 1}`} />
                  ))}
                </div>
                <button type="button" onClick={nextTestimonial} className="grid h-12 w-12 place-items-center rounded-full border-2 border-[#8BA3C8]/50 text-[#155BC2] transition hover:border-[#155BC2] hover:bg-blue-50" aria-label="Next testimonial">
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#091E42] px-4 py-12 text-white">
        <div className="mx-auto grid w-full max-w-[1500px] gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <img src={logoFull} alt="StudentHub" className="h-12 w-auto rounded-lg bg-white px-3 py-2" />
            <p className="mt-4 text-sm leading-6 text-white/70">Find trusted student accommodation near universities across Egypt.</p>
            <div className="mt-6 flex gap-3">
              {[Facebook, Instagram, Twitter].map((Icon, index) => (
                <a key={index} href="https://studenthub.com" target="_blank" rel="noreferrer" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20" aria-label="Social link">
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-extrabold">Quick Links</h3>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/70">
              <button type="button" onClick={() => navigate("/")} className="text-left transition hover:text-white">Home</button>
              <button type="button" onClick={() => navigate("/find-room")} className="text-left transition hover:text-white">Find Room</button>
              <button type="button" onClick={() => navigate("/owner/dashboard")} className="text-left transition hover:text-white">List Property</button>
              <button type="button" onClick={() => navigate("/login")} className="text-left transition hover:text-white">Login</button>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-extrabold">Contact</h3>
            <div className="mt-5 space-y-4 text-sm text-white/70">
              <p className="flex items-center gap-3"><Mail className="h-5 w-5 text-[#A0C4FF]" /> support@studenthub.com</p>
              <p className="flex items-center gap-3"><Phone className="h-5 w-5 text-[#A0C4FF]" /> +20 100 000 0000</p>
              <p className="flex items-center gap-3"><Globe className="h-5 w-5 text-[#A0C4FF]" /> www.studenthub.com</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-extrabold">Newsletter</h3>
            <p className="mt-4 text-sm leading-6 text-white/70">Get new rooms and student offers in your inbox.</p>
            <div className="mt-5 flex flex-col gap-3">
              <input type="email" placeholder="Enter your email" className="h-11 rounded-xl border border-white/10 bg-white/10 px-4 text-sm text-white outline-none placeholder:text-white/50" />
              <button type="button" className="h-11 rounded-xl bg-[#155BC2] text-sm font-bold transition hover:bg-[#0f4699]">Subscribe</button>
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
    </div>
  );
};

export default Home;
