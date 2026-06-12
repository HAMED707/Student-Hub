import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import PropertyCard from "../../assets/components/PropertyCard/PropertyCard.jsx";
import { ChevronRight, ChevronLeft, ArrowRight } from "lucide-react";
import { useFavorites } from "../../hooks/useFavorites.js";

const fallbackFavoriteProperties = [
  {
    id: 1,
    title: "Furnished Apartment - El Hamra",
    location: "Cairo - El Hamra",
    universityDistance: "14 mins from university",
    price: 2500,
    rating: 4.5,
    reviews: 10,
    roommates: 2,
    image:
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
  },
];

const Like = () => {
  const navigate = useNavigate();
  const [favoriteBusyId, setFavoriteBusyId] = useState(null);
  const {
    favoriteItems,
    favoriteIdSet,
    loading,
    error,
    refreshFavorites,
    toggleFavorite,
  } = useFavorites();

  useEffect(() => {
    refreshFavorites().catch(() => {});
  }, [refreshFavorites]);
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
    navigate("/find-room");
  };

  const handleFavoriteToggle = useCallback(
    async (property) => {
      setFavoriteBusyId(property.id);
      await toggleFavorite(property, {
        onRequireAuth: () =>
          navigate("/login", { state: { from: { pathname: "/favorites" } } }),
      });
      setFavoriteBusyId(null);
    },
    [navigate, toggleFavorite],
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-20">
      <Navbar />

      <div className="mx-6 md:mx-10 py-8">
        {/* === Header Section === */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-[#091E42]">Shortlist</h1>
          <p className="text-gray-500 font-medium mt-1">
            {favoriteItems.length} properties shortlisted
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        {/* === Favorites Grid (Main List) === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16 justify-items-center">
          {loading ? (
            <div className="col-span-full rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm font-bold text-slate-500">
              Loading your shortlist...
            </div>
          ) : favoriteItems.length > 0 ? (
            favoriteItems.map((item) => (
              <PropertyCard
                key={item.id}
                property={item}
                isFavorite={true}
                onFavoriteToggle={handleFavoriteToggle}
                favoriteLoading={favoriteBusyId === item.id}
              />
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center">
              <h2 className="text-2xl font-black text-[#091E42]">Your shortlist is empty</h2>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Save a few properties from the listings page and they will appear here.
              </p>
              <button
                type="button"
                onClick={handleViewAll}
                className="mt-5 rounded-full bg-[#155BC2] px-6 py-3 text-sm font-black text-white transition hover:bg-[#0f4699]"
              >
                Browse properties
              </button>
            </div>
          )}
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
                View All{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {/* قمت بتكرار القائمة لزيادة عدد العناصر للتجربة */}
            {[...(favoriteItems.length ? favoriteItems : fallbackFavoriteProperties), ...(favoriteItems.length ? favoriteItems : fallbackFavoriteProperties)].map(
              (item, index) => (
                <div
                  key={`suggest-${index}`}
                  className="flex-shrink-0 w-full max-w-sm"
                >
                  {favoriteItems.length > 0 ? (
                    <PropertyCard
                      property={item}
                      isFavorite={favoriteIdSet.has(item.id)}
                      onFavoriteToggle={handleFavoriteToggle}
                      favoriteLoading={favoriteBusyId === item.id}
                    />
                  ) : (
                    <PropertyCard property={item} isFavorite={false} />
                  )}
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Like;
