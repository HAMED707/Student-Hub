import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import {
  Search,
  Phone,
  Clock,
  ExternalLink,
  GraduationCap,
  ShoppingCart,
  Hospital,
  Pill,
  Landmark,
  Bus,
  Dumbbell,
  Banknote,
  Coffee,
  Building2,
  LocateFixed,
} from "lucide-react";
import {
  fetchNearbyPlaces,
  fetchSupportedUniversities,
  fetchUniversityPlaces,
} from "../../api/services.js";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

const defaultCenter = [30.0444, 31.2357];

const categories = [
  { id: "supermarket", label: "Supermarkets", icon: ShoppingCart },
  { id: "restaurant", label: "Restaurants", icon: Coffee },
  { id: "hospital", label: "Hospitals", icon: Hospital },
  { id: "pharmacy", label: "Pharmacies", icon: Pill },
  { id: "mosque", label: "Mosques", icon: Landmark },
  { id: "bus_station", label: "Bus Stations", icon: Bus },
  { id: "gym", label: "GYM", icon: Dumbbell },
  { id: "atm", label: "ATM", icon: Banknote },
];

function MapController({ activePlace, filteredPlaces }) {
  const map = useMap();

  useEffect(() => {
    if (activePlace) {
      map.flyTo([activePlace.lat, activePlace.lng], 16, {
        animate: true,
        duration: 1.2,
      });
      return;
    }

    if (filteredPlaces.length > 0) {
      const bounds = L.latLngBounds(
        filteredPlaces.map((place) => [place.lat, place.lng]),
      );

      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 15,
      });
    }
  }, [activePlace, filteredPlaces, map]);

  return null;
}

const normalizePlaces = (payload) =>
  (payload?.results || []).map((place) => ({
    id: place.id || place.external_id || `${place.latitude}-${place.longitude}`,
    name: place.name,
    lat: Number(place.latitude),
    lng: Number(place.longitude),
    hours:
      place.open_now === null || place.open_now === undefined
        ? "Hours unavailable"
        : place.open_now
          ? "Open now"
          : "Currently closed",
    phone: place.address || "Address unavailable",
    address: place.address || "Address unavailable",
    rating: place.rating ? `${place.rating}/5` : "No rating yet",
    distance: place.distance_m ? `${place.distance_m} m away` : "Distance unavailable",
  }));

const Services = () => {
  const [selectedCategory, setSelectedCategory] = useState("restaurant");
  const [searchTerm, setSearchTerm] = useState("");
  const [activePlaceId, setActivePlaceId] = useState(null);
  const [universities, setUniversities] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [activeSource, setActiveSource] = useState("university");
  const [coordinates, setCoordinates] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUniversities = async () => {
      try {
        const data = await fetchSupportedUniversities();
        const list = data?.universities || [];
        setUniversities(list);
        if (list.length > 0) setSelectedUniversity(list[0]);
      } catch (loadError) {
        setError(loadError.message || "Unable to load universities.");
      }
    };

    loadUniversities();
  }, []);

  useEffect(() => {
    const loadPlaces = async () => {
      if (activeSource === "university" && !selectedUniversity) return;
      if (activeSource === "location" && !coordinates) return;

      setLoading(true);
      setError("");

      try {
        const payload =
          activeSource === "location"
            ? await fetchNearbyPlaces({
                lat: coordinates.lat,
                lng: coordinates.lng,
                type: selectedCategory,
              })
            : await fetchUniversityPlaces({
                name: selectedUniversity,
                type: selectedCategory,
              });

        const normalized = normalizePlaces(payload);
        setPlaces(normalized);
        setActivePlaceId(normalized[0]?.id || null);
      } catch (loadError) {
        setPlaces([]);
        setActivePlaceId(null);
        setError(loadError.message || "Unable to load nearby services.");
      } finally {
        setLoading(false);
      }
    };

    loadPlaces();
  }, [activeSource, coordinates, selectedCategory, selectedUniversity]);

  const filteredPlaces = useMemo(() => {
    if (!searchTerm.trim()) return places;
    return places.filter((place) =>
      `${place.name} ${place.address}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    );
  }, [places, searchTerm]);

  const activePlace = useMemo(
    () =>
      filteredPlaces.find((place) => place.id === activePlaceId) ||
      filteredPlaces[0] ||
      null,
    [activePlaceId, filteredPlaces],
  );

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setActivePlaceId(null);
    setSearchTerm("");
  };

  const handleOpenGoogleMaps = () => {
    const target = activePlace || {
      lat: defaultCenter[0],
      lng: defaultCenter[1],
    };
    const url = `https://www.google.com/maps/search/?api=1&query=${target.lat},${target.lng}`;
    window.open(url, "_blank");
  };

  const handleUseLocation = () => {
    if (!navigator?.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setActiveSource("location");
      },
      () => {
        setLoading(false);
        setError("Unable to access your current location.");
      },
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-10 font-sans">
      <Navbar activePage="/services" />

      <div className="container mx-auto px-4 md:px-8 py-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#091E42]">Nearby Locations</h1>
            <p className="text-gray-500 mt-2">
              Explore essential spots around your accommodation using the live backend services API.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
              <GraduationCap className="h-4 w-4 text-blue-600" />
              <select
                value={selectedUniversity}
                onChange={(event) => {
                  setActiveSource("university");
                  setSelectedUniversity(event.target.value);
                }}
                className="bg-transparent outline-none"
              >
                {universities.map((university) => (
                  <option key={university} value={university}>
                    {university}
                  </option>
                ))}
              </select>
            </label>

            <button
              onClick={handleUseLocation}
              className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                activeSource === "location"
                  ? "bg-[#2563EB] text-white"
                  : "border border-gray-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <LocateFixed size={16} />
              Use My Location
            </button>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 mb-6">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all whitespace-nowrap font-medium text-sm md:text-base ${
                  isActive
                    ? "bg-[#2563EB] text-white border-[#2563EB] shadow-md scale-105"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                <Icon size={18} />
                {category.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          <div className="lg:col-span-2 bg-white p-1 rounded-3xl shadow-sm border border-gray-200 relative h-[400px] lg:h-full overflow-hidden z-0">
            <div className="w-full h-full rounded-2xl overflow-hidden relative">
              <MapContainer
                center={defaultCenter}
                zoom={13}
                style={{ width: "100%", height: "100%" }}
                zoomControl={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                <MapController
                  activePlace={activePlace}
                  filteredPlaces={filteredPlaces}
                />

                {filteredPlaces.map((place) => (
                  <Marker
                    key={`${selectedCategory}-${place.id}`}
                    position={[place.lat, place.lng]}
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

              <button
                onClick={handleOpenGoogleMaps}
                className="absolute bottom-6 right-6 bg-white text-gray-800 px-4 py-2 rounded-full shadow-lg font-medium text-xs md:text-sm hover:shadow-xl hover:bg-gray-50 transition-all flex items-center gap-2 z-[400] border border-gray-100"
              >
                <ExternalLink size={16} className="text-blue-600" />
                Open in Google Maps
              </button>
            </div>
          </div>

          <div className="lg:col-span-1 bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col overflow-hidden h-full">
            <div className="p-5 border-b border-gray-100 space-y-3">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && filteredPlaces.length > 0) {
                      setActivePlaceId(filteredPlaces[0].id);
                    }
                  }}
                  placeholder="Find a place..."
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-gray-700"
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Building2 className="h-4 w-4" />
                {activeSource === "location"
                  ? "Showing places around your current location"
                  : `Showing places near ${selectedUniversity || "your university"}`}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
              {loading ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-400">
                  Loading nearby places...
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50 p-6 text-center text-sm font-semibold text-rose-500">
                  {error}
                </div>
              ) : filteredPlaces.length > 0 ? (
                filteredPlaces.map((place) => {
                  const isActive = activePlace?.id === place.id;

                  return (
                    <div
                      key={place.id}
                      onClick={() => setActivePlaceId(place.id)}
                      className={`group border rounded-2xl p-4 transition-all duration-300 cursor-pointer relative overflow-hidden ${
                        isActive
                          ? "border-blue-500 bg-blue-50/70 shadow-md"
                          : "border-gray-100 bg-white hover:border-blue-300 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-[#091E42]">
                            {place.name}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {place.distance}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                          {place.rating}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-blue-600" />
                          <span className="line-clamp-2">{place.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-blue-600" />
                          <span>{place.hours}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-400">
                  No places matched this category and search.
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
