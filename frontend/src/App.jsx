import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import {
  AUTH_CHANGE_EVENT,
  getAuthSnapshot,
  getDefaultRouteForRole,
} from "./utils/auth.js";

import JoinPage from "./pages/Auth/JoinPage.jsx";
import Login from "./pages/Auth/Login/login.jsx";
import CompleteOnboarding from "./pages/Auth/CompleteOnboarding.jsx";
import StudentRegister from "./pages/Auth/StudentRegister/StudentRegister.jsx";
import LandlordRegister from "./pages/Auth/LandlordRegister/LandlordRegister.jsx";
import PasswordRecovery from "./pages/Auth/PasswordRecovery/PasswordRecovery.jsx";

import Home from "./pages/Home/Home.jsx";
import FindRoom from "./pages/FindRoom/FindRoom.jsx";
import PropertyDetails from "./pages/FindRoom/PropertyDetails.jsx";
import Community from "./pages/Commuity/Community.jsx";
import Groups from "./pages/Commuity/Groups.jsx";
import GroupDetails from "./pages/Commuity/GroupDetails.jsx";
import Posts from "./pages/Commuity/Posts.jsx";
import StudentMessages from "./pages/Messaging/Messages.jsx";

import Like from "./pages/Like/Like.jsx";
import MyBookings from "./pages/MyBookings/MyBookings.jsx";
import Payments from "./pages/Payments/Payments.jsx";
import Notifications from "./pages/Notifications/Notifications.jsx";
import Roommate from "./pages/Roommate/Roommate.jsx";
import Service from "./pages/Service/Service.jsx";

import Profile from "./pages/Profile/Profile.jsx";
import EditProfile from "./pages/Profile/EditProfile.jsx";
import PublicProfile from "./pages/Profile/PublicProfile.jsx";
import Settings from "./pages/Profile/Settings.jsx";

// ✅ Owner pages
import OwnerDashboard from "./Owner interface/OwnerDashboard.jsx";

import Footer from "./assets/components/Footer/Footer.jsx";
import { CommunityProvider } from "./hooks/useCommunityData.jsx";
import { NotificationsProvider } from "./hooks/useNotifications.jsx";
import { MessagingProvider } from "./hooks/useGlobalMessaging.jsx";
import ChatDock from "./assets/components/ChatDock/ChatDock.jsx";

const NotFound = () => (
  <div className="flex flex-col items-center justify-center h-screen text-center">
    <h1 className="text-4xl font-bold text-red-500">404</h1>
    <p className="text-xl text-gray-600">Page Not Found</p>
    <a href="/home" className="mt-4 text-blue-600 hover:underline">
      Go Home
    </a>
  </div>
);

function useAuthState() {
  const [authState, setAuthState] = useState(() => getAuthSnapshot());

  useEffect(() => {
    const syncAuth = () => setAuthState(getAuthSnapshot());

    window.addEventListener("storage", syncAuth);
    window.addEventListener(AUTH_CHANGE_EVENT, syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener(AUTH_CHANGE_EVENT, syncAuth);
    };
  }, []);

  return authState;
}

function GuestOnlyRoute() {
  const { token, user } = useAuthState();

  if (token && user) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  }

  return <Outlet />;
}

function RequireAuth({ allowedRoles = null }) {
  const location = useLocation();
  const { token, user } = useAuthState();

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.role === "pending" && location.pathname !== "/complete-onboarding") {
    return <Navigate to="/complete-onboarding" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  }

  return <Outlet />;
}

function StudentLayout() {
  return (
    <>
      <Outlet />
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <NotificationsProvider>
        <MessagingProvider>
        <CommunityProvider>
        <Routes>
          <Route index element={<Navigate to="/home" replace />} />

        {/* Auth */}
        <Route element={<GuestOnlyRoute />}>
          <Route path="/join" element={<JoinPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/student-setup" element={<StudentRegister />} />
          <Route path="/register/landlord" element={<LandlordRegister />} />
          <Route path="/forgot-password" element={<PasswordRecovery />} />
        </Route>

        {/* Main */}
        <Route element={<StudentLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/find-room" element={<FindRoom />} />
          <Route path="/property/:id" element={<PropertyDetails />} />
          <Route path="/find-room/:id" element={<PropertyDetails />} />

          <Route path="/services" element={<Service />} />
        </Route>

        <Route element={<StudentLayout />}>
          <Route element={<RequireAuth />}>
          <Route path="/complete-onboarding" element={<CompleteOnboarding />} />
          <Route path="/community" element={<Community />} />
          <Route path="/community/groups/:id" element={<GroupDetails />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/messages" element={<StudentMessages />} />
          <Route path="/chat/:id" element={<StudentMessages />} />
          <Route path="/posts" element={<Posts />} />

          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile/:id" element={<PublicProfile />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/settings" element={<Settings />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={["student"]} />}>
          <Route path="/roommate" element={<Roommate />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={["student"]} />}>
          <Route path="/likes" element={<Like />} />
          <Route path="/favorites" element={<Like />} />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/booking/:id" element={<MyBookings />} />
          <Route path="/payments" element={<Payments />} />
          </Route>
        </Route>

        {/* ✅ Owner */}
        <Route element={<RequireAuth allowedRoles={["landlord"]} />}>
          <Route path="/owner/*" element={<OwnerDashboard />} />
        </Route>

        {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </CommunityProvider>
        <ChatDock />
        </MessagingProvider>
      </NotificationsProvider>
    </div>
  );
}
