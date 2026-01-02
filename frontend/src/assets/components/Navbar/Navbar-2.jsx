import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Heart, Bell, Settings, User, LogOut } from "lucide-react";

// ✅ استيراد اللوجو
import logo from "../../brand/icons/logo.svg"; 

export default function NavbarOwner() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // ✅ تعديل 1: جعل "Find Room" هو النشط افتراضياً
  // إذا كنا في الصفحة الرئيسية "/" نعتبر النشط هو "/find-room" (أو يمكنك تثبيتها دائماً)
  const currentPath = location.pathname === "/" ? "/find-room" : location.pathname;

  // --- State ---
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // --- البيانات ---
  const currentUser = {
    name: "Salah",
    email: "salah@example.com",
    notificationCount: 2, 
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80"
  };

  const notifications = [
    { id: 1, title: "New Booking", desc: "You have a new request.", time: "10m ago", unread: true },
    { id: 2, title: "Message", desc: "Student asked about wifi.", time: "1h ago", unread: true },
  ];

  const menu = [
    { name: "Home", path: "/home" },
    { name: "Find Room", path: "/find-room" },
    { name: "Community", path: "/community" },
    { name: "Service", path: "/service" },
    { name: "Roommate", path: "/roommate" },
  ];

  const handleLogout = () => {
    navigate("/login"); 
  };

  return (
    // ✅ تعديل 2: تكبير المسافات الداخلية والخارجية
    // mx-6 (هوامش جانبية أكبر) | mt-6 (هامش علوي أكبر)
    <div className="mx-2 md:mx-4 mt-6 relative z-50">
      
      {/* ✅ تكبير الـ Padding الداخلي للناف بار: py-4 px-8 */}
      <nav className="bg-[#E9F3FF] rounded-[8px] border border-black/10 shadow-sm py-4 px-8">
        
        <div className="flex items-center justify-between">
          
          {/* === اليسار: اللوجو === */}
          <Link 
            to="/" 
            className="flex items-center gap-2 no-underline group active:scale-95 transition-transform duration-200"
          >
            <img 
              src={logo} 
              alt="StudentHub Logo" 
              className="h-10 w-auto object-contain" 
            />
          </Link>

          {/* === المنتصف: القائمة === */}
          <div className="hidden xl:flex items-center gap-2">
            {menu.map((item) => {
              const isActive = currentPath === item.path;
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  // زيادة الـ padding للأزرار أيضاً (px-6 py-3)
                  className={`text-base font-normal px-4 py-2 rounded-full transition-all duration-200 active:scale-95
                    ${isActive 
                      ? "bg-[#0A2647] text-white shadow-md" 
                      : "text-gray-800 hover:text-[#0A2647] hover:bg-[#0A2647]/5"
                    }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* === اليمين: الأيقونات === */}
          <div className="flex items-center gap-5">
            
            {/* أيقونة القلب */}
            <Link 
              to="/favorites" 
              className="text-gray-800 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-white/50 active:scale-90 duration-200"
            >
              <Heart className="w-7 h-7 stroke-[1.5px]" />
            </Link>

            {/* أيقونة الجرس */}
            <div className="relative">
              <button 
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsDropdownOpen(false);
                }}
                className="relative text-gray-800 hover:text-[#0A2647] transition-colors p-2 rounded-full hover:bg-white/50 active:scale-90 duration-200 flex items-center"
              >
                <Bell className="w-7 h-7 stroke-[1.5px]" />
                {currentUser.notificationCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-[#EF4444] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-[#E9F3FF]">
                    {currentUser.notificationCount}
                  </span>
                )}
              </button>

              {/* قائمة الإشعارات */}
              {isNotificationsOpen && (
                <div className="absolute right-0 top-full mt-4 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[100]">
                  <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-gray-800">Notifications</h3>
                    <button className="text-xs text-blue-600 hover:underline">Mark all read</button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((note) => (
                      <div key={note.id} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
                        <p className="text-sm font-bold text-gray-900">{note.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{note.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* البروفايل */}
            <div className="relative pl-1">
              <button 
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen);
                  setIsNotificationsOpen(false);
                }}
                className="flex items-center gap-3 cursor-pointer group active:scale-95 transition-transform duration-200"
              >
                <img 
                  src={currentUser.avatar} 
                  alt="User" 
                  className="w-11 h-11 rounded-full object-cover border border-white shadow-sm group-hover:border-[#0A2647]/30 transition-colors"
                />
                <span className="text-base font-normal text-black hidden lg:block group-hover:opacity-80 transition-opacity">
                  Hi, {currentUser.name}
                </span>
              </button>

              {/* قائمة المستخدم */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-4 w-60 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-[100]">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                    <p className="text-sm font-bold text-gray-900">{currentUser.name}</p>
                    <p className="text-xs text-gray-500">{currentUser.email}</p>
                  </div>
                  
                  <Link to="/settings" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#0A2647] transition-colors">
                    <Settings className="w-4 h-4 mr-3" /> Settings
                  </Link>
                  <Link to="/profile" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#0A2647] transition-colors">
                    <User className="w-4 h-4 mr-3" /> Profile
                  </Link>
                  
                  <div className="border-t border-gray-100 my-1"></div>
                  
                  <button onClick={handleLogout} className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4 mr-3" /> Sign out
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </nav>
    </div>
  );
};