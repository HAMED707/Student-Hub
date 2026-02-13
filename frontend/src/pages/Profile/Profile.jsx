import React from 'react';
// ✅ 1. استيراد هوك التنقل
import { useNavigate } from 'react-router-dom';
// 👇 تأكد من مسار الناف بار
import Navbar from "../../assets/components/Navbar/Navbar.jsx"; 
import { 
  MapPin, School, Calendar, CheckCircle, Edit3, Share2, 
  Shield, Quote, FileText, GraduationCap, User, Star, Hash, Mail, 
  Globe, Linkedin, Github, Award, Check, ThumbsUp
} from 'lucide-react';

// ==========================================
// 1. البيانات
// ==========================================
const userData = {
  name: "Mathew Perry",
  email: "mathewperry@xyz.com",
  role: "Student",
  status: "Looking for a Room", 
  bio: "Computer Science student at EELU. I am a quiet person who loves coding and coffee. Looking for a respectful roommate who values cleanliness and privacy.",
  avatar: "https://ui-avatars.com/api/?name=Mathew+Perry&background=1A56DB&color=fff&size=256",
  cover: "https://picsum.photos/seed/profile-cover/1600/500",
  
  profileCompletion: 85,
  languages: ["Arabic", "English", "German"],
  badges: ["Top Rated", "Verified", "Quick Responder"],

  basicInfo: {
    location: "Nasr City, Cairo",
    university: "EELU",
    faculty: "Computers & IT",
    year: "4th Year"
  },

  interests: {
    sleepingTime: "Normal (11 PM)",
    studyEnv: "With Music",
    music: "Morning Person",
    guests: "Sometimes",
    personality: "Quiet",
    cleanliness: "Medium",
    roomType: "Single, Shared",
    smoking: "Non-Smoker",
    budget: "1000 - 2500 EGP"
  },

  preferences: {
    budgetRange: "1000 - 2000 EGP",
    preferredRoom: "Single / Shared",
    smokingPref: "Non-smoker",
    sleepingSch: "Early Bird",
    cleanlinessPref: "Medium",
    personalityPref: "Quiet"
  },

  verification: {
    nationalId: true,
    studentId: true,
    status: true
  },

  reviews: [
    { 
        id: 1, 
        author: "Kim Jhone", 
        role: "Landlord", 
        text: "Mathew is an exceptional tenant. Always pays rent on time and keeps the apartment in perfect condition. Highly recommended!", 
        rating: 5.0, 
        date: "2 days ago", 
        avatar: "https://ui-avatars.com/api/?name=Kim+Jhone&background=0A2647&color=fff&size=64" 
    },
    { 
        id: 2, 
        author: "Ruri Kyla", 
        role: "Roommate", 
        text: "Quiet and clean roommate. We studied together often, and he respects personal space.", 
        rating: 4.8, 
        date: "1 week ago", 
        avatar: "https://ui-avatars.com/api/?name=Ruri+Kyla&background=10B981&color=fff&size=64" 
    },
    { 
        id: 3, 
        author: "Omar Hassan", 
        role: "Classmate", 
        text: "Very friendly and helpful. He helped me a lot with the graduation project. Great person to live with.", 
        rating: 5.0, 
        date: "3 weeks ago", 
        avatar: "https://ui-avatars.com/api/?name=Omar+Hassan&background=6366f1&color=fff&size=64" 
    },
    { 
        id: 4, 
        author: "Sarah Miller", 
        role: "Neighbor", 
        text: "Never had any noise issues. Very polite and respectful young man.", 
        rating: 4.5, 
        date: "1 month ago", 
        avatar: "https://ui-avatars.com/api/?name=Sarah+Miller&background=f43f5e&color=fff&size=64" 
    }
  ]
};

// مكون صغير للتفاصيل
const DetailBox = ({ label, value }) => (
  <div className="flex flex-col gap-1 w-full p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md hover:border-[#0A2647]/30 transition-all duration-300 cursor-default">
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
    <span className="text-sm font-bold text-gray-800 line-clamp-1">{value}</span>
  </div>
);

const Profile = () => {
  // ✅ 2. تفعيل هوك التنقل
  const navigate = useNavigate();

  // ✅ 3. دالة الانتقال لصفحة التعديل
  const handleEditProfile = () => {
    navigate('/edit-profile'); // هذا السطر هو المسؤول عن الانتقال
  };

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Profile Link Copied to Clipboard! 📋");
  };

  const handleViewDocs = () => {
    alert("Opening Verification Documents... 🔒");
  };

  const handleCompleteProfile = () => {
    alert("Opening Profile Completion Wizard... 🚀");
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-20">
      <Navbar />

      <div className="w-full px-4 md:px-8 py-6">

        {/* ================= HEADER ================= */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden mb-8 relative group">
          
          {/* Cover */}
          <div className="h-72 w-full relative overflow-hidden">
            <img 
              src={userData.cover} 
              alt="cover" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
            <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-xl flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
               {userData.status}
            </div>
          </div>

          <div className="px-8 pb-8 relative">
            <div className="flex flex-col lg:flex-row gap-8">
               
               {/* Avatar */}
               <div className="-mt-24 flex-shrink-0 relative z-10">
                   <div className="relative inline-block">
                     <img 
                        src={userData.avatar} 
                        alt="profile" 
                        className="w-44 h-44 rounded-full object-cover border-[6px] border-white shadow-2xl" 
                     />
                     <div className="absolute bottom-4 right-4 bg-[#0A2647] text-white p-1.5 rounded-full border-4 border-white shadow-md" title="Verified">
                         <Shield className="w-5 h-5" />
                     </div>
                   </div>
               </div>

               {/* Name & Actions */}
               <div className="flex-1 pt-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
                     <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-extrabold text-[#0A2647]">{userData.name}</h1>
                            {userData.badges.map((badge, index) => (
                              <span key={index} className="hidden md:flex items-center gap-1 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-lg text-[11px] font-bold border border-yellow-200 shadow-sm">
                                 <Award className="w-3 h-3" /> {badge}
                              </span>
                           ))}
                        </div>
                        <p className="text-gray-500 font-medium flex items-center gap-2">
                           <span className="font-bold text-[#0A2647]">{userData.role}</span> 
                           <span className="w-1 h-1 rounded-full bg-gray-300"></span> 
                           {userData.basicInfo.university} 
                           <span className="w-1 h-1 rounded-full bg-gray-300"></span> 
                           {userData.basicInfo.location}
                        </p>
                     </div>

                     {/* ✅ الأزرار المفعلة */}
                     <div className="flex gap-3">
                       <button 
                            onClick={handleEditProfile}
                            className="px-8 py-3 rounded-lg bg-[#0A2647] text-white font-bold hover:bg-[#153a69] hover:shadow-lg active:scale-95 transition-all duration-200 flex items-center gap-2"
                        >
                          <Edit3 className="w-4 h-4" /> Edit Profile
                       </button>
                       <button 
                            onClick={handleShareProfile}
                            className="px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-600 hover:border-[#0A2647] hover:text-[#0A2647] active:scale-95 transition-all duration-200 bg-white"
                        >
                          <Share2 className="w-5 h-5" />
                       </button>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* ================= MAIN CONTENT GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

           {/* --- LEFT COLUMN [8/12] --- */}
           <div className="lg:col-span-8 space-y-8">
              
              {/* About Me */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition hover:shadow-md">
                 <h3 className="text-xl font-bold text-[#0A2647] mb-6 flex items-center gap-2">
                    <User className="w-6 h-6" /> About Me
                 </h3>
                 <p className="text-gray-700 leading-relaxed text-sm md:text-base mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    "{userData.bio}"
                 </p>
                 
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {[
                        { icon: MapPin, label: "Location", value: userData.basicInfo.location, color: "text-red-500 bg-red-50" },
                        { icon: School, label: "University", value: userData.basicInfo.university, color: "text-blue-500 bg-blue-50" },
                        { icon: GraduationCap, label: "Faculty", value: userData.basicInfo.faculty, color: "text-purple-500 bg-purple-50" },
                        { icon: Calendar, label: "Year", value: userData.basicInfo.year, color: "text-green-500 bg-green-50" }
                     ].map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center p-4 rounded-lg border border-gray-100 hover:bg-white hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${item.color}`}>
                              <item.icon className="w-5 h-5" />
                           </div>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{item.label}</p>
                           <p className="font-bold text-gray-900 text-xs md:text-sm mt-1">{item.value}</p>
                        </div>
                     ))}
                 </div>
              </div>

              {/* Interests & Lifestyle */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition hover:shadow-md">
                 <h2 className="text-xl font-bold text-[#0A2647] mb-6">Interests & Lifestyle</h2>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(userData.interests).map(([key, value]) => (
                       <DetailBox key={key} label={key.replace(/([A-Z])/g, ' $1').trim()} value={value} />
                    ))}
                 </div>
              </div>

              {/* Preferences */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition hover:shadow-md">
                 <h2 className="text-xl font-bold text-[#0A2647] mb-6">Personal Preferences</h2>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(userData.preferences).map(([key, value]) => (
                       <DetailBox key={key} label={key.replace(/([A-Z])/g, ' $1').trim()} value={value} />
                    ))}
                 </div>
              </div>

              {/* ✅ Reviews - تصميم جديد ومحسن */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                 <div className="flex justify-between items-center mb-6">
                     <h2 className="text-xl font-bold text-[#0A2647] flex items-center gap-2">
                        <Star className="w-6 h-6 text-yellow-500 fill-current" />
                        Reviews ({userData.reviews.length})
                     </h2>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userData.reviews.map((review) => (
                       // ✅ التصميم الجديد: كارت أبيض نظيف مع حدود ملونة
                       <div key={review.id} className="flex flex-col p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:border-l-4 hover:border-l-[#0A2647] transition-all duration-300 group">
                          
                          {/* Header */}
                          <div className="flex items-center gap-3 mb-4">
                             <img src={review.avatar} alt="user" className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 shadow-sm" />
                             <div>
                                <h4 className="font-bold text-gray-900 text-sm">{review.author}</h4>
                                <div className="flex items-center gap-2">
                                   <span className="text-[10px] font-bold text-[#0A2647] bg-blue-50 px-2 py-0.5 rounded">{review.role}</span>
                                   <span className="text-[10px] text-gray-400">{review.date}</span>
                                </div>
                             </div>
                          </div>

                          {/* Text */}
                          <div className="relative flex-1 mb-4">
                             <Quote className="w-6 h-6 text-gray-200 absolute -top-1 -left-1 opacity-50" />
                             <p className="text-gray-600 text-sm leading-relaxed pl-6 italic">
                                "{review.text}"
                             </p>
                          </div>

                          {/* Footer Rating */}
                          <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-auto">
                             <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                   <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(review.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                                ))}
                             </div>
                             <span className="font-bold text-gray-900 text-sm">{review.rating}</span>
                          </div>

                       </div>
                    ))}
                 </div>
              </div>

           </div>

           {/* --- RIGHT SIDEBAR [4/12] (Sticky) --- */}
           <div className="lg:col-span-4 space-y-8 sticky top-6">
              
              {/* Profile Strength - Gradient */}
              <div className="bg-gradient-to-br from-[#0A2647] to-[#0d3b66] p-8 rounded-2xl shadow-xl text-white relative overflow-hidden group">
                 {/* Decorative background element */}
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 transition group-hover:bg-white/10"></div>
                 
                 <div className="relative z-10">
                    <h2 className="text-lg font-bold mb-1">Profile Strength</h2>
                    <div className="flex items-end gap-2 mt-1 mb-4">
                        <span className="text-4xl font-extrabold text-white">{userData.profileCompletion}%</span>
                        <span className="text-xs text-green-400 font-bold bg-green-900/30 px-2 py-0.5 rounded border border-green-500/20">Excellent!</span>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-2.5 mb-6">
                       <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2.5 rounded-full shadow-[0_0_10px_rgba(74,222,128,0.5)]" style={{ width: `${userData.profileCompletion}%` }}></div>
                    </div>
                    {/* زر التفعيل */}
                    <button 
                        onClick={handleCompleteProfile}
                        className="w-full py-3 bg-white text-[#0A2647] font-bold rounded-lg text-sm hover:bg-gray-50 transition shadow-lg active:scale-95"
                    >
                       Complete Profile
                    </button>
                 </div>
              </div>

              {/* Verification */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition hover:shadow-md">
                 <h2 className="text-xl font-bold text-[#0A2647] mb-6 flex items-center gap-3">
                    <Shield className="w-6 h-6 text-[#0A2647]" /> Verification
                 </h2>
                 <div className="space-y-4 mb-6">
                    {["National ID", "Student ID", "University Email"].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-white hover:border-[#0A2647]/20 transition">
                         <span className="text-gray-700 font-bold text-sm">{item}</span>
                         <span className="text-[#0A2647] font-bold flex items-center gap-1 text-xs">
                           <CheckCircle className="w-3.5 h-3.5 fill-[#0A2647] text-white" /> Verified
                         </span>
                      </div>
                    ))}
                 </div>
                 {/* زر التفعيل */}
                 <button 
                    onClick={handleViewDocs}
                    className="w-full py-4 rounded-lg border-2 border-[#0A2647] text-[#0A2647] font-bold text-sm hover:bg-[#0A2647] hover:text-white transition flex justify-center items-center gap-2 active:scale-95"
                 >
                    <FileText className="w-4 h-4" /> View Documents
                 </button>
              </div>

              {/* Languages & Socials */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition hover:shadow-md">
                 <h2 className="text-lg font-bold text-[#0A2647] mb-4">Languages</h2>
                 <div className="flex flex-wrap gap-2 mb-6">
                    {userData.languages.map((lang, idx) => (
                       <span key={idx} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold text-gray-700">
                          <Globe className="w-3.5 h-3.5 text-[#0A2647]" /> {lang}
                       </span>
                    ))}
                 </div>
                 <div className="flex gap-3">
                    <button className="flex-1 py-3 bg-[#0077b5] text-white rounded-lg flex justify-center items-center hover:opacity-90 hover:shadow-md transition active:scale-95"><Linkedin className="w-5 h-5"/></button>
                    <button className="flex-1 py-3 bg-[#333] text-white rounded-lg flex justify-center items-center hover:opacity-90 hover:shadow-md transition active:scale-95"><Github className="w-5 h-5"/></button>
                 </div>
              </div>

           </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;