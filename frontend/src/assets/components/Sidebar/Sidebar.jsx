import React, { useEffect, useMemo, useRef, useState } from "react";
import { MoreHorizontal, Settings, LogOut, User } from "lucide-react";

const cx = (...classes) => classes.filter(Boolean).join(" ");

export default function Sidebar({
  // Logo
  logoPath = "",
  logoAlt = "Studenthub",
  logoSize = 162,

  // Navigation
  menuItems = [],
  active = null,
  currentPath = "",
  onSelect = () => {},
  routerNavigate = null,

  // Routes
  profileTo = "/owner/profile",
  settingsTo = "/owner/settings",
  logoutTo = "/login",

  // Actions
  onLogout = null,

  // localStorage keys
  storageUserKey = "user",
  storageTokenKey = "token",
}) {
  const resolvedPath =
    active ||
    currentPath ||
    (typeof window !== "undefined" ? window.location.pathname : "");

  const navigateTo = (to) => {
    if (!to) return;
    if (typeof routerNavigate === "function") routerNavigate(to);
    else window.location.assign(to);
  };

  const isActive = (item) => {
    if (active) return item.id === active;
    if (resolvedPath && item.to) return item.to === resolvedPath;
    return false;
  };

  const handleNavClick = (item) => {
    onSelect?.(item.id);
    if (item.to) navigateTo(item.to);
  };

  const initials = (name = "") => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // ------------------ USER (dynamic) ------------------
  const [user, setUser] = useState(null);

  useEffect(() => {
    const readUser = () => {
      try {
        const raw = localStorage.getItem(storageUserKey);
        if (!raw) {
          setUser(null);
          return;
        }
        setUser(JSON.parse(raw));
      } catch {
        setUser(null);
      }
    };

    readUser();

    const onStorage = (e) => {
      if (e.key === storageUserKey) readUser();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageUserKey]);

  const profile = useMemo(() => {
    const u = user || {};
    const name = u.fullName || u.name || u.userName || u.username || "";
    const email = u.email || "";
    const avatarUrl = u.avatarUrl || u.avatar || u.photoUrl || "";
    return { name, email, avatarUrl };
  }, [user]);

  // ------------------ DROPDOWN ------------------
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const dotsRef = useRef(null);

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!open) return;
      const menuEl = menuRef.current;
      const dotsEl = dotsRef.current;
      if (!menuEl || !dotsEl) return;
      const inMenu = menuEl.contains(e.target);
      const inDots = dotsEl.contains(e.target);
      if (!inMenu && !inDots) setOpen(false);
    };

    const onEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const handleProfile = () => {
    setOpen(false);
    navigateTo(profileTo);
  };

  const handleSettings = () => {
    setOpen(false);
    navigateTo(settingsTo);
  };

  const handleLogout = () => {
    setOpen(false);

    if (typeof onLogout === "function") {
      onLogout();
      return;
    }

    try {
      localStorage.removeItem(storageTokenKey);
      localStorage.removeItem(storageUserKey);
    } catch {
      // ignore
    }

    navigateTo(logoutTo);
  };

  const activeClasses = "bg-[#E9EEFF] text-[#2D31A6] font-semibold";
  const hoverClasses = "hover:bg-[#F3F4FF] hover:text-[#2D31A6]";
  const baseBtn =
    "group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200";

  return (
    <aside className="fixed left-0 top-0 z-30 h-screen w-72 bg-white border-r border-slate-100">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.15s ease-out; }
      `}</style>

      <div className="flex h-full flex-col px-8 py-8">
        {/* Logo */}
        <div className="flex items-center ">
          {logoPath ? (
            <img
              src={logoPath}
              alt={logoAlt}
              className="object-contain"
              style={{ width: logoSize, height: "auto" }}
              draggable={false}
            />
          ) : (
            <div
              className="rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center text-slate-400"
              style={{ width: logoSize, height: logoSize }}
            >
              Logo
            </div>
          )}
        </div>

        <h3 className="mt-10 text-xl font-bold text-slate-900">Menu</h3>

        {/* Nav */}
        <nav className="mt-6 flex flex-col gap-2">
          {menuItems.map((item) => {
            const activeState = isActive(item);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item)}
                className={cx(
                  baseBtn,
                  activeState ? activeClasses : `text-slate-600 ${hoverClasses}`,
                  "focus:outline-none focus:ring-2 focus:ring-[#2D31A6]/20"
                )}
                aria-current={activeState ? "page" : undefined}
              >
                <span
                  className={cx(
                    "transition-colors",
                    activeState ? "text-[#2D31A6]" : "text-slate-400 group-hover:text-[#2D31A6]"
                  )}
                >
                  {item.icon}
                </span>

                <span className="text-sm font-medium truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom profile */}
        <div className="mt-auto pt-8 relative">
          <div className="flex items-center gap-3">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="avatar"
                className="h-11 w-11 rounded-full object-cover border border-slate-100"
                draggable={false}
              />
            ) : (
              <div className="h-11 w-11 rounded-full bg-[#FFD54A] flex items-center justify-center">
                <span className="text-sm font-bold text-slate-900">{initials(profile.name)}</span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{profile.name || "—"}</p>
              <p className="text-xs text-slate-400 truncate">{profile.email}</p>
            </div>

            {/* 3 dots */}
            <button
              ref={dotsRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={cx(
                "h-9 w-9 flex items-center justify-center rounded-lg",
                "text-slate-400 hover:bg-[#F3F4FF] hover:text-[#2D31A6]",
                "transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-[#2D31A6]/20"
              )}
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label="Open profile menu"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>

          {/* Dropdown */}
          {open && (
            <div
              ref={menuRef}
              className="absolute right-0 bottom-14 w-56 rounded-2xl bg-white border border-slate-100 shadow-xl p-2 animate-fadeIn"
              role="menu"
            >
              <button
                type="button"
                onClick={handleProfile}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition
                           text-slate-700 hover:bg-[#F3F4FF] hover:text-[#2D31A6]"
                role="menuitem"
              >
                <span className="text-slate-400">
                  <User size={18} />
                </span>
                <span className="text-sm font-medium">Profile</span>
              </button>

              <button
                type="button"
                onClick={handleSettings}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition
                           text-slate-700 hover:bg-[#F3F4FF] hover:text-[#2D31A6]"
                role="menuitem"
              >
                <span className="text-slate-400">
                  <Settings size={18} />
                </span>
                <span className="text-sm font-medium">Settings</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition
                           text-red-600 hover:bg-red-50"
                role="menuitem"
              >
                <span className="text-red-500">
                  <LogOut size={18} />
                </span>
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}