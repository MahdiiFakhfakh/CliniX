import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlinePlus,
  HiOutlineDownload,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineStar,
  HiOutlineCurrencyDollar,
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
  HiOutlineLocationMarker,
  HiOutlineUsers,
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
  HiOutlineUserGroup,
  HiOutlineBadgeCheck,
} from "react-icons/hi";

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [sortBy, setSortBy] = useState("fullName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    onLeave: 0,
    avgRating: 0,
  });

  const navigate = useNavigate();

  // Fetch doctors on component mount
  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get(
        "http://localhost:5000/api/admin/doctors",
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Transform data for better display
      const transformedDoctors = (response.data.doctors || []).map(
        (doctor) => ({
          ...doctor,
          initials:
            doctor.fullName
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase() || "DR",
          ratingStars: doctor.ratings?.average || 4.5,
          reviewCount: doctor.ratings?.totalReviews || 0,
          formattedFee: doctor.consultationFee
            ? new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(doctor.consultationFee)
            : "$0",
          experienceText: doctor.experience
            ? `${doctor.experience} ${doctor.experience === 1 ? "year" : "years"}`
            : "N/A",
          statusColor:
            doctor.status === "available"
              ? "green"
              : doctor.status === "on_leave"
                ? "yellow"
                : "gray",
          statusText:
            doctor.status === "available"
              ? "Available"
              : doctor.status === "on_leave"
                ? "On Leave"
                : "Unavailable",
          patientLoad: doctor.patients?.length || 0,
        }),
      );

      setDoctors(transformedDoctors);
      setFilteredDoctors(transformedDoctors);

      // Update stats
      setStats({
        total: transformedDoctors.length,
        available: transformedDoctors.filter((d) => d.status === "available")
          .length,
        onLeave: transformedDoctors.filter((d) => d.status === "on_leave")
          .length,
        avgRating:
          (
            transformedDoctors.reduce(
              (sum, d) => sum + (d.ratings?.average || 4.5),
              0,
            ) / transformedDoctors.length
          ).toFixed(1) || 4.5,
      });
    } catch (err) {
      console.error("Error fetching doctors:", err);
      toast.error("Failed to load doctors");
      if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorDetails = async (doctorId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/admin/doctors/${doctorId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSelectedDoctor(response.data.doctor);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Failed to fetch doctor details:", error);
      toast.error("Failed to load doctor details");
    }
  };

  const handleStatusChange = async (doctorId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/admin/doctors/${doctorId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Update local state
      setDoctors((prev) =>
        prev.map((d) =>
          d._id === doctorId
            ? { ...d, status: newStatus, statusText: getStatusText(newStatus) }
            : d,
        ),
      );
      setFilteredDoctors((prev) =>
        prev.map((d) =>
          d._id === doctorId
            ? { ...d, status: newStatus, statusText: getStatusText(newStatus) }
            : d,
        ),
      );

      // Update stats
      setStats((prev) => ({
        ...prev,
        available:
          newStatus === "available" ? prev.available + 1 : prev.available - 1,
        onLeave: newStatus === "on_leave" ? prev.onLeave + 1 : prev.onLeave - 1,
      }));

      // Update selected doctor if modal is open
      if (selectedDoctor && selectedDoctor._id === doctorId) {
        setSelectedDoctor({ ...selectedDoctor, status: newStatus });
      }

      toast.success(`Status updated to ${getStatusText(newStatus)}`);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      available: "Available",
      on_leave: "On Leave",
      unavailable: "Unavailable",
    };
    return statusMap[status] || status;
  };

  const handleDeleteDoctor = async (doctorId) => {
    if (!window.confirm("Are you sure you want to remove this doctor?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/admin/doctors/${doctorId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setDoctors((prev) => prev.filter((d) => d._id !== doctorId));
      setFilteredDoctors((prev) => prev.filter((d) => d._id !== doctorId));
      toast.success("Doctor removed successfully");
    } catch (error) {
      console.error("Failed to delete doctor:", error);
      toast.error("Failed to remove doctor");
    }
  };

  // Get unique values for filters
  const specializations = [
    "all",
    ...new Set(doctors.map((d) => d.specialization).filter(Boolean)),
  ];
  const departments = [
    "all",
    ...new Set(doctors.map((d) => d.department).filter(Boolean)),
  ];
  const statuses = ["all", "available", "on_leave", "unavailable"];

  // Filter doctors
  useEffect(() => {
    let filtered = [...doctors];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.fullName?.toLowerCase().includes(q) ||
          doc.specialization?.toLowerCase().includes(q) ||
          doc.department?.toLowerCase().includes(q) ||
          doc.email?.toLowerCase().includes(q) ||
          doc.hospital?.toLowerCase().includes(q),
      );
    }

    if (selectedSpecialization !== "all") {
      filtered = filtered.filter(
        (doc) => doc.specialization === selectedSpecialization,
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((doc) => doc.status === selectedStatus);
    }

    if (selectedDepartment !== "all") {
      filtered = filtered.filter(
        (doc) => doc.department === selectedDepartment,
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy] || "";
      let bVal = b[sortBy] || "";

      if (sortBy === "fullName") {
        aVal = a.fullName || "";
        bVal = b.fullName || "";
      }
      if (sortBy === "experience") {
        aVal = a.experience || 0;
        bVal = b.experience || 0;
      }
      if (sortBy === "consultationFee") {
        aVal = a.consultationFee || 0;
        bVal = b.consultationFee || 0;
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredDoctors(filtered);
    setCurrentPage(1);
  }, [
    doctors,
    searchTerm,
    selectedSpecialization,
    selectedStatus,
    selectedDepartment,
    sortBy,
    sortOrder,
  ]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDoctors.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSpecialization("all");
    setSelectedStatus("all");
    setSelectedDepartment("all");
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

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <HiOutlineUserGroup className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-lg text-gray-600 animate-pulse">
            Loading doctors...
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
            <p className="text-sm font-medium text-gray-500">Total Doctors</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.total}
            </p>
            <p className="text-xs text-green-600 mt-1">
              Active: {stats.available}
            </p>
          </div>
          <div className="bg-blue-100 p-3 rounded-2xl">
            <HiOutlineUserGroup className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Available Now</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.available}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round((stats.available / (stats.total || 1)) * 100)}% of
              staff
            </p>
          </div>
          <div className="bg-green-100 p-3 rounded-2xl">
            <HiOutlineCheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">On Leave</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.onLeave}
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Temporarily unavailable
            </p>
          </div>
          <div className="bg-yellow-100 p-3 rounded-2xl">
            <HiOutlineClock className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Average Rating</p>
            <div className="flex items-center mt-2">
              <p className="text-3xl font-bold text-gray-900 mr-2">
                {stats.avgRating}
              </p>
              <HiOutlineStar className="w-6 h-6 text-yellow-400 fill-current" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Based on patient reviews
            </p>
          </div>
          <div className="bg-purple-100 p-3 rounded-2xl">
            <HiOutlineStar className="w-6 h-6 text-purple-600" />
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
              placeholder="Search doctors by name, specialization, department..."
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
              {(selectedSpecialization !== "all" ||
                selectedStatus !== "all" ||
                selectedDepartment !== "all") && (
                <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {
                    [
                      selectedSpecialization,
                      selectedStatus,
                      selectedDepartment,
                    ].filter((s) => s !== "all").length
                  }
                </span>
              )}
            </button>

            <button
              onClick={() =>
                setViewMode(viewMode === "grid" ? "table" : "grid")
              }
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2"
            >
              {viewMode === "grid" ? (
                <>
                  <HiOutlineDocumentDuplicate className="w-5 h-5" />
                  <span className="hidden sm:inline">Table View</span>
                </>
              ) : (
                <>
                  <HiOutlineChartBar className="w-5 h-5" />
                  <span className="hidden sm:inline">Grid View</span>
                </>
              )}
            </button>

            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2 shadow-lg">
              <HiOutlinePlus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Doctor</span>
            </button>
          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 animate-slideDown">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                Specialization
              </label>
              <select
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50"
              >
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec === "all" ? "All Specializations" : spec}
                  </option>
                ))}
              </select>
            </div>

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
                <option value="available">Available</option>
                <option value="on_leave">On Leave</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept === "all" ? "All Departments" : dept}
                  </option>
                ))}
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
              {Math.min(indexOfLastItem, filteredDoctors.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900">
              {filteredDoctors.length}
            </span>{" "}
            doctors
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleSort("fullName")}
            className={`flex items-center gap-1 hover:text-blue-600 transition-colors ${
              sortBy === "fullName"
                ? "text-blue-600 font-semibold"
                : "text-gray-600"
            }`}
          >
            Name {sortBy === "fullName" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
          <button
            onClick={() => handleSort("experience")}
            className={`flex items-center gap-1 hover:text-blue-600 transition-colors ${
              sortBy === "experience"
                ? "text-blue-600 font-semibold"
                : "text-gray-600"
            }`}
          >
            Experience{" "}
            {sortBy === "experience" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
          <button
            onClick={() => handleSort("consultationFee")}
            className={`flex items-center gap-1 hover:text-blue-600 transition-colors ${
              sortBy === "consultationFee"
                ? "text-blue-600 font-semibold"
                : "text-gray-600"
            }`}
          >
            Fee{" "}
            {sortBy === "consultationFee" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================
  // GRID VIEW COMPONENT
  // ============================================
  const GridView = () => (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {currentItems.map((doctor) => (
        <div
          key={doctor._id}
          onClick={() => fetchDoctorDetails(doctor._id)}
          className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 overflow-hidden cursor-pointer"
        >
          {/* Header with Gradient */}
          <div className="relative h-32 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-5">
            <div className="absolute top-4 right-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                  doctor.status === "available"
                    ? "bg-green-500"
                    : doctor.status === "on_leave"
                      ? "bg-yellow-500"
                      : "bg-gray-500"
                }`}
              >
                {doctor.statusText}
              </span>
            </div>

            {/* Avatar */}
            <div className="absolute -bottom-12 left-5">
              <div
                className={`
                w-24 h-24 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center
                ${
                  doctor.status === "available"
                    ? "bg-gradient-to-br from-green-500 to-green-600"
                    : doctor.status === "on_leave"
                      ? "bg-gradient-to-br from-yellow-500 to-yellow-600"
                      : "bg-gradient-to-br from-gray-500 to-gray-600"
                }
              `}
              >
                <span className="text-white text-3xl font-bold">
                  {doctor.initials}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="pt-16 p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {doctor.fullName}
                </h3>
                <p className="text-sm font-medium text-blue-600">
                  {doctor.specialization}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {doctor.department || "General Medicine"}
                </p>
              </div>

              {doctor.licenseNumber && (
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-lg">
                  <HiOutlineBadgeCheck className="w-4 h-4 text-blue-600" />
                </div>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center">
                <HiOutlineStar className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-semibold text-gray-700 ml-1">
                  {doctor.ratings?.average || 4.5}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                ({doctor.ratings?.totalReviews || 0} reviews)
              </span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <HiOutlineBriefcase className="w-4 h-4 mr-2 text-gray-400" />
                <span>{doctor.experienceText}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <HiOutlineCurrencyDollar className="w-4 h-4 mr-2 text-gray-400" />
                <span className="font-medium">{doctor.formattedFee}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <HiOutlineAcademicCap className="w-4 h-4 mr-2 text-gray-400" />
                <span>{doctor.qualifications?.[0] || "MD"}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <HiOutlineUsers className="w-4 h-4 mr-2 text-gray-400" />
                <span>{doctor.patientLoad} patients</span>
              </div>
            </div>

            {/* Contact Preview */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center text-xs text-gray-500">
                <HiOutlineMail className="w-3 h-3 mr-1" />
                <span className="truncate max-w-[120px]">{doctor.email}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(
                    doctor._id,
                    doctor.status === "available" ? "on_leave" : "available",
                  );
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                {doctor.status === "available" ? "Set Leave" : "Set Available"}
              </button>
            </div>
          </div>
        </div>
      ))}
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
                Doctor
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Specialization
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Experience & Fee
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((doctor) => (
              <tr
                key={doctor._id}
                onClick={() => fetchDoctorDetails(doctor._id)}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div
                      className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      ${
                        doctor.status === "available"
                          ? "bg-green-100 text-green-700"
                          : doctor.status === "on_leave"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                      }
                    `}
                    >
                      <span className="font-bold">{doctor.initials}</span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {doctor.fullName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {doctor.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {doctor.specialization}
                  </div>
                  <div className="text-sm text-gray-500">
                    {doctor.department || "General"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {doctor.phone || "N/A"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {doctor.hospital || "City Hospital"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {doctor.experienceText}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {doctor.formattedFee}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <HiOutlineStar className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium text-gray-900 ml-1">
                      {doctor.ratings?.average || 4.5}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({doctor.ratings?.totalReviews || 0})
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={doctor.status}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleStatusChange(doctor._id, e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-semibold border-0 cursor-pointer
                      ${
                        doctor.status === "available"
                          ? "bg-green-100 text-green-700"
                          : doctor.status === "on_leave"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                      }
                    `}
                  >
                    <option value="available">Available</option>
                    <option value="on_leave">On Leave</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchDoctorDetails(doctor._id);
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
                        handleDeleteDoctor(doctor._id);
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
  // DOCTOR DETAILS MODAL
  // ============================================
  const DoctorDetailsModal = () => {
    if (!showDetailsModal || !selectedDoctor) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center">
                <div
                  className={`
                  w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold
                  ${
                    selectedDoctor.status === "available"
                      ? "bg-gradient-to-br from-green-500 to-green-600"
                      : selectedDoctor.status === "on_leave"
                        ? "bg-gradient-to-br from-yellow-500 to-yellow-600"
                        : "bg-gradient-to-br from-gray-500 to-gray-600"
                  }
                `}
                >
                  {selectedDoctor.fullName?.charAt(0) || "DR"}
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedDoctor.fullName}
                  </h3>
                  <p className="text-blue-600">
                    {selectedDoctor.specialization}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedDoctor.department || "General Medicine"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="text-sm text-blue-600 font-medium">Experience</p>
                <p className="text-2xl font-bold text-blue-900">
                  {selectedDoctor.experience || 0} yrs
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl">
                <p className="text-sm text-green-600 font-medium">
                  Consultation Fee
                </p>
                <p className="text-2xl font-bold text-green-900">
                  ${selectedDoctor.consultationFee || 0}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl">
                <p className="text-sm text-purple-600 font-medium">License</p>
                <p className="text-lg font-semibold text-purple-900">
                  {selectedDoctor.licenseNumber || "N/A"}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl">
                <p className="text-sm text-orange-600 font-medium">Rating</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold text-orange-900 mr-2">
                    {selectedDoctor.ratings?.average || 4.5}
                  </p>
                  <HiOutlineStar className="w-6 h-6 text-yellow-400 fill-current" />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">
                Contact Information
              </h4>
              <div className="space-y-2">
                <p className="text-gray-600">
                  <span className="font-medium w-24 inline-block">Email:</span>
                  {selectedDoctor.email || "Not provided"}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium w-24 inline-block">Phone:</span>
                  {selectedDoctor.phone || "Not provided"}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium w-24 inline-block">
                    Hospital:
                  </span>
                  {selectedDoctor.hospital || "Not provided"}
                </p>
              </div>
            </div>

            {/* Status Update */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Status</h4>
              <select
                value={selectedDoctor.status}
                onChange={async (e) => {
                  const newStatus = e.target.value;
                  await handleStatusChange(selectedDoctor._id, newStatus);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="available">Available</option>
                <option value="on_leave">On Leave</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            {/* Qualifications */}
            {selectedDoctor.qualifications?.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Qualifications
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDoctor.qualifications.map((qual, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {qual}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {selectedDoctor.bio && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Biography</h4>
                <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl">
                  {selectedDoctor.bio}
                </p>
              </div>
            )}
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
              Doctors Management
            </h1>
            <p className="text-gray-600 mt-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
              Manage physician profiles, schedules, and performance
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 border border-gray-300 shadow-sm">
              <HiOutlineDownload className="w-5 h-5" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2 shadow-lg">
              <HiOutlinePlus className="w-5 h-5" />
              <span>Add Doctor</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Search & Filters */}
        <SearchAndFilters />

        {/* Main Content */}
        {filteredDoctors.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-16 text-center">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <HiOutlineUserGroup className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">
              No doctors found
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ||
              selectedSpecialization !== "all" ||
              selectedStatus !== "all" ||
              selectedDepartment !== "all"
                ? "Try adjusting your search or filters"
                : "Start by adding your first doctor"}
            </p>
            {searchTerm ||
            selectedSpecialization !== "all" ||
            selectedStatus !== "all" ||
            selectedDepartment !== "all" ? (
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
                Add Doctor
              </button>
            )}
          </div>
        ) : (
          <>
            {viewMode === "grid" ? <GridView /> : <TableView />}
            <Pagination />
          </>
        )}

        {/* Doctor Details Modal */}
        <DoctorDetailsModal />
      </div>
    </div>
  );
};

export default Doctors;
