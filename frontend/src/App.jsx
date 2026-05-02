import React, { useMemo } from "react";
import { Routes, Route, Navigate, Outlet, useNavigate, useLocation } from "react-router-dom";

import JoinPage from "./pages/Auth/JoinPage.jsx";
import Login from "./pages/Auth/Login/login.jsx";
import StudentRegister from "./pages/Auth/StudentRegister/StudentRegister.jsx";
import LandlordRegister from "./pages/Auth/LandlordRegister/LandlordRegister.jsx";
import PasswordRecovery from "./pages/Auth/PasswordRecovery/PasswordRecovery.jsx";

import Home from "./pages/Home/Home.jsx";
import FindRoom from "./pages/FindRoom/FindRoom.jsx";
import PropertyDetails from "./pages/FindRoom/PropertyDetails.jsx";
import Community from "./pages/Commuity/Community.jsx";
import Groups from "./pages/Commuity/Groups.jsx";
import CommunityMessages from "./pages/Commuity/Messages.jsx";
import Posts from "./pages/Commuity/Posts.jsx";

import Like from "./pages/Like/Like.jsx";
import Booking from "./pages/Booking/Booking.jsx";
import Roommate from "./pages/Roommate/Roommate.jsx";
import Service from "./pages/Service/Service.jsx";

import Profile from "./pages/Profile/Profile.jsx";
import EditProfile from "./pages/Profile/EditProfile.jsx";
import PublicProfile from "./pages/Profile/PublicProfile.jsx";

// ✅ Owner pages
import Overview from "./Owner interface/Dashboard Overview/Overview.jsx";
import OwnerPayments from "./Owner interface/Dashboard Payments/Payments.jsx";
import OwnerProperties from "./Owner interface/Dashboard Properties/Properties.jsx";
import OwnerMessages from "./Owner interface/Dashboard Messages/Messages.jsx";
import AddNewProperty from "./Owner interface/Dashboard Properties/AddNewProperty.jsx";
import EditProperty from "./Owner interface/Dashboard Properties/EditProperty.jsx";
import OwnerProfile from "./Owner interface/OwnerProfile/OwnerProfile.jsx";
import OwnerSettings from "./Owner interface/OwnerProfile/Setting-Profile.jsx";

// ✅ Sidebar + logo
import Sidebar from "./assets/components/Sidebar/Sidebar.jsx";
import logo from "./assets/brand/icons/logo.svg";

import { LayoutDashboard, Building2, CreditCard, MessageSquare, User, LogOut } from "lucide-react";

const NotFound = () => (
  <div className="flex flex-col items-center justify-center h-screen text-center">
    <h1 className="text-4xl font-bold text-red-500">404</h1>
    <p className="text-xl text-gray-600">Page Not Found</p>
    <a href="/home" className="mt-4 text-blue-600 hover:underline">
      Go Home
    </a>
  </div>
);

// ✅ Owner Layout
function OwnerLayout() {
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

  const profile = useMemo(() => ({ name: "Owner", email: "", avatarUrl: "" }), []);

  // ✅ Dropdown (3 dots) — لازم يكون Route URL
  const profileMenuItems = useMemo(
    () => [
      { id: "profile", label: "Profile", icon: <User size={16} />, to: "/owner/profile" }, // ✅ الصح
      { id: "logout", label: "Logout", icon: <LogOut size={16} />, onClick: () => console.log("logout") },
    ],
    []
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

      <div className="ml-72 min-h-screen">
        <Outlet />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Routes>
        <Route index element={<Navigate to="/Home" replace />} />

        {/* Auth */}
        <Route path="/join" element={<JoinPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/student-setup" element={<StudentRegister />} />
        <Route path="/register/landlord" element={<LandlordRegister />} />
        <Route path="/forgot-password" element={<PasswordRecovery />} />

        {/* Main */}
        <Route path="/home" element={<Home />} />
        <Route path="/find-room" element={<FindRoom />} />
        <Route path="/property/:id" element={<PropertyDetails />} />
        <Route path="/find-room/:id" element={<PropertyDetails />} />

        <Route path="/community" element={<Community />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/messages" element={<CommunityMessages />} />
        <Route path="/posts" element={<Posts />} />

        <Route path="/services" element={<Service />} />
        <Route path="/roommate" element={<Roommate />} />
        <Route path="/likes" element={<Like />} />
        <Route path="/favorites" element={<Like />} />
        <Route path="/bookings" element={<Booking />} />

        {/* Profile */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/profile/:id" element={<PublicProfile />} />

        {/* ✅ Owner */}
        <Route path="/owner" element={<OwnerLayout />}>
          <Route index element={<Navigate to="/owner/overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="properties" element={<OwnerProperties />} />
          <Route path="payments" element={<OwnerPayments />} />
          <Route path="messages" element={<OwnerMessages />} />
          <Route path="properties/new" element={<AddNewProperty />} />
          <Route path="properties/edit" element={<EditProperty />} />

          {/* ✅ بروفايل المالك */}
          <Route path="settings" element={<OwnerSettings />} />

          {/* ✅ بروفايل المالك */}
          <Route path="profile" element={<OwnerProfile />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
