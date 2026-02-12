import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const isDoctorSchedulePage = location.pathname === "/dashboard/doctors";

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} />
        <main
          className={`flex-1 p-4 lg:p-6 transition-all duration-300 ${!isSidebarOpen ? "lg:ml-0" : ""}`}
        >
          <div className={isDoctorSchedulePage ? "w-full" : "max-w-7xl mx-auto"}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
