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
  HiOutlineClock,
  HiHeart,
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
      path: "/dashboard/approvals",
      label: "Doctor Approvals",
      icon: <HiOutlineClock className="w-5 h-5" />,
    },
    {
      path: "/dashboard/settings",
      label: "Settings",
      icon: <HiCog className="w-5 h-5" />,
    },
  ];

  if (!isOpen) return null;

  const bgClass =
    theme === "dark"
      ? "bg-slate-950 text-slate-200"
      : "bg-white/85 text-slate-900 backdrop-blur-xl";
  const borderClass =
    theme === "dark" ? "border-slate-800" : "border-teal-100/80";
  const hoverClass =
    theme === "dark"
      ? "hover:bg-slate-900 hover:text-white"
      : "hover:bg-teal-50 hover:text-teal-900";

  return (
    <aside
      className={`w-72 ${bgClass} ${borderClass} border-r min-h-[calc(100vh-65px)] transition-all duration-300 shadow-[12px_0_40px_rgba(15,118,110,0.06)] ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 lg:block`}
    >
      {/* Header */}
      <div className={`p-5 border-b ${borderClass}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-700 text-white shadow-sm shadow-teal-900/20">
            <HiHeart className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-950">
              CliniX
            </h2>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-teal-700">
              Care Admin
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-4">
        <ul className="space-y-1.5">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-teal-700 text-white shadow-sm shadow-teal-900/20"
                      : `${hoverClass} text-slate-600`
                  }`
                }
                end={item.path === "/dashboard"}
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Notifications & System Status */}
      {(notifications.length > 0 || systemStatus) && (
        <div className={`p-4 border-t mt-4 ${borderClass}`}>
          <div
            className={`rounded-lg p-4 ${theme === "dark" ? "bg-slate-900" : "bg-teal-50 border border-teal-100"}`}
          >
            {notifications.length > 0 && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Notifications</p>
                  <p className="text-xs mt-1">
                    {notifications.length} unread notifications
                  </p>
                </div>
                <HiBell className="w-5 h-5 text-teal-700" />
              </div>
            )}
            {systemStatus && (
              <div className="flex items-center mt-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                <span className="text-xs text-emerald-700">{systemStatus}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
