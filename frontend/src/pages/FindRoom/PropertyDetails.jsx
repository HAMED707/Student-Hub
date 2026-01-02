import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from "../../assets/components/Navbar/Navbar.jsx"; 
import PropertyCard from "../../assets/components/PropertyCard/PropertyCard.jsx";
import { 
  MapPin, Star, Heart, Bed, Bath, Wifi, Maximize, 
  CheckCircle, Wind, Coffee, Utensils, Zap, Droplet, 
  Flame, Layout, Monitor, ChevronLeft, ChevronRight
} from 'lucide-react';

// ==========================================
// 1. بيانات العقار (Mock Data)
// ==========================================
const propertyData = {
  id: 1,
  title: "Cozy room near Cairo University",
  price: 2500,
  address: "Khalifa Al Maamon Street, Abbasiya, Cairo",
  description: "A modern and fully furnished student accommodation offering private and shared rooms near major universities. Enjoy high-speed Wi-Fi, study spaces, and 24/7 security in a friendly and safe environment — perfect for focused study and comfortable living.",
  landlord: {
    name: "Mohamed Ahmed",
    image: "https://randomuser.me/api/portraits/men/32.jpg"
  },
  images: [
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&q=80", 
    "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&q=80",
    "https://images.unsplash.com/photo-1522771753035-4850d32f7041?w=600&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80",
    "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&q=80"
  ],
  rooms: [
    { type: "Twin Room — 2 Persons", tags: ["14m²", "2 Beds", "Shared Bath", "AC", "Desk"], image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=200&q=80" },
    { type: "Single Room - Private Space", tags: ["12m²", "1 Bed", "Private Bath", "AC", "Desk"], image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200&q=80" },
    { type: "Shared Room — 3 Persons", tags: ["20m²", "3 Beds", "Shared Bath", "AC", "Desk"], image: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=200&q=80" }
  ],
  facilities: [
    { name: "Air Conditioning", icon: Wind },
    { name: "Fully Furnished", icon: Layout },
    { name: "Elevators", icon: Maximize },
    { name: "Study Rooms", icon: Monitor },
    { name: "Wifi", icon: Wifi },
    { name: "Restaurants", icon: Utensils },
    { name: "Supermarkets", icon: Coffee }
  ],
  bills: [
    { name: "Wifi", icon: Wifi },
    { name: "Water", icon: Droplet },
    { name: "Electricity", icon: Zap },
    { name: "Gas", icon: Flame }
  ],
  reviews: [
    { id: 1, user: "Kim Jhone", text: "Lorem ipsum is simply dummy text of the printing and typesetting industry.", rating: 5, avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
    { id: 2, user: "Ruri Kyla", text: "Standard dummy text ever since the 1500s.", rating: 4.5, avatar: "https://randomuser.me/api/portraits/women/65.jpg" }
  ]
};

const similarProperties = [
    {
      id: 101, title: "Furnished Apartment - El Hamra", location: "Cairo - El Hamra", distance: "10 mins from university", city: "Cairo", roommates: 2, price: 2500, rating: 4.5, reviews: 10, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80", amenities: ["Wifi", "AC"]
    },
    {
      id: 102, title: "Furnished Apartment - El Hamra", location: "Cairo - El Hamra", distance: "Walking distance", city: "Cairo", roommates: 3, price: 2800, rating: 4.8, reviews: 15, image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80", amenities: ["Wifi", "Gym"]
    },
    {
      id: 103, title: "Furnished Apartment - El Hamra", location: "Cairo - El Hamra", distance: "5 mins by bus", city: "Cairo", roommates: 1, price: 3500, rating: 4.2, reviews: 8, image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80", amenities: ["Wifi"]
    }
];

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Rooms");

  // دالة وهمية للانتقال لعرض الصور/الفيديو
  const handleViewAllPhotos = () => {
    console.log("Viewing full gallery or video for property:", propertyData.id);
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-20">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-6 max-w-7xl">
        
        {/* ================= 1. HEADER (المطابق 100%) ================= */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 border-b border-gray-200 pb-6">
           
           {/* Left: Title & Location */}
           <div className="flex-1 min-w-0">
              <h1 className="text-4xl font-extrabold text-[#091E42] mb-3 leading-tight">
                {propertyData.title}
              </h1>
              <div className="flex items-center text-gray-700 text-base font-medium">
                 <MapPin className="w-5 h-5 mr-2 text-black shrink-0" />
                 {/* خط تحت العنوان كما في التصميم */}
                 <span className="border-b border-gray-700 pb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                   {propertyData.address}
                 </span>
              </div>
           </div>
           
           {/* Right: Price & Button */}
           <div className="flex flex-col items-end flex-shrink-0">
              <div className="text-base font-medium text-gray-700 mb-3 whitespace-nowrap">
                 From 
                 {/* السعر: حجم 3XL ولون أزرق غامق */}
                 <span className="text-3xl font-extrabold text-[#0A2647] ml-1">
                   EGP {propertyData.price}
                 </span> 
                 {/* /month: حجم 2XL ولون النص الرئيسي */}
                 <span className="text-xl font-medium text-[#0A2647]">/month</span>
              </div>
              <button className="bg-[#0A2647] text-white px-8 py-3 rounded-xl font-bold text-base hover:bg-[#153a69] shadow-lg transition active:scale-95">
                 Select Room
              </button>
           </div>
        </div>
        {/* ================= نهاية HEADER ================= */}


        {/* ================= 2. GALLERY (معرض الصور - المحدث والمطابق) ================= */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[400px] mb-8 rounded-2xl overflow-hidden shadow-lg">
           
            {/* 1. الصورة الرئيسية (تأخذ عمودين) - مع الأزرار الجديدة */}
            <div className="md:col-span-2 h-full relative">
               <img 
                  src={propertyData.images[0]}
                  className="w-full h-full object-cover hover:scale-105 transition duration-700 cursor-pointer" 
                  alt="main property view" 
               />
               
               {/* شريط الأزرار الشفاف في الأسفل (مطابق للتصميم) */}
               <div className="absolute bottom-4 left-4 flex gap-2 z-10">
                  {/* الأزرار مجمعة في صف واحد لتتوافق مع التصميم الأخير (image_7dc1c5.png) */}
                  <button className="flex items-center gap-2 bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white transition shadow-lg">
                     <CheckCircle className="w-4 h-4" /> View 15 Photos
                  </button>
                  <button className="flex items-center gap-2 bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white transition shadow-lg">
                     <CheckCircle className="w-4 h-4" /> View Videos
                  </button>
                  <button className="flex items-center gap-2 bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white transition shadow-lg">
                     <MapPin className="w-4 h-4" /> Map View
                  </button>
               </div>
            </div>
            
            {/* 2. الصور الجانبية 1 و 2 */}
            <div className="hidden md:flex flex-col gap-4 h-full">
               <img src={propertyData.images[1]} className="w-full h-[192px] object-cover cursor-pointer" alt="secondary view 1" />
               <img src={propertyData.images[2]} className="w-full h-[192px] object-cover cursor-pointer" alt="secondary view 2" />
            </div>
            
            {/* 3. الصورة الأخيرة (مع زر الفيديو) */}
            <div className="hidden md:flex flex-col gap-4 h-full relative">
               <img src={propertyData.images[3]} className="w-full h-[192px] object-cover cursor-pointer" alt="secondary view 3" />
               <div className="relative h-[192px]">
                  <img src={propertyData.images[4]} className="w-full h-full object-cover" alt="secondary view 4" />
                  {/* Overlay لزر الفيديو */}
                  <div onClick={handleViewAllPhotos} className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer hover:bg-black/40 transition">
                     <div className="w-14 h-14 bg-white/70 backdrop-blur-sm rounded-full flex items-center justify-center">
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-black ml-1">
                            <path d="M6 3l12 9-12 9V3z"/>
                         </svg>
                     </div>
                  </div>
               </div>
            </div>
        </div>
        {/* ================= نهاية GALLERY ================= */}

        {/* ================= 3. CONTENT GRID (التفاصيل والسايد بار) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
           
           {/* LEFT COLUMN (Details) - 2/3 Width */}
           <div className="lg:col-span-2 space-y-8">
              
              {/* About this Property */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                 <h2 className="text-xl font-bold text-[#091E42] mb-4">About this Property</h2>
                 <p className="text-gray-600 text-sm leading-relaxed mb-6">{propertyData.description}</p>
                 
                 {/* Hosted by Section */}
                 <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                       <img src={propertyData.landlord.image} className="w-12 h-12 rounded-full border-2 border-white" alt="landlord" />
                       <div>
                          <p className="text-xs text-gray-500 font-bold">Hosted by</p>
                          <p className="text-sm font-bold text-[#091E42]">{propertyData.landlord.name}</p>
                       </div>
                    </div>
                    <button className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 text-gray-700">Send Inquiry</button>
                 </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
                 {["Rooms", "Facilities", "Bills", "Reviews"].map(tab => (
                    <button 
                       key={tab} 
                       onClick={() => setActiveTab(tab)}
                       className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition 
                       ${activeTab === tab ? "bg-[#0A2647] text-white" : "text-gray-500 hover:bg-gray-100"}`}
                    >
                       {tab}
                    </button>
                 ))}
              </div>

              {/* Choose Your Room Section */}
              <div id="rooms-section">
                 <h2 className="text-xl font-bold text-[#091E42] mb-6">Choose Your Room</h2>
                 <div className="space-y-4">
                    {propertyData.rooms.map((room, idx) => (
                       <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 hover:border-[#0A2647]/30 transition">
                          <img src={room.image} className="w-full sm:w-40 h-32 rounded-xl object-cover" alt="room" />
                          <div className="flex-1">
                             <h3 className="text-lg font-bold text-[#091E42] mb-2">{room.type}</h3>
                             {/* Tags Row */}
                             <div className="flex flex-wrap gap-2 mb-4">
                                {room.tags.map((tag, i) => (
                                   <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded font-medium flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" /> {tag}
                                   </span>
                                ))}
                             </div>
                             <div className="flex justify-end">
                                <button className="bg-[#0A2647] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-[#153a69]">Enquire</button>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Facilities & Services */}
              <div id="facilities-section">
                 <h2 className="text-xl font-bold text-[#091E42] mb-6">Facilities & Services</h2>
                 <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex flex-wrap gap-3">
                       {propertyData.facilities.map((fac, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-blue-50 text-[#091E42] px-3 py-2 rounded-lg text-xs font-bold border border-blue-100">
                             <fac.icon className="w-4 h-4" /> {fac.name}
                          </div>
                       ))}
                    </div>
                 </div>
              </div>

              {/* Your Bills */}
              <div id="bills-section">
                 <h2 className="text-xl font-bold text-[#091E42] mb-6">Your Bills</h2>
                 <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex flex-wrap gap-3">
                       {propertyData.bills.map((bill, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-xs font-bold border border-green-100">
                             <bill.icon className="w-4 h-4" /> {bill.name}
                          </div>
                       ))}
                    </div>
                 </div>
              </div>

              {/* Student Reviews & Ratings */}
              <div id="reviews-section">
                 <h2 className="text-xl font-bold text-[#091E42] mb-6">Student Reviews & Ratings</h2>
                 <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    
                    {/* Rating Breakdown Section */}
                    <div className="space-y-2 mb-6 border-b border-gray-100 pb-6">
                       {["Landlord Communication", "Safety & Security", "Cleanliness", "Value for Money"].map((label, i) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                             <span className="text-gray-600 font-medium">{label}</span>
                             <div className="flex items-center gap-1">
                                <div className="flex text-yellow-400">
                                    <Star className="w-3 h-3 fill-current"/><Star className="w-3 h-3 fill-current"/><Star className="w-3 h-3 fill-current"/><Star className="w-3 h-3 fill-current"/><Star className="w-3 h-3 text-gray-200"/>
                                </div>
                                <span className="text-xs text-gray-400 font-bold ml-1">4.0 (22)</span>
                             </div>
                          </div>
                       ))}
                    </div>
                    
                    {/* Individual Review Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {propertyData.reviews.map(review => (
                            <div key={review.id} className="bg-blue-600 p-6 rounded-2xl text-white relative">
                                <p className="text-xs leading-relaxed opacity-90 mb-4">"{review.text}"</p>
                                <div className="flex items-center gap-3">
                                   <img src={review.avatar} className="w-10 h-10 rounded-full border-2 border-white/20" alt="user" />
                                   <div>
                                      <p className="text-sm font-bold">{review.user}</p>
                                      <div className="flex text-yellow-400"><Star className="w-3 h-3 fill-current"/><Star className="w-3 h-3 fill-current"/><Star className="w-3 h-3 fill-current"/><Star className="w-3 h-3 fill-current"/><Star className="w-3 h-3 fill-current"/></div>
                                   </div>
                                </div>
                                <span className="absolute bottom-4 right-4 text-4xl font-serif opacity-20">“</span>
                            </div>
                        ))}
                         <div className="bg-blue-600 p-6 rounded-2xl text-white relative flex items-center justify-center min-h-[140px] opacity-80 cursor-pointer hover:opacity-100 transition">
                             <span className="font-bold text-sm">+ Add Your Review</span>
                        </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* RIGHT COLUMN (Sticky Sidebar) - 1/3 Width */}
           <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                 
                 {/* Header */}
                 <div className="bg-yellow-50 p-4 rounded-xl text-center mb-4">
                    <h3 className="font-bold text-lg text-[#091E42] mb-1">{propertyData.title}</h3>
                    <div className="text-sm text-gray-700">From <span className="font-extrabold text-[#091E42]">EGP {propertyData.price}</span> /month</div>
                 </div>
                 
                 {/* Select Room Button (Large and prominent) */}
                 <button className="w-full bg-[#0A2647] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#153a69] mb-4 shadow-md">
                     Select Room
                 </button>

                 {/* Quick Info (Reviews Yet / Saved) */}
                 <div className="bg-blue-50 rounded-xl p-3 mb-4 flex items-center justify-between">
                     <span className="text-sm font-bold text-[#091E42]">Reviews Yet</span>
                     <div className="flex items-center gap-1 text-xs text-blue-600 font-bold">
                         <Heart className="w-4 h-4" /> 1 person saved this
                     </div>
                 </div>

                 {/* Map Location */}
                 <div className="flex items-start gap-2 text-xs text-gray-500 mb-4">
                     <MapPin className="w-4 h-4 text-[#091E42] shrink-0" />
                     {propertyData.address}
                 </div>

                 {/* Map Placeholder */}
                 <div className="w-full h-40 bg-gray-100 rounded-xl flex items-center justify-center relative overflow-hidden group cursor-pointer border border-gray-200">
                     <div className="bg-white p-3 rounded-full shadow-lg z-10 group-hover:scale-110 transition">
                        <MapPin className="w-6 h-6 text-[#091E42] fill-[#0A2647]" />
                     </div>
                     {/* صورة خريطة خفيفة كخلفية */}
                     <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Map_marker.svg/1200px-Map_marker.svg.png')] opacity-10 bg-center bg-no-repeat bg-contain"></div>
                 </div>
              </div>
           </div>
        </div>

        {/* ================= 4. الجزء السفلي: Find your perfect student home easily ================= */}
        <div className="border-t border-gray-200 pt-10 mt-10">
           <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
              <div>
                 <h2 className="text-2xl font-bold text-[#091E42]">Find your perfect student home easily</h2>
                 <p className="text-gray-500 mt-2 text-sm">From shared rooms to private apartments near your university</p>
              </div>
              
              <div className="flex items-center gap-3">
                 <button className="px-4 py-2 rounded-full border border-gray-300 text-sm font-bold hover:bg-gray-50 transition">View All</button>
                 <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
                 <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
              </div>
           </div>

           {/* Grid الكروت */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarProperties.map(item => (
                 <PropertyCard key={item.id} property={item} />
              ))}
           </div>
        </div>

      </div>
    </div>
  );
};

export default PropertyDetails;