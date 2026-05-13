import React, { useState, useEffect, useRef } from "react";
import {
  HiBell,
  HiCheckCircle,
  HiLogout,
  HiMenu,
  HiX,
  HiUser,
  HiChevronDown,
  HiSearch,
  HiUserGroup,
  HiCalendar,
  HiClipboardList,
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { adminAPI, notificationsAPI } from "../../services/api";

const formatNotificationTime = (value) => {
  if (!value) return "";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "";

  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) return "Just now";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return `${Math.floor(diffHours / 24)}d ago`;
};

const Navbar = ({ onMenuToggle, isSidebarOpen }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState({
    patients: [],
    doctors: [],
    appointments: [],
    prescriptions: [],
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const latestNotificationIdRef = useRef(null);
  const hasLoadedNotificationsRef = useRef(false);
  const searchContainerRef = useRef(null);

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

  useEffect(() => {
    if (!user || user.role !== "admin") return undefined;

    let isMounted = true;

    const loadNotifications = async () => {
      try {
        const response = await notificationsAPI.getAll({ limit: 10 });
        if (!isMounted) return;

        const nextNotifications = response.data?.notifications || [];
        const nextUnreadCount = response.data?.unreadCount || 0;
        const latest = nextNotifications[0];
        const latestId = latest?._id;

        if (
          hasLoadedNotificationsRef.current &&
          latestId &&
          latestId !== latestNotificationIdRef.current &&
          !latest?.isRead
        ) {
          toast.success(latest.title || "New notification");
        }

        latestNotificationIdRef.current = latestId || null;
        hasLoadedNotificationsRef.current = true;
        setNotifications(nextNotifications);
        setUnreadCount(nextUnreadCount);
      } catch (error) {
        console.error("Failed to load notifications:", error);
      }
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 15000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    const query = searchTerm.trim();

    if (query.length < 2) {
      setSearchResults({
        patients: [],
        doctors: [],
        appointments: [],
        prescriptions: [],
      });
      setSearchLoading(false);
      return undefined;
    }

    let isActive = true;
    setSearchLoading(true);

    const timeout = window.setTimeout(async () => {
      try {
        const response = await adminAPI.search(query);
        if (!isActive) return;

        setSearchResults(
          response.data?.results || {
            patients: [],
            doctors: [],
            appointments: [],
            prescriptions: [],
          },
        );
        setShowSearchResults(true);
      } catch (error) {
        if (!isActive) return;
        console.error("Global search failed:", error);
        setSearchResults({
          patients: [],
          doctors: [],
          appointments: [],
          prescriptions: [],
        });
      } finally {
        if (isActive) setSearchLoading(false);
      }
    }, 250);

    return () => {
      isActive = false;
      window.clearTimeout(timeout);
    };
  }, [searchTerm]);

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

  const getResultGroups = () => [
    {
      key: "patients",
      label: "Patients",
      path: "/dashboard/patients",
      icon: <HiUser className="h-4 w-4" />,
      items: searchResults.patients || [],
      formatTitle: (item) => item.fullName || `${item.firstName || ""} ${item.lastName || ""}`.trim() || "Patient",
      formatMeta: (item) => [item.patientId, item.email, item.status].filter(Boolean).join(" - "),
    },
    {
      key: "doctors",
      label: "Doctors",
      path: "/dashboard/doctors",
      icon: <HiUserGroup className="h-4 w-4" />,
      items: searchResults.doctors || [],
      formatTitle: (item) => item.fullName || `${item.firstName || ""} ${item.lastName || ""}`.trim() || "Doctor",
      formatMeta: (item) =>
        [item.specialization || item.department, item.email, item.status]
          .filter(Boolean)
          .join(" - "),
    },
    {
      key: "appointments",
      label: "Appointments",
      path: "/dashboard/appointments",
      icon: <HiCalendar className="h-4 w-4" />,
      items: searchResults.appointments || [],
      formatTitle: (item) =>
        item.patient?.fullName ||
        `${item.patient?.firstName || ""} ${item.patient?.lastName || ""}`.trim() ||
        item.appointmentId ||
        "Appointment",
      formatMeta: (item) =>
        [
          item.appointmentId,
          item.doctor?.fullName ||
            `${item.doctor?.firstName || ""} ${item.doctor?.lastName || ""}`.trim(),
          item.status,
        ]
          .filter(Boolean)
          .join(" - "),
    },
    {
      key: "prescriptions",
      label: "Prescriptions",
      path: "/dashboard/prescriptions",
      icon: <HiClipboardList className="h-4 w-4" />,
      items: searchResults.prescriptions || [],
      formatTitle: (item) =>
        item.prescriptionId ||
        item.medications?.[0]?.name ||
        "Prescription",
      formatMeta: (item) =>
        [
          item.patient?.fullName ||
            `${item.patient?.firstName || ""} ${item.patient?.lastName || ""}`.trim(),
          item.doctor?.fullName ||
            `${item.doctor?.firstName || ""} ${item.doctor?.lastName || ""}`.trim(),
          item.status,
        ]
          .filter(Boolean)
          .join(" - "),
    },
  ];

  const totalSearchResults = getResultGroups().reduce(
    (sum, group) => sum + group.items.length,
    0,
  );

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchTerm.trim();
    if (!query) return;

    setShowSearchResults(false);
    navigate(`/dashboard/patients?search=${encodeURIComponent(query)}`);
  };

  const handleResultSelect = (path) => {
    const query = searchTerm.trim();
    setShowSearchResults(false);
    setSearchTerm("");
    navigate(query ? `${path}?search=${encodeURIComponent(query)}` : path);
  };

  const refreshNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const response = await notificationsAPI.getAll({ limit: 10 });
      setNotifications(response.data?.notifications || []);
      setUnreadCount(response.data?.unreadCount || 0);
    } catch (error) {
      console.error("Failed to refresh notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleNotificationsClick = () => {
    setShowNotifications((open) => !open);
    setShowProfileMenu(false);
    refreshNotifications();
  };

  const markAllNotificationsRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true })),
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark notifications read:", error);
      toast.error("Could not update notifications");
    }
  };

  const navigateFromNotification = (notification) => {
    const resource = notification.data?.resource;
    const type = notification.type;

    if (type === "doctor_request") {
      navigate("/dashboard/approvals");
    } else if (resource === "patient") {
      navigate("/dashboard/patients");
    } else if (resource === "doctor") {
      navigate("/dashboard/doctors");
    } else if (resource === "appointment") {
      navigate("/dashboard/appointments");
    } else if (resource === "prescription") {
      navigate("/dashboard/prescriptions");
    }

    setShowNotifications(false);
  };

  const handleNotificationSelect = async (notification) => {
    if (!notification.isRead) {
      try {
        await notificationsAPI.markRead(notification._id);
        setNotifications((prev) =>
          prev.map((item) =>
            item._id === notification._id ? { ...item, isRead: true } : item,
          ),
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (error) {
        console.error("Failed to mark notification read:", error);
      }
    }

    navigateFromNotification(notification);
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
          <div ref={searchContainerRef} className="relative hidden w-full max-w-md lg:block">
            <form onSubmit={handleSearchSubmit}>
              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-500 transition focus-within:border-teal-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-100">
                <HiSearch className="mr-2 h-5 w-5 text-teal-700" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  placeholder="Search patients, doctors, appointments..."
                  className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>
            </form>

            {showSearchResults && searchTerm.trim().length >= 2 && (
              <div className="absolute left-0 z-40 mt-2 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-bold text-slate-900">
                    Search results
                  </p>
                  <p className="text-xs text-slate-500">
                    {searchLoading
                      ? "Searching clinic records..."
                      : `${totalSearchResults} result${totalSearchResults === 1 ? "" : "s"}`}
                  </p>
                </div>

                <div className="max-h-96 overflow-y-auto py-2">
                  {searchLoading ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                      Searching...
                    </div>
                  ) : totalSearchResults === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                      No matching records found.
                    </div>
                  ) : (
                    getResultGroups().map((group) =>
                      group.items.length > 0 ? (
                        <div key={group.key} className="py-1">
                          <div className="px-4 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700">
                            {group.label}
                          </div>
                          {group.items.map((item) => (
                            <button
                              key={item._id}
                              type="button"
                              onClick={() => handleResultSelect(group.path)}
                              className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition hover:bg-teal-50"
                            >
                              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                                {group.icon}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-slate-900">
                                  {group.formatTitle(item)}
                                </span>
                                <span className="mt-0.5 block truncate text-xs text-slate-500">
                                  {group.formatMeta(item) || group.label}
                                </span>
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : null,
                    )
                  )}
                </div>
              </div>
            )}
          </div>
          <span className="text-lg font-bold tracking-tight text-teal-800 lg:hidden">
            CliniX
          </span>
        </div>

        {/* Right: Notifications + Profile + Logout */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={handleNotificationsClick}
              className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-teal-50 hover:text-teal-800"
              aria-label="Notifications"
            >
              <HiBell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowNotifications(false)}
                ></div>
                <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Notifications
                      </p>
                      <p className="text-xs text-slate-500">
                        {unreadCount} unread
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-50"
                      >
                        <HiCheckCircle className="h-4 w-4" />
                        Read all
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notificationsLoading ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-500">
                        Loading notifications...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-500">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification._id}
                          onClick={() => handleNotificationSelect(notification)}
                          className={`flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-teal-50 ${
                            notification.isRead ? "bg-white" : "bg-teal-50/70"
                          }`}
                        >
                          <span
                            className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                              notification.isRead
                                ? "bg-slate-300"
                                : "bg-rose-500"
                            }`}
                          ></span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-slate-900">
                              {notification.title}
                            </span>
                            <span className="mt-0.5 block line-clamp-2 text-xs leading-5 text-slate-600">
                              {notification.message}
                            </span>
                            <span className="mt-1 block text-[11px] font-medium text-slate-400">
                              {formatNotificationTime(
                                notification.sentAt || notification.createdAt,
                              )}
                            </span>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
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
