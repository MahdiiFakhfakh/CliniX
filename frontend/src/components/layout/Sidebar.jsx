import React from "react";
import { NavLink } from "react-router-dom";
import {
  HiHome,
  HiUsers,
  HiUserGroup,
  HiCalendar,
  HiChartBar,
  HiCog,
  HiClipboardList,
  HiBell,
} from "react-icons/hi";

const Sidebar = ({
  isOpen = true,
  notifications = [],
  systemStatus,
  theme,
}) => {
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

  const bgClass =
    theme === "dark" ? "bg-gray-900 text-gray-200" : "bg-white text-gray-900";
  const borderClass = theme === "dark" ? "border-gray-700" : "border-gray-200";
  const hoverClass =
    theme === "dark"
      ? "hover:bg-gray-800 hover:text-white"
      : "hover:bg-gray-50 hover:text-gray-900";

  return (
    <aside
      className={`w-64 ${bgClass} ${borderClass} border-r min-h-[calc(100vh-80px)] transition-all duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 lg:block`}
    >
      {/* Header */}
      <div className={`p-4 border-b ${borderClass}`}>
        <h2 className="text-lg font-semibold">CliniX Admin</h2>
        <p className="text-sm mt-1 text-gray-500">Navigation Menu</p>
      </div>

      {/* Navigation Links */}
      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white border-l-4 border-blue-500"
                      : hoverClass
                  }`
                }
                end={item.path === "/dashboard"}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Notifications & System Status */}
      {(notifications.length > 0 || systemStatus) && (
        <div className="p-4 border-t mt-4">
          <div
            className={`rounded-lg p-4 ${theme === "dark" ? "bg-gray-800" : "bg-blue-50"}`}
          >
            {notifications.length > 0 && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Notifications</p>
                  <p className="text-xs mt-1">
                    {notifications.length} unread messages
                  </p>
                </div>
                <HiBell className="w-5 h-5 text-blue-600" />
              </div>
            )}
            {systemStatus && (
              <div className="flex items-center mt-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-xs text-green-600">{systemStatus}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
