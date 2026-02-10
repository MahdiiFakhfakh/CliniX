import React from "react";
import { NavLink } from "react-router-dom";
import {
  HiHome,
  HiUsers,
  HiUserGroup,
  HiCalendar,
  HiDocumentText,
  HiChartBar,
  HiCog,
  HiClipboardList,
  HiBell,
} from "react-icons/hi";

const Sidebar = ({ isOpen = true }) => {
  const navItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: <HiHome className="w-5 h-5" />,
    },
    {
      path: "/dashboard/patients",
      label: "Patients",
      icon: <HiUsers className="w-5 h-5" />,
    },
    {
      path: "/dashboard/doctors",
      label: "Doctors",
      icon: <HiUserGroup className="w-5 h-5" />,
    },
    {
      path: "/dashboard/appointments",
      label: "Appointments",
      icon: <HiCalendar className="w-5 h-5" />,
    },
    {
      path: "/dashboard/medical-records",
      label: "Medical Records",
      icon: <HiDocumentText className="w-5 h-5" />,
    },
    {
      path: "/dashboard/prescriptions",
      label: "Prescriptions",
      icon: <HiClipboardList className="w-5 h-5" />,
    },
    {
      path: "/dashboard/analytics",
      label: "Analytics",
      icon: <HiChartBar className="w-5 h-5" />,
    },
    {
      path: "/dashboard/settings",
      label: "Settings",
      icon: <HiCog className="w-5 h-5" />,
    },
  ];

  if (!isOpen) return null;

  return (
    <aside
      className={`w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-80px)] transition-all duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:block`}
    >
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">CliniX Admin</h2>
        <p className="text-sm text-gray-500 mt-1">Navigation Menu</p>
      </div>
      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-l-4 border-blue-600"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`
                }
                end={item.path === "/dashboard"}
              >
                <div
                  className={`${item.path.includes("/dashboard") ? "text-blue-600" : "text-gray-500"}`}
                >
                  {item.icon}
                </div>
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Quick stats */}
      <div className="p-4 border-t border-gray-200 mt-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Notifications</p>
              <p className="text-xs text-gray-600 mt-1">3 unread messages</p>
            </div>
            <HiBell className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-center mt-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-xs text-green-600">System Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
