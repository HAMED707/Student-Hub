import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../../assets/components/Navbar/Navbar.jsx"; 
import { Search, SlidersHorizontal, Heart, X, MapPin, DollarSign, Clock, Check, Users, School, Wallet } from 'lucide-react';

// ==========================================
// 1. بيانات الطلاب (موسعة ومتنوعة)
// ==========================================
const roommatesData = [
  {
    id: 1, name: "Sara Mohamed", gender: "Female", year: "1st Year", university: "Cairo University",
    budget: "2000-3000", bio: "Medicine student, quiet and organized.",
    tags: ["Quiet", "Clean"], matchPercentage: 98,
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
    details: { sleepTime: "10 PM", cleanliness: "High", hobbies: ["Reading", "Yoga"] }
  },
  {
    id: 2, name: "Ahmed Ali", gender: "Male", year: "2nd Year", university: "Ain Shams University",
    budget: "1000-2000", bio: "Engineering student, loves gaming.",
    tags: ["Gamer", "Night owl"], matchPercentage: 90,
    image: "https://ui-avatars.com/api/?name=Ahmed+Ali&background=0A2647&color=fff",
    details: { sleepTime: "2 AM", cleanliness: "Moderate", hobbies: ["Gaming", "Coding"] }
  },
  {
    id: 3, name: "Nourhan Ezzat", gender: "Female", year: "3rd Year", university: "Helwan University",
    budget: "3000+", bio: "Fine Arts student, loves painting and music.",
    tags: ["Artistic", "Friendly"], matchPercentage: 85,
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80",
    details: { sleepTime: "12 AM", cleanliness: "High", hobbies: ["Drawing", "Music"] }
  },
  {
    id: 4, name: "Omar Hassan", gender: "Male", year: "4th Year", university: "Cairo University",
    budget: "2000-3000", bio: "CS student, focused on graduation project.",
    tags: ["Studious", "Calm"], matchPercentage: 88,
    image: "https://ui-avatars.com/api/?name=Omar+Hassan&background=ced4da&color=fff",
    details: { sleepTime: "11 PM", cleanliness: "Very High", hobbies: ["Tech", "Chess"] }
  },
  {
    id: 5, name: "Mahmoud Samy", gender: "Male", year: "1st Year", university: "Ain Shams University",
    budget: "1000-2000", bio: "Freshman looking for new friends.",
    tags: ["Social", "Funny"], matchPercentage: 75,
    image: "https://ui-avatars.com/api/?name=Mahmoud+Samy&background=10B981&color=fff",
    details: { sleepTime: "1 AM", cleanliness: "Moderate", hobbies: ["Football", "Movies"] }
  },
  {
    id: 6, name: "Laila Ahmed", gender: "Female", year: "2nd Year", university: "Cairo University",
    budget: "3000+", bio: "Pharmacy student, clean and cooks well.",
    tags: ["Cook", "Tidy"], matchPercentage: 92,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    details: { sleepTime: "11 PM", cleanliness: "High", hobbies: ["Cooking", "Travel"] }
  },
  {
    id: 7, name: "Kareem Wael", gender: "Male", year: "3rd Year", university: "Helwan University",
    budget: "2000-3000", bio: "Business student, working part-time.",
    tags: ["Busy", "Quiet"], matchPercentage: 65,
    image: "https://ui-avatars.com/api/?name=Kareem+Wael&background=F59E0B&color=fff",
    details: { sleepTime: "12 AM", cleanliness: "Moderate", hobbies: ["Gym", "Business"] }
  },
  {
    id: 8, name: "Salma Hany", gender: "Female", year: "4th Year", university: "Ain Shams University",
    budget: "1000-2000", bio: "Architecture student, always working on models.",
    tags: ["Creative", "Night owl"], matchPercentage: 80,
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=80",
    details: { sleepTime: "3 AM", cleanliness: "Moderate", hobbies: ["Design", "Photography"] }
  },
  {
    id: 9, name: "Youssef Tarek", gender: "Male", year: "1st Year", university: "Cairo University",
    budget: "3000+", bio: "Dentistry student, looking for luxury apartment.",
    tags: ["Rich", "Chill"], matchPercentage: 70,
    image: "https://ui-avatars.com/api/?name=Youssef+Tarek&background=6366f1&color=fff",
    details: { sleepTime: "1 AM", cleanliness: "High", hobbies: ["Cars", "Gaming"] }
  },
  {
    id: 10, name: "Hana Magdy", gender: "Female", year: "2nd Year", university: "Helwan University",
    budget: "1000-2000", bio: "Law student, loves reading books.",
    tags: ["Reader", "Calm"], matchPercentage: 89,
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
    details: { sleepTime: "10 PM", cleanliness: "Very High", hobbies: ["Reading", "Writing"] }
  }
];

const Roommates = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [roommates, setRoommates] = useState(roommatesData);

  // حالة الفلاتر المتعددة
  const [filters, setFilters] = useState({
    gender: "All",
    university: "All",
    year: "All",
    budget: "All"
  });

  // ==========================================
  // 2. منطق الفلترة المتقدم
  // ==========================================
  const filteredRoommates = useMemo(() => {
    return roommates.filter(student => {
      // 1. البحث بالاسم
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. فلتر النوع
      const matchesGender = filters.gender === "All" || student.gender === filters.gender;
      
      // 3. فلتر الجامعة
      const matchesUni = filters.university === "All" || student.university === filters.university;
      
      // 4. فلتر السنة
      const matchesYear = filters.year === "All" || student.year === filters.year;

      // 5. فلتر الميزانية
      const matchesBudget = filters.budget === "All" || student.budget === filters.budget;

      return matchesSearch && matchesGender && matchesUni && matchesYear && matchesBudget;
    });
  }, [searchTerm, filters, roommates]);

  // دالة لتحديث الفلتر
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // عدد الفلاتر النشطة
  const activeFiltersCount = Object.values(filters).filter(v => v !== "All").length;

  // دوال التفاعل
  const toggleHeart = (id, e) => {
    e.stopPropagation();
    setRoommates(prev => prev.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s));
  };

  const handleProfile = (id, e) => { e.stopPropagation(); navigate(`/profile/${id}`); };
  const handleChat = (id, e) => { e.stopPropagation(); navigate(`/chat/${id}`); };
  const openDetails = (student) => setSelectedStudent(student);

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-20 relative">
      <Navbar activePage="/roommates" />

      <div className="container mx-auto px-4 md:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#091E42]">Roommate Matching</h1>
          <p className="text-gray-500 mt-2">Find a compatible roommate based on preferences</p>
        </div>

        {/* === Toolbar === */}
        <div className="flex flex-col md:flex-row gap-3 mb-8 items-center justify-between">
          
          {/* Search */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition text-sm shadow-sm"
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto relative">
            
            {/* Filter Button */}
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`h-11 px-6 rounded-full border font-semibold text-sm flex items-center gap-2 transition shadow-sm whitespace-nowrap
                ${isFilterOpen || activeFiltersCount > 0 ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}
              `}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                 <span className="bg-blue-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full ml-1">{activeFiltersCount}</span>
              )}
            </button>

            {/* === قائمة الفلتر المنسدلة (المحدثة) === */}
            {isFilterOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 p-4 animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">Filter Options</h3>
                  <button 
                    onClick={() => setFilters({ gender: "All", university: "All", year: "All", budget: "All" })}
                    className="text-xs text-red-500 hover:underline font-medium"
                  >
                    Reset All
                  </button>
                </div>
                
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  
                  {/* 1. Gender */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><Users className="w-3 h-3"/> Gender</p>
                    <div className="flex gap-2">
                      {["All", "Male", "Female"].map(opt => (
                        <button key={opt} onClick={() => handleFilterChange("gender", opt)}
                          className={`flex-1 py-1.5 text-xs rounded-lg border ${filters.gender === opt ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. University */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><School className="w-3 h-3"/> University</p>
                    <select 
                      value={filters.university} 
                      onChange={(e) => handleFilterChange("university", e.target.value)}
                      className="w-full p-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-500 bg-gray-50"
                    >
                      <option value="All">All Universities</option>
                      <option value="Cairo University">Cairo University</option>
                      <option value="Ain Shams University">Ain Shams University</option>
                      <option value="Helwan University">Helwan University</option>
                    </select>
                  </div>

                  {/* 3. Budget */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><Wallet className="w-3 h-3"/> Budget</p>
                    <div className="grid grid-cols-2 gap-2">
                      {["All", "1000-2000", "2000-3000", "3000+"].map(opt => (
                        <button key={opt} onClick={() => handleFilterChange("budget", opt)}
                          className={`py-1.5 text-xs rounded-lg border ${filters.budget === opt ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                          {opt} EGP
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Year */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><Clock className="w-3 h-3"/> Academic Year</p>
                    <div className="flex flex-wrap gap-2">
                      {["All", "1st Year", "2nd Year", "3rd Year", "4th Year"].map(opt => (
                        <button key={opt} onClick={() => handleFilterChange("year", opt)}
                          className={`px-3 py-1.5 text-xs rounded-lg border ${filters.year === opt ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Action Button */}
            <button className="h-11 px-6 bg-[#0A2647] text-white rounded-full font-bold text-sm hover:bg-[#153a69] transition shadow-md whitespace-nowrap flex-1 md:flex-none">
              Start Matching
            </button>
          </div>
        </div>

        {/* === Grid === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoommates.map((student) => (
            <div 
              key={student.id} 
              onClick={() => openDetails(student)}
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3">
                    <img src={student.image} alt={student.name} className="w-12 h-12 rounded-full object-cover border border-gray-100 shadow-sm" />
                    <div>
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 group-hover:text-blue-700 transition-colors">
                        {student.name} 
                        <span className="text-[10px] font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{student.year}</span>
                      </h3>
                      <p className="text-xs text-gray-500">{student.university}</p>
                    </div>
                  </div>
                  <button onClick={(e) => toggleHeart(student.id, e)} className="p-1 rounded-full hover:bg-red-50 transition z-10">
                    <Heart className={`w-5 h-5 transition-colors ${student.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                  </button>
                </div>

                <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2 min-h-[40px]">{student.bio}</p>

                <div className="flex flex-wrap gap-2 mb-5">
                  {student.tags.map((tag, index) => (
                    <span key={index} className="bg-gray-50 border border-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-xs font-medium">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold text-white
                  ${student.matchPercentage >= 80 ? 'bg-emerald-500' : student.matchPercentage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}>
                  {student.matchPercentage}% Match
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => handleProfile(student.id, e)} className="px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 hover:text-gray-900 transition z-10">Profile</button>
                  <button onClick={(e) => handleChat(student.id, e)} className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition shadow-sm flex items-center gap-1 z-10">Chat</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRoommates.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 mt-6">
            <h3 className="text-lg font-bold text-gray-900">No roommates found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your filters.</p>
            <button onClick={() => setFilters({ gender: "All", university: "All", year: "All", budget: "All" })} className="mt-4 text-blue-600 font-bold hover:underline">Clear Filters</button>
          </div>
        )}

      </div>

      {/* Modal Details (نفس الكود السابق للمودال) */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
              <button onClick={() => setSelectedStudent(null)} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full transition z-10 text-white"><X className="w-5 h-5" /></button>
              <div className="bg-[#0A2647] p-6 text-white pt-10">
                 <div className="flex items-center gap-4">
                    <img src={selectedStudent.image} className="w-20 h-20 rounded-full border-4 border-white/20 object-cover" alt="profile" />
                    <div>
                        <h2 className="text-2xl font-bold">{selectedStudent.name}</h2>
                        <p className="opacity-80 text-sm">{selectedStudent.university} • {selectedStudent.year}</p>
                        <div className="mt-2 inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-bold">{selectedStudent.budget} EGP / Month</div>
                    </div>
                 </div>
              </div>
              <div className="p-6 space-y-6">
                 <div><h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">About</h3><p className="text-gray-700 leading-relaxed">{selectedStudent.bio}</p></div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-xl"><div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><Clock className="w-4 h-4" /> Sleep Time</div><p className="font-semibold text-gray-900">{selectedStudent.details?.sleepTime}</p></div>
                    <div className="bg-gray-50 p-3 rounded-xl"><div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><Check className="w-4 h-4" /> Cleanliness</div><p className="font-semibold text-gray-900">{selectedStudent.details?.cleanliness}</p></div>
                 </div>
                 <div><h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Hobbies</h3><div className="flex flex-wrap gap-2">{selectedStudent.details?.hobbies?.map(h => <span key={h} className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 font-medium">{h}</span>)}</div></div>
              </div>
              <div className="p-4 border-t border-gray-100 flex gap-3 bg-gray-50">
                  <button onClick={() => navigate(`/profile/${selectedStudent.id}`)} className="flex-1 py-3 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-white transition">Full Profile</button>
                  <button onClick={() => navigate(`/chat/${selectedStudent.id}`)} className="flex-1 py-3 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700 transition shadow-md">Start Chat</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Roommates;