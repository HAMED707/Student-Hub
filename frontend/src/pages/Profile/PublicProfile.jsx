import React from 'react';
import Navbar from "../../assets/components/Navbar/navbar.jsx"; 
import { 
  MapPin, School, Calendar, CheckCircle, Share2, 
  Shield, Quote, FileText, GraduationCap, User, Star, 
  Globe, Linkedin, Github, Award, MessageCircle, UserPlus, Heart, Check
} from 'lucide-react';

const userData = {
  name: "Mathew Perry",
  email: "mathewperry@xyz.com",
  avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
  cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop",

  status: "Looking for a roommate",
  matchScore: 85, 

  basicInfo: [
    { label: "Full Name", value: "Mathew Perry" },
    { label: "Location", value: "Nasr City, Cairo" },
    { label: "University", value: "EELU" },
    { label: "Faculty / Major", value: "Computers and Information Technology" },
    { label: "Academic Year", value: "4th" },
  ],

  interests: [
    { label: "Sleeping Time", value: "Normal (11 PM)" },
    { label: "Study Environment", value: "With Music" },
    { label: "Routine", value: "Morning Person" },
    { label: "Guests Frequency", value: "Sometimes" },
    { label: "Personality Type", value: "Quiet" },
    { label: "Cleanliness Level", value: "Medium" },
    { label: "Room Type", value: "Single , Shared" },
    { label: "Smoking Status", value: "Non-Smoker" },
    { label: "Budget Range", value: "1000-2500 EGP" },
  ],

  preferences: [
    { label: "Budget Range", value: "1000-2000 EGP" },
    { label: "Preferred Room Type", value: "Single / Shared" },
    { label: "Smoking Preference", value: "Non-smoker" },
    { label: "Sleeping Schedule", value: "Early" },
    { label: "Cleanliness Level", value: "Medium" },
    { label: "Personality Type", value: "Quiet" },
  ],

  reviews: [
    {
      id: 1,
      author: "Kim Jhone",
      role: "Landlord",
      text: "Mathew is an exceptional tenant. Always pays rent on time and keeps the apartment in perfect condition.",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    {
      id: 2,
      author: "Ruri Kyla",
      role: "Roommate",
      text: "Quiet and clean roommate. We studied together often, and he respects personal space. Highly recommend!",
      avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    },
    {
      id: 3,
      author: "Omar Hassan",
      role: "Classmate",
      text: "Very friendly and helpful. Great person to live with during the academic year.",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
  ],

  verification: [
    { label: "National ID", status: "Verified" },
    { label: "Student ID", status: "Verified" },
    { label: "University Email", status: "Verified" },
  ],
};

const InfoField = ({ label, value }) => (
  <div className="flex flex-col mb-4 group">
    <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1.5 ml-1">
      {label}
    </label>
    <div className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 bg-white shadow-sm hover:border-gray-300 transition-all duration-200 w-full break-words">
      {value}
    </div>
  </div>
);

const SectionCard = ({ title, children }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 hover:shadow-md transition-shadow duration-300">
    <div className="border-b border-gray-100 pb-4 mb-5">
      <h3 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h3>
    </div>
    {children}
  </div>
);

const PublicProfile = () => {
  return (
    <div className="min-h-screen bg-[#f4f7f9] font-sans pb-20 antialiased">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
          {/* Cover Image & Status Banner */}
          <div className="h-52 w-full relative bg-gray-900">
            <img
              src={userData.cover}
              alt="Cover"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur text-blue-700 px-4 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 border border-gray-100">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-gray-500 font-semibold">Status:</span>
              {userData.status}
            </div>
          </div>

          {/* Profile Info Row (تم تعديل الهيكل ليتوافق تماماً مع الهواتف دون تداخل) */}
          <div className="px-6 md:px-10 pt-4 pb-8">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-5">
              
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left w-full md:w-auto">
                {/* Avatar */}
                <div className="relative shrink-0 -mt-20 z-10">
                  <img
                    src={userData.avatar}
                    alt="Avatar"
                    className="w-28 h-28 md:w-32 md:h-32 rounded-full border-[5px] border-white shadow-xl object-cover bg-white"
                  />
                  <div
                    className="absolute bottom-1 right-1 bg-green-500 text-white p-1.5 rounded-full border-2 border-white shadow"
                    title="Verified User"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>

                {/* Name, Location & Email (تم إضافة الإيميل هنا لعرضه بالكامل) */}
                <div className="flex-1 min-w-0 pt-2">
                  <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                    {userData.name}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-1.5 text-xs font-medium text-gray-500">
                    <p className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" /> {userData.basicInfo[1].value}
                    </p>
                    <span className="text-gray-300 hidden sm:inline">•</span>
                    <p className="flex items-center gap-1 break-all">
                      <Mail className="w-3.5 h-3.5 text-gray-400" /> {userData.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 w-full md:w-auto shrink-0 mt-2 md:mt-0">
                <button className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 transition-all flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Message
                </button>
                <button className="flex-1 md:flex-none bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center justify-center gap-2">
                  <UserPlus className="w-4 h-4" /> Invite
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-2">
            <SectionCard title="Basic Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                {userData.basicInfo.map((info, idx) => (
                  <div key={idx} className={info.label === "University" ? "md:col-span-2" : ""}>
                    <InfoField label={info.label} value={info.value} />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Interests & Lifestyle">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4">
                {userData.interests.map((item, idx) => (
                  <InfoField key={idx} label={item.label} value={item.value} />
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Personal Preferences (What I'm looking for)">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4">
                {userData.preferences.map((item, idx) => (
                  <InfoField key={idx} label={item.label} value={item.value} />
                ))}
              </div>
            </SectionCard>

            {/* Reviews Section (تم تعديل التصميم ليكون عمودياً مريحاً للعين ومتناسقاً مع المنصة بدون مشاكل الـ Scrollbar) */}
            <SectionCard title="Reviews from Landlords & Students">
              <div className="space-y-4">
                {userData.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-5 rounded-2xl border border-gray-100 bg-gray-50/40 hover:bg-white hover:shadow-md hover:border-gray-200/60 transition-all duration-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={review.avatar}
                          alt={review.author}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                        />
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{review.author}</h4>
                          <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md mt-0.5 inline-block uppercase tracking-wide">
                            {review.role}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed italic pl-1">
                      "{review.text}"
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Compatibility Score Widget */}
            <div className="bg-gradient-to-br from-indigo-900 to-blue-900 p-6 rounded-2xl shadow-md text-white">
              <div className="flex items-center gap-2 mb-4 opacity-90">
                <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <h3 className="font-bold text-sm tracking-wide uppercase">Compatibility Match</h3>
              </div>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-black tracking-tight">
                  {userData.matchScore}%
                </span>
                <span className="text-xs text-blue-200 mb-1 font-semibold">Great Match!</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-green-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${userData.matchScore}%` }}
                ></div>
              </div>
              <p className="text-xs text-blue-200/80 mt-4 leading-relaxed">
                Based on your lifestyle and preferences, Mathew is a highly
                compatible roommate option.
              </p>
            </div>

            {/* Verification Widget */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="border-b border-gray-100 pb-3 mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 tracking-tight">
                  <ShieldCheck className="w-5 h-5 text-green-500" /> Trust & Verification
                </h3>
              </div>

              <div className="space-y-2.5">
                {userData.verification.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100/70"
                  >
                    <span className="text-xs font-bold text-gray-700">
                      {item.label}
                    </span>
                    <span className="text-[10px] font-extrabold text-green-700 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-md uppercase tracking-wide">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PublicProfile;