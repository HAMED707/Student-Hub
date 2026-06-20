import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, CalendarCheck, Heart, LogOut, Menu, MessageCircle, Search, Settings, User, UserPlus, X } from "lucide-react";
import { withApiUrl } from "../../../api/client.js";
import { useNotifications } from "../../../context/notificationsContext.js";
import { clearSession } from "../../../utils/auth.js";
import {
  getNotificationActionLabel,
  resolveNotificationDestination,
} from "../../../utils/notifications.js";
import logoFull from "../../brand/icons/logo.svg";
import { useGlobalMessaging } from "../../../context/messagingContext.js";

const cx = (...classes) => classes.filter(Boolean).join(" ");

function ConversationsFlyout({ conversations, onOpenChat }) {
  const preview = conversations.slice(0, 8);
  return (
    <div className="absolute right-0 top-full z-[100] mt-4 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-4 py-3">
        <h3 className="font-bold text-gray-800">Messages</h3>
        <Link to="/messages" className="text-xs text-blue-600 hover:underline">
          See all
        </Link>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {preview.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">No conversations yet.</div>
        ) : (
          preview.map((conv) => (
            <button
              key={conv.id}
              type="button"
              onClick={() => onOpenChat(conv)}
              className="flex w-full items-center gap-3 border-b border-gray-50 px-4 py-3 text-left transition hover:bg-gray-50"
            >
              <img
                src={conv.avatar}
                alt={conv.name}
                className="h-10 w-10 shrink-0 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between">
                  <span className="truncate text-sm font-bold text-gray-900">{conv.name}</span>
                  <span className="ml-2 shrink-0 text-[10px] text-gray-400">{conv.lastTime}</span>
                </div>
                <p className="truncate text-xs text-gray-500">{conv.lastMessage}</p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="shrink-0 rounded-full bg-[#155BC2] px-2 py-0.5 text-[10px] font-bold text-white">
                  {conv.unreadCount}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default function Navbar({ edgeToEdge = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const dropdownRef = useRef(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const {
    user,
    role,
    notifications,
    unreadCount,
    loading,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useNotifications();

  const { totalUnread, conversations, openChat } = useGlobalMessaging();

  const currentUser = useMemo(() => {
    const displayName = user?.fullName || user?.name || user?.username || "Student";
    const avatar =
      (user?.avatarUrl || user?.profile_picture
        ? withApiUrl(user.avatarUrl || user.profile_picture)
        : "") ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        displayName,
      )}&background=0A2647&color=fff&bold=true`;

    return {
      name: displayName,
      email: user?.email || "",
      avatar,
    };
  }, [user]);

  const notificationPreview = notifications.slice(0, 6);

  const guestMenu = [
    { name: "Home", path: "/home" },
    { name: "FindRoom", path: "/find-room" },
    { name: "Services", path: "/services" },
  ];

  const authMenu = [
    { name: "Home", path: "/home" },
    { name: "Community", path: "/community" },
    { name: "Services", path: "/services" },
    { name: "FindRoom", path: "/find-room" },
    { name: "Roommate", path: "/roommate" },
  ];

  const menu = user ? authMenu : guestMenu;

  const closeMenus = () => {
    setIsDropdownOpen(false);
    setIsNotificationsOpen(false);
    setIsInboxOpen(false);
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeMenus();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleLogout = () => {
    closeMenus();
    clearSession();
    navigate("/login");
  };

  const handleOpenNotification = async (notification) => {
    if (!notification) return;

    closeMenus();
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }

    if (
      notification.notificationType === "new_message" &&
      notification.data?.conversation_id
    ) {
      openChat({ conversationId: notification.data.conversation_id });
      return;
    }

    const destination = resolveNotificationDestination(notification, role);
    navigate(destination.path, destination.state ? { state: destination.state } : undefined);
  };

  const handleViewAllNotifications = () => {
    closeMenus();
    navigate(role === "landlord" ? "/owner/notifications" : "/notifications");
  };

  const isActiveLink = (path) => currentPath === path;
  const isFavoritesActive = currentPath === "/favorites" || currentPath === "/likes";

  return (
    <div
      ref={dropdownRef}
      className={cx(
        "relative z-50 flex flex-col bg-white font-sans shadow-md",
        edgeToEdge ? "mx-0 mt-0 rounded-none" : "mx-3 mt-3 rounded-2xl",
      )}
    >
      <div
        className={cx(
          "mx-auto flex w-full min-w-0 items-center justify-between gap-2 bg-white px-3 py-3 sm:gap-4 sm:px-6",
          edgeToEdge ? "max-w-none rounded-none" : "container rounded-t-2xl",
        )}
      >
        <Link
          to="/"
          className="flex min-w-0 flex-shrink items-center gap-2 lg:flex-shrink-0"
          onClick={closeMenus}
        >
          <img src={logoFull} className="h-8 w-auto max-w-[130px] object-contain sm:h-10 sm:max-w-none" alt="Student Hub" />
        </Link>

        <div className="mx-auto hidden min-w-0 max-w-2xl flex-1 items-center rounded-full border border-gray-200 bg-gray-100 px-4 py-2.5 transition-all focus-within:ring-2 focus-within:ring-[#0A2647] md:flex">
          <Search className="mr-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-transparent text-gray-700 outline-none placeholder:text-gray-400"
          />
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4 lg:gap-6">
          {user ? (
            <>
              <Link
                to="/bookings"
                onClick={closeMenus}
                title="Bookings"
                aria-label="Bookings"
                className={cx(
                  "hidden transition duration-300 lg:block",
                  isActiveLink("/bookings")
                    ? "text-blue-600"
                    : "text-gray-700 hover:text-blue-600",
                )}
              >
                <CalendarCheck className="h-6 w-6" />
              </Link>

              <Link
                to="/favorites"
                onClick={closeMenus}
                title="Favorites"
                aria-label="Favorites"
                className={cx(
                  "hidden transition duration-300 lg:block",
                  isFavoritesActive
                    ? "text-red-500"
                    : "text-gray-700 hover:text-red-500",
                )}
              >
                <Heart
                  className="h-6 w-6"
                  fill={isFavoritesActive ? "currentColor" : "none"}
                />
              </Link>

              <div className="relative">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsNotificationsOpen((open) => !open);
                    setIsDropdownOpen(false);
                    setIsInboxOpen(false);
                  }}
                  className="group relative flex cursor-pointer items-center"
                >
                  <Bell
                    className={cx(
                      "h-6 w-6 transition",
                      isNotificationsOpen
                        ? "text-blue-600"
                        : "text-gray-700 group-hover:text-blue-600",
                    )}
                  />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full border border-white bg-red-600 px-1 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 top-full z-[100] mt-4 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)]">
                    <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-4 py-3">
                      <div>
                        <h3 className="font-bold text-gray-800">Notifications</h3>
                        <p className="mt-0.5 text-[11px] text-gray-400">
                          {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => markAllNotificationsAsRead()}
                        disabled={unreadCount === 0}
                        className="text-xs text-blue-600 transition hover:underline disabled:cursor-not-allowed disabled:text-gray-300"
                      >
                        Mark all as read
                      </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      {loading && notificationPreview.length === 0 ? (
                        <div className="px-4 py-6 text-sm text-gray-500">Loading notifications...</div>
                      ) : notificationPreview.length === 0 ? (
                        <div className="px-4 py-6 text-sm text-gray-500">
                          No notifications right now.
                        </div>
                      ) : (
                        notificationPreview.map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() => handleOpenNotification(notification)}
                            className={cx(
                              "w-full border-b border-gray-50 px-4 py-3 text-left transition hover:bg-gray-50",
                              !notification.read ? "bg-blue-50/30" : "bg-white",
                            )}
                          >
                            <div className="mb-1 flex items-start justify-between">
                              <p
                                className={cx(
                                  "pr-3 text-sm",
                                  !notification.read
                                    ? "font-bold text-gray-900"
                                    : "text-gray-700",
                                )}
                              >
                                {notification.title}
                              </p>
                              <span className="ml-2 whitespace-nowrap text-[10px] text-gray-400">
                                {notification.time}
                              </span>
                            </div>
                            <p className="line-clamp-2 text-xs text-gray-500">
                              {notification.desc}
                            </p>
                            <p className="mt-2 text-[11px] font-semibold text-blue-600">
                              {getNotificationActionLabel(notification)}
                            </p>
                          </button>
                        ))
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleViewAllNotifications}
                      className="block w-full bg-gray-50/50 py-2.5 text-center text-xs font-bold text-[#0A2647] transition hover:bg-gray-50"
                    >
                      View All Notifications
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsInboxOpen((open) => !open);
                    setIsNotificationsOpen(false);
                    setIsDropdownOpen(false);
                  }}
                  className="group relative flex cursor-pointer items-center"
                >
                  <MessageCircle
                    className={cx(
                      "h-6 w-6 transition",
                      isInboxOpen
                        ? "text-blue-600"
                        : "text-gray-700 group-hover:text-blue-600",
                    )}
                  />
                  {totalUnread > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full border border-white bg-[#155BC2] px-1 text-[10px] font-bold text-white">
                      {totalUnread > 99 ? "99+" : totalUnread}
                    </span>
                  )}
                </button>

                {isInboxOpen && (
                  <ConversationsFlyout conversations={conversations} onOpenChat={openChat} />
                )}
              </div>

              <div className="relative hidden lg:block">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsDropdownOpen((open) => !open);
                    setIsNotificationsOpen(false);
                    setIsInboxOpen(false);
                  }}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border-l border-gray-200 p-1 pl-2 transition hover:bg-gray-50"
                >
                  <img
                    src={currentUser.avatar}
                    alt="user"
                    className="h-9 w-9 rounded-full border border-gray-200 object-cover"
                  />
                  <span className="hidden font-medium text-gray-700 lg:block">
                    Hi, {(currentUser.name || "Student").split(" ")[0]}
                  </span>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-full z-[100] mt-4 w-60 rounded-xl border border-gray-100 bg-white py-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)]">
                    <div className="mb-1 border-b border-gray-100 bg-gray-50/50 px-4 py-3">
                      <p className="text-sm font-bold text-gray-900">{currentUser.name}</p>
                      <p className="truncate text-xs text-gray-500">{currentUser.email}</p>
                    </div>

                    <Link
                      to="/settings"
                      onClick={closeMenus}
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 transition hover:bg-blue-50 hover:text-[#0A2647]"
                    >
                      <Settings className="mr-3 h-4 w-4 text-gray-400" /> Settings
                    </Link>
                    <Link
                      to="/profile"
                      onClick={closeMenus}
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 transition hover:bg-blue-50 hover:text-[#0A2647]"
                    >
                      <User className="mr-3 h-4 w-4 text-gray-400" /> Profile
                    </Link>

                    <div className="my-1 border-t border-gray-100" />

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut className="mr-3 h-4 w-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-3 lg:flex">
              <Link
                to="/login"
                onClick={closeMenus}
                className="rounded-full border border-[#155BC2] px-5 py-2 text-sm font-semibold text-[#155BC2] transition hover:bg-blue-50"
              >
                Log in
              </Link>
              <Link
                to="/join"
                onClick={closeMenus}
                className="flex items-center gap-2 rounded-full bg-[#155BC2] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#0f4699]"
              >
                <UserPlus className="h-4 w-4" />
                Sign up
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              const nextOpen = !isMobileMenuOpen;
              setIsMobileMenuOpen(nextOpen);
              setIsDropdownOpen(false);
              setIsNotificationsOpen(false);
              setIsInboxOpen(false);
            }}
            className="grid h-10 w-10 place-items-center rounded-xl border border-gray-200 text-gray-700 transition hover:bg-gray-50 hover:text-blue-600 lg:hidden"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-gray-100 bg-white px-3 pb-4 pt-3 lg:hidden">
          <div className="mb-3 flex items-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 md:hidden">
            <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
            <input
              type="search"
              placeholder="Search"
              className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />
          </div>

          {user && (
            <div className="mb-3 flex min-w-0 items-center gap-3 rounded-xl bg-blue-50 px-3 py-3">
              <img src={currentUser.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full border border-blue-100 object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900">{currentUser.name}</p>
                <p className="truncate text-xs text-gray-500">{currentUser.email}</p>
              </div>
            </div>
          )}

          <nav className="grid grid-cols-2 gap-2" aria-label="Mobile navigation">
            {menu.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMenus}
                className={cx(
                  "rounded-xl px-3 py-2.5 text-center text-sm font-semibold transition",
                  isActiveLink(item.path)
                    ? "bg-[#0A2647] text-white"
                    : "bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700",
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {user ? (
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
              <Link to="/bookings" onClick={closeMenus} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <CalendarCheck className="h-4 w-4 text-blue-600" /> Bookings
              </Link>
              <Link to="/favorites" onClick={closeMenus} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <Heart className="h-4 w-4 text-red-500" /> Favorites
              </Link>
              <Link to="/profile" onClick={closeMenus} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <User className="h-4 w-4 text-blue-600" /> Profile
              </Link>
              <Link to="/settings" onClick={closeMenus} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <Settings className="h-4 w-4 text-blue-600" /> Settings
              </Link>
              <button type="button" onClick={handleLogout} className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
              <Link to="/login" onClick={closeMenus} className="rounded-xl border border-[#155BC2] px-4 py-2.5 text-center text-sm font-semibold text-[#155BC2]">
                Log in
              </Link>
              <Link to="/join" onClick={closeMenus} className="rounded-xl bg-[#155BC2] px-4 py-2.5 text-center text-sm font-semibold text-white">
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}

      <div className={cx("hidden w-full justify-center bg-[#0A2647] py-2 lg:flex", edgeToEdge ? "rounded-none" : "rounded-b-2xl")}>
        <div className={cx("flex justify-center gap-2 overflow-x-auto no-scrollbar md:gap-8", edgeToEdge ? "w-full px-0" : "container px-4")}>
          {menu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={closeMenus}
              className={cx(
                "whitespace-nowrap rounded-full px-6 py-2 text-sm font-medium transition-all md:text-base",
                isActiveLink(item.path)
                  ? "bg-[#1d4ed8] text-white shadow-md"
                  : "text-gray-300 hover:bg-white/10 hover:text-white",
              )}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
