import React, { useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Star, PersonStanding, Heart, BedDouble } from "lucide-react";

const PropertyCard = memo(({
  property,
  initialFavorite = false,
  isFavorite: favoriteProp,
}) => {
  const navigate = useNavigate(); // 2. تفعيل الهوك
  const [isFavorite, setIsFavorite] = useState(
    favoriteProp ?? initialFavorite,
  );

  // حماية البيانات الافتراضية
  const defaultData = {
    id: 0,
    title: "Apartment",
    location: "Cairo",
    distance: "N/A",
    city: "Cairo",
    roommates: 0,
    price: "0",
    rating: "0",
    reviews: 0,
    image: "https://via.placeholder.com/400x300",
  };

  const data = { ...defaultData, ...property };
  const rawStatus = String(
    data.availabilityStatus || data.status || (data.isAvailable === false ? "booked" : "available"),
  ).toLowerCase();
  const statusKey = rawStatus.includes("unavailable")
    ? "unavailable"
    : rawStatus.includes("book")
      ? "booked"
      : "available";
  const statusMeta = {
    available: {
      label: "Available",
      className: "bg-[#155BC2] text-white",
    },
    booked: {
      label: "Booked",
      className: "bg-amber-100 text-amber-800 border border-amber-200",
    },
    unavailable: {
      label: "Unavailable",
      className: "bg-slate-900 text-white",
    },
  }[statusKey];

  // 3. دالة الانتقال عند الضغط
  const handleCardClick = () => {
    // سينقلك إلى الرابط: /find-room/رقم_العقار
    navigate(`/find-room/${data.id}`);
  };

  const toggleFavorite = (e) => {
    e.stopPropagation(); // منع فتح الصفحة عند الضغط على القلب
    setIsFavorite(!isFavorite);
  };

  return (
    <div
      onClick={handleCardClick} // 4. ربط الدالة بالكارد
      className="group bg-[#F9FAFB] rounded-2xl border border-gray-200 overflow-hidden transition-all duration-300 cursor-pointer relative flex flex-col w-full max-w-sm mx-auto hover:-translate-y-1 hover:border-[#155BC2]/25 hover:shadow-[0_18px_42px_rgba(15,23,42,0.12)]"
    >
      {/* الصورة */}
      <div className="relative h-64 overflow-hidden shrink-0">
        <img
          src={data.image}
          alt={data.title}
          loading="lazy"
          className="w-full h-full object-cover transform transition-transform duration-500 ease-out group-hover:scale-105"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/400x300?text=Error";
          }}
        />

        {/* طبقة View Details */}
        <div className={`absolute top-4 left-4 text-[10px] font-bold px-3 py-1.5 rounded-full z-20 shadow-sm ${statusMeta.className}`}>
          {statusMeta.label}
        </div>

        {/* زر القلب */}
        <button
          onClick={toggleFavorite}
          className="absolute top-4 right-4 z-20 bg-white rounded-full p-3 shadow-lg transition-all hover:scale-110 active:scale-95 flex items-center justify-center hover:shadow-xl"
        >
          <Heart
            size={28}
            className={`transition-colors duration-200 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-700 hover:text-red-400"}`}
          />
        </button>
      </div>

      {/* المحتوى */}
      <div className="p-4 flex flex-col gap-2">
        <div>
          <h3 className="text-lg font-bold text-gray-900 leading-tight line-clamp-1 transition-colors duration-300 group-hover:text-[#155BC2]">
            {data.title}
          </h3>
          <p className="text-gray-500 text-sm mt-1 line-clamp-1">
            {data.location}
          </p>
        </div>

        <div className="flex justify-between items-end mt-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-800">
              <PersonStanding className="w-4 h-4 text-black shrink-0" />
              <span className="line-clamp-1">
                {data.universityDistance || data.distance}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-gray-800">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-black shrink-0" />
                <span>{data.city}</span>
              </div>
              <div className="flex items-center gap-1">
                <BedDouble className="w-4 h-4 text-black shrink-0" />
                <span>{data.roommates} Roommates</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="text-right">
              <span className="text-xl font-bold text-black">
                {data.price} EGP
              </span>
              <span className="text-xs text-gray-500 font-normal">
                {" "}
                / month
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-xs text-gray-500 font-medium">
                {data.rating} ({data.reviews})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PropertyCard;
