import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Heart, Bell, Search, Settings, User, LogOut } from "lucide-react";

// 👇 تأكد من مسار اللوجو الصحيح
import logoFull from "../../brand/icons/logo.svg"; 

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  // التحكم في القوائم
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // بيانات وهمية
  const currentUser = {
    name: "Mohamed Ahmed",  
    email: "student@example.com",
    notificationCount: 3, 
    avatar: "https://ui-avatars.com/api/?name=Mohamed+Ahmed&background=0A2647&color=fff&bold=true"
  };

  const notifications = [
    { id: 1, title: "New Roommate Request", desc: "Ahmed sent you a request.", time: "2m ago", unread: true },
    { id: 2, title: "System Update", desc: "Maintenance scheduled for tonight.", time: "1h ago", unread: true },
    { id: 3, title: "Welcome!", desc: "Thanks for joining StudentHub.", time: "1d ago", unread: false },
  ];

  const menu = [
    { name: "Home", path: "/home" },
    { name: "Community", path: "/community" },
    { name: "Services", path: "/services" },
    { name: "FindRoom", path: "/find-room" },
    { name: "Roommate", path: "/roommate" },
  ];

  const handleLogout = () => {
    setIsDropdownOpen(false);
    navigate("/login"); 
  };

  const isActiveLink = (path) => currentPath === path;

  // دالة لإغلاق القوائم عند التنقل
  const closeMenus = () => {
    setIsDropdownOpen(false);
    setIsNotificationsOpen(false);
  };

  return (
    // ⚠️ التعديل الهام هنا: إزالة overflow-hidden للسماح بظهور القوائم
    <div className="mx-3 md:mx-3 mt-3 flex flex-col font-sans relative z-50 shadow-md rounded-2xl bg-white">      
      
      {/* --- TOP BAR --- */}
      <div className="container mx-auto flex items-center justify-between px-6 py-3 gap-4 rounded-t-2xl bg-white">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0" onClick={closeMenus}>
          <img src={logoFull} className="h-10 w-auto object-contain" alt="logo" />
        </Link>

        {/* SEARCH BAR */}
        <div className="hidden md:flex items-center bg-gray-100 border border-gray-200 rounded-full px-4 py-2.5 flex-1 max-w-2xl mx-auto focus-within:ring-2 focus-within:ring-[#0A2647] transition-all">
          <Search className="text-gray-400 w-5 h-5 mr-3" />
          <input
            type="text"
            placeholder="Search"
            className="bg-transparent outline-none w-full text-gray-700 placeholder-gray-400"
          />
        </div>

        {/* ICONS + USER */}
        <div className="flex items-center gap-4 md:gap-6">
          
          {/* Favorites Button */}
          <Link 
            to="/favorites" 
            onClick={closeMenus}
            className={`transition duration-300 ${isActiveLink('/favorites') ? "text-red-500" : "text-gray-700 hover:text-red-500"}`} 
          >
            <Heart className="w-6 h-6" fill={isActiveLink('/favorites') ? "currentColor" : "none"} />
          </Link>

          {/* Notifications Button */}
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsDropdownOpen(false);
              }}
              className="relative cursor-pointer group flex items-center"
            >
              <Bell className={`w-6 h-6 transition ${isNotificationsOpen ? "text-blue-600" : "text-gray-700 group-hover:text-blue-600"}`} />
              {currentUser.notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full border border-white px-1">
                  {currentUser.notificationCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 top-full mt-4 w-80 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[100]">
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-gray-50/80">
                  <h3 className="font-bold text-gray-800">Notifications</h3>
                  <button className="text-xs text-blue-600 hover:underline">Mark all as read</button>
                </div>
                
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((note) => (
                    <div key={note.id} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer ${note.unread ? 'bg-blue-50/30' : ''}`}>
                      <div className="flex justify-between items-start mb-1">
                        <p className={`text-sm ${note.unread ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{note.title}</p>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{note.time}</span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{note.desc}</p>
                    </div>
                  ))}
                </div>
                
                <Link to="/notifications" onClick={closeMenus} className="block text-center py-2.5 text-xs font-bold text-[#0A2647] hover:bg-gray-50 transition bg-gray-50/50">
                  View All Notifications
                </Link>
              </div>
            )}
          </div>

          {/* User Dropdown */}
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen(!isDropdownOpen);
                setIsNotificationsOpen(false);
              }}
              className="flex items-center gap-3 cursor-pointer pl-2 border-l border-gray-200 hover:bg-gray-50 p-1 rounded-lg transition"
            >
              <img
                src={currentUser.avatar} 
                alt="user"
                className="w-9 h-9 rounded-full object-cover border border-gray-200"
              />
              <span className="font-medium text-gray-700 hidden lg:block">Hi, {currentUser.name.split(' ')[0]}</span>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-4 w-60 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-100 py-2 animate-in fade-in zoom-in-95 duration-200 z-[100]">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 mb-1">
                  <p className="text-sm font-bold text-gray-900">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                </div>

                <Link to="/settings" onClick={closeMenus} className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#0A2647] transition">
                  <Settings className="w-4 h-4 mr-3 text-gray-400" /> Settings
                </Link>
                <Link to="/profile" onClick={closeMenus} className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#0A2647] transition">
                  <User className="w-4 h-4 mr-3 text-gray-400" /> Profile
                </Link>
                
                <div className="border-t border-gray-100 my-1"></div>
                
                <button onClick={handleLogout} className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition">
                  <LogOut className="w-4 h-4 mr-3" /> Sign out
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* --- BLUE MENU BAR --- */}
      {/* ⚠️ إضافة rounded-b-2xl للحفاظ على الشكل الدائري من الأسفل */}
      <div className="w-full bg-[#0A2647] flex justify-center py-2 rounded-b-2xl">
        <div className="container overflow-x-auto no-scrollbar flex justify-center gap-2 md:gap-8 px-4">
            {menu.map((item) => (
            <Link
                key={item.path}
                to={item.path}
                onClick={closeMenus}
                className={`text-sm md:text-base font-medium px-6 py-2 rounded-full transition-all whitespace-nowrap
                ${
                    isActiveLink(item.path)
                    ? "bg-[#1d4ed8] text-white shadow-md"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
            >
                {item.name}
            </Link>
            ))}
        </div>
      </div>
    </div>
  );
}