import React from "react";
import { Routes, Route } from "react-router-dom"; 

// ========================================================
// 1. استيراد صفحات المصادقة (Authentication)
// ========================================================
import JoinPage from "./pages/Auth/JoinPage.jsx"; 
import Login from "./pages/Auth/Login/login.jsx"; 

// حسب هيكل ملفاتك: صفحة تسجيل الطالب داخل مجلد StudentRegister واسمها login.jsx
import StudentRegister from "./pages/Auth/StudentRegister/StudentRegister.jsx"; 
import LandlordRegister from "./pages/Auth/LandlordRegister/LandlordRegister.jsx"; 

// حسب هيكل ملفاتك: PasswordRecovery عبارة عن مجلد
import PasswordRecovery from "./pages/Auth/PasswordRecovery/PasswordRecovery.jsx"; 


// ========================================================
// 2. استيراد صفحات التطبيق الرئيسية (Main App)
// ========================================================
import Home from "./pages/Home/Home.jsx";
import FindRoom from "./pages/FindRoom/FindRoom.jsx";
// تأكد هل الاسم PropertyDetails أم PropertyDetail حسب ملفك
import PropertyDetails from "./pages/FindRoom/PropertyDetails.jsx"; 

// لاحظ: الاسم في مجلداتك مكتوب "Commuity" (بدون n)
import Community from "./pages/Commuity/Community.jsx"; 
// الصفحات الفرعية للمجتمع (اختياري إضافتها كمسارات منفصلة أو داخل Community)
import Groups from "./pages/Commuity/Groups.jsx";
import Messages from "./pages/Commuity/Messages.jsx";
import Posts from "./pages/Commuity/Posts.jsx";

import Like from "./pages/Like/Like.jsx";
import Roommate from "./pages/Roommate/Roommate.jsx";
import Service from "./pages/Service/Service.jsx"; // تأكد هل هو Service.jsx أم Services.jsx


// ========================================================
// 3. استيراد صفحات البروفايل (Profile)
// ========================================================
import Profile from "./pages/Profile/Profile.jsx";
import EditProfile from "./pages/Profile/EditProfile.jsx";
import PublicProfile from "./pages/Profile/PublicProfile.jsx";


// ========================================================
// 4. صفحة الخطأ (404)
// ========================================================
const NotFound = () => (
  <div className="flex flex-col items-center justify-center h-screen text-center">
    <h1 className="text-4xl font-bold text-red-500">404</h1>
    <p className="text-xl text-gray-600">Page Not Found</p>
    <a href="/home" className="mt-4 text-blue-600 hover:underline">Go Home</a>
  </div>
);


function App() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Routes>
        
        {/* ==================== أ. مسارات الدخول والتسجيل ==================== */}
        
        {/* الصفحة الأولى عند فتح الموقع */}
        <Route path="/" element={<JoinPage />} />
        
        {/* تسجيل الدخول */}
        <Route path="/login" element={<Login />} />

        {/* إنشاء الحسابات */}
        <Route path="/student-setup" element={<StudentRegister />} />
        <Route path="/register/landlord" element={<LandlordRegister />} />

        {/* استعادة كلمة المرور */}
        <Route path="/forgot-password" element={<PasswordRecovery />} />


        {/* ==================== ب. مسارات التطبيق (بعد الدخول) ==================== */}
        
        <Route path="/home" element={<Home />} />

        {/* ✅✅✅ حل مشكلة الشاشة البيضاء ✅✅✅ */}
        {/* نوجه روابط الداشبورد إلى الصفحة الرئيسية Home */}
        <Route path="/student-dashboard" element={<Home />} />
        <Route path="/landlord-dashboard" element={<Home />} />


        {/* --- البحث عن سكن --- */}
        <Route path="/find-room" element={<FindRoom />} />
        <Route path="/property/:id" element={<PropertyDetails />} />
        <Route path="/find-room/:id" element={<PropertyDetails />} />


        {/* --- المجتمع (الشات والمجموعات) --- */}
        <Route path="/community" element={<Community />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/posts" element={<Posts />} />
        
        {/* مسارات إضافية للشات لضمان العمل */}
        <Route path="/chat" element={<Community />} />
        <Route path="/chat/:id" element={<Community />} />


        {/* --- الخدمات والروميت والمفضلة --- */}
        <Route path="/services" element={<Service />} />
        
        <Route path="/roommate" element={<Roommate />} />
        <Route path="/roommates" element={<Roommate />} /> {/* اسم بديل */}

        <Route path="/likes" element={<Like />} />
        <Route path="/favorites" element={<Like />} /> {/* اسم بديل */}


        {/* ==================== ج. مسارات البروفايل ==================== */}
        
        {/* بروفايل المستخدم الحالي */}
        <Route path="/profile" element={<Profile />} />
        
        {/* تعديل البروفايل */}
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        
        {/* عرض بروفايل مستخدم آخر (Public) */}
        <Route path="/profile/:id" element={<PublicProfile />} />
        <Route path="/user/:id" element={<PublicProfile />} />


        {/* ==================== د. أي رابط خاطئ ==================== */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </div>
  );
}

export default App;