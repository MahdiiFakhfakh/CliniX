import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { matchesSearch } from "../utils/search";
import {
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineDownload,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineStar,
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDoctor, setEditDoctor] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    onLeave: 0,
    avgRating: 0,
  });

  const navigate = useNavigate();
  const location = useLocation();

  const toListText = (value) =>
    Array.isArray(value) ? value.filter(Boolean).join(", ") : value || "";

  const fromListText = (value) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const calculateDoctorStats = (doctorList) => {
    const total = doctorList.length;
    const ratingTotal = doctorList.reduce(
      (sum, d) => sum + (d.ratings?.average || 4.5),
      0,
    );

    return {
      total,
      available: doctorList.filter((d) => d.status === "available").length,
      onLeave: doctorList.filter((d) => d.status === "on_leave").length,
      avgRating: total ? (ratingTotal / total).toFixed(1) : "0.0",
    };
  };

  // Fetch doctors on component mount
  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(location.search).get("search") || "";
    setSearchTerm(query);
  }, [location.search]);

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
      setStats(calculateDoctorStats(transformedDoctors));
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
      await axios.put(
        `http://localhost:5000/api/admin/doctors/${doctorId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Update local state
      setDoctors((prev) => {
        const updatedDoctors = prev.map((d) =>
          d._id === doctorId
            ? { ...d, status: newStatus, statusText: getStatusText(newStatus) }
            : d,
        );
        setStats(calculateDoctorStats(updatedDoctors));
        return updatedDoctors;
      });
      setFilteredDoctors((prev) =>
        prev.map((d) =>
          d._id === doctorId
            ? { ...d, status: newStatus, statusText: getStatusText(newStatus) }
            : d,
        ),
      );

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

      setDoctors((prev) => {
        const remainingDoctors = prev.filter((d) => d._id !== doctorId);
        setStats(calculateDoctorStats(remainingDoctors));
        return remainingDoctors;
      });
      setFilteredDoctors((prev) => prev.filter((d) => d._id !== doctorId));
      if (selectedDoctor?._id === doctorId) {
        setSelectedDoctor(null);
        setShowDetailsModal(false);
      }
      toast.success("Doctor removed successfully");
    } catch (error) {
      console.error("Failed to delete doctor:", error);
      toast.error("Failed to remove doctor");
    }
  };

  const openEditDoctor = (doctor) => {
    setEditDoctor({
      ...doctor,
      qualificationsText: toListText(doctor.qualifications),
      workingStart: doctor.workingHours?.start || "",
      workingEnd: doctor.workingHours?.end || "",
    });
    setShowEditModal(true);
  };

  const handleEditDoctorChange = (field, value) => {
    setEditDoctor((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDoctor = async (event) => {
    event.preventDefault();
    if (!editDoctor?._id) return;

    try {
      setSavingEdit(true);
      const token = localStorage.getItem("token");
      const payload = {
        firstName: editDoctor.firstName,
        lastName: editDoctor.lastName,
        email: editDoctor.email,
        phone: editDoctor.phone,
        specialization: editDoctor.specialization,
        department: editDoctor.department,
        licenseNumber: editDoctor.licenseNumber,
        qualifications: fromListText(editDoctor.qualificationsText || ""),
        experience: Number(editDoctor.experience) || 0,
        consultationFee: Number(editDoctor.consultationFee) || 0,
        status: editDoctor.status,
        bio: editDoctor.bio,
        notes: editDoctor.notes,
        workingHours: {
          start: editDoctor.workingStart,
          end: editDoctor.workingEnd,
        },
      };

      await axios.put(
        `http://localhost:5000/api/admin/doctors/${editDoctor._id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success("Doctor details updated");
      setShowEditModal(false);
      setEditDoctor(null);
      await fetchDoctors();
      if (selectedDoctor?._id === editDoctor._id) {
        await fetchDoctorDetails(editDoctor._id);
      }
    } catch (error) {
      console.error("Failed to update doctor:", error);
      toast.error(error.response?.data?.message || "Failed to update doctor");
    } finally {
      setSavingEdit(false);
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

    if (searchTerm.trim()) {
      filtered = filtered.filter((doc) =>
        matchesSearch(searchTerm, [
          doc.fullName,
          doc.firstName,
          doc.lastName,
          doc.doctorId,
          doc.email,
          doc.phone,
          doc.specialization,
          doc.department,
          doc.hospital,
          doc.licenseNumber,
          doc.status,
          doc.statusText,
          doc.qualifications,
          doc.experienceText,
          doc.bio,
          doc.notes,
        ]),
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
    if (location.search) {
      navigate(location.pathname, { replace: true });
    }
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
      <div className="min-h-screen bg-gradient-to-br from-[#f8fffd] via-[#eef8f7] to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-teal-200 rounded-full animate-spin border-t-teal-700 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <HiOutlineUserGroup className="w-8 h-8 text-teal-700 animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-lg text-slate-600 animate-pulse">
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
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Doctors</p>
            <p className="text-3xl font-bold text-slate-950 mt-2">
              {stats.total}
            </p>
            <p className="text-xs text-green-600 mt-1">
              Active: {stats.available}
            </p>
          </div>
          <div className="bg-teal-50 p-3 rounded-lg">
            <HiOutlineUserGroup className="w-6 h-6 text-teal-700" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Available Now</p>
            <p className="text-3xl font-bold text-slate-950 mt-2">
              {stats.available}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {Math.round((stats.available / (stats.total || 1)) * 100)}% of
              staff
            </p>
          </div>
          <div className="bg-green-100 p-3 rounded-lg">
            <HiOutlineCheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">On Leave</p>
            <p className="text-3xl font-bold text-slate-950 mt-2">
              {stats.onLeave}
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Temporarily unavailable
            </p>
          </div>
          <div className="bg-yellow-100 p-3 rounded-lg">
            <HiOutlineClock className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Average Rating</p>
            <div className="flex items-center mt-2">
              <p className="text-3xl font-bold text-slate-950 mr-2">
                {stats.avgRating}
              </p>
              <HiOutlineStar className="w-6 h-6 text-yellow-400 fill-current" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Based on patient reviews
            </p>
          </div>
          <div className="bg-sky-50 p-3 rounded-lg">
            <HiOutlineStar className="w-6 h-6 text-sky-700" />
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================
  // SEARCH AND FILTERS COMPONENT
  // ============================================
  const SearchAndFilters = () => (
    <div className="bg-white rounded-lg shadow-lg border border-slate-200 mb-8 overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <HiOutlineSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search doctors by name, specialization, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-lg flex items-center gap-2 transition-all ${
                showFilters
                  ? "bg-teal-50 text-teal-800 border-2 border-teal-300"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-transparent"
              }`}
            >
              <HiOutlineFilter className="w-5 h-5" />
              <span className="hidden sm:inline">Filters</span>
              {(selectedSpecialization !== "all" ||
                selectedStatus !== "all" ||
                selectedDepartment !== "all") && (
                <span className="ml-1 px-2 py-0.5 bg-teal-500 text-white text-xs rounded-full">
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
              className="px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all flex items-center gap-2"
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

          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 animate-slideDown">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-2">
                Specialization
              </label>
              <select
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-slate-50"
              >
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec === "all" ? "All Specializations" : spec}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-slate-50"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="on_leave">On Leave</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-2">
                Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-slate-50"
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
                className="w-full px-4 py-2.5 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
              >
                <HiOutlineRefresh className="w-4 h-4" />
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="bg-slate-50 px-6 py-3 flex flex-wrap items-center justify-between text-sm border-t border-slate-200">
        <div className="flex items-center gap-2 text-slate-600">
          <HiOutlineInformationCircle className="w-4 h-4" />
          <span>
            Showing{" "}
            <span className="font-semibold text-slate-950">
              {indexOfFirstItem + 1}-
              {Math.min(indexOfLastItem, filteredDoctors.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-950">
              {filteredDoctors.length}
            </span>{" "}
            doctors
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleSort("fullName")}
            className={`flex items-center gap-1 hover:text-teal-700 transition-colors ${
              sortBy === "fullName"
                ? "text-teal-700 font-semibold"
                : "text-slate-600"
            }`}
          >
            Name {sortBy === "fullName" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
          <button
            onClick={() => handleSort("experience")}
            className={`flex items-center gap-1 hover:text-teal-700 transition-colors ${
              sortBy === "experience"
                ? "text-teal-700 font-semibold"
                : "text-slate-600"
            }`}
          >
            Experience{" "}
            {sortBy === "experience" && (sortOrder === "asc" ? "↑" : "↓")}
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
          className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-900/10 cursor-pointer"
        >
          {/* Header with Gradient */}
          <div className="relative h-28 bg-gradient-to-r from-slate-900 via-teal-800 to-emerald-600 p-5">
            <div className="absolute top-4 right-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ring-1 ring-white/25 ${
                  doctor.status === "available"
                    ? "bg-green-500"
                    : doctor.status === "on_leave"
                      ? "bg-yellow-500"
                      : "bg-slate-500"
                }`}
              >
                {doctor.statusText}
              </span>
            </div>

            {/* Avatar */}
            <div className="absolute -bottom-12 left-5">
              <div
                className={`
                w-20 h-20 rounded-lg border-4 border-white shadow-xl flex items-center justify-center
                ${
                  doctor.status === "available"
                    ? "bg-gradient-to-br from-teal-500 to-emerald-600"
                    : doctor.status === "on_leave"
                      ? "bg-gradient-to-br from-yellow-500 to-yellow-600"
                      : "bg-gradient-to-br from-slate-500 to-slate-600"
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
          <div className="pt-14 p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-black text-slate-950 group-hover:text-teal-700 transition-colors">
                  {doctor.fullName}
                </h3>
                <p className="text-sm font-bold text-teal-700">
                  {doctor.specialization}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {doctor.department || "General Medicine"}
                </p>
              </div>

              {doctor.licenseNumber && (
                <div className="flex items-center gap-1 px-2 py-1 bg-teal-50 rounded-lg ring-1 ring-teal-100">
                  <HiOutlineBadgeCheck className="w-4 h-4 text-teal-700" />
                </div>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                <HiOutlineStar className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-bold text-slate-700 ml-1">
                  {doctor.ratings?.average || 4.5}
                </span>
              </div>
              <span className="text-xs text-slate-500">
                ({doctor.ratings?.totalReviews || 0} reviews)
              </span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
              <div className="flex items-center text-sm text-slate-600">
                <HiOutlineBriefcase className="w-4 h-4 mr-2 text-teal-600" />
                <span>{doctor.experienceText}</span>
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <HiOutlineAcademicCap className="w-4 h-4 mr-2 text-sky-600" />
                <span className="truncate">{doctor.qualifications?.[0] || "MD"}</span>
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <HiOutlineUsers className="w-4 h-4 mr-2 text-violet-600" />
                <span>{doctor.patientLoad} patients</span>
              </div>
            </div>

            {/* Contact Preview */}
            <div className="grid grid-cols-[minmax(0,1fr)_auto_2rem] items-center gap-2 border-t border-slate-100 pt-3">
              <div className="flex min-w-0 items-center text-xs text-slate-500">
                <HiOutlineMail className="w-3 h-3 mr-1" />
                <span className="truncate">{doctor.email}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEditDoctor(doctor);
                }}
                className="h-8 rounded-md bg-slate-100 px-2 text-[11px] font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteDoctor(doctor._id);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-50 p-0 text-rose-600 transition-all hover:bg-rose-100"
                aria-label={`Delete ${doctor.fullName}`}
              >
                <HiOutlineTrash className="block h-3.5 w-3.5" />
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
    <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Doctor
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Specialization
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Experience
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Rating
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {currentItems.map((doctor) => (
              <tr
                key={doctor._id}
                onClick={() => fetchDoctorDetails(doctor._id)}
                className="hover:bg-slate-50 transition-colors cursor-pointer"
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
                            : "bg-slate-100 text-slate-700"
                      }
                    `}
                    >
                      <span className="font-bold">{doctor.initials}</span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-slate-950">
                        {doctor.fullName}
                      </div>
                      <div className="text-sm text-slate-500">
                        {doctor.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-950">
                    {doctor.specialization}
                  </div>
                  <div className="text-sm text-slate-500">
                    {doctor.department || "General"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-950">
                    {doctor.phone || "N/A"}
                  </div>
                  <div className="text-sm text-slate-500">
                    {doctor.hospital || "CliniX"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-950">
                    {doctor.experienceText}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <HiOutlineStar className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium text-slate-950 ml-1">
                      {doctor.ratings?.average || 4.5}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">
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
                            : "bg-slate-100 text-slate-700"
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
                      className="text-teal-700 hover:text-teal-950 transition-colors"
                    >
                      <HiOutlineEye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDoctor(doctor);
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
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center">
                <div
                  className={`
                  w-20 h-20 rounded-lg flex items-center justify-center text-white text-3xl font-bold
                  ${
                    selectedDoctor.status === "available"
                      ? "bg-gradient-to-br from-green-500 to-green-600"
                      : selectedDoctor.status === "on_leave"
                        ? "bg-gradient-to-br from-yellow-500 to-yellow-600"
                        : "bg-gradient-to-br from-slate-500 to-slate-600"
                  }
                `}
                >
                  {selectedDoctor.fullName?.charAt(0) || "DR"}
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-slate-950">
                    {selectedDoctor.fullName}
                  </h3>
                  <p className="text-teal-700">
                    {selectedDoctor.specialization}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedDoctor.department || "General Medicine"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-teal-50 p-4 rounded-lg">
                <p className="text-sm text-teal-700 font-medium">Experience</p>
                <p className="text-2xl font-bold text-teal-950">
                  {selectedDoctor.experience || 0} yrs
                </p>
              </div>
              <div className="bg-sky-50 p-4 rounded-lg">
                <p className="text-sm text-sky-700 font-medium">License</p>
                <p className="text-lg font-semibold text-sky-950">
                  {selectedDoctor.licenseNumber || "N/A"}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
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
              <h4 className="font-semibold text-slate-950 mb-3">
                Contact Information
              </h4>
              <div className="space-y-2">
                <p className="text-slate-600">
                  <span className="font-medium w-24 inline-block">Email:</span>
                  {selectedDoctor.email || "Not provided"}
                </p>
                <p className="text-slate-600">
                  <span className="font-medium w-24 inline-block">Phone:</span>
                  {selectedDoctor.phone || "Not provided"}
                </p>
                <p className="text-slate-600">
                  <span className="font-medium w-24 inline-block">
                    Hospital:
                  </span>
                  {selectedDoctor.hospital || "CliniX"}
                </p>
              </div>
            </div>

            {/* Status Update */}
            <div className="mb-6">
              <h4 className="font-semibold text-slate-950 mb-3">Status</h4>
              <select
                value={selectedDoctor.status}
                onChange={async (e) => {
                  const newStatus = e.target.value;
                  await handleStatusChange(selectedDoctor._id, newStatus);
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="available">Available</option>
                <option value="on_leave">On Leave</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            <button
              onClick={() => openEditDoctor(selectedDoctor)}
              className="mb-6 w-full px-4 py-3 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-all font-semibold flex items-center justify-center gap-2"
            >
              <HiOutlinePencil className="w-5 h-5" />
              Edit Doctor Details
            </button>

            {/* Qualifications */}
            {selectedDoctor.qualifications?.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-slate-950 mb-3">
                  Qualifications
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDoctor.qualifications.map((qual, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-teal-50 text-teal-800 rounded-full text-sm"
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
                <h4 className="font-semibold text-slate-950 mb-3">Biography</h4>
                <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-lg">
                  {selectedDoctor.bio}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const EditDoctorModal = () => {
    if (!showEditModal || !editDoctor) return null;

    const inputClass =
      "w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500";

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveDoctor} className="p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-950">
                  Edit Doctor Details
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Update profile, contact, clinical, and availability details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  First Name
                </span>
                <input
                  className={inputClass}
                  value={editDoctor.firstName || ""}
                  onChange={(e) =>
                    handleEditDoctorChange("firstName", e.target.value)
                  }
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Last Name
                </span>
                <input
                  className={inputClass}
                  value={editDoctor.lastName || ""}
                  onChange={(e) =>
                    handleEditDoctorChange("lastName", e.target.value)
                  }
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <input
                  type="email"
                  className={inputClass}
                  value={editDoctor.email || ""}
                  onChange={(e) =>
                    handleEditDoctorChange("email", e.target.value)
                  }
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Phone</span>
                <input
                  className={inputClass}
                  value={editDoctor.phone || ""}
                  onChange={(e) =>
                    handleEditDoctorChange("phone", e.target.value)
                  }
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Specialization
                </span>
                <input
                  className={inputClass}
                  value={editDoctor.specialization || ""}
                  onChange={(e) =>
                    handleEditDoctorChange("specialization", e.target.value)
                  }
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Department
                </span>
                <input
                  className={inputClass}
                  value={editDoctor.department || ""}
                  onChange={(e) =>
                    handleEditDoctorChange("department", e.target.value)
                  }
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  License Number
                </span>
                <input
                  className={inputClass}
                  value={editDoctor.licenseNumber || ""}
                  onChange={(e) =>
                    handleEditDoctorChange("licenseNumber", e.target.value)
                  }
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Status
                </span>
                <select
                  className={inputClass}
                  value={editDoctor.status || "available"}
                  onChange={(e) =>
                    handleEditDoctorChange("status", e.target.value)
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="available">Available</option>
                  <option value="on_leave">On Leave</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Experience
                </span>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={editDoctor.experience ?? 0}
                  onChange={(e) =>
                    handleEditDoctorChange("experience", e.target.value)
                  }
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Consultation Fee
                </span>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={editDoctor.consultationFee ?? 0}
                  onChange={(e) =>
                    handleEditDoctorChange("consultationFee", e.target.value)
                  }
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Work Start
                </span>
                <input
                  className={inputClass}
                  placeholder="09:00"
                  value={editDoctor.workingStart || ""}
                  onChange={(e) =>
                    handleEditDoctorChange("workingStart", e.target.value)
                  }
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Work End
                </span>
                <input
                  className={inputClass}
                  placeholder="17:00"
                  value={editDoctor.workingEnd || ""}
                  onChange={(e) =>
                    handleEditDoctorChange("workingEnd", e.target.value)
                  }
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Qualifications
              </span>
              <input
                className={inputClass}
                placeholder="MD, FACC, MBBS"
                value={editDoctor.qualificationsText || ""}
                onChange={(e) =>
                  handleEditDoctorChange("qualificationsText", e.target.value)
                }
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Bio</span>
              <textarea
                rows={3}
                className={inputClass}
                value={editDoctor.bio || ""}
                onChange={(e) => handleEditDoctorChange("bio", e.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Notes</span>
              <textarea
                rows={3}
                className={inputClass}
                value={editDoctor.notes || ""}
                onChange={(e) =>
                  handleEditDoctorChange("notes", e.target.value)
                }
              />
            </label>

            <div className="flex justify-end gap-3 border-t pt-5">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="px-5 py-2.5 rounded-lg bg-teal-700 text-white font-semibold hover:bg-teal-800 disabled:opacity-60"
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ============================================
  // PAGINATION COMPONENT
  // ============================================
  const Pagination = () => (
    <div className="mt-8 flex items-center justify-between bg-white px-6 py-3 rounded-lg shadow-lg border border-slate-200">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-700">
          Page <span className="font-semibold">{currentPage}</span> of{" "}
          <span className="font-semibold">{totalPages}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
        >
          <HiOutlineChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
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
    <div className="min-h-screen bg-gradient-to-br from-[#f8fffd] via-[#eef8f7] to-slate-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-700 via-emerald-600 to-sky-600 bg-clip-text text-transparent">
              Doctors Management
            </h1>
            <p className="text-slate-600 mt-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></span>
              Manage physician profiles, schedules, and performance
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-all flex items-center gap-2 border border-slate-300 shadow-sm">
              <HiOutlineDownload className="w-5 h-5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Search & Filters */}
        {SearchAndFilters()}

        {/* Main Content */}
        {filteredDoctors.length === 0 ? (
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-16 text-center">
            <div className="bg-gradient-to-br from-slate-50 to-teal-50 w-24 h-24 rounded-lg flex items-center justify-center mx-auto mb-6">
              <HiOutlineUserGroup className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-700 mb-2">
              No doctors found
            </h3>
            <p className="text-slate-500 mb-6">
              {searchTerm ||
              selectedSpecialization !== "all" ||
              selectedStatus !== "all" ||
              selectedDepartment !== "all"
                ? "Try adjusting your search or filters"
                : "No doctor records are available yet"}
            </p>
            {searchTerm ||
            selectedSpecialization !== "all" ||
            selectedStatus !== "all" ||
            selectedDepartment !== "all" ? (
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-all inline-flex items-center gap-2 shadow-lg"
              >
                <HiOutlineRefresh className="w-5 h-5" />
                Clear all filters
              </button>
            ) : null}
          </div>
        ) : (
          <>
            {viewMode === "grid" ? <GridView /> : <TableView />}
            <Pagination />
          </>
        )}

        {/* Doctor Details Modal */}
        {DoctorDetailsModal()}
        {EditDoctorModal()}
      </div>
    </div>
  );
};

export default Doctors;
