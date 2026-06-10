import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import PropertyCard from "../../assets/components/PropertyCard/PropertyCard.jsx";
import {
  Search, Home, DollarSign, Map, ChevronDown, Check, X,
  SlidersHorizontal, Star, MapPin, Clock,
  ChevronLeft, ChevronRight, Bookmark, Trash2, RefreshCw,
  LayoutGrid, Loader2, ShieldCheck, Navigation,
  Building2, Wifi, Flame, RotateCcw
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
  const coords = {
    "Cairo - Maadi": [29.9606, 31.2503],
    "Cairo - Zamalek": [30.0644, 31.2165],
    "Giza - Dokki": [30.0367, 31.2032],
    "Cairo - Nasr City": [30.0596, 31.3301],
    "New Cairo - 5th Settlement": [30.0097, 31.4489],
    "Giza - 6th October": [29.9345, 30.9404],
  };

  return Array.from({ length: 24 }, (_, i) => {
    const loc = locations[i % locations.length];
    const type = typesList[i % typesList.length];
    const shuffled = [...allAmenities].sort(() => 0.5 - Math.random());
    const locationKey = `${loc.city} - ${loc.area}`;
    const campusMinutes = Math.floor(Math.random() * 20) + 5;
    const availabilityStatus = i % 8 === 0 ? "unavailable" : i % 5 === 0 ? "booked" : "available";

    return {
      id: i,
      title: `${type === "Shared Room" || type === "Private Room" ? "Cozy" : "Modern"} ${type} in ${loc.area}`,
      type,
      location: locationKey,
      universityDistance: `${campusMinutes} mins to campus`,
      campusMinutes,
      price: Math.floor(Math.random() * (12000 - 1500) + 1500),
      rating: parseFloat((Math.random() * (5 - 3.5) + 3.5).toFixed(1)),
      reviews: Math.floor(Math.random() * 80) + 5,
      roommates: type === "Shared Room" ? Math.floor(Math.random() * 3) + 1 : 0,
      image: images[i % images.length],
      availabilityStatus,
      isAvailable: availabilityStatus === "available",
      amenities: shuffled.slice(0, Math.floor(Math.random() * 4) + 2),
      city: loc.city,
      area: loc.area,
      lat: coords[locationKey]?.[0] ?? 30.0444,
      lng: coords[locationKey]?.[1] ?? 31.2357,
      createdAt: Date.now() - i * 86400000,
      description: `A wonderful ${type.toLowerCase()} located in ${loc.area}, ${loc.city}. Perfect for students with easy access to universities and amenities.`,
      images: [images[i % images.length], images[(i + 1) % images.length], images[(i + 2) % images.length]],
    };
  });
};

const sortOptions = ["Recommended", "Newest", "Lowest Price", "Highest Price", "Highest Rated", "Most Popular"];
const ITEMS_PER_PAGE = 8;
const PROPERTY_TYPES = ["Studio", "Apartment", "Private Room", "Shared Room"];
const ALL_AMENITIES = ["Wifi", "AC", "Kitchen", "Gym", "Pool", "Study Room"];
const RECENT_SEARCHES_KEY = "studenthub_recent_searches";
const SAVED_SEARCHES_KEY = "studenthub_saved_searches";
const MAX_RECENT = 5;
const DEFAULT_FILTERS = {
  types: [],
  amenities: [],
  maxPrice: 15000,
  minRating: 0,
  cairoOnly: false,
  availableOnly: false,
  nearUniversity: false,
};

const readJsonStorage = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const createMapIcon = (isSelected) =>
  L.divIcon({
    html: `<div class="findroom-marker ${isSelected ? "is-selected" : ""}"><span></span></div>`,
    className: "",
    iconSize: [isSelected ? 54 : 38, isSelected ? 54 : 38],
    iconAnchor: [isSelected ? 27 : 19, isSelected ? 54 : 38],
    popupAnchor: [0, isSelected ? -54 : -38],
  });

const MapBounds = React.memo(({ items }) => {
  const map = useMap();
  useEffect(() => {
    if (items.length === 0) return;
    const bounds = L.latLngBounds(items.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [42, 42], maxZoom: 13 });
  }, [items, map]);
  return null;
});

const MapFocus = React.memo(({ property }) => {
  const map = useMap();
  useEffect(() => {
    if (property) map.flyTo([property.lat, property.lng], 14, { duration: 0.6 });
  }, [property, map]);
  return null;
});

const SkeletonCard = () => (
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="relative h-64 animate-pulse bg-slate-200">
      <div className="absolute left-4 top-4 h-7 w-28 rounded-full bg-white/70" />
      <div className="absolute right-4 top-4 h-11 w-11 rounded-full bg-white/70" />
    </div>
    <div className="space-y-4 p-4">
      <div className="h-5 w-4/5 animate-pulse rounded bg-slate-200" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
      <div className="flex items-end justify-between pt-3">
        <div className="space-y-2">
          <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="space-y-2">
          <div className="h-5 w-20 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-16 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    </div>
  </div>
);

const applyFiltersToItems = (items, query, filters) => {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      item.city.toLowerCase().includes(q) ||
      item.area.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q);
    const matchesType = filters.types.length === 0 || filters.types.includes(item.type);
    const matchesAmenities = filters.amenities.every((a) => item.amenities.includes(a));
    const matchesPrice = item.price <= filters.maxPrice;
    const matchesRating = item.rating >= filters.minRating;
    const matchesCity = !filters.cairoOnly || item.city === "Cairo";
    const matchesAvailability = !filters.availableOnly || item.isAvailable;
    const matchesDistance = !filters.nearUniversity || item.campusMinutes <= 12;
    return matchesSearch && matchesType && matchesAmenities && matchesPrice && matchesRating && matchesCity && matchesAvailability && matchesDistance;
  });
};

const FindRoom = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties] = useState(() => generateData());
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [activeSort, setActiveSort] = useState(searchParams.get("sort") || "Recommended");
  const [filters, setFilters] = useState({
    types: searchParams.get("types") ? searchParams.get("types").split(",") : [],
    amenities: searchParams.get("amenities") ? searchParams.get("amenities").split(",") : [],
    maxPrice: parseInt(searchParams.get("maxPrice")) || DEFAULT_FILTERS.maxPrice,
    minRating: parseFloat(searchParams.get("minRating")) || DEFAULT_FILTERS.minRating,
    cairoOnly: searchParams.get("cairo") === "1",
    availableOnly: searchParams.get("available") === "1",
    nearUniversity: searchParams.get("near") === "1",
  });
  const [draftFilters, setDraftFilters] = useState(filters);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page")) || 1);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [selectedMapProperty, setSelectedMapProperty] = useState(null);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => readJsonStorage(RECENT_SEARCHES_KEY, []));
  const [savedSearches, setSavedSearches] = useState(() => readJsonStorage(SAVED_SEARCHES_KEY, []));
  const sortRef = useRef(null);
  const suggestionRef = useRef(null);
  const gridRef = useRef(null);
  const didPageMount = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 650);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const params = {};
    if (searchQuery) params.q = searchQuery;
    if (activeSort !== "Recommended") params.sort = activeSort;
    if (filters.types.length) params.types = filters.types.join(",");
    if (filters.amenities.length) params.amenities = filters.amenities.join(",");
    if (filters.maxPrice < DEFAULT_FILTERS.maxPrice) params.maxPrice = String(filters.maxPrice);
    if (filters.minRating > 0) params.minRating = String(filters.minRating);
    if (filters.cairoOnly) params.cairo = "1";
    if (filters.availableOnly) params.available = "1";
    if (filters.nearUniversity) params.near = "1";
    if (currentPage > 1) params.page = String(currentPage);
    setSearchParams(params, { replace: true });
  }, [searchQuery, activeSort, filters, currentPage, setSearchParams]);

  useEffect(() => {
    const handle = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setIsSortOpen(false);
      if (suggestionRef.current && !suggestionRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setShowRecent(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    const locked = isFilterPanelOpen;
    document.body.style.overflow = locked ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isFilterPanelOpen]);

  useEffect(() => {
    if (!didPageMount.current) {
      didPageMount.current = true;
      return;
    }
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentPage]);

  const activeFiltersCount = useMemo(() => (
    filters.types.length + filters.amenities.length +
    (filters.maxPrice < DEFAULT_FILTERS.maxPrice ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.cairoOnly ? 1 : 0) +
    (filters.availableOnly ? 1 : 0) +
    (filters.nearUniversity ? 1 : 0)
  ), [filters]);

  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const scored = properties
      .map((p) => {
        const title = p.title.toLowerCase();
        const location = `${p.area} ${p.city} ${p.type}`.toLowerCase();
        const score = title.startsWith(q) ? 4 : title.includes(q) ? 3 : location.includes(q) ? 2 : 0;
        return { property: p, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || b.property.rating - a.property.rating)
      .slice(0, 6);
    return scored.map(({ property }) => property);
  }, [searchQuery, properties]);

  const filteredProperties = useMemo(
    () => applyFiltersToItems(properties, searchQuery, filters),
    [properties, searchQuery, filters]
  );

  const sortedProperties = useMemo(() => {
    const sorted = [...filteredProperties];
    switch (activeSort) {
      case "Newest": sorted.sort((a, b) => b.createdAt - a.createdAt); break;
      case "Lowest Price": sorted.sort((a, b) => a.price - b.price); break;
      case "Highest Price": sorted.sort((a, b) => b.price - a.price); break;
      case "Highest Rated": sorted.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews); break;
      case "Most Popular": sorted.sort((a, b) => b.reviews - a.reviews || b.rating - a.rating); break;
      default:
        sorted.sort((a, b) => Number(b.isAvailable) - Number(a.isAvailable) || b.rating - a.rating || a.campusMinutes - b.campusMinutes);
    }
    return sorted;
  }, [filteredProperties, activeSort]);

  const draftResultsCount = useMemo(
    () => applyFiltersToItems(properties, searchQuery, draftFilters).length,
    [properties, searchQuery, draftFilters]
  );

  const totalPages = Math.ceil(sortedProperties.length / ITEMS_PER_PAGE) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProperties = useMemo(
    () => sortedProperties.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE),
    [sortedProperties, safePage]
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setDraftFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setActiveSort("Recommended");
    resetFilters();
  }, [resetFilters]);

  const toggleArrayFilter = useCallback((target, key, value) => {
    target((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((v) => v !== value) : [...prev[key], value],
    }));
  }, []);

  const updateFilter = useCallback((target, key, value) => {
    target((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyQuickFilter = useCallback((updater) => {
    setFilters((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setDraftFilters(next);
      return next;
    });
    setCurrentPage(1);
  }, []);

  const removeFilterTag = useCallback((tag) => {
    if (tag.type === "search") setSearchQuery("");
    if (tag.type === "types") applyQuickFilter((prev) => ({ ...prev, types: prev.types.filter((v) => v !== tag.value) }));
    if (tag.type === "amenities") applyQuickFilter((prev) => ({ ...prev, amenities: prev.amenities.filter((v) => v !== tag.value) }));
    if (tag.type === "price") applyQuickFilter((prev) => ({ ...prev, maxPrice: DEFAULT_FILTERS.maxPrice }));
    if (tag.type === "rating") applyQuickFilter((prev) => ({ ...prev, minRating: DEFAULT_FILTERS.minRating }));
    if (tag.type === "cairo") applyQuickFilter((prev) => ({ ...prev, cairoOnly: false }));
    if (tag.type === "available") applyQuickFilter((prev) => ({ ...prev, availableOnly: false }));
    if (tag.type === "near") applyQuickFilter((prev) => ({ ...prev, nearUniversity: false }));
    setCurrentPage(1);
  }, [applyQuickFilter]);

  const filterTags = useMemo(() => {
    const tags = [];
    if (searchQuery) tags.push({ type: "search", label: `"${searchQuery}"`, key: "search" });
    filters.types.forEach((value) => tags.push({ type: "types", value, label: value, key: `type-${value}` }));
    filters.amenities.forEach((value) => tags.push({ type: "amenities", value, label: value, key: `amenity-${value}` }));
    if (filters.maxPrice < DEFAULT_FILTERS.maxPrice) tags.push({ type: "price", label: `Up to EGP ${filters.maxPrice}`, key: "price" });
    if (filters.minRating > 0) tags.push({ type: "rating", label: `${filters.minRating}+ stars`, key: "rating" });
    if (filters.cairoOnly) tags.push({ type: "cairo", label: "Cairo only", key: "cairo" });
    if (filters.availableOnly) tags.push({ type: "available", label: "Available only", key: "available" });
    if (filters.nearUniversity) tags.push({ type: "near", label: "Near university", key: "near" });
    return tags;
  }, [searchQuery, filters]);

  const saveRecentSearch = useCallback((query) => {
    const clean = query.trim();
    if (!clean) return;
    setRecentSearches((prev) => {
      const updated = [clean, ...prev.filter((s) => s !== clean)].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteRecentSearch = useCallback((query) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== query);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleSearchSubmit = useCallback((e) => {
    e.preventDefault();
    saveRecentSearch(searchQuery);
    setShowSuggestions(false);
    setShowRecent(false);
    setCurrentPage(1);
  }, [searchQuery, saveRecentSearch]);

  const saveCurrentSearch = useCallback(() => {
    const label = searchQuery.trim();
    if (!label) return;
    setSavedSearches((prev) => {
      const entry = { label, query: label, filters: { ...filters }, sort: activeSort, timestamp: Date.now() };
      const updated = [entry, ...prev.filter((s) => s.label !== label)].slice(0, 10);
      localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [searchQuery, filters, activeSort]);

  const visibleSavedSearches = useMemo(
    () => savedSearches.filter((saved) => saved.query?.trim() && !/^Filters \(\d+ active\)$/i.test(saved.label)),
    [savedSearches]
  );

  const applySavedSearch = useCallback((saved) => {
    setSearchQuery(saved.query || "");
    setFilters(saved.filters || DEFAULT_FILTERS);
    setDraftFilters(saved.filters || DEFAULT_FILTERS);
    setActiveSort(saved.sort || "Recommended");
    setCurrentPage(1);
  }, []);

  const openFilters = useCallback(() => {
    setDraftFilters(filters);
    setIsFilterPanelOpen(true);
  }, [filters]);

  const applyDraftFilters = useCallback(() => {
    setFilters(draftFilters);
    setCurrentPage(1);
    setIsFilterPanelOpen(false);
  }, [draftFilters]);

  return (
    <div className="relative min-h-screen bg-[#F8F9FA] pb-16 font-sans text-[#091E42]">
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes tagPop { from { opacity: 0; transform: scale(.92) translateY(4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp .46s ease-out both; }
        .animate-tag-pop { animation: tagPop .2s ease-out both; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .findroom-map .leaflet-container { width: 100%; height: 100%; border-radius: 16px; z-index: 1; }
        .findroom-marker {
          width: 38px; height: 38px; border-radius: 999px; background: #3B82F6; border: 4px solid white;
          display: grid; place-items: center; box-shadow: 0 12px 24px rgba(9, 30, 66, .24);
          transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
        }
        .findroom-marker:hover { transform: translateY(-3px) scale(1.05); box-shadow: 0 16px 30px rgba(9, 30, 66, .30); }
        .findroom-marker.is-selected { width: 54px; height: 54px; background: #0A2647; box-shadow: 0 20px 38px rgba(10, 38, 71, .36); }
        .findroom-marker span { width: 10px; height: 10px; border-radius: 999px; background: white; }
        .range-input::-webkit-slider-thumb { appearance: none; height: 22px; width: 22px; border-radius: 999px; background: #155BC2; border: 4px solid #fff; box-shadow: 0 6px 16px rgba(21, 91, 194, .35); }
        .range-input::-moz-range-thumb { height: 22px; width: 22px; border-radius: 999px; background: #155BC2; border: 4px solid #fff; box-shadow: 0 6px 16px rgba(21, 91, 194, .35); }
      `}</style>

      <Navbar />

      <div className="sticky top-0 z-30 border-b border-slate-200/60 bg-[#F8F9FA]/90 py-3 backdrop-blur">
        <div className="mx-auto w-full max-w-[1500px] px-4 md:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1" ref={suggestionRef}>
                <form onSubmit={handleSearchSubmit}>
                  <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by city, area, title, or room type"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); setShowSuggestions(true); }}
                    onFocus={() => { setShowSuggestions(true); setShowRecent(true); }}
                    className="h-12 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-900 shadow-sm transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#155BC2] focus:outline-none focus:ring-4 focus:ring-blue-100"
                  />
                </form>

                {showSuggestions && searchQuery && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-slate-100 bg-white py-2 shadow-2xl">
                    {suggestions.map((property) => (
                      <button
                        key={property.id}
                        type="button"
                        onClick={() => {
                          setSearchQuery(property.title);
                          saveRecentSearch(property.title);
                          setShowSuggestions(false);
                          setCurrentPage(1);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-blue-50"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#155BC2]/10 text-[#155BC2]">
                          <Building2 className="h-5 w-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-extrabold text-slate-800">{property.title}</span>
                          <span className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-slate-500">
                            <MapPin className="h-3.5 w-3.5" /> {property.area}, {property.city}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {showRecent && !searchQuery && recentSearches.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-slate-100 bg-white py-3 shadow-2xl">
                    <div className="flex items-center justify-between px-4 pb-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Recent searches</span>
                      <button type="button" onClick={() => { setRecentSearches([]); localStorage.removeItem(RECENT_SEARCHES_KEY); }} className="text-xs font-bold text-rose-500 hover:text-rose-600">Clear all</button>
                    </div>
                    {recentSearches.map((query) => (
                      <div key={query} className="group flex items-center gap-2 px-4 py-2 transition hover:bg-slate-50">
                        <button
                          type="button"
                          onClick={() => { setSearchQuery(query); saveRecentSearch(query); setShowRecent(false); setCurrentPage(1); }}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="truncate text-sm font-bold text-slate-700">{query}</span>
                        </button>
                        <button type="button" onClick={() => deleteRecentSearch(query)} className="grid h-8 w-8 place-items-center rounded-full text-slate-300 transition hover:bg-rose-50 hover:text-rose-500" aria-label={`Delete ${query}`}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={openFilters}
                className="relative inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#155BC2] px-5 text-sm font-bold text-white shadow-md transition hover:bg-[#0f4699] active:scale-95 sm:w-auto"
              >
                <SlidersHorizontal className="h-5 w-5" /> Filters
                {activeFiltersCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-[#3B82F6] px-1 text-[10px] font-black text-white">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-xl font-black tracking-normal text-[#091E42] sm:text-2xl">Find student accommodation</h1>
                <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Finding the best matches...</span>
                  ) : (
                    <span><span className="font-black text-[#0A2647]">{sortedProperties.length}</span> homes found {activeFiltersCount > 0 && `with ${activeFiltersCount} active filter${activeFiltersCount > 1 ? "s" : ""}`}</span>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={saveCurrentSearch}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-600 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 active:scale-95"
                >
                  <Bookmark className="h-4 w-4" /> Save
                </button>

                <div className="flex rounded-xl bg-slate-100 p-0.5">
                  <button type="button" onClick={() => setViewMode("grid")} className={`grid h-8 w-8 place-items-center rounded-lg transition ${viewMode === "grid" ? "bg-white text-[#0A2647] shadow-sm" : "text-slate-400 hover:text-slate-600"}`} aria-label="Grid view">
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setViewMode("map")} className={`grid h-8 w-8 place-items-center rounded-lg transition ${viewMode === "map" ? "bg-white text-[#0A2647] shadow-sm" : "text-slate-400 hover:text-slate-600"}`} aria-label="Map view">
                    <Map className="h-4 w-4" />
                  </button>
                </div>

                <div className="relative flex items-center gap-2 text-sm font-bold text-slate-500" ref={sortRef}>
                  <span className="hidden sm:inline">Sort</span>
                  <button type="button" onClick={() => setIsSortOpen((prev) => !prev)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-[#0A2647] shadow-sm transition hover:border-[#155BC2]/40 hover:bg-blue-50 sm:text-sm">
                    {activeSort} <ChevronDown className={`h-4 w-4 transition-transform ${isSortOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isSortOpen && (
                    <div className="animate-fade-in-up absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-100 bg-white py-2 shadow-2xl">
                      {sortOptions.map((option) => (
                        <button key={option} type="button" onClick={() => { setActiveSort(option); setIsSortOpen(false); setCurrentPage(1); }} className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-extrabold text-slate-700 transition hover:bg-blue-50 hover:text-[#0A2647]">
                          {option}
                          {activeSort === option && <Check className="h-4 w-4 text-[#155BC2]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {filterTags.length > 0 && (
        <div className="mx-auto mt-4 flex w-full max-w-[1500px] flex-wrap items-center gap-2 px-4 md:px-8">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Active</span>
          {filterTags.map((tag) => (
            <span key={tag.key} className="animate-tag-pop inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-[#0A2647]">
              {tag.label}
              <button type="button" onClick={() => removeFilterTag(tag)} className="rounded-full p-0.5 transition hover:bg-blue-100" aria-label={`Remove ${tag.label}`}>
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-rose-600 shadow-sm ring-1 ring-rose-100 transition hover:bg-rose-50">
            <RefreshCw className="h-3.5 w-3.5" /> Clear All
          </button>
        </div>
      )}

      {visibleSavedSearches.length > 0 && (
        <div className="mx-auto mt-2 flex w-full max-w-[1500px] flex-wrap items-center gap-2 px-4 md:px-8">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Saved</span>
          {visibleSavedSearches.slice(0, 4).map((saved) => (
            <button key={saved.timestamp} type="button" onClick={() => applySavedSearch(saved)} className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-extrabold text-amber-800 transition hover:bg-amber-100">
              <Bookmark className="h-3.5 w-3.5" /> {saved.label}
            </button>
          ))}
        </div>
      )}

      <main className="mx-auto mt-4 w-full max-w-[1500px] px-4 md:mt-5 md:px-8" ref={gridRef}>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : viewMode === "map" ? (
          <div className="space-y-4">
            <div className="findroom-map h-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:h-[420px]">
              <MapContainer center={[30.0444, 31.2357]} zoom={11} scrollWheelZoom style={{ width: "100%", height: "100%" }}>
                <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {!selectedMapProperty && <MapBounds items={sortedProperties} />}
                <MapFocus property={selectedMapProperty} />
                {sortedProperties.map((property) => (
                  <Marker
                    key={property.id}
                    position={[property.lat, property.lng]}
                    icon={createMapIcon(selectedMapProperty?.id === property.id)}
                    eventHandlers={{ click: () => setSelectedMapProperty(property) }}
                  >
                    <Popup>
                      <strong style={{ color: "#091E42", fontSize: 13 }}>{property.title}</strong>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {selectedMapProperty && (
              <div className="animate-fade-in-up flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
                <img src={selectedMapProperty.image} alt={selectedMapProperty.title} className="h-28 w-full rounded-xl object-cover sm:w-40" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-black text-[#091E42]">{selectedMapProperty.title}</h3>
                  <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-500"><MapPin className="h-4 w-4" /> {selectedMapProperty.location}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-[#155BC2]">EGP {selectedMapProperty.price}/month</span>
                    <span className="rounded-full bg-yellow-50 px-3 py-1 text-yellow-700">{selectedMapProperty.rating} rating</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{selectedMapProperty.universityDistance}</span>
                  </div>
                </div>
                <a href={`/find-room/${selectedMapProperty.id}`} className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0A2647] px-5 text-sm font-extrabold text-white transition hover:bg-[#153a69]">
                  View Details
                </a>
              </div>
            )}
          </div>
        ) : sortedProperties.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedProperties.map((item) => (
                <PropertyCard key={item.id} property={item} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                <button type="button" onClick={() => setCurrentPage(safePage - 1)} disabled={safePage <= 1} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous page">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1).map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-slate-400">...</span>}
                    <button type="button" onClick={() => setCurrentPage(p)} className={`h-10 min-w-10 rounded-xl px-3 text-sm font-black shadow-sm transition ${safePage === p ? "bg-[#0A2647] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{p}</button>
                  </React.Fragment>
                ))}
                <button type="button" onClick={() => setCurrentPage(safePage + 1)} disabled={safePage >= totalPages} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next page">
                  <ChevronRight className="h-4 w-4" />
                </button>
                <span className="ml-1 text-xs font-bold text-slate-400">Page {safePage} of {totalPages}</span>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-3xl border border-slate-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-blue-50 text-[#155BC2]">
              <Search className="h-10 w-10" />
            </div>
            <h3 className="mt-5 text-2xl font-black text-[#091E42]">No exact matches found</h3>
            <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">Try widening your price range, removing one amenity, or searching by area instead of the full property name.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={clearFilters} className="inline-flex items-center gap-2 rounded-xl bg-[#0A2647] px-6 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-[#153a69]">
                <RotateCcw className="h-4 w-4" /> Reset search
              </button>
              <button type="button" onClick={() => applyQuickFilter((prev) => ({ ...prev, availableOnly: true, maxPrice: DEFAULT_FILTERS.maxPrice }))} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50">
                Show available homes
              </button>
              <button type="button" onClick={() => applyQuickFilter((prev) => ({ ...prev, nearUniversity: true }))} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50">
                Near university
              </button>
            </div>
          </div>
        )}
      </main>

      {isFilterPanelOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end">
          <div className="absolute inset-0 bg-[#091E42]/60 backdrop-blur-sm" onClick={() => setIsFilterPanelOpen(false)} />
          <aside className="animate-fade-in-up relative flex max-h-[88vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl md:h-full md:max-h-full md:max-w-md md:rounded-none">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 md:p-6">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-black text-[#091E42]"><SlidersHorizontal className="h-5 w-5 text-[#155BC2]" /> Filters</h2>
                <p className="mt-1 text-xs font-bold text-slate-400">{draftResultsCount} expected result{draftResultsCount !== 1 ? "s" : ""}</p>
              </div>
              <button type="button" onClick={() => setIsFilterPanelOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="custom-scrollbar flex-1 space-y-7 overflow-y-auto p-5 md:p-6">
              <section>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#091E42]"><Home className="h-4 w-4 text-[#155BC2]" /> Property Type</h3>
                <div className="grid grid-cols-2 gap-3">
                  {PROPERTY_TYPES.map((type) => (
                    <button key={type} type="button" onClick={() => toggleArrayFilter(setDraftFilters, "types", type)} className={`min-h-12 rounded-xl border px-3 text-sm font-extrabold transition active:scale-[0.98] ${draftFilters.types.includes(type) ? "border-[#0A2647] bg-[#0A2647] text-white shadow-md" : "border-slate-200 bg-white text-slate-700 hover:border-[#155BC2]/40 hover:bg-blue-50"}`}>
                      {type}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-4 flex items-end justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#091E42]"><DollarSign className="h-4 w-4 text-[#155BC2]" /> Max Price</h3>
                  <span className="text-lg font-black text-[#0A2647]">EGP {draftFilters.maxPrice}</span>
                </div>
                <input type="range" min="1500" max="15000" step="500" value={draftFilters.maxPrice} onChange={(e) => updateFilter(setDraftFilters, "maxPrice", parseInt(e.target.value))} className="range-input h-2 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-[#155BC2] to-[#3B82F6] accent-[#155BC2]" />
                <div className="mt-2 flex justify-between text-xs font-bold text-slate-400"><span>EGP 1,500</span><span>EGP 15,000+</span></div>
              </section>

              <section>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#091E42]"><Wifi className="h-4 w-4 text-[#155BC2]" /> Amenities</h3>
                <div className="grid grid-cols-2 gap-3">
                  {ALL_AMENITIES.map((amenity) => (
                    <label key={amenity} className="group flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 transition hover:border-[#155BC2]/40 hover:bg-blue-50">
                      <span className="relative grid h-5 w-5 shrink-0 place-items-center">
                        <input type="checkbox" checked={draftFilters.amenities.includes(amenity)} onChange={() => toggleArrayFilter(setDraftFilters, "amenities", amenity)} className="peer h-5 w-5 appearance-none rounded-md border-2 border-slate-300 transition checked:border-[#155BC2] checked:bg-[#155BC2]" />
                        <Check className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 transition peer-checked:opacity-100" strokeWidth={3} />
                      </span>
                      <span className="text-sm font-extrabold text-slate-700">{amenity}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#091E42]"><Star className="h-4 w-4 text-[#155BC2]" /> Guest Rating</h3>
                <div className="space-y-3">
                  {[{ val: 0, label: "Any rating" }, { val: 4.5, label: "Excellent 4.5+" }, { val: 4, label: "Very good 4.0+" }, { val: 3.5, label: "Good 3.5+" }].map((rate) => (
                    <label key={rate.val} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 transition hover:bg-slate-50">
                      <span className="relative grid h-5 w-5 place-items-center">
                        <input type="radio" name="ratingFilter" checked={draftFilters.minRating === rate.val} onChange={() => updateFilter(setDraftFilters, "minRating", rate.val)} className="peer h-5 w-5 appearance-none rounded-full border-2 border-slate-300 transition checked:border-[#155BC2]" />
                        <span className="absolute h-2.5 w-2.5 rounded-full bg-[#155BC2] opacity-0 transition peer-checked:opacity-100" />
                      </span>
                      <span className="flex items-center gap-1.5 text-sm font-extrabold text-slate-700">{rate.label} {rate.val > 0 && <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#091E42]"><Flame className="h-4 w-4 text-[#155BC2]" /> Smart Filters</h3>
                <div className="space-y-3">
                  {[
                    ["availableOnly", "Available Only", ShieldCheck],
                    ["nearUniversity", "Near University", Navigation],
                    ["cairoOnly", "Cairo Only", Map],
                  ].map(([key, label, icon]) => {
                    const SmartIcon = icon;
                    return (
                      <button key={key} type="button" onClick={() => updateFilter(setDraftFilters, key, !draftFilters[key])} className={`flex min-h-12 w-full items-center justify-between rounded-xl border px-4 text-sm font-extrabold transition active:scale-[0.98] ${draftFilters[key] ? "border-[#155BC2] bg-blue-50 text-[#0A2647]" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
                        <span className="flex items-center gap-2"><SmartIcon className="h-4 w-4" /> {label}</span>
                        <span className={`h-6 w-11 rounded-full p-1 transition ${draftFilters[key] ? "bg-[#155BC2]" : "bg-slate-200"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${draftFilters[key] ? "translate-x-5" : ""}`} /></span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 bg-slate-50 p-5 md:p-6">
              <button type="button" onClick={() => { setDraftFilters(DEFAULT_FILTERS); setFilters(DEFAULT_FILTERS); setCurrentPage(1); }} className="h-12 rounded-xl bg-white text-sm font-black text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100">
                Reset Filters
              </button>
              <button type="button" onClick={applyDraftFilters} className="h-12 rounded-xl bg-[#0A2647] text-sm font-black text-white shadow-md transition hover:bg-[#153a69]">
                Apply Filters ({draftResultsCount})
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default FindRoom;
