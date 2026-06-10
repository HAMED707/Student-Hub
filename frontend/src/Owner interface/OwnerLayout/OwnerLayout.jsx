import React, { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Building2, CreditCard, MessageSquare, User, Settings, LogOut } from "lucide-react";

import Sidebar from "../../assets/components/Sidebar/Sidebar.jsx";
import logo from "../../assets/brand/icons/logo.svg";

export default function OwnerLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = useMemo(
    () => [
      { id: "overview", label: "Dashboard", icon: <LayoutDashboard size={18} />, to: "/owner/overview" },
      { id: "properties", label: "Properties", icon: <Building2 size={18} />, to: "/owner/properties" },
      { id: "payments", label: "Payments", icon: <CreditCard size={18} />, to: "/owner/payments" },
      { id: "messages", label: "Messages", icon: <MessageSquare size={18} />, to: "/owner/messages" },
    ],
    []
  );

  const profile = useMemo(
    () => ({
      name: "Mohamed Ahmed",
      email: "owner@studenthub.com",
      avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
    }),
    []
  );

  const profileMenuItems = useMemo(
    () => [
      { id: "profile", label: "Profile", icon: <User size={16} />, to: "/owner/profile" },
      { id: "settings", label: "Settings", icon: <Settings size={16} />, to: "/owner/settings" },
      { id: "logout", label: "Logout", icon: <LogOut size={16} />, onClick: () => navigate("/login") },
    ],
    [navigate]
  );

  return (
    <div className="min-h-screen bg-[#F6F8FC]">
      <Sidebar
        logoPath={logo}
        menuItems={menuItems}
        routerNavigate={navigate}
        currentPath={location.pathname}
        profile={profile}
        profileMenuItems={profileMenuItems}
      />

      {/* Sidebar width = w-72 => لازم ml-72 */}
      <div className="ml-72 min-h-screen">
        <Outlet />
      </div>
    </div>
  );
}
