import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import Navbar from "../../assets/components/Navbar/navbar.jsx";
import PropertyCard from "../../assets/components/PropertyCard/PropertyCard.jsx";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Map, FileText, CheckCircle } from "lucide-react"; 
import heroBanner from "../../assets/images/banners/hero_banner.png"; 

// 👇 استيراد الصورة المجمعة (تأكد من أن المسار واسم الملف صحيحين)
// يفضل إعادة تسمية الملف ليكون بدون مسافات، مثلاً: students_group.png
import studentsGroupImage from "../../assets/images/banners/image.png"; 

// --- بيانات شعارات الجامعات ---
const partnerLogos = [
  { name: "EELU", src: "https://upload.wikimedia.org/wikipedia/commons/e/e6/Eelu_logo.png" },
  { name: "Sohag University", src: "https://upload.wikimedia.org/wikipedia/ar/9/98/Sohag_University_logo.png" },
  { name: "Helwan University", src: "https://upload.wikimedia.org/wikipedia/ar/d/d0/Helwan_University_Logo.png" },
  { name: "Galala University", src: "https://upload.wikimedia.org/wikipedia/commons/0/06/Galala_University_Logo.png" },
  { name: "Suez University", src: "https://upload.wikimedia.org/wikipedia/ar/6/62/Suez_University_Logo.png" },
  { name: "Mansoura National", src: "https://upload.wikimedia.org/wikipedia/ar/e/e1/Mansoura_University_logo.png" },
  { name: "Cairo University", src: "https://upload.wikimedia.org/wikipedia/ar/9/9c/Cairo_University_logo.png" },
  { name: "Ain Shams", src: "https://upload.wikimedia.org/wikipedia/ar/6/64/Ain_Shams_University_logo.png" }
];

// --- بيانات آراء الطلاب ---
const testimonialsData = [
  {
    id: 1,
    quote: "The process was very fast and...",
    text: "The process was very fast and efficient. It took us just a few hours to fully settle the booking. The people in charge of were very attentive and always ensure that our requests were fulfilled.",
    rating: 4,
    user: {
      name: "Amaaney Zulqarnain",
      location: "Cairo, EG",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
    }
  },
  {
    id: 2,
    quote: "Best accommodation ever!",
    text: "I was struggling to find a place near my university, but StudentHub made it incredibly easy. The support team was available 24/7 and answered all my questions patiently.",
    rating: 5,
    user: {
      name: "Sarah Johnson",
      location: "London, UK",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80"
    }
  },
  {
    id: 3,
    quote: "Highly recommended service",
    text: "The price match promise is real! I found a cheaper option elsewhere and they matched it instantly. The booking confirmation was quick and hassle-free.",
    rating: 5,
    user: {
      name: "Michael Chen",
      location: "Sydney, AU",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"
    }
  }
];

const Home = () => {
  const navigate = useNavigate();
  
  // Refs for scrolling
  const featuredScrollRef = useRef(null);
  const uniScrollRef = useRef(null);
  
  // State for selected university
  const [selectedUniversity, setSelectedUniversity] = useState("Cairo University");

  // State for Testimonials Slider
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  // General Navigation
  const handleViewAll = () => {
    navigate("/find-room");
  };

  // Scroll Function
  const scroll = (ref, direction) => {
    if (ref.current) {
      const { current } = ref;
      const scrollAmount = 400; 
      if (direction === "left") {
        current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  // Testimonials Handlers
  const handleNextTestimonial = () => {
    setTestimonialIndex((prev) => (prev === testimonialsData.length - 1 ? 0 : prev + 1));
  };

  const handlePrevTestimonial = () => {
    setTestimonialIndex((prev) => (prev === 0 ? testimonialsData.length - 1 : prev - 1));
  };

  const currentTestimonial = testimonialsData[testimonialIndex];

  // ================= DATA =================
  const propertiesList = [
    {
      id: 1,
      title: "Furnished Apartment - El Hamra",
      location: "Cairo - El Hamra",
      distance: "14 mins from university of Cairo",
      city: "Cairo",
      roommates: 2,
      price: 2500,
      rating: 4.5,
      reviews: 10,
      image: "https://images.unsplash.com/photo-1554995207-c18c203602cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
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
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=1180&q=80"
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
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
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
      image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
    },
    {
      id: 5,
      title: "Private Room - Zamalek",
      location: "Cairo - Zamalek",
      distance: "Near Helwan Fine Arts",
      city: "Cairo",
      roommates: 0,
      price: 6000,
      rating: 5.0,
      reviews: 4,
      image: "https://images.unsplash.com/photo-1501183638710-841dd1904471?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
    }
  ];

  const egyptUniversities = [
    "Cairo University", "Ain Shams University", "Alexandria University", "Al-Azhar University",
    "Helwan University", "Mansoura University", "Assiut University", "Zagazig University",
    "Tanta University", "Suez Canal University", "Menoufia University", "Benha University",
    "Minia University", "Beni Suef University", "Fayoum University", "Sohag University",
    "Kafrelsheikh University", "Port Said University", "Aswan University", "Damietta University",
    "Suez University", "Luxor University", "Matrouh University", "New Valley University",
    "American University in Cairo (AUC)", "German University in Cairo (GUC)", "British University in Egypt (BUE)", 
    "Misr International University (MIU)", "October 6 University", "MSA University", "Future University in Egypt (FUE)"
  ];

  const uniPropertiesData = [
    // --- Cairo University ---
    { id: 101, title: "Walking distance to Campus", location: "Giza - Dokki", university: "Cairo University", distance: "5 mins walk", city: "Giza", roommates: 2, price: 2000, rating: 4.6, reviews: 12, image: "https://images.unsplash.com/photo-1522771753035-4850d32f7041?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    { id: 102, title: "Cozy Room in Bein El-Sarayat", location: "Giza - Bein El-Sarayat", university: "Cairo University", distance: "2 mins walk", city: "Giza", roommates: 3, price: 1500, rating: 4.2, reviews: 8, image: "https://images.unsplash.com/photo-1596276020587-8044fe049813?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    { id: 103, title: "Modern Apartment - Manial", location: "Cairo - Manial", university: "Cairo University", distance: "10 mins transport", city: "Cairo", roommates: 1, price: 3000, rating: 4.8, reviews: 20, image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    { id: 104, title: "Shared Flat - Giza Square", location: "Giza - Giza Square", university: "Cairo University", distance: "5 mins metro", city: "Giza", roommates: 4, price: 1200, rating: 4.0, reviews: 5, image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    // --- Ain Shams University ---
    { id: 201, title: "Luxury Apartment near Gate 3", location: "Cairo - Abbasiya", university: "Ain Shams University", distance: "2 mins walk", city: "Cairo", roommates: 1, price: 3500, rating: 4.8, reviews: 20, image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    { id: 202, title: "Budget Room - Roxy", location: "Cairo - Roxy", university: "Ain Shams University", distance: "10 mins metro", city: "Cairo", roommates: 2, price: 1800, rating: 4.3, reviews: 15, image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    { id: 203, title: "Student Residence - Khalifa", location: "Cairo - El Khalifa El Maamoun", university: "Ain Shams University", distance: "5 mins walk", city: "Cairo", roommates: 3, price: 2200, rating: 4.5, reviews: 9, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    // --- Alexandria University ---
    { id: 301, title: "Sea View Apartment - Shatby", location: "Alexandria - Shatby", university: "Alexandria University", distance: "Opposite Campus", city: "Alexandria", roommates: 2, price: 2800, rating: 4.9, reviews: 30, image: "https://images.unsplash.com/photo-1502005229766-939cb93c59a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    { id: 302, title: "Cozy Studio - Camp Cesar", location: "Alexandria - Camp Cesar", university: "Alexandria University", distance: "5 mins tram", city: "Alexandria", roommates: 1, price: 2000, rating: 4.4, reviews: 12, image: "https://images.unsplash.com/photo-1555854743-e3c2f6f58951?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    { id: 303, title: "Shared Room - Ibrahimiya", location: "Alexandria - Ibrahimiya", university: "Alexandria University", distance: "10 mins walk", city: "Alexandria", roommates: 3, price: 1100, rating: 4.1, reviews: 8, image: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    // --- Suez Canal University ---
    { id: 401, title: "Student Housing Complex", location: "Ismailia - Circular Rd", university: "Suez Canal University", distance: "10 mins bus ride", city: "Ismailia", roommates: 3, price: 1200, rating: 4.3, reviews: 8, image: "https://images.unsplash.com/photo-1555854743-e3c2f6f58951?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    { id: 402, title: "Apartment near Old Campus", location: "Ismailia - El Sheikh Zayed", university: "Suez Canal University", distance: "5 mins walk", city: "Ismailia", roommates: 2, price: 1500, rating: 4.5, reviews: 5, image: "https://images.unsplash.com/photo-1501183638710-841dd1904471?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    // --- Al-Azhar University ---
    { id: 501, title: "Al-Azhar Special Housing", location: "Nasr City - Taiaran St", university: "Al-Azhar University", distance: "5 mins walk", city: "Cairo", roommates: 4, price: 800, rating: 4.1, reviews: 50, image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    { id: 502, title: "Private Room - Hay El-Sabea", location: "Nasr City - Hay El-Sabea", university: "Al-Azhar University", distance: "10 mins walk", city: "Cairo", roommates: 1, price: 1800, rating: 4.6, reviews: 14, image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    // --- AUC ---
    { id: 601, title: "Studio near AUC Gate 4", location: "New Cairo - The Spot", university: "American University in Cairo (AUC)", distance: "Across the street", city: "New Cairo", roommates: 0, price: 7000, rating: 4.9, reviews: 30, image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    { id: 602, title: "Luxury Shared Flat", location: "New Cairo - Eastown", university: "American University in Cairo (AUC)", distance: "5 mins walk", city: "New Cairo", roommates: 2, price: 5500, rating: 4.8, reviews: 18, image: "https://images.unsplash.com/photo-1522771753035-4850d32f7041?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" }
  ];

  const filteredUniProperties = uniPropertiesData.filter(
    (item) => item.university === selectedUniversity
  );

  return (
    <div className="min-h-screen bg-white font-sans pb-0">
      {/* Styles */}
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: scroll 30s linear infinite;
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>

      <Navbar />

      {/* Hero Section */}
      <div className="mt-6 mx-2 md:mx-4 lg:mx-4">
        <div className="relative w-full h-[400px] md:h-[480px] rounded-[16px] overflow-hidden shadow-sm">
          <div className="absolute inset-0">
            <img
              src={heroBanner}
              alt="Hero Banner"
              className="w-full h-full object-cover object-top"
              style={{ filter: "brightness(0.95)" }}
            />
          </div>
          <div className="absolute inset-0 flex items-center px-6 md:px-16">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight drop-shadow-md max-w-2xl">
              Search, explore and <br />
              book your <span className="text-[#3B82F6]">Room</span>!
            </h1>
          </div>
        </div>
      </div>

      {/* ======================================================= */}
      {/* 1. FEATURED PROPERTIES */}
      {/* ======================================================= */}
      <div className="mt-12 mx-2 md:mx-4 lg:mx-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4 px-2">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0A2647]">
              Featured Properties
            </h2>
            <p className="text-gray-500 mt-2 text-sm md:text-base">
              Top rated properties recommended for you
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleViewAll}
              className="group flex items-center gap-2 px-6 py-2 rounded-full border border-gray-800 text-gray-900 bg-white font-medium transition-all duration-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 active:scale-95"
            >
              View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="flex gap-2">
              <button 
                onClick={() => scroll(featuredScrollRef, "left")} 
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 bg-white transition-all hover:border-blue-500 hover:text-blue-600 active:scale-90"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => scroll(featuredScrollRef, "right")}
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 bg-white transition-all hover:border-blue-500 hover:text-blue-600 active:scale-90"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div 
          ref={featuredScrollRef}
          className="flex gap-6 overflow-x-auto pb-4 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {propertiesList.map((item) => (
            <div key={item.id} className="flex-shrink-0 w-full max-w-sm">
              <PropertyCard property={item} />
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================= */}
      {/* 2. FIND HOMES BY UNIVERSITY */}
      {/* ======================================================= */}
      <div className="mt-16 mx-2 md:mx-4 lg:mx-4 px-2">
        <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0A2647]">
              Find your perfect student home easily
            </h2>
            <p className="text-gray-500 mt-2 text-sm md:text-base">
              From shared rooms to private apartments near your university
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => scroll(uniScrollRef, "left")}
              className="w-10 h-10 rounded-full border border-gray-400 flex items-center justify-center text-gray-700 bg-white hover:border-blue-600 hover:text-blue-600 active:scale-90 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => scroll(uniScrollRef, "right")}
              className="w-10 h-10 rounded-full border border-gray-400 flex items-center justify-center text-gray-700 bg-white hover:border-blue-600 hover:text-blue-600 active:scale-90 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-6 mb-2 scrollbar-hide">
          {egyptUniversities.map((uni, index) => (
            <button
              key={index}
              onClick={() => setSelectedUniversity(uni)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 
                ${selectedUniversity === uni 
                  ? 'bg-[#002B5B] text-white shadow-md transform scale-105' 
                  : 'bg-[#4285F4] text-white hover:bg-[#3367d6] opacity-90' 
                }`}
            >
              {uni}
            </button>
          ))}
        </div>

        <div 
          ref={uniScrollRef} 
          className="flex gap-6 overflow-x-auto pb-4 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filteredUniProperties.length > 0 ? (
            filteredUniProperties.map((item) => (
              <div key={item.id} className="flex-shrink-0 w-full max-w-sm">
                <PropertyCard property={item} />
              </div>
            ))
          ) : (
            <div className="w-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
              <div className="p-4 bg-blue-50 rounded-full mb-3 text-blue-500">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No listings yet near {selectedUniversity}</h3>
              <p className="text-gray-500 mt-1">Try another university.</p>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================= */}
      {/* 3. UNIVERSITY PARTNERS MARQUEE */}
      {/* ======================================================= */}
      <div className="mt-16 mx-2 md:mx-2 lg:mx-4 w-full bg-[#A0C4FF] py-16 overflow-hidden relative">
        <h2 className="text-center text-3xl font-bold text-white mb-8 drop-shadow-sm">
          University Partners
        </h2>
        <div className="relative w-full flex overflow-hidden group">
          <div className="flex animate-marquee whitespace-nowrap gap-16 px-8 items-center">
            {partnerLogos.map((partner, index) => (
              <div key={`logo-1-${index}`} className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 bg-white/20 backdrop-blur-sm rounded-full p-4 flex items-center justify-center hover:scale-110 transition-transform duration-300 border border-white/30">
                <img src={partner.src} alt={partner.name} className="w-full h-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300" />
              </div>
            ))}
            {partnerLogos.map((partner, index) => (
              <div key={`logo-2-${index}`} className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 bg-white/20 backdrop-blur-sm rounded-full p-4 flex items-center justify-center hover:scale-110 transition-transform duration-300 border border-white/30">
                <img src={partner.src} alt={partner.name} className="w-full h-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ======================================================= */}
      {/* 4. BOOKING PROCESS */}
      {/* ======================================================= */}
      <div className="mt-16 mx-2 md:mx-2 lg:mx-4 bg-[#E6FBF6] rounded-t-[16px] py-12 px-6 md:px-16 mb-0">
        
        <h2 className="text-3xl md:text-4xl font-bold text-[#0A2647] mb-12">
          Booking <span className="text-[#3B82F6]">Process</span>
        </h2>

        <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative">
          
          {/* Step 1 */}
          <div className="flex-1 flex flex-col group">
            <div className="h-48 w-full flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <div className="w-40 h-40 bg-white/60 rounded-full flex items-center justify-center text-blue-500 shadow-sm border border-white">
                  <Map className="w-16 h-16 opacity-70" />
                </div>
            </div>
            <span className="text-[#3B82F6] font-medium mb-1">Step 1</span>
            <h3 className="text-xl font-bold text-[#0A2647] mb-2">Explore your city</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Discover the accommodation options different cities have to offer as you plan for life at university.
            </p>
          </div>

          {/* Arrow 1 */}
          <div className="hidden md:flex pt-20 text-[#0A2647]">
            <ArrowRight className="w-8 h-8" />
          </div>

          {/* Step 2 */}
          <div className="flex-1 flex flex-col group">
            <div className="h-48 w-full flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <div className="w-40 h-40 bg-white/60 rounded-full flex items-center justify-center text-blue-500 shadow-sm border border-white">
                  <FileText className="w-16 h-16 opacity-70" />
                </div>
            </div>
            <span className="text-[#3B82F6] font-medium mb-1">Step 2</span>
            <h3 className="text-xl font-bold text-[#0A2647] mb-2">Submit an application</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Apply for any properties that meet your needs. We'll be there every step of the way to guide you.
            </p>
          </div>

          {/* Arrow 2 */}
          <div className="hidden md:flex pt-20 text-[#0A2647]">
            <ArrowRight className="w-8 h-8" />
          </div>

          {/* Step 3 */}
          <div className="flex-1 flex flex-col group">
            <div className="h-48 w-full flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <div className="w-40 h-40 bg-white/60 rounded-full flex items-center justify-center text-blue-500 shadow-sm border border-white">
                  <CheckCircle className="w-16 h-16 opacity-70" />
                </div>
            </div>
            <span className="text-[#3B82F6] font-medium mb-1">Step 3</span>
            <h3 className="text-xl font-bold text-[#0A2647] mb-2">Confirm your booking</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Lease signed and any pre-payments made, you're ready to embark on an exciting phase of life!
            </p>
          </div>
        </div>

        {/* Button */}
        <div className="mt-12 flex justify-center">
          <button 
            onClick={() => navigate("/find-room")}
            className="bg-[#155BC2] hover:bg-[#0f4699] text-white px-8 py-3 rounded-full font-semibold shadow-lg transition-all flex items-center gap-2 active:scale-95"
          >
            Start Now <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ======================================================= */}
      {/* 5. WE WILL HELP YOU (Bento Grid) */}
      {/* ======================================================= */}
      <div className="mx-2 md:mx-4 lg:mx-4 bg-[#EEF2FF] rounded-b-[16px] py-16 px-16 flex justify-center font-sans overflow-hidden mb-16">      
        <div className="w-full max-w-[1144px] flex flex-col gap-6">

          {/* الصف الأول */}
          <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-end">
            <div className="w-full lg:w-[800px] flex flex-col justify-center mb-8 lg:mb-24 text-center lg:text-left">
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#0A2647] leading-tight">
                We Will Help You Find <br />
                 Your <span className="text-[#3B82F6]">Perfect Room!</span>
            </h2>
          </div>

            <div className="w-full lg:w-[416px] h-auto lg:h-[188px] bg-[#A0C4FF] rounded-[16px] p-8 flex flex-col justify-center shadow-sm hover:shadow-lg transition-transform duration-300 hover:-translate-y-1">
              <h3 className="text-xl font-bold text-[#0A2647] mb-3">Perfect Home Guarantee</h3>
              <p className="text-[#0A2647]/80 text-xs leading-relaxed font-medium">
                We work with only trusted partners to give you a peace of mind during your stay at your home away from home.
              </p>
            </div>

            <div className="w-full lg:w-[330px] h-[190px] rounded-[16px] overflow-hidden relative shadow-sm group">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80" 
                alt="Students relaxing" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
          </div>

          {/* الصف الثاني */}
          <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start">
            <div className="w-full lg:w-[416px] h-auto lg:h-[188px] bg-[#FBBF24] rounded-[16px] p-8 flex flex-col justify-center shadow-sm hover:shadow-lg transition-transform duration-300 hover:-translate-y-1">
              <h3 className="text-xl font-bold text-[#0A2647] mb-3">Price Match Promise</h3>
              <p className="text-[#0A2647] text-xs leading-relaxed font-medium opacity-90">
                If you find your choice of accommodation available at a lower price, we will match that price at your time of booking.
              </p>
            </div>

            <div className="w-full lg:w-[215px] h-[188px] rounded-[16px] overflow-hidden relative shadow-sm group">
              <img 
                src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80"
                alt="Student with headphones" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>

            <div className="w-full lg:w-[465px] h-auto lg:h-[188px] bg-[#047857] rounded-[16px] p-8 flex flex-col justify-center shadow-sm hover:shadow-lg transition-transform duration-300 hover:-translate-y-1">
              <h3 className="text-xl font-bold text-white mb-3">Instant Book Available</h3>
              <p className="text-white text-xs leading-relaxed opacity-90">
                Take advantage of instant booking options to secure your ideal home that's perfectly matched to your needs.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ======================================================= */}
      {/* 6. PARTNER WITH US & LIST WITH US */}
      {/* ======================================================= */}
      <div className="w-full px-4 md:px-4 flex justify-center mb-16 font-sans">
        <div className="w-full max-w-[1500px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Partner With Us */}
          <div className="bg-[#D2E6FA] rounded-[16px] h-[240px] relative overflow-hidden flex items-center px-8 md:px-12 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="relative z-10 w-[65%] flex flex-col items-start gap-4">
              <h3 className="text-2xl md:text-3xl font-bold text-[#091E42]">
                Partner With Us
              </h3>
              <p className="text-[#091E42]/70 text-sm leading-relaxed font-medium">
                At StudentHub, we offer seamless booking process and a robust sales support.
              </p>
              <button className="bg-[#0f45a8] hover:bg-[#0A2647] text-white px-6 py-2.5 rounded-full text-sm font-bold transition-colors duration-300 shadow-sm">
                Partner With Us
              </button>
            </div>
            <div className="absolute right-0 bottom-0 w-[40%] h-full flex items-end justify-end pointer-events-none">
              <div className="w-full h-[90%] border-2 border-dashed border-blue-400/30 bg-blue-300/10 flex items-center justify-center rounded-tl-2xl">
                  <span className="text-[10px] text-blue-800">صورة المصافحة</span>
              </div>
            </div>
          </div>

          {/* List With Us */}
          <div className="bg-[#D2E6FA] rounded-[16px] h-[240px] relative overflow-hidden flex items-center px-8 md:px-12 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="relative z-10 w-[65%] flex flex-col items-start gap-4">
              <h3 className="text-2xl md:text-3xl font-bold text-[#091E42]">
                List With Us
              </h3>
              <p className="text-[#091E42]/70 text-sm leading-relaxed font-medium">
                List your properties efficiently with amber today.
              </p>
              <button className="bg-[#0f45a8] hover:bg-[#0A2647] text-white px-6 py-2.5 rounded-full text-sm font-bold transition-colors duration-300 shadow-sm">
                List With Us
              </button>
            </div>
            <div className="absolute right-0 bottom-0 w-[40%] h-full flex items-end justify-end pointer-events-none">
              <div className="w-full h-[90%] border-2 border-dashed border-blue-400/30 bg-blue-300/10 flex items-center justify-center rounded-tl-2xl">
                  <span className="text-[10px] text-blue-800">صورة المفاتيح</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================= */}
      {/* 7. TESTIMONIALS SECTION (Mixed: Image Left, Card Right) */}
      {/* ======================================================= */}
      <div className="w-full px-4 md:px-8 py-20 font-sans ">
        <div className="w-full max-w-[1500px] mx-auto flex flex-col gap-12">

          {/* العنوان */}
          <h2 className="text-3xl md:text-4xl font-bold text-[#091E42]">
            What <span className="text-[#3B82F6]">Students</span> Say About Us?
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* === الجانب الأيسر: الصورة المجمعة === */}
            <div className="flex justify-center lg:justify-start w-full">
              {/* الصورة تستجيب للعرض تلقائياً */}
              <img 
                src={studentsGroupImage} 
                alt="Happy Students" 
                className="w-full max-w-[500px] object-contain" 
              />
            </div>

            {/* === الجانب الأيمن: كارد التقييم === */}
            <div className="flex flex-col gap-8 w-full">
              
              {/* الكارد الكريمي */}
              <div className="bg-[#FEF6E0] rounded-[30px] p-8 md:p-12 relative w-full h-[320px] flex flex-col justify-between shadow-sm">
                
                {/* الجزء العلوي: الأيقونة والنجوم */}
                <div className="flex justify-between items-start">
                  {/* علامة الاقتباس البرتقالية */}
                  <svg className="w-12 h-12 text-[#F59E0B] mb-4" fill="currentColor" viewBox="0 0 512 512">
                    <path d="M464 256h-80v-64c0-35.3 28.7-64 64-64h8c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24h-8c-88.4 0-160 71.6-160 160v240c0 26.5 21.5 48 48 48h128c26.5 0 48-21.5 48-48V304c0-26.5-21.5-48-48-48zm-288 0H96v-64c0-35.3 28.7-64 64-64h8c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24h-8C71.6 32 0 103.6 0 192v240c0 26.5 21.5 48 48 48h128c26.5 0 48-21.5 48-48V304c0-26.5-21.5-48-48-48z"/>
                  </svg>

                  {/* النجوم */}
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-5 h-5 ${i < currentTestimonial.rating ? "text-[#F59E0B]" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>

                {/* نص التقييم */}
                <div>
                  <h3 className="text-xl font-bold text-[#091E42] mb-3">"{currentTestimonial.quote}"</h3>
                  <p className="text-[#091E42]/80 text-sm leading-relaxed">
                    {currentTestimonial.text}
                  </p>
                </div>

                {/* بيانات المستخدم */}
                <div className="flex items-center gap-3">
                  <img src={currentTestimonial.user.image} alt="User" className="w-10 h-10 rounded-full object-cover ring-2 ring-white" />
                  <div>
                    <h4 className="text-sm font-bold text-[#091E42]">{currentTestimonial.user.name}</h4>
                    <div className="flex items-center gap-1 text-[#091E42]/60 text-xs font-medium">
                       <MapPin className="w-3 h-3" />
                       <span>{currentTestimonial.user.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* أزرار التحكم (خارج الكارد) */}
              <div className="flex justify-center items-center gap-6 mt-2">
                
                {/* زر السابق */}
                <button 
                  onClick={handlePrevTestimonial} 
                  className="w-12 h-12 rounded-full border-2 border-[#8BA3C8]/50 text-[#3B82F6] flex items-center justify-center hover:bg-blue-50 hover:border-[#3B82F6] transition-all duration-300"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                {/* النقاط (Dots) */}
                <div className="flex gap-2">
                  {testimonialsData.map((_, index) => (
                    <button 
                      key={index}
                      onClick={() => setTestimonialIndex(index)}
                      className={`h-3 rounded-full transition-all duration-300 
                        ${index === testimonialIndex 
                          ? "w-8 bg-[#091E42]"   // النشط: عريض وداكن
                          : "w-3 border-2 border-[#091E42] bg-transparent hover:bg-[#091E42]/20" // غير النشط: دائرة مفرغة
                        }`}
                    />
                  ))}
                </div>

                {/* زر التالي */}
                <button 
                  onClick={handleNextTestimonial} 
                  className="w-12 h-12 rounded-full border-2 border-[#8BA3C8]/50 text-[#3B82F6] flex items-center justify-center hover:bg-blue-50 hover:border-[#3B82F6] transition-all duration-300"
                >
                   <ChevronRight className="w-6 h-6" />
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
                  
    </div>
  );
};

export default Home;