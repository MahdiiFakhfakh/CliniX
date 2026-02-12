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
  HiOutlineDocumentDuplicate,
  HiOutlineDocumentText,
  HiOutlineBeaker,
  HiOutlinePrinter,
  HiOutlineRefresh as HiOutlineRefreshicon,
} from "react-icons/hi";
import { format } from "date-fns";

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDoctor, setSelectedDoctor] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    expired: 0,
    cancelled: 0,
  });
  const [doctors, setDoctors] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchPrescriptions();
    fetchDoctors();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get(
        "http://localhost:5000/api/admin/prescriptions",
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Transform data for better display
      const transformedPrescriptions = (response.data.prescriptions || []).map(
        (rx) => ({
          ...rx,
          prescriptionId: rx.prescriptionId || `RX${rx._id.slice(-6)}`,
          patientName:
            rx.patient?.fullName ||
            `${rx.patient?.firstName || ""} ${rx.patient?.lastName || ""}`.trim() ||
            "Unknown Patient",
          patientId: rx.patient?.patientId || "N/A",
          doctorName:
            rx.doctor?.fullName ||
            `Dr. ${rx.doctor?.firstName || ""} ${rx.doctor?.lastName || ""}`.trim() ||
            "Unknown Doctor",
          doctorSpecialization: rx.doctor?.specialization || "General",
          dateFormatted: rx.date
            ? format(new Date(rx.date), "MMM dd, yyyy")
            : "Unknown",
          timeFormatted: rx.date ? format(new Date(rx.date), "hh:mm a") : "",
          medicationCount: rx.medications?.length || 0,
          totalRefills:
            rx.medications?.reduce((sum, med) => sum + (med.refills || 0), 0) ||
            0,
          statusColor:
            rx.status === "active"
              ? "green"
              : rx.status === "completed"
                ? "blue"
                : rx.status === "expired"
                  ? "yellow"
                  : rx.status === "cancelled"
                    ? "red"
                    : "gray",
          statusText:
            rx.status === "active"
              ? "Active"
              : rx.status === "completed"
                ? "Completed"
                : rx.status === "expired"
                  ? "Expired"
                  : rx.status === "cancelled"
                    ? "Cancelled"
                    : rx.status,
          isExpiringSoon:
            rx.status === "active" &&
            rx.followUpDate &&
            new Date(rx.followUpDate) - new Date() < 7 * 24 * 60 * 60 * 1000,
        }),
      );

      setPrescriptions(transformedPrescriptions);
      setFilteredPrescriptions(transformedPrescriptions);

      // Update stats
      const active = transformedPrescriptions.filter(
        (rx) => rx.status === "active",
      ).length;
      const completed = transformedPrescriptions.filter(
        (rx) => rx.status === "completed",
      ).length;
      const expired = transformedPrescriptions.filter(
        (rx) => rx.status === "expired",
      ).length;
      const cancelled = transformedPrescriptions.filter(
        (rx) => rx.status === "cancelled",
      ).length;

      setStats({
        total: transformedPrescriptions.length,
        active,
        completed,
        expired,
        cancelled,
      });
    } catch (err) {
      console.error("Error fetching prescriptions:", err);
      toast.error("Failed to load prescriptions");
      if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/admin/doctors",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setDoctors(response.data.doctors || []);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
    }
  };

  const fetchPrescriptionDetails = async (prescriptionId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/admin/prescriptions/${prescriptionId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSelectedPrescription(response.data.prescription);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Failed to fetch prescription details:", error);
      toast.error("Failed to load prescription details");
    }
  };

  const handleStatusChange = async (prescriptionId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/admin/prescriptions/${prescriptionId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Update local state
      setPrescriptions((prev) =>
        prev.map((rx) =>
          rx._id === prescriptionId
            ? {
                ...rx,
                status: newStatus,
                statusText: getStatusText(newStatus),
                statusColor: getStatusColor(newStatus),
              }
            : rx,
        ),
      );
      setFilteredPrescriptions((prev) =>
        prev.map((rx) =>
          rx._id === prescriptionId
            ? {
                ...rx,
                status: newStatus,
                statusText: getStatusText(newStatus),
                statusColor: getStatusColor(newStatus),
              }
            : rx,
        ),
      );

      // Update stats
      setStats((prev) => {
        const oldRx = prescriptions.find((rx) => rx._id === prescriptionId);
        const oldStatus = oldRx?.status;

        return {
          ...prev,
          active:
            newStatus === "active"
              ? prev.active + 1
              : prev.active - (oldStatus === "active" ? 1 : 0),
          completed:
            newStatus === "completed"
              ? prev.completed + 1
              : prev.completed - (oldStatus === "completed" ? 1 : 0),
          expired:
            newStatus === "expired"
              ? prev.expired + 1
              : prev.expired - (oldStatus === "expired" ? 1 : 0),
          cancelled:
            newStatus === "cancelled"
              ? prev.cancelled + 1
              : prev.cancelled - (oldStatus === "cancelled" ? 1 : 0),
        };
      });

      // Update selected prescription if modal is open
      if (selectedPrescription && selectedPrescription._id === prescriptionId) {
        setSelectedPrescription({ ...selectedPrescription, status: newStatus });
      }

      toast.success(`Prescription ${getStatusText(newStatus)}`);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update prescription status");
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      active: "Active",
      completed: "Completed",
      expired: "Expired",
      cancelled: "Cancelled",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      active: "green",
      completed: "blue",
      expired: "yellow",
      cancelled: "red",
    };
    return colorMap[status] || "gray";
  };

  const handleDeletePrescription = async (prescriptionId) => {
    if (!window.confirm("Are you sure you want to delete this prescription?"))
      return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/admin/prescriptions/${prescriptionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setPrescriptions((prev) =>
        prev.filter((rx) => rx._id !== prescriptionId),
      );
      setFilteredPrescriptions((prev) =>
        prev.filter((rx) => rx._id !== prescriptionId),
      );
      toast.success("Prescription deleted successfully");
    } catch (error) {
      console.error("Failed to delete prescription:", error);
      toast.error("Failed to delete prescription");
    }
  };

  const handlePrintPrescription = (prescription) => {
    // Create a printable window
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print prescriptions");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription - ${prescription.prescriptionId}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .clinic-name { font-size: 24px; font-weight: bold; color: #2563eb; }
            .prescription-id { color: #6b7280; margin-top: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-section { border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; }
            .info-title { font-weight: bold; margin-bottom: 10px; color: #374151; }
            .medication-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .medication-table th { background: #f3f4f6; padding: 10px; text-align: left; }
            .medication-table td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
            .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="clinic-name">CliniX Health Management System</div>
            <div class="prescription-id">Prescription #${prescription.prescriptionId}</div>
            <div style="margin-top: 10px;">Date: ${new Date(prescription.date).toLocaleDateString()}</div>
          </div>
          
          <div class="info-grid">
            <div class="info-section">
              <div class="info-title">Patient Information</div>
              <div><strong>Name:</strong> ${prescription.patientName}</div>
              <div><strong>ID:</strong> ${prescription.patientId}</div>
            </div>
            <div class="info-section">
              <div class="info-title">Doctor Information</div>
              <div><strong>Name:</strong> ${prescription.doctorName}</div>
              <div><strong>Specialization:</strong> ${prescription.doctorSpecialization}</div>
            </div>
          </div>

          <h3 style="margin-bottom: 15px;">Prescribed Medications</h3>
          <table class="medication-table">
            <thead>
              <tr>
                <th>Medication</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Duration</th>
                <th>Instructions</th>
                <th>Refills</th>
              </tr>
            </thead>
            <tbody>
              ${prescription.medications
                ?.map(
                  (med) => `
                <tr>
                  <td><strong>${med.name}</strong></td>
                  <td>${med.dosage}</td>
                  <td>${med.frequency}</td>
                  <td>${med.duration || "N/A"}</td>
                  <td>${med.instructions || "Take as directed"}</td>
                  <td>${med.refills || 0}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>

          ${
            prescription.instructions
              ? `
            <div style="margin-top: 30px; padding: 15px; background: #f9fafb; border-radius: 8px;">
              <strong>Instructions:</strong> ${prescription.instructions}
            </div>
          `
              : ""
          }

          ${
            prescription.notes
              ? `
            <div style="margin-top: 15px; padding: 15px; background: #fef3c7; border-radius: 8px;">
              <strong>Notes:</strong> ${prescription.notes}
            </div>
          `
              : ""
          }

          <div class="footer">
            <p>This is a computer generated prescription. No signature required.</p>
            <p>© ${new Date().getFullYear()} CliniX Health Management System</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Get unique values for filters
  const statuses = ["all", "active", "completed", "expired", "cancelled"];
  const doctorOptions = ["all", ...doctors.map((d) => d._id)];

  // Filter prescriptions
  useEffect(() => {
    let filtered = [...prescriptions];

    // Search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (rx) =>
          (rx.patientName?.toLowerCase() || "").includes(q) ||
          (rx.doctorName?.toLowerCase() || "").includes(q) ||
          (rx.prescriptionId?.toLowerCase() || "").includes(q) ||
          (rx.patientId?.toLowerCase() || "").includes(q),
      );
    }

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter((rx) => rx.status === selectedStatus);
    }

    // Doctor filter
    if (selectedDoctor !== "all") {
      filtered = filtered.filter((rx) => rx.doctor?._id === selectedDoctor);
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
      } else if (sortBy === "medications") {
        aVal = a.medicationCount || 0;
        bVal = b.medicationCount || 0;
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

    setFilteredPrescriptions(filtered);
    setCurrentPage(1);
  }, [
    prescriptions,
    searchTerm,
    selectedStatus,
    selectedDoctor,
    sortBy,
    sortOrder,
  ]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPrescriptions.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredPrescriptions.length / itemsPerPage);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedDoctor("all");
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
        "Prescription ID",
        "Patient",
        "Doctor",
        "Date",
        "Medications",
        "Status",
        "Refills",
        "Follow-up",
      ],
      ...filteredPrescriptions.map((rx) => [
        rx.prescriptionId,
        rx.patientName,
        rx.doctorName,
        rx.dateFormatted,
        rx.medicationCount,
        rx.status,
        rx.totalRefills,
        rx.followUpDate
          ? format(new Date(rx.followUpDate), "MMM dd, yyyy")
          : "N/A",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prescriptions_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Prescriptions data exported successfully");
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <HiOutlineDocumentText className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-lg text-gray-600 animate-pulse">
            Loading prescriptions...
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
              Total Prescriptions
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.total}
            </p>
            <p className="text-xs text-blue-600 mt-1">All time prescriptions</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-2xl">
            <HiOutlineDocumentText className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Active</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.active}
            </p>
            <p className="text-xs text-green-600 mt-1">
              Currently valid prescriptions
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
            <p className="text-sm font-medium text-gray-500">
              Expired / Completed
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.expired + stats.completed}
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              {stats.expired} expired, {stats.completed} completed
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
            <p className="text-sm font-medium text-gray-500">Cancelled</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.cancelled}
            </p>
            <p className="text-xs text-red-600 mt-1">Voided prescriptions</p>
          </div>
          <div className="bg-red-100 p-3 rounded-2xl">
            <HiOutlineXCircle className="w-6 h-6 text-red-600" />
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
              placeholder="Search prescriptions by patient, doctor, or ID..."
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
              {(selectedStatus !== "all" || selectedDoctor !== "all") && (
                <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {
                    [selectedStatus, selectedDoctor].filter((s) => s !== "all")
                      .length
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
                  <HiOutlineDocumentText className="w-5 h-5" />
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
              <span className="hidden sm:inline">New Prescription</span>
            </button>
          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 animate-slideDown">
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
                <option value="completed">Completed</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                Prescribing Doctor
              </label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50"
              >
                <option value="all">All Doctors</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.fullName ||
                      `Dr. ${doctor.firstName} ${doctor.lastName}`}
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
              {Math.min(indexOfLastItem, filteredPrescriptions.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900">
              {filteredPrescriptions.length}
            </span>{" "}
            prescriptions
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
            onClick={() => handleSort("medications")}
            className={`flex items-center gap-1 hover:text-blue-600 transition-colors ${
              sortBy === "medications"
                ? "text-blue-600 font-semibold"
                : "text-gray-600"
            }`}
          >
            Medications{" "}
            {sortBy === "medications" && (sortOrder === "asc" ? "↑" : "↓")}
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
      {currentItems.map((prescription) => (
        <div
          key={prescription._id}
          onClick={() => fetchPrescriptionDetails(prescription._id)}
          className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 overflow-hidden cursor-pointer"
        >
          {/* Header with Gradient */}
          <div className="relative h-24 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-5">
            <div className="absolute top-4 right-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                  prescription.status === "active"
                    ? "bg-green-500"
                    : prescription.status === "completed"
                      ? "bg-blue-500"
                      : prescription.status === "expired"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                }`}
              >
                {prescription.statusText}
              </span>
            </div>

            {/* Prescription Icon */}
            <div className="absolute -bottom-12 left-5">
              <div className="w-20 h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center">
                <HiOutlineDocumentText className="w-10 h-10 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="pt-16 p-5">
            <div className="mb-3">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {prescription.prescriptionId}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {prescription.dateFormatted}
              </p>
            </div>

            {/* Patient & Doctor Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-start">
                <HiOutlineUser className="w-4 h-4 mt-0.5 mr-2 text-gray-400 flex-shrink-0" />
                <div className="text-sm">
                  <span className="font-medium text-gray-900">
                    {prescription.patientName}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    #{prescription.patientId}
                  </span>
                </div>
              </div>
              <div className="flex items-start">
                <HiOutlineUserGroup className="w-4 h-4 mt-0.5 mr-2 text-gray-400 flex-shrink-0" />
                <div className="text-sm">
                  <span className="font-medium text-gray-900">
                    {prescription.doctorName}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {prescription.doctorSpecialization}
                  </span>
                </div>
              </div>
            </div>

            {/* Medications Summary */}
            <div className="bg-blue-50 p-3 rounded-xl mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <HiOutlineBeaker className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-700">
                    {prescription.medicationCount}{" "}
                    {prescription.medicationCount === 1
                      ? "Medication"
                      : "Medications"}
                  </span>
                </div>
                {prescription.totalRefills > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {prescription.totalRefills} refills
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fetchPrescriptionDetails(prescription._id);
                }}
                className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all flex items-center justify-center gap-2 text-sm font-medium"
              >
                <HiOutlineEye className="w-4 h-4" />
                View
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrintPrescription(prescription);
                }}
                className="flex-1 px-3 py-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2 text-sm font-medium"
              >
                <HiOutlinePrinter className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePrescription(prescription._id);
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
                Prescription ID
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Doctor
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Medications
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
            {currentItems.map((prescription) => (
              <tr
                key={prescription._id}
                onClick={() => fetchPrescriptionDetails(prescription._id)}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {prescription.prescriptionId}
                  </div>
                  {prescription.isExpiringSoon && (
                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Expiring soon
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {prescription.patientName?.charAt(0) || "P"}
                      </span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {prescription.patientName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {prescription.patientId}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {prescription.doctorName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {prescription.doctorSpecialization}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {prescription.dateFormatted}
                  </div>
                  <div className="text-xs text-gray-500">
                    {prescription.timeFormatted}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {prescription.medicationCount} medications
                  </div>
                  <div className="text-xs text-gray-500">
                    {prescription.totalRefills} refills
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={prescription.status}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleStatusChange(prescription._id, e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-semibold border-0 cursor-pointer
                      ${
                        prescription.status === "active"
                          ? "bg-green-100 text-green-700"
                          : prescription.status === "completed"
                            ? "bg-blue-100 text-blue-700"
                            : prescription.status === "expired"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                      }
                    `}
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchPrescriptionDetails(prescription._id);
                      }}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      <HiOutlineEye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrintPrescription(prescription);
                      }}
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <HiOutlinePrinter className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePrescription(prescription._id);
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
  // PRESCRIPTION DETAILS MODAL
  // ============================================
  const PrescriptionDetailsModal = () => {
    if (!showDetailsModal || !selectedPrescription) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Prescription {selectedPrescription.prescriptionId}
                  </h3>
                  <span
                    className={`
                    px-3 py-1 rounded-full text-xs font-semibold
                    ${
                      selectedPrescription.status === "active"
                        ? "bg-green-100 text-green-700"
                        : selectedPrescription.status === "completed"
                          ? "bg-blue-100 text-blue-700"
                          : selectedPrescription.status === "expired"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                    }
                  `}
                  >
                    {selectedPrescription.statusText}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">
                  Prescribed on {selectedPrescription.dateFormatted}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintPrescription(selectedPrescription)}
                  className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <HiOutlinePrinter className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Patient & Doctor Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-blue-50 p-5 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <HiOutlineUser className="w-5 h-5 mr-2 text-blue-600" />
                  Patient Information
                </h4>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <span className="font-medium">Name:</span>{" "}
                    {selectedPrescription.patient?.fullName ||
                      selectedPrescription.patientName}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Patient ID:</span>{" "}
                    {selectedPrescription.patient?.patientId ||
                      selectedPrescription.patientId}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Email:</span>{" "}
                    {selectedPrescription.patient?.email || "N/A"}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Phone:</span>{" "}
                    {selectedPrescription.patient?.phone || "N/A"}
                  </p>
                </div>
              </div>

              <div className="bg-green-50 p-5 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <HiOutlineUserGroup className="w-5 h-5 mr-2 text-green-600" />
                  Prescribing Doctor
                </h4>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <span className="font-medium">Name:</span>{" "}
                    {selectedPrescription.doctor?.fullName ||
                      selectedPrescription.doctorName}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Specialization:</span>{" "}
                    {selectedPrescription.doctor?.specialization ||
                      selectedPrescription.doctorSpecialization}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Email:</span>{" "}
                    {selectedPrescription.doctor?.email || "N/A"}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Phone:</span>{" "}
                    {selectedPrescription.doctor?.phone || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Medications Table */}
            <div className="bg-gray-50 p-5 rounded-xl mb-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <HiOutlineBeaker className="w-5 h-5 mr-2 text-gray-600" />
                Prescribed Medications
              </h4>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Medication
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Dosage
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Frequency
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Duration
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Instructions
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Refills
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedPrescription.medications?.map((med, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {med.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {med.dosage}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {med.frequency}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {med.duration || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {med.instructions || "Take as directed"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {med.refills || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {selectedPrescription.instructions && (
                <div className="bg-gray-50 p-5 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Instructions
                  </h4>
                  <p className="text-gray-700">
                    {selectedPrescription.instructions}
                  </p>
                </div>
              )}

              {selectedPrescription.followUpDate && (
                <div className="bg-gray-50 p-5 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Follow-up Date
                  </h4>
                  <p className="text-gray-700">
                    {format(
                      new Date(selectedPrescription.followUpDate),
                      "MMMM dd, yyyy",
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Notes */}
            {selectedPrescription.notes && (
              <div className="bg-yellow-50 p-5 rounded-xl mb-6">
                <h4 className="font-semibold text-yellow-800 mb-2">Notes</h4>
                <p className="text-yellow-700">{selectedPrescription.notes}</p>
              </div>
            )}

            {/* Pharmacy Notes */}
            {selectedPrescription.pharmacyNotes && (
              <div className="bg-blue-50 p-5 rounded-xl mb-6">
                <h4 className="font-semibold text-blue-800 mb-2">
                  Pharmacy Notes
                </h4>
                <p className="text-blue-700">
                  {selectedPrescription.pharmacyNotes}
                </p>
              </div>
            )}

            {/* Status Update */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Update Prescription Status
                  </h4>
                  <p className="text-sm text-gray-500">
                    Change the current status of this prescription
                  </p>
                </div>
                <select
                  value={selectedPrescription.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    await handleStatusChange(
                      selectedPrescription._id,
                      newStatus,
                    );
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
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
              Prescriptions Management
            </h1>
            <p className="text-gray-600 mt-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
              Manage patient medications and prescriptions
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
              <span>New Prescription</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Search & Filters */}
        <SearchAndFilters />

        {/* Main Content */}
        {filteredPrescriptions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-16 text-center">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <HiOutlineDocumentText className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">
              No prescriptions found
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ||
              selectedStatus !== "all" ||
              selectedDoctor !== "all"
                ? "Try adjusting your search or filters"
                : "Start by creating a new prescription"}
            </p>
            {searchTerm ||
            selectedStatus !== "all" ||
            selectedDoctor !== "all" ? (
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
                Create Prescription
              </button>
            )}
          </div>
        ) : (
          <>
            {viewMode === "grid" ? <GridView /> : <TableView />}
            <Pagination />
          </>
        )}

        {/* Prescription Details Modal */}
        <PrescriptionDetailsModal />
      </div>
    </div>
  );
};

export default Prescriptions;
