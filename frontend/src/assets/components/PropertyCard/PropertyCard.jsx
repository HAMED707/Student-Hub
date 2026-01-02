import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. استيراد useNavigate
import { MapPin, Star, PersonStanding, Heart, BedDouble } from 'lucide-react';

const PropertyCard = ({ property, initialFavorite = false }) => {
  const navigate = useNavigate(); // 2. تفعيل الهوك
  const [isFavorite, setIsFavorite] = useState(initialFavorite);

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
      className="group bg-[#F9FAFB] rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer relative flex flex-col w-full max-w-sm mx-auto"
    >
      
      {/* الصورة */}
      <div className="relative h-64 overflow-hidden shrink-0">
        <img 
          src={data.image} 
          alt={data.title} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = "https://via.placeholder.com/400x300?text=Error"; }}
        />

        {/* طبقة View Details */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
          <span className="text-white text-xl font-medium tracking-wide">View Details</span>
        </div>

        <div className="absolute top-4 left-4 bg-[#10b981] text-white text-[10px] font-bold px-3 py-1.5 rounded-full z-20 shadow-sm">
          Available for reservation
        </div>

        {/* زر القلب */}
        <button 
          onClick={toggleFavorite}
          className="absolute top-4 right-4 z-20 bg-white rounded-full p-2 shadow-md transition-transform hover:scale-110 active:scale-95 flex items-center justify-center"
        >
          <Heart 
            size={20}
            className={`transition-colors duration-200 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} 
          />
        </button>
      </div>

      {/* المحتوى */}
      <div className="p-4 flex flex-col gap-2">
        <div>
          <h3 className="text-lg font-bold text-gray-900 leading-tight line-clamp-1">{data.title}</h3>
          <p className="text-gray-500 text-sm mt-1 line-clamp-1">{data.location}</p>
        </div>

        <div className="flex justify-between items-end mt-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-800">
              <PersonStanding className="w-4 h-4 text-black shrink-0" />
              <span className="line-clamp-1">{data.universityDistance || data.distance}</span>
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
              <span className="text-xl font-bold text-black">{data.price} EGP</span>
              <span className="text-xs text-gray-500 font-normal"> / month</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-xs text-gray-500 font-medium">{data.rating} ({data.reviews})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;