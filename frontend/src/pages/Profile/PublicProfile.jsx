import React from 'react';
import Navbar from "../../assets/components/Navbar/navbar.jsx"; 
import { 
  MapPin, School, Calendar, CheckCircle, Share2, 
  Shield, Quote, FileText, GraduationCap, User, Star, 
  Globe, Linkedin, Github, Award, MessageCircle, UserPlus, Heart, Check
} from 'lucide-react';

// ==========================================
// 1. بيانات الطالب (المعروضة للعامة)
// ==========================================
const userData = {
  name: "Mathew Perry",
  role: "Student",
  status: "Looking for a Roommate", // تم التعديل لتناسب سياق الطالب
  bio: "Computer Science student at EELU. I am a quiet person who loves coding and coffee. Looking for a respectful roommate who values cleanliness and privacy.",
  avatar: "https://ui-avatars.com/api/?name=Mathew+Perry&background=1A56DB&color=fff&size=256",
  cover: "https://picsum.photos/seed/profile-cover/1600/500",
  
  matchScore: 85, // نسبة التوافق مع الطالب الزائر (افتراضي)
  
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

  reviews: [
    { id: 1, author: "Kim Jhone", role: "Landlord", text: "Very polite and pays rent on time.", rating: 5, date: "2 days ago", avatar: "https://ui-avatars.com/api/?name=Kim+Jhone&background=0A2647&color=fff&size=64" },
    { id: 2, author: "Ruri Kyla", role: "Student", text: "Quiet and clean roommate.", rating: 4.5, date: "1 week ago", avatar: "https://ui-avatars.com/api/?name=Ruri+Kyla&background=10B981&color=fff&size=64" }
  ]
};

const DetailBox = ({ label, value }) => (
  <div className="flex flex-col gap-1 w-full p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md hover:border-[#0A2647]/30 transition-all duration-300 cursor-default">
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
    <span className="text-sm font-bold text-gray-800 line-clamp-1">{value}</span>
  </div>
);

const PublicProfile = () => {
  // ❌ محاكاة: الزائر طالب وليس مالك
  const isLandlordView = false; 

  const handleConnect = () => alert("Friend Request Sent! 👥");
  const handleMessage = () => alert("Opening Chat... 💬");
  const handleSave = () => alert("Profile Saved to Favorites! ❤️");

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-20">
      <Navbar />

      <div className="w-full px-4 md:px-8 py-6">

        {/* ================= HEADER SECTION ================= */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden mb-8 relative group">
          
          <div className="h-72 w-full relative overflow-hidden">
            <img src={userData.cover} alt="cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
            
            {/* حالة الطالب */}
            <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-xl flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
               {userData.status}
            </div>
          </div>

          <div className="px-8 pb-8 relative">
            <div className="flex flex-col lg:flex-row gap-8">
               
               <div className="-mt-24 flex-shrink-0 relative z-10">
                   <div className="relative inline-block">
                     <img src={userData.avatar} alt="profile" className="w-44 h-44 rounded-full object-cover border-[6px] border-white shadow-2xl" />
                     <div className="absolute bottom-4 right-4 bg-[#0A2647] text-white p-1.5 rounded-full border-4 border-white shadow-md" title="Verified User">
                         <Shield className="w-5 h-5" />
                     </div>
                   </div>
               </div>

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
                        </p>
                     </div>

                     {/* ✅ أزرار التفاعل للطالب الزائر */}
                     <div className="flex gap-3">
                       <button onClick={handleConnect} className="px-6 py-3 rounded-lg bg-[#0A2647] text-white font-bold hover:bg-[#153a69] shadow-lg transition flex items-center gap-2">
                          <UserPlus className="w-4 h-4" /> Connect
                       </button>
                       <button onClick={handleMessage} className="px-4 py-3 rounded-lg bg-gray-100 text-[#0A2647] font-bold hover:bg-gray-200 transition">
                          <MessageCircle className="w-5 h-5" />
                       </button>
                       <button onClick={handleSave} className="px-4 py-3 rounded-lg border-2 border-pink-100 text-pink-500 hover:bg-pink-50 font-bold transition">
                          <Heart className="w-5 h-5" />
                       </button>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* ================= MAIN CONTENT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

           {/* --- LEFT COLUMN --- */}
           <div className="lg:col-span-8 space-y-8">
              
              {/* About Me */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                 <h3 className="text-xl font-bold text-[#0A2647] mb-6 flex items-center gap-2">
                    <User className="w-6 h-6" /> About Me
                 </h3>
                 <p className="text-gray-700 leading-relaxed text-sm md:text-base mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    "{userData.bio}"
                 </p>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {[
                        { icon: MapPin, label: "Looking In", value: userData.basicInfo.location },
                        { icon: School, label: "University", value: userData.basicInfo.university },
                        { icon: GraduationCap, label: "Major", value: userData.basicInfo.faculty },
                        { icon: Calendar, label: "Year", value: userData.basicInfo.year }
                     ].map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center p-4 rounded-lg border border-gray-100 bg-gray-50/50">
                           <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-white shadow-sm text-[#0A2647]">
                              <item.icon className="w-5 h-5" />
                           </div>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{item.label}</p>
                           <p className="font-bold text-gray-900 text-xs md:text-sm mt-1">{item.value}</p>
                        </div>
                     ))}
                 </div>
              </div>

              {/* Lifestyle & Habits */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                 <h2 className="text-xl font-bold text-[#0A2647] mb-6">Lifestyle & Habits</h2>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(userData.interests).map(([key, value]) => (
                       <DetailBox key={key} label={key.replace(/([A-Z])/g, ' $1').trim()} value={value} />
                    ))}
                 </div>
              </div>

              {/* Reviews */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                 <h2 className="text-xl font-bold text-[#0A2647] mb-6 flex items-center gap-2">
                    <Star className="w-6 h-6 text-yellow-500 fill-current" /> What others say
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userData.reviews.map((review) => (
                       <div key={review.id} className="flex flex-col p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-[#0A2647]/30 transition group">
                          <div className="flex items-center gap-3 mb-4">
                             <img src={review.avatar} alt="user" className="w-12 h-12 rounded-full object-cover border-2 border-gray-100" />
                             <div>
                                <h4 className="font-bold text-gray-900 text-sm">{review.author}</h4>
                                <span className="text-[10px] font-bold text-[#0A2647] bg-blue-50 px-2 py-0.5 rounded">{review.role}</span>
                             </div>
                          </div>
                          <p className="text-gray-600 text-sm italic mb-3">"{review.text}"</p>
                          <div className="flex gap-1 mt-auto">
                             {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(review.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                             ))}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

           </div>

           {/* --- RIGHT SIDEBAR (Sticky) --- */}
           <div className="lg:col-span-4 space-y-8 sticky top-6">
              
              {/* ✅ بطاقة التوافق للطالب (Compatibility Score) */}
              <div className="bg-[#0A2647] p-8 rounded-2xl shadow-xl text-white relative overflow-hidden">
                 {/* خلفية زخرفية */}
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                 
                 <div className="relative z-10 text-center">
                    <h2 className="text-lg font-bold mb-2">Compatibility Match</h2>
                    <p className="text-gray-300 text-xs mb-6">Based on your preferences & habits</p>
                    
                    <div className="w-32 h-32 mx-auto rounded-full border-4 border-green-400 flex items-center justify-center bg-white/10 mb-6 relative">
                       <span className="text-4xl font-extrabold text-white">{userData.matchScore}%</span>
                       <div className="absolute -bottom-3 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                          High Match
                       </div>
                    </div>

                    <div className="space-y-3 text-left bg-white/5 p-4 rounded-xl mb-6">
                       <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">Sleeping Habits</span>
                          <span className="text-green-400 text-xs font-bold flex items-center gap-1"><Check className="w-3 h-3"/> Match</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">Cleanliness</span>
                          <span className="text-green-400 text-xs font-bold flex items-center gap-1"><Check className="w-3 h-3"/> Match</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">Budget</span>
                          <span className="text-yellow-400 text-xs font-bold flex items-center gap-1">Close</span>
                       </div>
                    </div>

                    <button onClick={handleConnect} className="w-full py-3 bg-white text-[#0A2647] font-bold rounded-lg text-sm hover:bg-gray-100 transition shadow-lg">
                       Send Roommate Request
                    </button>
                 </div>
              </div>

              {/* Shared Interests */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                 <h2 className="text-xl font-bold text-[#0A2647] mb-6 flex items-center gap-3">
                    <Share2 className="w-5 h-5 text-[#0A2647]" /> Common Interests
                 </h2>
                 <div className="flex flex-wrap gap-2">
                    {["Coding", "Coffee", "Gaming", "Reading"].map((tag, idx) => (
                       <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-[#0A2647] hover:text-white transition cursor-default">
                          #{tag}
                       </span>
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