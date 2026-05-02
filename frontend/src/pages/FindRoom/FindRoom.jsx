import React, { useState, useRef, useEffect } from "react";
import Navbar from "../../assets/components/Navbar/Navbar-2.jsx"; 
import PropertyCard from "../../assets/components/PropertyCard/PropertyCard.jsx"; 
import { 
  Search, 
  Home, 
  DollarSign, 
  Map, 
  Calendar, 
  Filter, 
  ChevronDown,
  Check,
  X,
  SlidersHorizontal,
  Star
} from "lucide-react";

// --- دالة توليد البيانات (تم تحديثها لتشمل أنواع عقارات وخدمات مختلفة لتعمل مع الخيارات) ---
const generateData = () => {
  const images = [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1522771753035-4850d32f7041?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
  ];

  const locations = [
    { city: "Cairo", area: "Maadi" }, { city: "Cairo", area: "Zamalek" },
    { city: "Giza", area: "Dokki" }, { city: "Cairo", area: "Nasr City" },
    { city: "New Cairo", area: "5th Settlement" }, { city: "Giza", area: "6th October" }
  ];

  const typesList = ["Studio", "Apartment", "Private Room", "Shared Room"];
  const allAmenities = ["Wifi", "AC", "Kitchen", "Gym", "Pool", "Study Room"];

  let data = [];
  for (let i = 0; i < 24; i++) {
    const loc = locations[i % locations.length];
    const type = typesList[i % typesList.length];
    
    // خلط وتوزيع الخدمات بشكل عشوائي
    const shuffledAmenities = allAmenities.sort(() => 0.5 - Math.random());
    const propertyAmenities = shuffledAmenities.slice(0, Math.floor(Math.random() * 4) + 2);

    data.push({
      id: i,
      title: `${type === "Shared Room" || type === "Private Room" ? "Cozy" : "Modern"} ${type} in ${loc.area}`,
      type: type,
      location: `${loc.city} - ${loc.area}`,
      universityDistance: `${Math.floor(Math.random() * 20) + 5} mins to campus`,
      price: Math.floor(Math.random() * (12000 - 1500) + 1500),
      rating: parseFloat((Math.random() * (5 - 3.5) + 3.5).toFixed(1)),
      reviews: Math.floor(Math.random() * 80) + 5,
      roommates: type === "Shared Room" ? Math.floor(Math.random() * 3) + 1 : 0,
      image: images[i % images.length],
      isAvailable: i % 5 !== 0,
      amenities: propertyAmenities,
      city: loc.city
    });
  }
  return data;
};

const sortOptions = [
  "Recommended",
  "Price: Low to High",
  "Price: High to Low",
  "Highest Rated"
];

const FindRoom = () => {
  const [properties] = useState(() => generateData());
  const [searchQuery, setSearchQuery] = useState("");
  
  // Sorting State
  const [activeSort, setActiveSort] = useState("Recommended");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);

  // Advanced Filters State (الخيارات المتقدمة)
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState({
    types: [],
    amenities: [],
    maxPrice: 15000,
    minRating: 0,
    cairoOnly: false
  });

  // إغلاق قائمة الترتيب عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // منع التمرير عند فتح لوحة الخيارات
  useEffect(() => {
    if (isFilterPanelOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isFilterPanelOpen]);

  // دوال تعديل الخيارات
  const toggleType = (type) => {
    setFilters(prev => ({
      ...prev,
      types: prev.types.includes(type) ? prev.types.filter(t => t !== type) : [...prev.types, type]
    }));
  };

  const toggleAmenity = (amenity) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity) ? prev.amenities.filter(a => a !== amenity) : [...prev.amenities, amenity]
    }));
  };

  const clearFilters = () => {
    setFilters({ types: [], amenities: [], maxPrice: 15000, minRating: 0, cairoOnly: false });
    setSearchQuery("");
  };

  // --- دالة الفلترة والترتيب (تطبق جميع الخيارات) ---
  const getFilteredAndSortedProperties = () => {
    let filtered = properties.filter((item) => {
      // 1. Search text
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Property Type
      const matchesType = filters.types.length === 0 || filters.types.includes(item.type);

      // 3. Amenities (يجب أن يحتوي العقار على كل الخدمات المحددة)
      const matchesAmenities = filters.amenities.every(a => item.amenities.includes(a));

      // 4. Max Price
      const matchesPrice = item.price <= filters.maxPrice;

      // 5. Min Rating
      const matchesRating = item.rating >= filters.minRating;

      // 6. City Filter (Quick toggle)
      const matchesCity = !filters.cairoOnly || item.city === "Cairo";

      return matchesSearch && matchesType && matchesAmenities && matchesPrice && matchesRating && matchesCity;
    });

    // الترتيب
    const sorted = [...filtered];
    switch (activeSort) {
      case "Price: Low to High": sorted.sort((a, b) => a.price - b.price); break;
      case "Price: High to Low": sorted.sort((a, b) => b.price - a.price); break;
      case "Highest Rated": sorted.sort((a, b) => b.rating - a.rating); break;
      default: break; // Recommended
    }

    return sorted;
  };

  const displayedProperties = getFilteredAndSortedProperties();

  // حساب عدد الفلاتر النشطة لعرضها في الزر
  const activeFiltersCount = filters.types.length + filters.amenities.length + (filters.maxPrice < 15000 ? 1 : 0) + (filters.minRating > 0 ? 1 : 0) + (filters.cairoOnly ? 1 : 0);

  // تنسيقات الأزرار السريعة
  const buttonBaseClass = "flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all border whitespace-nowrap active:scale-95";
  const buttonInactiveClass = "bg-[#F3F4F6] text-black border-transparent hover:bg-[#E5E7EB]";
  const buttonActiveClass = "bg-[#0A2647] text-white border-[#0A2647] shadow-md";

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-20 relative">
      <Navbar />

      {/* === قسم البحث والفلاتر السريعة === */}
      <div className="py-6 bg-[#F8F9FA] sticky top-0 z-30 shadow-sm border-b border-gray-200/50">
        <div className="mx-6 md:mx-10">
          <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
            
            {/* شريط البحث */}
            <div className="relative w-full xl:w-[450px]">
              <div className="absolute left-6 top-1/2 transform -translate-y-1/2">
                <Search className="w-6 h-6 text-black" strokeWidth={1.5} />
              </div>
              <input 
                type="text" 
                placeholder="Search by city, area, or title..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F3F4F6] text-gray-900 placeholder-gray-500 font-medium text-base rounded-full py-3.5 pl-16 pr-6 border border-gray-200 focus:outline-none focus:border-[#0A2647] focus:bg-white hover:border-gray-300 transition-all shadow-sm"
              />
            </div>

            {/* أزرار الفلترة السريعة (Quick Toggles) */}
            <div className="flex gap-3 flex-wrap justify-center xl:justify-start w-full xl:w-auto items-center">
              
              <button 
                onClick={() => setFilters(prev => ({...prev, types: prev.types.includes("Studio") ? [] : ["Studio"]}))} 
                className={`${buttonBaseClass} ${filters.types.includes("Studio") ? buttonActiveClass : buttonInactiveClass}`}
              >
                <Home className="w-5 h-5" strokeWidth={2} /> Studios
              </button>

              <button 
                onClick={() => setFilters(prev => ({...prev, maxPrice: prev.maxPrice === 5000 ? 15000 : 5000}))} 
                className={`${buttonBaseClass} ${filters.maxPrice === 5000 ? buttonActiveClass : buttonInactiveClass}`}
              >
                <DollarSign className="w-5 h-5" strokeWidth={2} /> Budget ({"<"}5k)
              </button>

              <button 
                onClick={() => setFilters(prev => ({...prev, cairoOnly: !prev.cairoOnly}))} 
                className={`${buttonBaseClass} ${filters.cairoOnly ? buttonActiveClass : buttonInactiveClass}`}
              >
                <Map className="w-5 h-5" strokeWidth={2} /> Cairo Only
              </button>

              {/* زر الخيارات المتقدمة (All Filters) */}
              <button 
                onClick={() => setIsFilterPanelOpen(true)} 
                className={`${buttonBaseClass} bg-[#0A2647] text-white hover:bg-[#153a69] relative pr-10 border-[#0A2647] shadow-sm`}
              >
                <SlidersHorizontal className="w-5 h-5" strokeWidth={2} /> Options & Filters
                {activeFiltersCount > 0 && (
                  <span className="absolute top-[-4px] right-[-4px] bg-[#3B82F6] text-white text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-[3px] border-white shadow-sm">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* === شبكة الكروت والترتيب === */}
      <div className="mx-6 md:mx-10 mt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#091E42]">Find student accommodation</h1>
            <p className="text-gray-500 text-sm mt-2 font-medium">{displayedProperties.length} properties found</p>
          </div>
          
          {/* قائمة الترتيب المنسدلة */}
          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium relative" ref={sortRef}>
            <span>Sort by:</span>
            <button 
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-1.5 text-[#0A2647] hover:bg-gray-200 bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-xl font-bold transition"
            >
              {activeSort} <ChevronDown className={`w-4 h-4 transition-transform ${isSortOpen ? "rotate-180" : ""}`} />
            </button>

            {isSortOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                {sortOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setActiveSort(option);
                      setIsSortOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-blue-50 text-gray-700 hover:text-[#0A2647] flex items-center justify-between"
                  >
                    {option}
                    {activeSort === option && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* عرض الكروت */}
        {displayedProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {displayedProperties.map((item) => (
              <PropertyCard 
                key={item.id} 
                property={item}  
                initialFavorite={item.isFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-gray-100 shadow-sm mt-4">
            <div className="bg-gray-50 p-6 rounded-full mb-5 border border-gray-100">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-extrabold text-[#091E42] mb-2">No exact matches found</h3>
            <p className="text-gray-500 text-sm max-w-sm">
              Try removing some filter options to see more results.
            </p>
            <button 
              onClick={clearFilters} 
              className="mt-6 px-8 py-3 bg-[#0A2647] text-white text-sm font-bold rounded-xl hover:bg-[#153a69] transition shadow-md"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FILTER PANEL MODAL (لوحة الخيارات الجانبية)                                */}
      {/* ========================================================================= */}
      {isFilterPanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
           {/* الخلفية المعتمة */}
           <div 
             className="absolute inset-0 bg-[#091E42]/60 backdrop-blur-sm transition-opacity animate-in fade-in" 
             onClick={() => setIsFilterPanelOpen(false)}
           ></div>
           
           {/* اللوحة الجانبية */}
           <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                 <h2 className="text-xl font-extrabold text-[#091E42] flex items-center gap-2">
                   <SlidersHorizontal className="w-5 h-5 text-blue-600" /> Options & Filters
                 </h2>
                 <button onClick={() => setIsFilterPanelOpen(false)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition text-gray-600">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              {/* Body (الخيارات) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
                 
                 {/* 1. Property Type */}
                 <div>
                    <h3 className="text-sm font-extrabold text-[#091E42] mb-4 uppercase tracking-wider">Property Type</h3>
                    <div className="flex flex-wrap gap-3">
                       {["Studio", "Apartment", "Private Room", "Shared Room"].map(type => (
                          <button 
                            key={type}
                            onClick={() => toggleType(type)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all active:scale-95 flex items-center gap-2
                             ${filters.types.includes(type) ? 'border-[#0A2647] bg-[#0A2647] text-white shadow-md' : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'}`}
                          >
                            {filters.types.includes(type) && <Check className="w-4 h-4" />} {type}
                          </button>
                       ))}
                    </div>
                 </div>

                 {/* 2. Price Range */}
                 <div>
                    <div className="flex justify-between items-end mb-4">
                       <h3 className="text-sm font-extrabold text-[#091E42] uppercase tracking-wider">Max Price (Monthly)</h3>
                       <span className="text-[#0A2647] font-black text-lg">EGP {filters.maxPrice}</span>
                    </div>
                    <input 
                       type="range" 
                       min="1500" 
                       max="15000" 
                       step="500"
                       value={filters.maxPrice} 
                       onChange={(e) => setFilters(prev => ({...prev, maxPrice: parseInt(e.target.value)}))}
                       className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0A2647]"
                    />
                    <div className="flex justify-between text-xs text-gray-400 font-bold mt-2">
                       <span>EGP 1,500</span>
                       <span>EGP 15,000+</span>
                    </div>
                 </div>

                 {/* 3. Amenities */}
                 <div>
                    <h3 className="text-sm font-extrabold text-[#091E42] mb-4 uppercase tracking-wider">Amenities & Facilities</h3>
                    <div className="grid grid-cols-2 gap-3">
                       {["Wifi", "AC", "Kitchen", "Gym", "Pool", "Study Room"].map(amenity => (
                          <label key={amenity} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-gray-50 transition">
                             <div className="relative flex items-center justify-center shrink-0">
                               <input 
                                 type="checkbox" 
                                 checked={filters.amenities.includes(amenity)}
                                 onChange={() => toggleAmenity(amenity)}
                                 className="peer appearance-none w-5 h-5 rounded border-2 border-gray-300 checked:bg-[#0A2647] checked:border-[#0A2647] transition-all cursor-pointer group-hover:border-[#0A2647]"
                               />
                               <Check className="absolute text-white w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
                             </div>
                             <span className="text-sm font-bold text-gray-700">{amenity}</span>
                          </label>
                       ))}
                    </div>
                 </div>

                 {/* 4. Minimum Rating */}
                 <div>
                    <h3 className="text-sm font-extrabold text-[#091E42] mb-4 uppercase tracking-wider">Guest Rating</h3>
                    <div className="flex flex-col gap-3">
                       {[
                         { val: 0, label: "Any rating" },
                         { val: 4.5, label: "Excellent: 4.5+" },
                         { val: 4, label: "Very Good: 4.0+" },
                         { val: 3.5, label: "Good: 3.5+" }
                       ].map(rate => (
                          <label key={rate.val} className="flex items-center gap-3 cursor-pointer group">
                             <div className="relative flex items-center justify-center shrink-0">
                               <input 
                                 type="radio" 
                                 name="ratingFilter"
                                 checked={filters.minRating === rate.val}
                                 onChange={() => setFilters(prev => ({...prev, minRating: rate.val}))}
                                 className="peer appearance-none w-5 h-5 rounded-full border-2 border-gray-300 checked:border-[#0A2647] transition-all cursor-pointer"
                               />
                               <div className="absolute w-2.5 h-2.5 bg-[#0A2647] rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                             </div>
                             <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                               {rate.label} {rate.val > 0 && <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 mb-0.5"/>}
                             </span>
                          </label>
                       ))}
                    </div>
                 </div>

              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4">
                 <button 
                   onClick={clearFilters}
                   className="px-6 py-3.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition text-sm flex-1 bg-gray-100"
                 >
                   Clear All
                 </button>
                 <button 
                   onClick={() => setIsFilterPanelOpen(false)}
                   className="px-6 py-3.5 rounded-xl font-bold text-white bg-[#0A2647] hover:bg-[#153a69] transition shadow-md text-sm flex-[2]"
                 >
                   Show {displayedProperties.length} Homes
                 </button>
              </div>

           </div>
        </div>
      )}

    </div>
  );
};

export default FindRoom;