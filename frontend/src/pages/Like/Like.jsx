import React, { useRef } from "react";
import Navbar from "../../assets/components/Navbar/Navbar.jsx"; 
import PropertyCard from "../../assets/components/PropertyCard/PropertyCard.jsx"; 
import { ChevronRight, ChevronLeft, ArrowRight } from "lucide-react";

const favoriteProperties = [
  {
    id: 1,
    title: "Furnished Apartment - El Hamra",
    location: "Cairo - El Hamra",
    universityDistance: "14 mins from university",
    price: 2500,
    rating: 4.5,
    reviews: 10,
    roommates: 2,
    image: "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    title: "Modern Studio - Nasr City",
    location: "Cairo - Nasr City",
    universityDistance: "5 mins from Al-Azhar",
    price: 3200,
    rating: 4.8,
    reviews: 25,
    roommates: 1,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    title: "Cozy Room - Dokki",
    location: "Giza - Dokki",
    universityDistance: "10 mins from Cairo Univ",
    price: 1800,
    rating: 4.2,
    reviews: 8,
    roommates: 3,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
  },
];

const Like = () => {
  // 1. تعريف المرجع للسكرول
  const scrollRef = useRef(null);

  // 2. دالة التحكم في التمرير
  const scroll = (ref, direction) => {
    const { current } = ref;
    if (current) {
      const scrollAmount = 350; // مقدار التمرير (تقريباً عرض الكارت)
      current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleViewAll = () => {
    console.log("View All Clicked");
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-20">
      
      <Navbar />

      <div className="mx-6 md:mx-10 py-8">
        
        {/* === Header Section === */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-[#091E42]">Shortlist</h1>
          <p className="text-gray-500 font-medium mt-1">
            {favoriteProperties.length} properties shortlisted
          </p>
        </div>

        {/* === Favorites Grid (Main List) === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16 justify-items-center">
          {favoriteProperties.map((item) => (
            <PropertyCard 
              key={item.id} 
              property={item} 
              isFavorite={true} 
            />
          ))}
        </div>

        {/* === Suggestions Section (New Slider Style) === */}
        <div className="mt-12 mx-2 md:mx-4 lg:mx-4 border-t border-gray-200 pt-8">
          
          {/* Header Controls */}
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
                  onClick={() => scroll(scrollRef, "left")} 
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 bg-white transition-all hover:border-blue-500 hover:text-blue-600 active:scale-90"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => scroll(scrollRef, "right")}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 bg-white transition-all hover:border-blue-500 hover:text-blue-600 active:scale-90"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Cards Scroll Container */}
          <div 
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-4 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* قمت بتكرار القائمة لزيادة عدد العناصر للتجربة */}
            {[...favoriteProperties, ...favoriteProperties].map((item, index) => (
              <div key={`suggest-${index}`} className="flex-shrink-0 w-full max-w-sm">
                {/* تأكدنا من تمرير property بشكل صحيح */}
                <PropertyCard property={item} isFavorite={false} />
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};

export default Like;