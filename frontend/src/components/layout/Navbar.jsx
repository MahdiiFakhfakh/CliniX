import React, { useState, useEffect } from "react";
import {
  HiBell,
  HiLogout,
  HiMenu,
  HiX,
  HiUser,
  HiChevronDown,
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
    <nav className="bg-white border-b border-gray-200 px-4 py-2.5 shadow-sm sticky top-0 z-20">
      <div className="flex items-center justify-between">
        {/* Left: Menu Toggle (Mobile) */}
        <div className="flex items-center">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 mr-3 transition-colors"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? (
              <HiX className="w-5 h-5" />
            ) : (
              <HiMenu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Center: Logo or Title (optional) */}
        <div className="flex-1 flex justify-center lg:justify-start">
          <span className="text-lg font-semibold text-gray-800 lg:hidden">
            CliniX
          </span>
        </div>

        {/* Right: Notifications + Profile + Logout */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <button
            onClick={() => toast.success("No new notifications")}
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <HiBell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                {initials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user.role || "Admin"}
                </p>
              </div>
              <HiChevronDown className="w-4 h-4 text-gray-500 hidden md:block" />
            </button>

            {/* Dropdown menu */}
            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowProfileMenu(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-40">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                  </div>
                  <button
                    onClick={handleProfileClick}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <HiUser className="w-4 h-4 mr-3 text-gray-500" />
                    Profile & Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
            className="md:hidden p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
