import React, { useState, useEffect } from "react";
import Navbar from "../../assets/components/Navbar/Navbar-2.jsx"; 
import PropertyCard from "../../assets/components/PropertyCard/PropertyCard.jsx"; 
import { fetchProperties, normalizeProperty } from "../../services/propertyService.js";
import { 
  Search, 
  Home, 
  DollarSign, 
  Map, 
  Calendar, 
  Filter,
  ChevronDown,
  Loader2
} from "lucide-react";

const FindRoom = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSort, setActiveSort] = useState("Recommended");
  const [activeFilter, setActiveFilter] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchProperties();
        setProperties(data.map(normalizeProperty));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-[#0A2647] animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h3 className="text-xl font-bold text-red-600">Failed to load properties</h3>
            <p className="text-gray-500 mt-2">{error}</p>
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProperties.map((item) => (
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
