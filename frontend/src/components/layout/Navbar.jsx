import React, { useState, useEffect } from "react";
import {
  HiBell,
  HiLogout,
  HiMenu,
  HiX,
  HiUser,
  HiChevronDown,
  HiSearch,
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Navbar = ({ onMenuToggle, isSidebarOpen }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Load user from localStorage
  useEffect(() => {
    const loadUser = () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      setUser(storedUser);
    };

    loadUser();
    window.addEventListener("storage", loadUser);
    return () => window.removeEventListener("storage", loadUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handleProfileClick = () => {
    navigate("/dashboard/settings");
    setShowProfileMenu(false);
  };

  if (!user) return null;

  const displayName =
    user.fullName || user.firstName
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
      : user.email || "Admin";

  const initials = (
    user.firstName?.charAt(0) ||
    user.email?.charAt(0) ||
    "A"
  ).toUpperCase();

  return (
    <nav className="sticky top-0 z-20 border-b border-teal-100/80 bg-white/85 px-4 py-3 shadow-sm backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Menu Toggle (Mobile) */}
        <div className="flex items-center">
          <button
            onClick={onMenuToggle}
            className="mr-3 rounded-lg p-2 text-slate-600 transition-colors hover:bg-teal-50 hover:text-teal-800 lg:hidden"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? (
              <HiX className="w-5 h-5" />
            ) : (
              <HiMenu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Center: Search */}
        <div className="flex flex-1 justify-center lg:justify-start">
          <div className="hidden w-full max-w-md items-center rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-500 lg:flex">
            <HiSearch className="mr-2 h-5 w-5 text-teal-700" />
            <span>Search patients, doctors, appointments...</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-teal-800 lg:hidden">
            CliniX
          </span>
        </div>

        {/* Right: Notifications + Profile + Logout */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <button
            onClick={() => toast.success("No new notifications")}
            className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-teal-50 hover:text-teal-800"
            aria-label="Notifications"
          >
            <HiBell className="w-5 h-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 rounded-lg border border-transparent p-1.5 transition-colors hover:border-teal-100 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-sm font-bold text-white shadow-sm shadow-teal-900/20">
                {initials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-900">
                  {displayName}
                </p>
                <p className="text-xs text-slate-500 capitalize">
                  {user.role || "Admin"}
                </p>
              </div>
              <HiChevronDown className="w-4 h-4 text-slate-500 hidden md:block" />
            </button>

            {/* Dropdown menu */}
            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowProfileMenu(false)}
                ></div>
                <div className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl shadow-slate-900/10">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {displayName}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={handleProfileClick}
                    className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-800"
                  >
                    <HiUser className="w-4 h-4 mr-3 text-teal-700" />
                    Profile & Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                  >
                    <HiLogout className="w-4 h-4 mr-3" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Logout button (visible on small screens) */}
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-rose-600 transition-colors hover:bg-rose-50 md:hidden"
            aria-label="Logout"
          >
            <HiLogout className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
