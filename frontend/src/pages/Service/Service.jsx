import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Search, Phone, Clock, MapPin, ExternalLink, Map as MapIcon,
  Utensils, GraduationCap, ShoppingCart, Hospital, Pill, Church, TrainFront, Landmark, Bus, Dumbbell, Banknote
} from 'lucide-react';

// ==========================================
// 1. الإعدادات والبيانات
// ==========================================
const defaultCenter = [30.0444, 31.2357]; // القاهرة

const categories = [
  { id: 'universities', label: 'Universities', icon: GraduationCap },
  { id: 'restaurants', label: 'Restaurants', icon: Utensils },
  { id: 'supermarkets', label: 'Supermarkets', icon: ShoppingCart },
  { id: 'hospitals', label: 'Hospital', icon: Hospital },
  { id: 'pharmacies', label: 'Pharmacies', icon: Pill },
  { id: 'mosques', label: 'Mosque', icon: Landmark },
  { id: 'churches', label: 'Church', icon: Church },
  { id: 'train_stations', label: 'Train Stations', icon: TrainFront },
  { id: 'bus_stations', label: 'Bus Stations', icon: Bus },
  { id: 'gym', label: 'GYM', icon: Dumbbell },
  { id: 'atm', label: 'ATM', icon: Banknote },
];

const placesData = {
  universities: [
    { id: 1, name: "Cairo University", lat: 30.0276, lng: 31.2101, hours: "8:00 AM - 5:00 PM", phone: "16666" },
    { id: 2, name: "Ain Shams University", lat: 30.0761, lng: 31.2861, hours: "8:00 AM - 4:00 PM", phone: "19876" },
  ],
  restaurants: [
    { id: 1, name: "Super ABO ALY", lat: 30.0450, lng: 31.2360, hours: "Open 24 Hours", phone: "+20 64 3911000" },
    { id: 2, name: "Tito ristorante pizzeria", lat: 30.0460, lng: 31.2370, hours: "9:00 AM - 2:00 AM", phone: "+20 100 009 8882" },
    { id: 3, name: "Reda Helmy", lat: 30.0440, lng: 31.2340, hours: "12:15 AM - 2:00 AM", phone: "+20 64 3911000" },
    { id: 4, name: "Alfanar Restaurant", lat: 30.0430, lng: 31.2330, hours: "9:00 AM - 2:00 AM", phone: "+20 64 3911000" },
  ],
  supermarkets: [
    { id: 1, name: "Carrefour City Center", lat: 30.0480, lng: 31.2400, hours: "9:00 AM - 12:00 AM", phone: "16061" },
  ],
  hospitals: [
    { id: 1, name: "Dar Al Fouad Hospital", lat: 30.0100, lng: 31.2000, hours: "24 Hours", phone: "16370" },
  ],
  gym: [
    { id: 1, name: "Gold's Gym", lat: 30.0500, lng: 31.2200, hours: "6:00 AM - 12:00 AM", phone: "19999" },
  ],
  atm: [
    { id: 1, name: "CIB ATM", lat: 30.0455, lng: 31.2365, hours: "24 Hours", phone: "19666" },
  ],
  // باقي الفئات فارغة
  pharmacies: [], mosques: [], churches: [], train_stations: [], bus_stations: []
};

// ==========================================
// 2. مكونات مساعدة للتفاعل
// ==========================================

// هذا المكون هو المسؤول عن تحريك الخريطة (FlyTo) عند تغيير المكان النشط
function MapController({ activePlace }) {
  const map = useMap();
  
  useEffect(() => {
    if (activePlace) {
      map.flyTo([activePlace.lat, activePlace.lng], 16, {
        animate: true,
        duration: 1.5 // مدة التحرك (ثانية ونصف) لتعطي شعوراً سلساً
      });
    }
  }, [activePlace, map]);

  return null;
}

const Services = () => {
  const [selectedCategory, setSelectedCategory] = useState('restaurants');
  const [searchTerm, setSearchTerm] = useState("");
  const [activePlaceId, setActivePlaceId] = useState(null); // لتخزين معرف المكان المختار
  
  // مرجع للماركرز لفتح الـ Popup برمجياً
  const markersRef = useRef({});

  // فلترة البيانات
  const filteredPlaces = useMemo(() => {
    const list = placesData[selectedCategory] || [];
    if (!searchTerm) return list;
    return list.filter(place => 
      place.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [selectedCategory, searchTerm]);

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

        {/* Filter Bar */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); setSearchTerm(""); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all whitespace-nowrap font-medium text-sm md:text-base
                  ${isActive 
                    ? "bg-[#2563EB] text-white border-[#2563EB] shadow-md transform scale-105" 
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  }`}
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
                    center={defaultCenter} 
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
                    <MapController activePlace={activePlace} />

                    {filteredPlaces.map(place => (
                    <Marker 
                        key={place.id} 
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
            </div>

            {/* List Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 [&::-webkit-scrollbar]:hidden">
              {filteredPlaces.length > 0 ? (
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
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{place.hours}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span dir="ltr" className="font-medium hover:underline">{place.phone}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                  <div className="bg-gray-50 p-4 rounded-full mb-3">
                    <Search className="w-8 h-8 opacity-40" />
                  </div>
                  <p>No places found</p>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Services;