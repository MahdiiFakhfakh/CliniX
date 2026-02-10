import React, { useState } from "react";
import { HiBell, HiSearch, HiLogout, HiMenu, HiX } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Navbar = ({ onMenuToggle, isSidebarOpen }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Get user from localStorage (no Redux!)
  const user = JSON.parse(localStorage.getItem("user")) || {
    email: "admin@clinix.com",
    role: "admin",
    profile: {
      fullName: "Admin User",
      department: "management",
    },
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast.success(`Searching for: ${searchQuery}`);
      // Implement search functionality here
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm sticky top-0 z-10">
      <div className="flex items-center justify-between">
        {/* Left side - Menu toggle and Search */}
        <div className="flex items-center flex-1">
          {/* Mobile menu button */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 mr-3"
          >
            {isSidebarOpen ? (
              <HiX className="w-6 h-6" />
            ) : (
              <HiMenu className="w-6 h-6" />
            )}
          </button>

          {/* Search */}
          <div className="flex-1 max-w-xl">
            <form onSubmit={handleSearch} className="relative">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patients, doctors, appointments..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </form>
          </div>
        </div>

        {/* Right side - Icons & User */}
        <div className="flex items-center space-x-3 ml-4">
          {/* Notifications */}
          <button
            onClick={() => toast.success("No new notifications")}
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <HiBell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User profile dropdown */}
          <div className="relative group">
            <button className="flex items-center space-x-3 p-1 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-900">
                  {user.profile?.fullName || user.email || "Admin User"}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user.role || "admin"}
                </p>
              </div>
              <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="font-semibold text-white text-sm">
                  {(
                    user.email?.charAt(0) ||
                    user.profile?.fullName?.charAt(0) ||
                    "A"
                  ).toUpperCase()}
                </span>
              </div>
            </button>

            {/* Dropdown menu */}
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
              <div className="p-4 border-b border-gray-100">
                <p className="font-medium text-gray-900">
                  {user.profile?.fullName || user.email}
                </p>
                <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                <p className="text-xs text-gray-400 mt-2">Role: {user.role}</p>
              </div>
              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <HiLogout className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
