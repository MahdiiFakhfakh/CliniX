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
  HiOutlineHeart,
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
  HiOutlineUser,
  HiOutlineLocationMarker,
  HiOutlineBriefcase,
  HiOutlineColorSwatch,
  HiOutlineScale,
  HiOutlineBeaker,
} from "react-icons/hi";

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedBloodGroup, setSelectedBloodGroup] = useState("all");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [sortBy, setSortBy] = useState("fullName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0,
    newThisMonth: 0,
    male: 0,
    female: 0,
    avgAge: 0,
  });

  const navigate = useNavigate();

  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients();
    fetchStats();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get(
        "http://localhost:5000/api/admin/patients",
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Transform data for better display
      const transformedPatients = (response.data.patients || []).map(
        (patient) => ({
          ...patient,
          initials:
            patient.fullName
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase() || "?",
          ageGroup: patient.age
            ? patient.age < 18
              ? "Child"
              : patient.age < 30
                ? "Young Adult"
                : patient.age < 50
                  ? "Adult"
                  : patient.age < 65
                    ? "Senior"
                    : "Elderly"
            : "Unknown",
          lastVisitFormatted: patient.lastVisit
            ? new Date(patient.lastVisit).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "Never",
          nextAppointmentFormatted: patient.nextAppointment
            ? new Date(patient.nextAppointment).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "None",
          statusColor:
            patient.status === "active"
              ? "green"
              : patient.status === "inactive"
                ? "gray"
                : patient.status === "pending"
                  ? "yellow"
                  : "red",
          riskLevel:
            patient.chronicConditions?.length > 2
              ? "High"
              : patient.chronicConditions?.length > 0
                ? "Medium"
                : "Low",
          riskColor:
            patient.chronicConditions?.length > 2
              ? "red"
              : patient.chronicConditions?.length > 0
                ? "yellow"
                : "green",
          bmiCategory: patient.bmi
            ? patient.bmi < 18.5
              ? "Underweight"
              : patient.bmi < 25
                ? "Normal"
                : patient.bmi < 30
                  ? "Overweight"
                  : "Obese"
            : "Unknown",
          fullAddress: patient.address
            ? `${patient.address.street || ""}, ${patient.address.city || ""}, ${patient.address.state || ""} ${patient.address.zipCode || ""}`.trim()
            : "No address",
        }),
      );

      setPatients(transformedPatients);
      setFilteredPatients(transformedPatients);

      // Update basic stats
      const active = transformedPatients.filter(
        (p) => p.status === "active",
      ).length;
      const inactive = transformedPatients.filter(
        (p) => p.status === "inactive",
      ).length;
      const pending = transformedPatients.filter(
        (p) => p.status === "pending",
      ).length;
      const male = transformedPatients.filter(
        (p) => p.gender === "male",
      ).length;
      const female = transformedPatients.filter(
        (p) => p.gender === "female",
      ).length;
      const totalAge = transformedPatients.reduce(
        (sum, p) => sum + (p.age || 0),
        0,
      );
      const avgAge = transformedPatients.length
        ? Math.round(totalAge / transformedPatients.length)
        : 0;

      // Count new patients this month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const newThisMonth = transformedPatients.filter(
        (p) => p.createdAt && new Date(p.createdAt) >= firstDayOfMonth,
      ).length;

      setStats({
        total: transformedPatients.length,
        active,
        inactive,
        pending,
        newThisMonth,
        male,
        female,
        avgAge,
      });
    } catch (err) {
      console.error("Error fetching patients:", err);
      toast.error("Failed to load patients");
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
        "http://localhost:5000/api/admin/patients/stats",
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setStats((prev) => ({
          ...prev,
          ...response.data.data,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch patient stats:", error);
    }
  };

  const fetchPatientDetails = async (patientId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/admin/patients/${patientId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSelectedPatient(response.data.patient);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Failed to fetch patient details:", error);
      toast.error("Failed to load patient details");
    }
  };

  const handleStatusChange = async (patientId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/admin/patients/${patientId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Update local state
      setPatients((prev) =>
        prev.map((p) =>
          p._id === patientId ? { ...p, status: newStatus } : p,
        ),
      );
      setFilteredPatients((prev) =>
        prev.map((p) =>
          p._id === patientId ? { ...p, status: newStatus } : p,
        ),
      );

      // Update stats
      setStats((prev) => {
        const oldStatus = patients.find((p) => p._id === patientId)?.status;
        return {
          ...prev,
          active:
            newStatus === "active"
              ? prev.active + 1
              : prev.active - (oldStatus === "active" ? 1 : 0),
          inactive:
            newStatus === "inactive"
              ? prev.inactive + 1
              : prev.inactive - (oldStatus === "inactive" ? 1 : 0),
          pending:
            newStatus === "pending"
              ? prev.pending + 1
              : prev.pending - (oldStatus === "pending" ? 1 : 0),
        };
      });

      // Update selected patient if modal is open
      if (selectedPatient && selectedPatient._id === patientId) {
        setSelectedPatient({ ...selectedPatient, status: newStatus });
      }

      toast.success(`Patient status updated to ${newStatus}`);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleDeletePatient = async (patientId) => {
    if (!window.confirm("Are you sure you want to delete this patient?"))
      return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/admin/patients/${patientId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setPatients((prev) => prev.filter((p) => p._id !== patientId));
      setFilteredPatients((prev) => prev.filter((p) => p._id !== patientId));
      toast.success("Patient deleted successfully");
    } catch (error) {
      console.error("Failed to delete patient:", error);
      toast.error("Failed to delete patient");
    }
  };

  // Get unique values for filters
  const bloodGroups = [
    "all",
    ...new Set(patients.map((p) => p.bloodGroup).filter(Boolean)),
  ];
  const ageGroups = [
    "all",
    "Child",
    "Young Adult",
    "Adult",
    "Senior",
    "Elderly",
  ];
  const statuses = ["all", "active", "inactive", "pending"];

  // Filter patients
  useEffect(() => {
    let filtered = [...patients];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.fullName?.toLowerCase().includes(q) ||
          p.patientId?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.phone?.includes(q) ||
          p.address?.city?.toLowerCase().includes(q),
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((p) => p.status === selectedStatus);
    }

    if (selectedGender !== "all") {
      filtered = filtered.filter((p) => p.gender === selectedGender);
    }

    if (selectedBloodGroup !== "all") {
      filtered = filtered.filter((p) => p.bloodGroup === selectedBloodGroup);
    }

    if (selectedAgeGroup !== "all") {
      filtered = filtered.filter((p) => p.ageGroup === selectedAgeGroup);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy] || "";
      let bVal = b[sortBy] || "";

      if (sortBy === "fullName") {
        aVal = a.fullName || "";
        bVal = b.fullName || "";
      }
      if (sortBy === "age") {
        aVal = a.age || 0;
        bVal = b.age || 0;
      }
      if (sortBy === "lastVisit") {
        aVal = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
        bVal = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredPatients(filtered);
    setCurrentPage(1);
  }, [
    patients,
    searchTerm,
    selectedStatus,
    selectedGender,
    selectedBloodGroup,
    selectedAgeGroup,
    sortBy,
    sortOrder,
  ]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPatients.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedGender("all");
    setSelectedBloodGroup("all");
    setSelectedAgeGroup("all");
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

  // Export patients data
  const handleExport = () => {
    const csvContent = [
      [
        "Patient ID",
        "Name",
        "Age",
        "Gender",
        "Blood Group",
        "Email",
        "Phone",
        "Status",
        "Last Visit",
      ],
      ...filteredPatients.map((p) => [
        p.patientId,
        p.fullName,
        p.age || "N/A",
        p.gender || "N/A",
        p.bloodGroup || "N/A",
        p.email,
        p.phone,
        p.status,
        p.lastVisitFormatted,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `patients_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Patients data exported successfully");
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
            Loading patients...
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
            <p className="text-sm font-medium text-gray-500">Total Patients</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.total}
            </p>
            <p className="text-xs text-green-600 mt-1">
              <span className="font-semibold">{stats.active}</span> Active •{" "}
              <span className="font-semibold">{stats.inactive}</span> Inactive
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
            <p className="text-sm font-medium text-gray-500">New This Month</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.newThisMonth}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              +{stats.newThisMonth} new patients
            </p>
          </div>
          <div className="bg-green-100 p-3 rounded-2xl">
            <HiOutlineUser className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Gender Distribution
            </p>
            <div className="flex items-center mt-2">
              <p className="text-2xl font-bold text-gray-900 mr-3">
                {stats.male}M
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.female}F
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Avg. Age: {stats.avgAge} years
            </p>
          </div>
          <div className="bg-purple-100 p-3 rounded-2xl">
            <HiOutlineUsers className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Pending Actions</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.pending}
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Awaiting verification
            </p>
          </div>
          <div className="bg-yellow-100 p-3 rounded-2xl">
            <HiOutlineClock className="w-6 h-6 text-yellow-600" />
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
              placeholder="Search patients by name, ID, email, phone, or city..."
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
                selectedGender !== "all" ||
                selectedBloodGroup !== "all" ||
                selectedAgeGroup !== "all") && (
                <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {
                    [
                      selectedStatus,
                      selectedGender,
                      selectedBloodGroup,
                      selectedAgeGroup,
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

            <button
              onClick={handleExport}
              className="px-4 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 border border-gray-300"
            >
              <HiOutlineDownload className="w-5 h-5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2 shadow-lg">
              <HiOutlinePlus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Patient</span>
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                Gender
              </label>
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50"
              >
                <option value="all">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                Blood Group
              </label>
              <select
                value={selectedBloodGroup}
                onChange={(e) => setSelectedBloodGroup(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50"
              >
                {bloodGroups.map((group) => (
                  <option key={group} value={group}>
                    {group === "all" ? "All Blood Groups" : group}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                Age Group
              </label>
              <select
                value={selectedAgeGroup}
                onChange={(e) => setSelectedAgeGroup(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50"
              >
                {ageGroups.map((group) => (
                  <option key={group} value={group}>
                    {group === "all" ? "All Ages" : group}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2"
              >
                <HiOutlineRefresh className="w-4 h-4" />
                Clear All Filters
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
              {Math.min(indexOfLastItem, filteredPatients.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900">
              {filteredPatients.length}
            </span>{" "}
            patients
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
            onClick={() => handleSort("age")}
            className={`flex items-center gap-1 hover:text-blue-600 transition-colors ${
              sortBy === "age" ? "text-blue-600 font-semibold" : "text-gray-600"
            }`}
          >
            Age {sortBy === "age" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
          <button
            onClick={() => handleSort("lastVisit")}
            className={`flex items-center gap-1 hover:text-blue-600 transition-colors ${
              sortBy === "lastVisit"
                ? "text-blue-600 font-semibold"
                : "text-gray-600"
            }`}
          >
            Last Visit{" "}
            {sortBy === "lastVisit" && (sortOrder === "asc" ? "↑" : "↓")}
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
      {currentItems.map((patient) => (
        <div
          key={patient._id}
          onClick={() => fetchPatientDetails(patient._id)}
          className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 overflow-hidden cursor-pointer"
        >
          {/* Header with Gradient */}
          <div className="relative h-32 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-5">
            <div className="absolute top-4 right-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                  patient.status === "active"
                    ? "bg-green-500"
                    : patient.status === "inactive"
                      ? "bg-gray-500"
                      : "bg-yellow-500"
                }`}
              >
                {patient.status?.charAt(0).toUpperCase() +
                  patient.status?.slice(1)}
              </span>
            </div>

            {/* Avatar */}
            <div className="absolute -bottom-12 left-5">
              <div
                className={`
                w-24 h-24 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center text-white text-3xl font-bold
                ${
                  patient.status === "active"
                    ? "bg-gradient-to-br from-green-500 to-green-600"
                    : patient.status === "inactive"
                      ? "bg-gradient-to-br from-gray-500 to-gray-600"
                      : "bg-gradient-to-br from-yellow-500 to-yellow-600"
                }
              `}
              >
                {patient.initials}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="pt-16 p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {patient.fullName}
                </h3>
                <p className="text-sm text-gray-600">
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {patient.patientId}
                  </span>
                </p>
              </div>

              {/* Risk Level Badge */}
              <div
                className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                  patient.riskLevel === "High"
                    ? "bg-red-100 text-red-700"
                    : patient.riskLevel === "Medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                }`}
              >
                {patient.riskLevel} Risk
              </div>
            </div>

            {/* Patient Info Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <HiOutlineHeart className="w-4 h-4 mr-2 text-gray-400" />
                <span>{patient.bloodGroup || "Unknown"}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <HiOutlineUser className="w-4 h-4 mr-2 text-gray-400" />
                <span>
                  {patient.age || "?"} yrs •{" "}
                  {patient.gender?.charAt(0).toUpperCase() || "?"}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <HiOutlineCalendar className="w-4 h-4 mr-2 text-gray-400" />
                <span>{patient.lastVisitFormatted}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <HiOutlineBeaker className="w-4 h-4 mr-2 text-gray-400" />
                <span>{patient.bmiCategory}</span>
              </div>
            </div>

            {/* Contact Preview */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-xs text-gray-500">
                <HiOutlineMail className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{patient.email}</span>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <HiOutlinePhone className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{patient.phone}</span>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <HiOutlineLocationMarker className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">
                  {patient.address?.city || "No city"}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fetchPatientDetails(patient._id);
                }}
                className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all flex items-center justify-center gap-2 text-sm font-medium"
              >
                <HiOutlineEye className="w-4 h-4" />
                View
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(
                    patient._id,
                    patient.status === "active" ? "inactive" : "active",
                  );
                }}
                className="flex-1 px-3 py-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2 text-sm font-medium"
              >
                <HiOutlinePencil className="w-4 h-4" />
                {patient.status === "active" ? "Deactivate" : "Activate"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePatient(patient._id);
                }}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
              >
                <HiOutlineTrash className="w-4 h-4" />
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
                Patient
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Medical Info
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Visit
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk
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
            {currentItems.map((patient) => (
              <tr
                key={patient._id}
                onClick={() => fetchPatientDetails(patient._id)}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div
                      className={`
                      w-10 h-10 rounded-lg flex items-center justify-center font-bold
                      ${
                        patient.status === "active"
                          ? "bg-green-100 text-green-700"
                          : patient.status === "inactive"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-yellow-100 text-yellow-700"
                      }
                    `}
                    >
                      {patient.initials}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {patient.fullName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {patient.patientId}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{patient.email}</div>
                  <div className="text-sm text-gray-500">{patient.phone}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {patient.address?.city || "N/A"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    Age: {patient.age || "N/A"}
                  </div>
                  <div className="text-sm text-gray-900">
                    Blood: {patient.bloodGroup || "Unknown"}
                  </div>
                  <div className="text-xs text-gray-500">{patient.gender}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {patient.lastVisitFormatted}
                  </div>
                  <div className="text-xs text-gray-500">
                    Next: {patient.nextAppointmentFormatted}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      patient.riskLevel === "High"
                        ? "bg-red-100 text-red-800"
                        : patient.riskLevel === "Medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {patient.riskLevel}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    {patient.chronicConditions?.length || 0} conditions
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={patient.status}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleStatusChange(patient._id, e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-semibold border-0 cursor-pointer
                      ${
                        patient.status === "active"
                          ? "bg-green-100 text-green-700"
                          : patient.status === "inactive"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-yellow-100 text-yellow-700"
                      }
                    `}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchPatientDetails(patient._id);
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
                        handleDeletePatient(patient._id);
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
  // PATIENT DETAILS MODAL
  // ============================================
  const PatientDetailsModal = () => {
    if (!showDetailsModal || !selectedPatient) return null;

    const formatDate = (date) => {
      if (!date) return "Not recorded";
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center">
                <div
                  className={`
                  w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold
                  ${
                    selectedPatient.status === "active"
                      ? "bg-gradient-to-br from-green-500 to-green-600"
                      : selectedPatient.status === "inactive"
                        ? "bg-gradient-to-br from-gray-500 to-gray-600"
                        : "bg-gradient-to-br from-yellow-500 to-yellow-600"
                  }
                `}
                >
                  {selectedPatient.fullName?.charAt(0) || "P"}
                </div>
                <div className="ml-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {selectedPatient.fullName}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedPatient.status === "active"
                          ? "bg-green-100 text-green-700"
                          : selectedPatient.status === "inactive"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {selectedPatient.status?.charAt(0).toUpperCase() +
                        selectedPatient.status?.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">
                    Patient ID: {selectedPatient.patientId}
                  </p>
                  <p className="text-sm text-gray-500">
                    Member since {formatDate(selectedPatient.createdAt)}
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="text-sm text-blue-600 font-medium">Age</p>
                <p className="text-2xl font-bold text-blue-900">
                  {selectedPatient.age || "N/A"}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {selectedPatient.ageGroup}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl">
                <p className="text-sm text-green-600 font-medium">
                  Blood Group
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {selectedPatient.bloodGroup || "Unknown"}
                </p>
                <p className="text-xs text-green-700 mt-1">Rh Factor</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl">
                <p className="text-sm text-purple-600 font-medium">BMI</p>
                <p className="text-2xl font-bold text-purple-900">
                  {selectedPatient.bmi || "N/A"}
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  {selectedPatient.bmiCategory}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl">
                <p className="text-sm text-orange-600 font-medium">
                  Risk Level
                </p>
                <p
                  className={`text-2xl font-bold ${
                    selectedPatient.riskLevel === "High"
                      ? "text-red-600"
                      : selectedPatient.riskLevel === "Medium"
                        ? "text-yellow-600"
                        : "text-green-600"
                  }`}
                >
                  {selectedPatient.riskLevel}
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  Based on conditions
                </p>
              </div>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-5 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <HiOutlineUser className="w-5 h-5 mr-2 text-gray-600" />
                  Personal Information
                </h4>
                <div className="space-y-3">
                  <div className="flex">
                    <span className="text-sm text-gray-600 w-24">
                      Full Name:
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedPatient.fullName}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-sm text-gray-600 w-24">
                      Date of Birth:
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(selectedPatient.dateOfBirth)}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-sm text-gray-600 w-24">Gender:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedPatient.gender?.charAt(0).toUpperCase() +
                        selectedPatient.gender?.slice(1) || "Unknown"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-sm text-gray-600 w-24">
                      Blood Group:
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedPatient.bloodGroup || "Unknown"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-5 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <HiOutlineLocationMarker className="w-5 h-5 mr-2 text-gray-600" />
                  Contact Information
                </h4>
                <div className="space-y-3">
                  <div className="flex">
                    <span className="text-sm text-gray-600 w-24">Email:</span>
                    <span className="text-sm font-medium text-gray-900 break-all">
                      {selectedPatient.email}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-sm text-gray-600 w-24">Phone:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedPatient.phone}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-sm text-gray-600 w-24">Address:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedPatient.fullAddress}
                    </span>
                  </div>
                  {selectedPatient.emergencyContact && (
                    <>
                      <div className="flex">
                        <span className="text-sm text-gray-600 w-24">
                          Emergency:
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedPatient.emergencyContact.name}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="text-sm text-gray-600 w-24">
                          Relationship:
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedPatient.emergencyContact.relationship}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="text-sm text-gray-600 w-24">
                          Emergency Phone:
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedPatient.emergencyContact.phone}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-5 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <HiOutlineHeart className="w-5 h-5 mr-2 text-gray-600" />
                  Medical History
                </h4>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Chronic Conditions
                  </p>
                  {selectedPatient.chronicConditions?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedPatient.chronicConditions.map(
                        (condition, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-2 rounded-lg border border-gray-200"
                          >
                            <p className="text-sm font-medium text-gray-900">
                              {condition.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Diagnosed: {formatDate(condition.diagnosedDate)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Status: {condition.status}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No chronic conditions recorded
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Allergies
                  </p>
                  {selectedPatient.allergies?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedPatient.allergies.map((allergy, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs"
                        >
                          {allergy.name} ({allergy.severity})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No known allergies</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-5 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <HiOutlineCalendar className="w-5 h-5 mr-2 text-gray-600" />
                  Appointments & Insurance
                </h4>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Recent Activity
                    </p>
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">Last Visit:</span>{" "}
                        {selectedPatient.lastVisitFormatted}
                      </p>
                      <p className="text-sm text-gray-900 mt-1">
                        <span className="font-medium">Next Appointment:</span>{" "}
                        {selectedPatient.nextAppointmentFormatted}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Insurance Information
                    </p>
                    {selectedPatient.insurance ? (
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">Provider:</span>{" "}
                          {selectedPatient.insurance.provider}
                        </p>
                        <p className="text-sm text-gray-900 mt-1">
                          <span className="font-medium">Policy:</span>{" "}
                          {selectedPatient.insurance.policyNumber}
                        </p>
                        <p className="text-sm text-gray-900 mt-1">
                          <span className="font-medium">Expires:</span>{" "}
                          {formatDate(selectedPatient.insurance.expiryDate)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No insurance information
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Primary Doctor
                    </p>
                    {selectedPatient.primaryDoctor ? (
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-900">
                          {selectedPatient.primaryDoctor.fullName ||
                            "Dr. Smith"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {selectedPatient.primaryDoctor.specialization ||
                            "Cardiology"}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No primary doctor assigned
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Status Update */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Update Patient Status
                  </h4>
                  <p className="text-sm text-gray-500">
                    Change the current status of this patient
                  </p>
                </div>
                <select
                  value={selectedPatient.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    await handleStatusChange(selectedPatient._id, newStatus);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            {selectedPatient.notes && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <p className="text-sm font-medium text-yellow-800 mb-1">
                  Notes
                </p>
                <p className="text-sm text-yellow-700">
                  {selectedPatient.notes}
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
              Patients Management
            </h1>
            <p className="text-gray-600 mt-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
              Manage patient records, medical history, and appointments
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
              <span>Add Patient</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Search & Filters */}
        <SearchAndFilters />

        {/* Main Content */}
        {filteredPatients.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-16 text-center">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <HiOutlineUserGroup className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">
              No patients found
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ||
              selectedStatus !== "all" ||
              selectedGender !== "all" ||
              selectedBloodGroup !== "all" ||
              selectedAgeGroup !== "all"
                ? "Try adjusting your search or filters"
                : "Start by adding your first patient"}
            </p>
            {searchTerm ||
            selectedStatus !== "all" ||
            selectedGender !== "all" ||
            selectedBloodGroup !== "all" ||
            selectedAgeGroup !== "all" ? (
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
                Add Patient
              </button>
            )}
          </div>
        ) : (
          <>
            {viewMode === "grid" ? <GridView /> : <TableView />}
            <Pagination />
          </>
        )}

        {/* Patient Details Modal */}
        <PatientDetailsModal />
      </div>
    </div>
  );
};

export default Patients;
