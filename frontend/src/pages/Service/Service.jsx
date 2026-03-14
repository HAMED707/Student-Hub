import React, { useState, useMemo, useEffect } from 'react';
import Navbar from "../../assets/components/Navbar/Navbar.jsx"; 
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- Map marker icons (CDN so they always load) ---
const markerIconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const markerShadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";
const DefaultIcon = L.icon({
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

import {
  Search,
  ExternalLink,
  Map as MapIcon,
  MapPin,
  Star,
  Utensils,
  Coffee,
  ShoppingCart,
  Hospital,
  Pill,
  TrainFront,
  Landmark,
  Bus,
  Dumbbell,
  Banknote,
  BookOpen,
  Shirt,
  Building2,
} from 'lucide-react';

import {
  fetchNearbyServices,
  fetchUniversityServices,
  fetchServiceUniversities,
} from '../../services/serviceService.js';
import { useAuth } from '../../context/AuthContext.jsx';

// ==========================================
// 1. الإعدادات والبيانات
// ==========================================
const defaultCenter = [30.0444, 31.2357]; // القاهرة
const defaultRadius = 1500;
const radiusOptions = [500, 1000, 1500, 2500, 5000];

const categories = [
  { id: 'restaurant', label: 'Restaurants', icon: Utensils },
  { id: 'cafe', label: 'Cafes', icon: Coffee },
  { id: 'supermarket', label: 'Supermarkets', icon: ShoppingCart },
  { id: 'hospital', label: 'Hospitals', icon: Hospital },
  { id: 'pharmacy', label: 'Pharmacies', icon: Pill },
  { id: 'gym', label: 'Gyms', icon: Dumbbell },
  { id: 'atm', label: 'ATMs', icon: Banknote },
  { id: 'bank', label: 'Banks', icon: Landmark },
  { id: 'bus_station', label: 'Bus Stations', icon: Bus },
  { id: 'metro_station', label: 'Metro Stations', icon: TrainFront },
  { id: 'mosque', label: 'Mosques', icon: Landmark },
  { id: 'library', label: 'Libraries', icon: BookOpen },
  { id: 'laundry', label: 'Laundry', icon: Shirt },
  { id: 'other', label: 'Other', icon: Building2 },
];

// ==========================================
// 2. مكونات مساعدة للتفاعل
// ==========================================

// هذا المكون هو المسؤول عن تحريك الخريطة (FlyTo) عند تغيير المكان النشط
function MapController({ activePlace, focusCenter }) {
  const map = useMap();
  
  useEffect(() => {
    if (activePlace) {
      map.flyTo([activePlace.lat, activePlace.lng], 16, {
        animate: true,
        duration: 1.5 // مدة التحرك (ثانية ونصف) لتعطي شعوراً سلساً
      });
    }
  }, [activePlace, map]);

  useEffect(() => {
    if (!activePlace && focusCenter) {
      map.flyTo([focusCenter.lat, focusCenter.lng], 13, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [activePlace, focusCenter, map]);

  return null;
}

const Services = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('restaurant');
  const [searchTerm, setSearchTerm] = useState("");
  const [activePlaceId, setActivePlaceId] = useState(null); // لتخزين معرف المكان المختار
  const [searchMode, setSearchMode] = useState("nearby"); // nearby | university
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [universities, setUniversities] = useState([]);
  const [radius, setRadius] = useState(defaultRadius);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [focusCenter, setFocusCenter] = useState({
    lat: defaultCenter[0],
    lng: defaultCenter[1],
  });
  const [userLocation, setUserLocation] = useState(null);

  // Load universities list once
  useEffect(() => {
    let mounted = true;
    fetchServiceUniversities()
      .then((data) => {
        if (!mounted) return;
        setUniversities(data.universities || []);
      })
      .catch(() => {
        // Non-blocking; user can still search by GPS
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported. Using Cairo default.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(loc);
        setFocusCenter(loc);
      },
      () => {
      setLocationError("Location permission denied. Using Cairo default.");
      setUserLocation(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Fetch places from backend
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user?.access) {
        setPlaces([]);
        setLoading(false);
        setError("Please log in to view nearby services.");
        return;
      }
      setLoading(true);
      setError("");
      try {
        if (searchMode === "university") {
          if (!selectedUniversity) {
            setPlaces([]);
            setLoading(false);
            return;
          }
          const data = await fetchUniversityServices({
            name: selectedUniversity,
            type: selectedCategory,
            radius,
          });
          if (!mounted) return;
          setPlaces(data.results || []);
          if (data.lat && data.lng) {
            setFocusCenter({ lat: Number(data.lat), lng: Number(data.lng) });
          }
        } else {
          const target = userLocation || focusCenter;
          const data = await fetchNearbyServices({
            lat: target.lat,
            lng: target.lng,
            type: selectedCategory,
            radius,
          });
          if (!mounted) return;
          setPlaces(data.results || []);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || "Failed to load nearby services.");
        setPlaces([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user?.access, searchMode, selectedUniversity, selectedCategory, radius, focusCenter.lat, focusCenter.lng, userLocation]);

  // When switching back to nearby, recenter to user's location if available
  useEffect(() => {
    if (searchMode === "nearby" && userLocation) {
      setFocusCenter(userLocation);
    }
  }, [searchMode, userLocation]);

  // فلترة البيانات
  const normalizedPlaces = useMemo(() => {
    return (places || []).map((p) => ({
      ...p,
      lat: Number(p.latitude),
      lng: Number(p.longitude),
      distance_km: p.distance_m ? (p.distance_m / 1000).toFixed(1) : null,
    }));
  }, [places]);

  const filteredPlaces = useMemo(() => {
    const list = normalizedPlaces;
    if (!searchTerm) return list;
    return list.filter(place => 
      place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (place.address || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [normalizedPlaces, searchTerm]);

  // المكان النشط حالياً
  const activePlace = useMemo(() => {
    return filteredPlaces.find(p => p.id === activePlaceId);
  }, [filteredPlaces, activePlaceId]);

  // عند تغيير الفئة، نلغي التحديد
  useEffect(() => {
    setActivePlaceId(null);
  }, [selectedCategory]);

  // دالة لفتح جوجل ماب
  const handleOpenGoogleMaps = () => {
    const target = activePlace || { lat: defaultCenter[0], lng: defaultCenter[1] };
    const url = `https://www.google.com/maps/search/?api=1&query=${target.lat},${target.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-10 font-sans">
      <Navbar activePage="/services" /> 

      <div className="container mx-auto px-4 md:px-8 py-8">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#091E42]">Nearby Locations</h1>
          <p className="text-gray-500 mt-2">Explore essential spots around your accommodation</p>
        </div>

        {!user?.access && (
          <div className="mb-6 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
            You must be logged in to use Services. Please log in and try again.
          </div>
        )}

        {/* Mode + University + Radius */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setSearchMode("nearby")}
              disabled={!user?.access}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                searchMode === "nearby"
                  ? "bg-[#2563EB] text-white border-[#2563EB]"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              } ${!user?.access ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              Use My Location
            </button>
            <button
              onClick={() => setSearchMode("university")}
              disabled={!user?.access}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                searchMode === "university"
                  ? "bg-[#2563EB] text-white border-[#2563EB]"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              } ${!user?.access ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              Search by University
            </button>
          </div>

          {searchMode === "university" && (
            <select
              value={selectedUniversity}
              onChange={(e) => setSelectedUniversity(e.target.value)}
              disabled={!user?.access}
              className={`px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-700 text-sm ${!user?.access ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <option value="">Select a university</option>
              {universities.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          )}

          <div className="ml-0 md:ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-500">Radius</span>
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              disabled={!user?.access}
              className={`px-3 py-2 rounded-full border border-gray-200 bg-white text-gray-700 text-sm ${!user?.access ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {radiusOptions.map((r) => (
                <option key={r} value={r}>{r} m</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); setSearchTerm(""); }}
                disabled={!user?.access}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all whitespace-nowrap font-medium text-sm md:text-base
                  ${isActive 
                    ? "bg-[#2563EB] text-white border-[#2563EB] shadow-md transform scale-105" 
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  } ${!user?.access ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <Icon size={18} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          
          {/* --- Map Section (Left) --- */}
          <div className="lg:col-span-2 bg-white p-1 rounded-3xl shadow-sm border border-gray-200 relative h-[400px] lg:h-full overflow-hidden z-0">
             <div className="w-full h-full rounded-2xl overflow-hidden relative">
                <MapContainer 
                    center={[focusCenter.lat, focusCenter.lng]} 
                    zoom={13} 
                    style={{ width: '100%', height: '100%' }}
                    zoomControl={false}
                >
                    {/* ✅ استخدام خريطة CartoDB Voyager لشكل حديث ونظيف */}
                    <TileLayer
                        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    />
                    
                    {/* ✅ تحريك الخريطة عند اختيار مكان */}
                    <MapController activePlace={activePlace} focusCenter={focusCenter} />

                    {filteredPlaces.map(place => (
                    <Marker 
                        key={`${place.id}-${place.external_id || ""}`} 
                        position={[place.lat, place.lng]}
                        ref={el => {
                            // حفظ المرجع لفتح الـ Popup تلقائياً
                            if (el && activePlaceId === place.id) {
                                setTimeout(() => el.openPopup(), 100);
                            }
                        }}
                        eventHandlers={{
                            click: () => setActivePlaceId(place.id),
                        }}
                    >
                        <Popup className="font-sans font-semibold text-sm">
                            {place.name}
                        </Popup>
                    </Marker>
                    ))}
                </MapContainer>

                {/* زر فتح جوجل ماب العائم */}
                <button 
                    onClick={handleOpenGoogleMaps}
                    className="absolute bottom-6 right-6 bg-white text-gray-800 px-4 py-2 rounded-full shadow-lg font-medium text-xs md:text-sm hover:shadow-xl hover:bg-gray-50 transition-all flex items-center gap-2 z-[400] border border-gray-100"
                >
                    <ExternalLink size={16} className="text-blue-600" />
                    Open in Google Maps
                </button>
            </div>
          </div>

          {/* --- List Section (Right) --- */}
          <div className="lg:col-span-1 bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col overflow-hidden h-full">
            
            {/* Search */}
            <div className="p-5 border-b border-gray-100">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Find a place..." 
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-gray-700"
                />
              </div>
              {locationError && (
                <p className="text-xs text-amber-600 mt-2">{locationError}</p>
              )}
            </div>

            {/* List Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 [&::-webkit-scrollbar]:hidden">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
                  {error}
                </div>
              )}
              {searchMode === "university" && !selectedUniversity && (
                <div className="text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-xl p-3">
                  Select a university to load nearby places.
                </div>
              )}
              {loading && (
                <div className="text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-xl p-3">
                  Loading nearby places...
                </div>
              )}
              {!loading && filteredPlaces.length > 0 ? (
                filteredPlaces.map((place) => {
                  const isActive = activePlaceId === place.id;
                  return (
                    <div 
                      key={place.id} 
                      onClick={() => setActivePlaceId(place.id)} // ✅ تفعيل عند الضغط
                      className={`group border rounded-2xl p-4 transition-all duration-300 cursor-pointer relative overflow-hidden
                        ${isActive 
                            ? "border-blue-500 bg-blue-50/50 shadow-md" // تصميم العنصر النشط
                            : "border-gray-100 bg-white hover:border-blue-300 hover:shadow-md"
                        }`}
                    >
                      {isActive && <div className="absolute inset-y-0 left-0 w-1 bg-blue-500"></div>}
                      
                      <div className="flex justify-between items-start mb-2">
                          <h3 className={`font-bold text-lg ${isActive ? "text-blue-700" : "text-gray-800 group-hover:text-blue-600"}`}>{place.name}</h3>
                          <div className={`p-2 rounded-full transition-colors ${isActive ? "bg-white" : "bg-blue-50 group-hover:bg-blue-100"}`}>
                              <MapIcon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-blue-500"}`} />
                          </div>
                      </div>
                      
                      <div className="flex flex-col gap-2.5">
                        {place.address && (
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{place.address}</span>
                          </div>
                        )}
                        {place.distance_km && (
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{place.distance_km} km away</span>
                          </div>
                        )}
                        {(place.rating || place.open_now === true || place.open_now === false) && (
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Star className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">
                              {place.rating ? `Rating ${place.rating}` : "Rating N/A"}
                              {place.open_now === true && " · Open now"}
                              {place.open_now === false && " · Closed now"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : !loading ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                  <div className="bg-gray-50 p-4 rounded-full mb-3">
                    <Search className="w-8 h-8 opacity-40" />
                  </div>
                  <p>No places found</p>
                </div>
              ) : null}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Services;
