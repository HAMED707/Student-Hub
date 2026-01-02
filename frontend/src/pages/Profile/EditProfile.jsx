import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ لاستخدام التنقل
import Navbar from "../../assets/components/Navbar/Navbar.jsx"; 
import { 
  User, MapPin, School, GraduationCap, Calendar, 
  Save, X, Camera, Globe, Mail, Phone, Heart, Coffee, Upload
} from 'lucide-react';

const EditProfile = () => {
  const navigate = useNavigate(); // ✅ هوك التنقل
  const fileInputRef = useRef(null); // ✅ مرجع لزر رفع الملفات

  // الحالة المبدئية (نفس بيانات البروفايل)
  const [formData, setFormData] = useState({
    name: "Mathew Perry",
    role: "Student",
    bio: "Computer Science student at EELU. I am a quiet person who loves coding and coffee.",
    email: "mathewperry@xyz.com",
    phone: "+20 123 456 7890",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80", // الصورة الحالية
    
    location: "Nasr City, Cairo",
    university: "EELU",
    faculty: "Computers & IT",
    year: "4th Year",

    sleepingTime: "Normal (11 PM)",
    studyEnv: "With Music",
    music: "Morning Person",
    smoking: "Non-Smoker",
    
    budgetRange: "1000 - 2000 EGP",
    roomType: "Single",
    cleanliness: "Medium"
  });

  // التعامل مع تغيير النصوص
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ التعامل مع رفع الصورة
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file); // إنشاء رابط مؤقت للصورة
      setFormData(prev => ({ ...prev, avatar: imageUrl }));
    }
  };

  // ✅ دالة لمحاكاة الضغط على زر Input المخفي
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // ✅ زر الحفظ: يعرض رسالة ثم يعود للبروفايل
  const handleSave = (e) => {
    e.preventDefault();
    // هنا المفروض نرسل البيانات للباك إند (API)
    alert("Profile Updated Successfully! ✅");
    navigate('/profile'); // 👈 العودة لصفحة البروفايل
  };

  // ✅ زر الإلغاء: يعود للبروفايل فوراً
  const handleCancel = () => {
    if(window.confirm("Are you sure you want to discard changes?")) {
      navigate('/profile'); // 👈 العودة لصفحة البروفايل
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-20">
      <Navbar />

      <div className="w-full px-4 md:px-8 py-6 max-w-5xl mx-auto">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
           <div>
              <h1 className="text-3xl font-extrabold text-[#0A2647]">Edit Profile</h1>
              <p className="text-gray-500 mt-1 text-sm">Update your personal information and preferences.</p>
           </div>
           <div className="flex gap-3 w-full md:w-auto">
              <button 
                type="button" 
                onClick={handleCancel} 
                className="flex-1 md:flex-none px-6 py-2.5 rounded-lg border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition"
              >
                 Cancel
              </button>
              <button 
                onClick={handleSave} 
                className="flex-1 md:flex-none px-6 py-2.5 rounded-lg bg-[#0A2647] text-white font-bold hover:bg-[#153a69] shadow-lg flex justify-center items-center gap-2 transition"
              >
                 <Save className="w-4 h-4" /> Save Changes
              </button>
           </div>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

           {/* --- LEFT COLUMN (Images & Bio) --- */}
           <div className="lg:col-span-1 space-y-8">
              
              {/* Profile Image Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                 <h3 className="text-lg font-bold text-[#0A2647] mb-4 text-left">Profile Photo</h3>
                 
                 <div className="relative inline-block group cursor-pointer" onClick={triggerFileInput}>
                    <img 
                       src={formData.avatar} 
                       alt="profile" 
                       className="w-40 h-40 rounded-full object-cover border-4 border-gray-50 shadow-md group-hover:opacity-75 transition duration-300" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                       <div className="bg-black/50 p-3 rounded-full text-white">
                          <Camera className="w-6 h-6" />
                       </div>
                    </div>
                 </div>

                 {/* حقل رفع الملفات المخفي */}
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                 />

                 <button 
                    type="button" 
                    onClick={triggerFileInput}
                    className="mt-4 w-full py-2.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-[#0A2647] transition flex justify-center items-center gap-2"
                 >
                    <Upload className="w-4 h-4" /> Change Avatar
                 </button>
              </div>

              {/* Bio Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                 <h3 className="text-lg font-bold text-[#0A2647] mb-4">Short Bio</h3>
                 <textarea 
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="5"
                    className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#0A2647] focus:ring-1 focus:ring-[#0A2647] outline-none text-sm text-gray-700 leading-relaxed resize-none transition"
                    placeholder="Tell us about yourself..."
                 ></textarea>
                 <div className="flex justify-end mt-2">
                    <span className={`text-xs font-bold ${formData.bio.length > 300 ? "text-red-500" : "text-gray-400"}`}>
                        {formData.bio.length}/300
                    </span>
                 </div>
              </div>

           </div>

           {/* --- RIGHT COLUMN (Form Fields) --- */}
           <div className="lg:col-span-2 space-y-8">
              
              {/* 1. Basic Information */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                 <h2 className="text-xl font-bold text-[#0A2647] mb-6 flex items-center gap-2">
                    <User className="w-5 h-5" /> Basic Information
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700">Full Name</label>
                       <div className="relative">
                          <User className="w-4 h-4 absolute left-4 top-3.5 text-gray-400" />
                          <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#0A2647] outline-none text-sm font-medium transition" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700">Role</label>
                       <select name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#0A2647] outline-none text-sm font-medium transition cursor-pointer">
                          <option>Student</option>
                          <option>Fresh Grad</option>
                          <option>Employee</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700">Email</label>
                       <div className="relative">
                          <Mail className="w-4 h-4 absolute left-4 top-3.5 text-gray-400" />
                          <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#0A2647] outline-none text-sm font-medium transition" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700">Phone</label>
                       <div className="relative">
                          <Phone className="w-4 h-4 absolute left-4 top-3.5 text-gray-400" />
                          <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#0A2647] outline-none text-sm font-medium transition" />
                       </div>
                    </div>
                 </div>
              </div>

              {/* 2. Education & Location */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                 <h2 className="text-xl font-bold text-[#0A2647] mb-6 flex items-center gap-2">
                    <School className="w-5 h-5" /> Education & Location
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700">University</label>
                       <div className="relative">
                          <School className="w-4 h-4 absolute left-4 top-3.5 text-gray-400" />
                          <input type="text" name="university" value={formData.university} onChange={handleChange} className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#0A2647] outline-none text-sm font-medium transition" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700">Faculty / Major</label>
                       <div className="relative">
                          <GraduationCap className="w-4 h-4 absolute left-4 top-3.5 text-gray-400" />
                          <input type="text" name="faculty" value={formData.faculty} onChange={handleChange} className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#0A2647] outline-none text-sm font-medium transition" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700">Academic Year</label>
                       <div className="relative">
                          <Calendar className="w-4 h-4 absolute left-4 top-3.5 text-gray-400" />
                          <select name="year" value={formData.year} onChange={handleChange} className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#0A2647] outline-none text-sm font-medium transition cursor-pointer">
                             <option>1st Year</option>
                             <option>2nd Year</option>
                             <option>3rd Year</option>
                             <option>4th Year</option>
                             <option>Graduated</option>
                          </select>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700">Current Location</label>
                       <div className="relative">
                          <MapPin className="w-4 h-4 absolute left-4 top-3.5 text-gray-400" />
                          <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#0A2647] outline-none text-sm font-medium transition" />
                       </div>
                    </div>
                 </div>
              </div>

              {/* 3. Interests & Lifestyle */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                 <h2 className="text-xl font-bold text-[#0A2647] mb-6 flex items-center gap-2">
                    <Heart className="w-5 h-5" /> Interests & Habits
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700">Sleeping Time</label>
                       <select name="sleepingTime" value={formData.sleepingTime} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-[#0A2647] outline-none transition cursor-pointer">
                          <option>Early Bird (9-10 PM)</option>
                          <option>Normal (11 PM)</option>
                          <option>Night Owl (After 1 AM)</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700">Smoking</label>
                       <select name="smoking" value={formData.smoking} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-[#0A2647] outline-none transition cursor-pointer">
                          <option>Non-Smoker</option>
                          <option>Smoker</option>
                          <option>Outside Only</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700">Study Env</label>
                       <select name="studyEnv" value={formData.studyEnv} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-[#0A2647] outline-none transition cursor-pointer">
                          <option>Quiet</option>
                          <option>With Music</option>
                          <option>Group Study</option>
                       </select>
                    </div>
                 </div>
              </div>

              {/* 4. Housing Preferences */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                 <h2 className="text-xl font-bold text-[#0A2647] mb-6 flex items-center gap-2">
                    <Coffee className="w-5 h-5" /> Housing Preferences
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700">Budget Range (EGP)</label>
                       <input type="text" name="budgetRange" value={formData.budgetRange} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none text-sm font-medium focus:border-[#0A2647] transition" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700">Preferred Room Type</label>
                       <div className="flex gap-4 pt-1">
                          {["Single", "Shared"].map((type) => (
                             <label key={type} className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                   type="radio" 
                                   name="roomType" 
                                   value={type} 
                                   checked={formData.roomType === type} 
                                   onChange={handleChange}
                                   className="w-4 h-4 text-[#0A2647] focus:ring-[#0A2647] cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-[#0A2647] transition">{type}</span>
                             </label>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

           </div>

        </form>
      </div>
    </div>
  );
};

export default EditProfile;