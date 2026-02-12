import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlinePlus,
  HiOutlineDownload,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineRefresh,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineDotsVertical,
  HiOutlineInformationCircle,
  HiOutlineChartBar,
  HiOutlineDocumentDuplicate,
  HiOutlineVideoCamera,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentText,
} from "react-icons/hi";
import { format, isToday, isTomorrow, isThisWeek, parseISO } from "date-fns";

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedDate, setSelectedDate] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [viewMode, setViewMode] = useState("table");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    revenue: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchAppointments();
    fetchStats();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get(
        "http://localhost:5000/api/admin/appointments",
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Transform data for better display
      const transformedAppointments = (response.data.appointments || []).map(
        (appt) => ({
          ...appt,
          patientName:
            appt.patient?.fullName ||
            `${appt.patient?.firstName || ""} ${appt.patient?.lastName || ""}`.trim() ||
            "Unknown",
          patientId: appt.patient?.patientId || "N/A",
          doctorName:
            appt.doctor?.fullName ||
            `Dr. ${appt.doctor?.firstName || ""} ${appt.doctor?.lastName || ""}`.trim() ||
            "Unknown",
          doctorSpecialization: appt.doctor?.specialization || "General",
          dateFormatted: format(new Date(appt.date), "MMM dd, yyyy"),
          timeFormatted: appt.time,
          dayOfWeek: format(new Date(appt.date), "EEEE"),
          isToday: isToday(new Date(appt.date)),
          isTomorrow: isTomorrow(new Date(appt.date)),
          isThisWeek: isThisWeek(new Date(appt.date)),
          statusColor:
            appt.status === "completed"
              ? "green"
              : appt.status === "scheduled"
                ? "blue"
                : appt.status === "confirmed"
                  ? "indigo"
                  : appt.status === "in_progress"
                    ? "yellow"
                    : appt.status === "cancelled"
                      ? "red"
                      : appt.status === "no_show"
                        ? "gray"
                        : "purple",
          statusText:
            appt.status === "completed"
              ? "Completed"
              : appt.status === "scheduled"
                ? "Scheduled"
                : appt.status === "confirmed"
                  ? "Confirmed"
                  : appt.status === "in_progress"
                    ? "In Progress"
                    : appt.status === "cancelled"
                      ? "Cancelled"
                      : appt.status === "no_show"
                        ? "No Show"
                        : appt.status,
          paymentStatusColor:
            appt.paymentStatus === "paid"
              ? "green"
              : appt.paymentStatus === "pending"
                ? "yellow"
                : appt.paymentStatus === "partial"
                  ? "blue"
                  : "red",
          typeIcon:
            appt.type === "video" ? (
              <HiOutlineVideoCamera className="w-4 h-4" />
            ) : appt.type === "emergency" ? (
              <HiOutlineXCircle className="w-4 h-4" />
            ) : (
              <HiOutlineCalendar className="w-4 h-4" />
            ),
        }),
      );

      setAppointments(transformedAppointments);
      setFilteredAppointments(transformedAppointments);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      toast.error("Failed to load appointments");
      if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/admin/appointments/stats",
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch appointment stats:", error);
    }
  };

  const fetchAppointmentDetails = async (appointmentId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/admin/appointments/${appointmentId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSelectedAppointment(response.data.appointment);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Failed to fetch appointment details:", error);
      toast.error("Failed to load appointment details");
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/admin/appointments/${appointmentId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Update local state
      setAppointments((prev) =>
        prev.map((a) =>
          a._id === appointmentId
            ? {
                ...a,
                status: newStatus,
                statusText: getStatusText(newStatus),
                statusColor: getStatusColor(newStatus),
              }
            : a,
        ),
      );
      setFilteredAppointments((prev) =>
        prev.map((a) =>
          a._id === appointmentId
            ? {
                ...a,
                status: newStatus,
                statusText: getStatusText(newStatus),
                statusColor: getStatusColor(newStatus),
              }
            : a,
        ),
      );

      // Update selected appointment if modal is open
      if (selectedAppointment && selectedAppointment._id === appointmentId) {
        setSelectedAppointment({ ...selectedAppointment, status: newStatus });
      }

      toast.success(
        `Appointment status updated to ${getStatusText(newStatus)}`,
      );
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update appointment status");
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      scheduled: "Scheduled",
      confirmed: "Confirmed",
      in_progress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
      no_show: "No Show",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      scheduled: "blue",
      confirmed: "indigo",
      in_progress: "yellow",
      completed: "green",
      cancelled: "red",
      no_show: "gray",
    };
    return colorMap[status] || "purple";
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to delete this appointment?"))
      return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/admin/appointments/${appointmentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setAppointments((prev) => prev.filter((a) => a._id !== appointmentId));
      setFilteredAppointments((prev) =>
        prev.filter((a) => a._id !== appointmentId),
      );
      toast.success("Appointment deleted successfully");
    } catch (error) {
      console.error("Failed to delete appointment:", error);
      toast.error("Failed to delete appointment");
    }
  };

  // Get unique values for filters
  const statuses = [
    "all",
    "scheduled",
    "confirmed",
    "in_progress",
    "completed",
    "cancelled",
    "no_show",
  ];
  const types = [
    "all",
    ...new Set(appointments.map((a) => a.type).filter(Boolean)),
  ];
  const dateFilters = [
    "all",
    "today",
    "tomorrow",
    "this_week",
    "next_week",
    "this_month",
  ];

  // Filter appointments
  useEffect(() => {
    let filtered = [...appointments];

    // Search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.patientName?.toLowerCase().includes(q) ||
          a.doctorName?.toLowerCase().includes(q) ||
          a.patientId?.toLowerCase().includes(q) ||
          a.reason?.toLowerCase().includes(q) ||
          a.appointmentId?.toLowerCase().includes(q),
      );
    }

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter((a) => a.status === selectedStatus);
    }

    // Type filter
    if (selectedType !== "all") {
      filtered = filtered.filter((a) => a.type === selectedType);
    }

    // Date filter
    if (selectedDate !== "all") {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      switch (selectedDate) {
        case "today":
          filtered = filtered.filter((a) => a.isToday);
          break;
        case "tomorrow":
          filtered = filtered.filter((a) => a.isTomorrow);
          break;
        case "this_week":
          filtered = filtered.filter((a) => a.isThisWeek);
          break;
        case "next_week":
          filtered = filtered.filter((a) => {
            const date = new Date(a.date);
            return date > today && date <= nextWeek;
          });
          break;
        case "this_month":
          filtered = filtered.filter((a) => {
            const date = new Date(a.date);
            return (
              date.getMonth() === today.getMonth() &&
              date.getFullYear() === today.getFullYear()
            );
          });
          break;
        default:
          break;
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;

      if (sortBy === "date") {
        aVal = new Date(a.date).getTime();
        bVal = new Date(b.date).getTime();
      } else if (sortBy === "patient") {
        aVal = a.patientName || "";
        bVal = b.patientName || "";
      } else if (sortBy === "doctor") {
        aVal = a.doctorName || "";
        bVal = b.doctorName || "";
      } else if (sortBy === "status") {
        aVal = a.status || "";
        bVal = b.status || "";
      } else {
        aVal = a[sortBy] || "";
        bVal = b[sortBy] || "";
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredAppointments(filtered);
    setCurrentPage(1);
  }, [
    appointments,
    searchTerm,
    selectedStatus,
    selectedType,
    selectedDate,
    sortBy,
    sortOrder,
  ]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAppointments.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedType("all");
    setSelectedDate("all");
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleExport = () => {
    const csvContent = [
      [
        "Appointment ID",
        "Patient",
        "Doctor",
        "Date",
        "Time",
        "Type",
        "Status",
        "Fee",
        "Payment Status",
      ],
      ...filteredAppointments.map((a) => [
        a.appointmentId,
        a.patientName,
        a.doctorName,
        a.dateFormatted,
        a.time,
        a.type,
        a.status,
        a.fee || 0,
        a.paymentStatus || "pending",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `appointments_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Appointments data exported successfully");
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <HiOutlineCalendar className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-lg text-gray-600 animate-pulse">
            Loading appointments...
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // STATS CARDS COMPONENT
  // ============================================
  const StatsCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Total Appointments
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.total || appointments.length}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              <span className="font-semibold">{stats.completed || 0}</span>{" "}
              Completed
            </p>
          </div>
          <div className="bg-blue-100 p-3 rounded-2xl">
            <HiOutlineCalendar className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Today</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.today || appointments.filter((a) => a.isToday).length}
            </p>
            <p className="text-xs text-green-600 mt-1">
              <span className="font-semibold">
                {
                  appointments.filter(
                    (a) => a.isToday && a.status === "scheduled",
                  ).length
                }
              </span>{" "}
              Scheduled
            </p>
          </div>
          <div className="bg-green-100 p-3 rounded-2xl">
            <HiOutlineClock className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Pending / Scheduled
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.scheduled ||
                appointments.filter((a) => a.status === "scheduled").length}
            </p>
            <p className="text-xs text-yellow-600 mt-1">Need confirmation</p>
          </div>
          <div className="bg-yellow-100 p-3 rounded-2xl">
            <HiOutlineRefresh className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Revenue</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              $
              {(
                stats.revenue ||
                appointments.reduce((sum, a) => sum + (a.fee || 0), 0)
              ).toLocaleString()}
            </p>
            <p className="text-xs text-purple-600 mt-1">
              From completed appointments
            </p>
          </div>
          <div className="bg-purple-100 p-3 rounded-2xl">
            <HiOutlineCurrencyDollar className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================
  // SEARCH AND FILTERS COMPONENT
  // ============================================
  const SearchAndFilters = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <HiOutlineSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search appointments by patient, doctor, ID, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-all ${
                showFilters
                  ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent"
              }`}
            >
              <HiOutlineFilter className="w-5 h-5" />
              <span className="hidden sm:inline">Filters</span>
              {(selectedStatus !== "all" ||
                selectedType !== "all" ||
                selectedDate !== "all") && (
                <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {
                    [selectedStatus, selectedType, selectedDate].filter(
                      (s) => s !== "all",
                    ).length
                  }
                </span>
              )}
            </button>

            <button
              onClick={handleExport}
              className="px-4 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 border border-gray-300"
            >
              <HiOutlineDownload className="w-5 h-5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2 shadow-lg">
              <HiOutlinePlus className="w-5 h-5" />
              <span className="hidden sm:inline">New Appointment</span>
            </button>
          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 animate-slideDown">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                Appointment Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50"
              >
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type === "all"
                      ? "All Types"
                      : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                Date
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="this_week">This Week</option>
                <option value="next_week">Next Week</option>
                <option value="this_month">This Month</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
              >
                <HiOutlineRefresh className="w-4 h-4" />
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="bg-gray-50 px-6 py-3 flex flex-wrap items-center justify-between text-sm border-t border-gray-200">
        <div className="flex items-center gap-2 text-gray-600">
          <HiOutlineInformationCircle className="w-4 h-4" />
          <span>
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {indexOfFirstItem + 1}-
              {Math.min(indexOfLastItem, filteredAppointments.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900">
              {filteredAppointments.length}
            </span>{" "}
            appointments
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleSort("date")}
            className={`flex items-center gap-1 hover:text-blue-600 transition-colors ${
              sortBy === "date"
                ? "text-blue-600 font-semibold"
                : "text-gray-600"
            }`}
          >
            Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
          <button
            onClick={() => handleSort("patient")}
            className={`flex items-center gap-1 hover:text-blue-600 transition-colors ${
              sortBy === "patient"
                ? "text-blue-600 font-semibold"
                : "text-gray-600"
            }`}
          >
            Patient {sortBy === "patient" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
          <button
            onClick={() => handleSort("status")}
            className={`flex items-center gap-1 hover:text-blue-600 transition-colors ${
              sortBy === "status"
                ? "text-blue-600 font-semibold"
                : "text-gray-600"
            }`}
          >
            Status {sortBy === "status" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================
  // TABLE VIEW COMPONENT
  // ============================================
  const TableView = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Appointment
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Doctor
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((appointment) => (
              <tr
                key={appointment._id}
                onClick={() => fetchAppointmentDetails(appointment._id)}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {appointment.appointmentId}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {appointment.reason?.substring(0, 30)}...
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {appointment.patientName?.charAt(0) || "P"}
                      </span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {appointment.patientName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {appointment.patientId}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {appointment.doctorName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {appointment.doctorSpecialization}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <HiOutlineCalendar className="w-4 h-4 mr-2 text-gray-400" />
                    {appointment.dateFormatted}
                  </div>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <HiOutlineClock className="w-3 h-3 mr-2 text-gray-400" />
                    {appointment.time} ({appointment.duration || 30} min)
                  </div>
                  {appointment.isToday && (
                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Today
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-600">
                    {appointment.typeIcon}
                    <span className="ml-2 capitalize">{appointment.type}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={appointment.status}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleStatusChange(appointment._id, e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-semibold border-0 cursor-pointer
                      ${
                        appointment.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : appointment.status === "scheduled"
                            ? "bg-blue-100 text-blue-700"
                            : appointment.status === "confirmed"
                              ? "bg-indigo-100 text-indigo-700"
                              : appointment.status === "in_progress"
                                ? "bg-yellow-100 text-yellow-700"
                                : appointment.status === "cancelled"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                      }
                    `}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No Show</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`
                    px-3 py-1.5 rounded-lg text-xs font-semibold
                    ${
                      appointment.paymentStatus === "paid"
                        ? "bg-green-100 text-green-700"
                        : appointment.paymentStatus === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : appointment.paymentStatus === "partial"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                    }
                  `}
                  >
                    ${appointment.fee || 0}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchAppointmentDetails(appointment._id);
                      }}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      <HiOutlineEye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Edit functionality
                      }}
                      className="text-green-600 hover:text-green-900 transition-colors"
                    >
                      <HiOutlinePencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAppointment(appointment._id);
                      }}
                      className="text-red-600 hover:text-red-900 transition-colors"
                    >
                      <HiOutlineTrash className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ============================================
  // APPOINTMENT DETAILS MODAL
  // ============================================
  const AppointmentDetailsModal = () => {
    if (!showDetailsModal || !selectedAppointment) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Appointment {selectedAppointment.appointmentId}
                  </h3>
                  <span
                    className={`
                    px-3 py-1 rounded-full text-xs font-semibold
                    ${
                      selectedAppointment.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : selectedAppointment.status === "scheduled"
                          ? "bg-blue-100 text-blue-700"
                          : selectedAppointment.status === "confirmed"
                            ? "bg-indigo-100 text-indigo-700"
                            : selectedAppointment.status === "in_progress"
                              ? "bg-yellow-100 text-yellow-700"
                              : selectedAppointment.status === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                    }
                  `}
                  >
                    {selectedAppointment.statusText}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">
                  {selectedAppointment.reason}
                </p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Patient Info */}
              <div className="bg-blue-50 p-5 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <HiOutlineUser className="w-5 h-5 mr-2 text-blue-600" />
                  Patient Information
                </h4>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <span className="font-medium">Name:</span>{" "}
                    {selectedAppointment.patient?.fullName}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Patient ID:</span>{" "}
                    {selectedAppointment.patient?.patientId}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Email:</span>{" "}
                    {selectedAppointment.patient?.email}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Phone:</span>{" "}
                    {selectedAppointment.patient?.phone}
                  </p>
                </div>
              </div>

              {/* Doctor Info */}
              <div className="bg-green-50 p-5 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <HiOutlineUserGroup className="w-5 h-5 mr-2 text-green-600" />
                  Doctor Information
                </h4>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <span className="font-medium">Name:</span>{" "}
                    {selectedAppointment.doctor?.fullName}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Specialization:</span>{" "}
                    {selectedAppointment.doctor?.specialization}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Email:</span>{" "}
                    {selectedAppointment.doctor?.email}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Phone:</span>{" "}
                    {selectedAppointment.doctor?.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="bg-gray-50 p-5 rounded-xl mb-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <HiOutlineCalendar className="w-5 h-5 mr-2 text-gray-600" />
                Appointment Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium text-gray-900">
                    {selectedAppointment.dateFormatted} at{" "}
                    {selectedAppointment.time}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedAppointment.dayOfWeek}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium text-gray-900">
                    {selectedAppointment.duration || 30} minutes
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {selectedAppointment.type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fee</p>
                  <p className="font-medium text-gray-900">
                    ${selectedAppointment.fee || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <span
                    className={`
                    inline-block px-3 py-1 rounded-lg text-xs font-semibold mt-1
                    ${
                      selectedAppointment.paymentStatus === "paid"
                        ? "bg-green-100 text-green-700"
                        : selectedAppointment.paymentStatus === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : selectedAppointment.paymentStatus === "partial"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                    }
                  `}
                  >
                    {selectedAppointment.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Symptoms & Diagnosis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {selectedAppointment.symptoms?.length > 0 && (
                <div className="bg-gray-50 p-5 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-3">Symptoms</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAppointment.symptoms.map((symptom, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs"
                      >
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedAppointment.diagnosis && (
                <div className="bg-gray-50 p-5 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Diagnosis
                  </h4>
                  <p className="text-gray-700">
                    {selectedAppointment.diagnosis}
                  </p>
                </div>
              )}
            </div>

            {/* Notes */}
            {selectedAppointment.notes && (
              <div className="bg-yellow-50 p-5 rounded-xl mb-6">
                <h4 className="font-semibold text-yellow-800 mb-2">Notes</h4>
                <p className="text-yellow-700">{selectedAppointment.notes}</p>
              </div>
            )}

            {/* Status Update */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Update Appointment Status
                  </h4>
                  <p className="text-sm text-gray-500">
                    Change the current status of this appointment
                  </p>
                </div>
                <select
                  value={selectedAppointment.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    await handleStatusChange(
                      selectedAppointment._id,
                      newStatus,
                    );
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // PAGINATION COMPONENT
  // ============================================
  const Pagination = () => (
    <div className="mt-8 flex items-center justify-between bg-white px-6 py-3 rounded-2xl shadow-lg border border-gray-200">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">
          Page <span className="font-semibold">{currentPage}</span> of{" "}
          <span className="font-semibold">{totalPages}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          <HiOutlineChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          <HiOutlineChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Appointments Management
            </h1>
            <p className="text-gray-600 mt-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
              Schedule, track, and manage patient appointments
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 border border-gray-300 shadow-sm"
            >
              <HiOutlineDownload className="w-5 h-5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2 shadow-lg">
              <HiOutlinePlus className="w-5 h-5" />
              <span>New Appointment</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Search & Filters */}
        <SearchAndFilters />

        {/* Main Content */}
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-16 text-center">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <HiOutlineCalendar className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">
              No appointments found
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ||
              selectedStatus !== "all" ||
              selectedType !== "all" ||
              selectedDate !== "all"
                ? "Try adjusting your search or filters"
                : "Start by scheduling a new appointment"}
            </p>
            {searchTerm ||
            selectedStatus !== "all" ||
            selectedType !== "all" ||
            selectedDate !== "all" ? (
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all inline-flex items-center gap-2 shadow-lg"
              >
                <HiOutlineRefresh className="w-5 h-5" />
                Clear all filters
              </button>
            ) : (
              <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all inline-flex items-center gap-2 shadow-lg">
                <HiOutlinePlus className="w-5 h-5" />
                Schedule Appointment
              </button>
            )}
          </div>
        ) : (
          <>
            <TableView />
            <Pagination />
          </>
        )}

        {/* Appointment Details Modal */}
        <AppointmentDetailsModal />
      </div>
    </div>
  );
};

export default Appointments;
