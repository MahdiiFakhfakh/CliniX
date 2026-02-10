import React, { useState, useEffect } from "react";
import {
  HiSearch,
  HiFilter,
  HiEye,
  HiPencil,
  HiTrash,
  HiUserAdd,
  HiDocumentDownload,
} from "react-icons/hi";
import { toast } from "react-hot-toast";

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock data for patients
  const mockPatients = [
    {
      id: "PAT1001",
      name: "John Doe",
      age: 45,
      gender: "Male",
      bloodGroup: "O+",
      phone: "+1 (555) 123-4567",
      email: "john.doe@example.com",
      lastVisit: "2024-03-15",
      nextAppointment: "2024-04-15",
      status: "active",
      conditions: ["Hypertension", "Type 2 Diabetes"],
    },
    {
      id: "PAT1002",
      name: "Jane Smith",
      age: 32,
      gender: "Female",
      bloodGroup: "A+",
      phone: "+1 (555) 987-6543",
      email: "jane.smith@example.com",
      lastVisit: "2024-03-10",
      nextAppointment: "2024-04-10",
      status: "active",
      conditions: ["Asthma"],
    },
    {
      id: "PAT1003",
      name: "Robert Johnson",
      age: 58,
      gender: "Male",
      bloodGroup: "B+",
      phone: "+1 (555) 456-7890",
      email: "robert.j@example.com",
      lastVisit: "2024-03-05",
      nextAppointment: "2024-03-25",
      status: "active",
      conditions: ["Arthritis", "High Cholesterol"],
    },
    {
      id: "PAT1004",
      name: "Emily Wilson",
      age: 29,
      gender: "Female",
      bloodGroup: "AB+",
      phone: "+1 (555) 234-5678",
      email: "emily.w@example.com",
      lastVisit: "2024-02-28",
      nextAppointment: "2024-03-28",
      status: "inactive",
      conditions: ["Migraine"],
    },
    {
      id: "PAT1005",
      name: "Michael Brown",
      age: 67,
      gender: "Male",
      bloodGroup: "O-",
      phone: "+1 (555) 345-6789",
      email: "michael.b@example.com",
      lastVisit: "2024-03-12",
      nextAppointment: "2024-04-12",
      status: "active",
      conditions: ["Heart Disease", "Hypertension"],
    },
    {
      id: "PAT1006",
      name: "Sarah Davis",
      age: 41,
      gender: "Female",
      bloodGroup: "A-",
      phone: "+1 (555) 567-8901",
      email: "sarah.d@example.com",
      lastVisit: "2024-02-20",
      nextAppointment: null,
      status: "pending",
      conditions: ["Anxiety"],
    },
    {
      id: "PAT1007",
      name: "David Miller",
      age: 53,
      gender: "Male",
      bloodGroup: "B-",
      phone: "+1 (555) 678-9012",
      email: "david.m@example.com",
      lastVisit: "2024-03-08",
      nextAppointment: "2024-04-08",
      status: "active",
      conditions: ["Type 1 Diabetes"],
    },
    {
      id: "PAT1008",
      name: "Lisa Taylor",
      age: 38,
      gender: "Female",
      bloodGroup: "AB-",
      phone: "+1 (555) 789-0123",
      email: "lisa.t@example.com",
      lastVisit: "2024-02-15",
      nextAppointment: "2024-03-15",
      status: "active",
      conditions: ["Hypothyroidism"],
    },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPatients(mockPatients);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || patient.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDelete = (patientId) => {
    setPatients((prev) => prev.filter((p) => p.id !== patientId));
    toast.success("Patient deleted successfully");
  };

  const handleStatusChange = (patientId, newStatus) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, status: newStatus } : p)),
    );
    toast.success("Status updated successfully");
  };

  const handleAddPatient = () => {
    toast.success("Add patient functionality coming soon!");
  };

  const handleExport = () => {
    toast.success("Exporting patient data...");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading patients...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Patients
          </h1>
          <p className="text-gray-600 mt-1">
            Manage patient records and information
          </p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <HiDocumentDownload className="w-5 h-5 mr-2" />
            Export
          </button>
          <button
            onClick={handleAddPatient}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <HiUserAdd className="w-5 h-5 mr-2" />
            Add Patient
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
          <div className="flex-1">
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search patients by name, ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <HiFilter className="text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Patients</p>
          <p className="text-2xl font-bold mt-2">{patients.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Active Patients</p>
          <p className="text-2xl font-bold mt-2">
            {patients.filter((p) => p.status === "active").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Avg. Age</p>
          <p className="text-2xl font-bold mt-2">
            {Math.round(
              patients.reduce((sum, p) => sum + p.age, 0) / patients.length,
            )}{" "}
            yrs
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Pending Appointments</p>
          <p className="text-2xl font-bold mt-2">
            {patients.filter((p) => p.nextAppointment).length}
          </p>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medical Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Visit
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
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {patient.name.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {patient.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {patient.id}
                        </div>
                        <div className="text-xs text-gray-400">
                          {patient.age} yrs • {patient.gender}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.phone}</div>
                    <div className="text-sm text-gray-500">{patient.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      Blood: {patient.bloodGroup}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {patient.conditions.join(", ")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {patient.lastVisit}
                    </div>
                    <div className="text-sm text-gray-500">
                      {patient.nextAppointment
                        ? `Next: ${patient.nextAppointment}`
                        : "No upcoming"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        patient.status === "active"
                          ? "bg-green-100 text-green-800"
                          : patient.status === "inactive"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {patient.status.charAt(0).toUpperCase() +
                        patient.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toast.success(`Viewing ${patient.name}`)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="View"
                      >
                        <HiEye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => toast.success(`Editing ${patient.name}`)}
                        className="text-green-600 hover:text-green-900 p-1"
                        title="Edit"
                      >
                        <HiPencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          handleStatusChange(
                            patient.id,
                            patient.status === "active" ? "inactive" : "active",
                          )
                        }
                        className="text-yellow-600 hover:text-yellow-900 p-1"
                        title="Toggle Status"
                      >
                        {patient.status === "active"
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDelete(patient.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete"
                      >
                        <HiTrash className="w-5 h-5" />
                      </button>
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

export default Patients;
