import React, { useState } from "react";
import Navbar from "../../assets/components/Navbar/Navbar-2.jsx"; 
import PropertyCard from "../../assets/components/PropertyCard/PropertyCard.jsx"; 
import { 
  Search, 
  Home, 
  DollarSign, 
  Map, 
  Calendar, 
  Filter, 
  ChevronDown 
} from "lucide-react";

// --- دالة توليد البيانات ---
const generateData = () => {
  const images = [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1522771753035-4850d32f7041?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600596542815-2a4d9f8770d3?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=800&q=80"
  ];

  const locations = [
    { city: "Cairo", area: "Maadi" }, { city: "Cairo", area: "Zamalek" },
    { city: "Giza", area: "Dokki" }, { city: "Cairo", area: "Nasr City" },
    { city: "New Cairo", area: "5th Settlement" }, { city: "Giza", area: "6th October" },
    { city: "Cairo", area: "Heliopolis" }, { city: "Cairo", area: "Rehab" }
  ];

  let data = [];
  for (let i = 0; i < 24; i++) {
    const loc = locations[i % locations.length];
    data.push({
      id: i,
      title: i % 2 === 0 ? `Modern Apartment in ${loc.area}` : `Cozy Studio - ${loc.area}`,
      location: `${loc.city} - ${loc.area}`,
      universityDistance: `${Math.floor(Math.random() * 20) + 5} mins to campus`,
      price: Math.floor(Math.random() * (10000 - 2000) + 2000),
      rating: (Math.random() * (5 - 3.5) + 3.5).toFixed(1),
      reviews: Math.floor(Math.random() * 50) + 5,
      roommates: Math.floor(Math.random() * 4),
      image: images[i % images.length],
      isAvailable: i % 5 !== 0,
      amenities: ["Wifi", "AC", "Kitchen"], // إضافة مصفوفة الخدمات لتجنب الأخطاء في الكارت
      city: loc.city // إضافة المدينة للكارت
    });
  }
  return data.sort(() => Math.random() - 0.5);
};

const FindRoom = () => {
  const [properties] = useState(() => generateData());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSort, setActiveSort] = useState("Recommended");
  const [activeFilter, setActiveFilter] = useState(null);

  const handleFilterClick = (name) => {
    setActiveFilter(activeFilter === name ? null : name);
  };

  const filteredProperties = properties.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const buttonBaseClass = "flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all border whitespace-nowrap";
  const buttonInactiveClass = "bg-[#F3F4F6] text-black border-transparent hover:bg-[#E5E7EB]";
  const buttonActiveClass = "bg-[#0A2647] text-white border-[#0A2647]";

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-20">
      <Navbar />

      {/* === قسم الفلتر === */}
      <div className="py-6 bg-[#F8F9FA]">
        <div className="mx-6 md:mx-10">
          <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
            
            <div className="relative w-full xl:w-[450px]">
              <div className="absolute left-6 top-1/2 transform -translate-y-1/2">
                <Search className="w-6 h-6 text-black" strokeWidth={1.5} />
              </div>
              <input 
                type="text" 
                placeholder="Search location..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F3F4F6] text-gray-700 placeholder-gray-500 font-medium text-base rounded-full py-3.5 pl-16 pr-6 border border-gray-200 focus:outline-none focus:border-[#0A2647] hover:border-gray-300 transition-all"
              />
            </div>

            <div className="flex gap-3 flex-wrap justify-center xl:justify-start w-full xl:w-auto items-center">
              <button onClick={() => handleFilterClick("Room Type")} className={`${buttonBaseClass} ${activeFilter === "Room Type" ? buttonActiveClass : buttonInactiveClass}`}>
                <Home className="w-5 h-5" strokeWidth={2} /> Room Type
              </button>

              <button onClick={() => handleFilterClick("Price Range")} className={`${buttonBaseClass} ${activeFilter === "Price Range" ? buttonActiveClass : buttonInactiveClass}`}>
                <DollarSign className="w-5 h-5" strokeWidth={2} /> Price Range
              </button>

              <button onClick={() => handleFilterClick("Cairo")} className={`${buttonBaseClass} ${activeFilter === "Cairo" ? buttonActiveClass : buttonInactiveClass}`}>
                <Map className="w-5 h-5" strokeWidth={2} /> Cairo
              </button>

              <button onClick={() => handleFilterClick("Length Of Stay")} className={`${buttonBaseClass} ${activeFilter === "Length Of Stay" ? buttonActiveClass : buttonInactiveClass}`}>
                <Calendar className="w-5 h-5" strokeWidth={2} /> Length Of Stay
              </button>

              <button onClick={() => handleFilterClick("All Filters")} className={`${buttonBaseClass} ${activeFilter === "All Filters" ? buttonActiveClass : buttonInactiveClass} relative pr-10`}>
                <Filter className="w-5 h-5" strokeWidth={2} /> All Filters
                <span className="absolute top-[-2px] right-[-2px] bg-[#3B82F6] text-white text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-[3px] border-[#F8F9FA]">
                  3
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* === شبكة الكروت === */}
      <div className="mx-6 md:mx-10 mt-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#091E42]">Find student accommodation in Cairo</h1>
            <p className="text-gray-500 text-sm mt-2 font-medium">{filteredProperties.length} results found</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
            <span>Sort by:</span>
            <button className="flex items-center gap-1 text-[#3B82F6] hover:underline font-bold">
              {activeSort} <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProperties.map((item) => (
              /* ✅ هنا كان الخطأ: تم تغيير item={item} إلى property={item} */
              <PropertyCard 
                key={item.id} 
                property={item}  
                initialFavorite={item.isFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700">No properties found</h3>
          </div>
        )}
      </div>

    </div>
  );
};

export default FindRoom;