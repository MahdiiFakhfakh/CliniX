import React, { useState, useEffect } from "react";
import {
  HiSearch,
  HiFilter,
  HiDocument,
  HiClock,
  HiCheckCircle,
  HiXCircle,
} from "react-icons/hi";
import { toast } from "react-hot-toast";

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch prescriptions from backend
  useEffect(() => {
    const fetchPrescriptions = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/prescriptions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setPrescriptions(data); // Ensure backend returns array of prescriptions
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch prescriptions");
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  // Filter prescriptions
  const filteredPrescriptions = prescriptions.filter((rx) => {
    const matchesSearch =
      rx.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rx.doctor.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || rx.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = (prescriptionId, newStatus) => {
    setPrescriptions((prev) =>
      prev.map((rx) =>
        rx.id === prescriptionId ? { ...rx, status: newStatus } : rx,
      ),
    );
    toast.success(`Prescription status updated to ${newStatus}`);
  };

  const handleAddPrescription = () => {
    toast.success("Add prescription functionality coming soon!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading prescriptions...</div>
      </div>
    );
  }

  const statusColors = {
    active: "bg-green-100 text-green-800",
    completed: "bg-blue-100 text-blue-800",
    expired: "bg-red-100 text-red-800",
    pending: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Prescriptions
          </h1>
          <p className="text-gray-600 mt-1">
            Manage patient prescriptions and medications
          </p>
        </div>
        <button
          onClick={handleAddPrescription}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-4 sm:mt-0"
        >
          <HiDocument className="w-5 h-5 mr-2" />
          New Prescription
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
          <div className="flex-1 relative">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by patient, doctor, or prescription ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <HiFilter className="text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Prescriptions</p>
          <p className="text-2xl font-bold mt-2">{prescriptions.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Active Prescriptions</p>
          <p className="text-2xl font-bold mt-2">
            {prescriptions.filter((p) => p.status === "active").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Avg. Medications per Rx</p>
          <p className="text-2xl font-bold mt-2">
            {(
              prescriptions.reduce((sum, p) => sum + p.medications.length, 0) /
              prescriptions.length
            ).toFixed(1)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Pending Refills</p>
          <p className="text-2xl font-bold mt-2">
            {prescriptions.filter((p) => p.refills > 0).length}
          </p>
        </div>
      </div>

      {/* Prescriptions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prescription Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient & Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPrescriptions.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">
                    No prescriptions found.
                  </td>
                </tr>
              )}
              {filteredPrescriptions.map((prescription) => (
                <tr key={prescription.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        #{prescription.id}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <HiClock className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(prescription.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Pharmacy: {prescription.pharmacy}
                      </div>
                      <div className="text-sm text-gray-500">
                        Refills: {prescription.refills}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {prescription.medications.map((med, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded ${
                            index < prescription.medications.length - 1
                              ? "border-b border-gray-200"
                              : ""
                          }`}
                        >
                          <div className="text-sm font-medium text-gray-900">
                            {med.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {med.dosage} • {med.frequency} • {med.duration}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {prescription.patient.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {prescription.patient.id}
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      <span className="font-medium">Doctor:</span>{" "}
                      {prescription.doctor.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[prescription.status] ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {prescription.status.charAt(0).toUpperCase() +
                        prescription.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          toast.success(
                            `Viewing prescription ${prescription.id}`,
                          )
                        }
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      {prescription.status === "active" && (
                        <>
                          <button
                            onClick={() =>
                              handleStatusUpdate(prescription.id, "completed")
                            }
                            className="text-green-600 hover:text-green-900"
                          >
                            <HiCheckCircle className="w-5 h-5 inline mr-1" />
                            Complete
                          </button>
                          <button
                            onClick={() =>
                              handleStatusUpdate(prescription.id, "expired")
                            }
                            className="text-red-600 hover:text-red-900"
                          >
                            <HiXCircle className="w-5 h-5 inline mr-1" />
                            Expire
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Prescriptions;
