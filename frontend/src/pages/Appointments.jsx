import React, { useState, useEffect } from "react";
import {
  HiSearch,
  HiFilter,
  HiCalendar,
  HiClock,
  HiUser,
  HiCheckCircle,
  HiXCircle,
} from "react-icons/hi";
import { toast } from "react-hot-toast";

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  // Mock data for appointments
  const mockAppointments = [
    {
      id: "APT1001",
      patient: { name: "John Doe", id: "PAT1001" },
      doctor: { name: "Dr. Robert Smith", specialization: "Cardiology" },
      date: "2024-03-15",
      time: "10:30 AM",
      duration: "30 mins",
      type: "Consultation",
      reason: "Routine Checkup",
      status: "completed",
      notes: "Blood pressure normal",
    },
    {
      id: "APT1002",
      patient: { name: "Jane Smith", id: "PAT1002" },
      doctor: { name: "Dr. Sarah Johnson", specialization: "Pediatrics" },
      date: "2024-03-15",
      time: "11:45 AM",
      duration: "45 mins",
      type: "Follow-up",
      reason: "Vaccination",
      status: "confirmed",
      notes: "Second dose required",
    },
    {
      id: "APT1003",
      patient: { name: "Robert Johnson", id: "PAT1003" },
      doctor: { name: "Dr. Michael Wilson", specialization: "Orthopedics" },
      date: "2024-03-16",
      time: "2:15 PM",
      duration: "60 mins",
      type: "Consultation",
      reason: "Knee Pain",
      status: "scheduled",
      notes: "X-ray scheduled",
    },
    {
      id: "APT1004",
      patient: { name: "Emily Wilson", id: "PAT1004" },
      doctor: { name: "Dr. Emily Davis", specialization: "Neurology" },
      date: "2024-03-16",
      time: "3:30 PM",
      duration: "45 mins",
      type: "Follow-up",
      reason: "Migraine Treatment",
      status: "scheduled",
      notes: "Medication review",
    },
    {
      id: "APT1005",
      patient: { name: "Michael Brown", id: "PAT1005" },
      doctor: { name: "Dr. James Brown", specialization: "Dermatology" },
      date: "2024-03-17",
      time: "9:00 AM",
      duration: "30 mins",
      type: "Consultation",
      reason: "Skin Allergy",
      status: "pending",
      notes: "Allergy test needed",
    },
    {
      id: "APT1006",
      patient: { name: "Sarah Davis", id: "PAT1006" },
      doctor: { name: "Dr. Lisa Taylor", specialization: "Gynecology" },
      date: "2024-03-17",
      time: "10:30 AM",
      duration: "60 mins",
      type: "Annual Checkup",
      reason: "Annual Examination",
      status: "confirmed",
      notes: "Routine tests ordered",
    },
    {
      id: "APT1007",
      patient: { name: "David Miller", id: "PAT1007" },
      doctor: { name: "Dr. David Miller", specialization: "Psychiatry" },
      date: "2024-03-18",
      time: "11:00 AM",
      duration: "50 mins",
      type: "Therapy",
      reason: "Anxiety Treatment",
      status: "scheduled",
      notes: "Weekly session",
    },
    {
      id: "APT1008",
      patient: { name: "Lisa Taylor", id: "PAT1008" },
      doctor: { name: "Dr. Anna Clark", specialization: "Ophthalmology" },
      date: "2024-03-18",
      time: "2:00 PM",
      duration: "30 mins",
      type: "Follow-up",
      reason: "Eye Checkup",
      status: "cancelled",
      notes: "Patient rescheduled",
    },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAppointments(mockAppointments);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.patient.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      appointment.doctor.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      appointment.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || appointment.status === statusFilter;

    const matchesDate = !dateFilter || appointment.date === dateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleStatusUpdate = (appointmentId, newStatus) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId ? { ...apt, status: newStatus } : apt,
      ),
    );
    toast.success(`Appointment status updated to ${newStatus}`);
  };

  const handleAddAppointment = () => {
    toast.success("Schedule appointment functionality coming soon!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading appointments...</div>
      </div>
    );
  }

  const statusColors = {
    completed: "bg-green-100 text-green-800",
    confirmed: "bg-blue-100 text-blue-800",
    scheduled: "bg-yellow-100 text-yellow-800",
    pending: "bg-orange-100 text-orange-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Appointments
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and schedule patient appointments
          </p>
        </div>
        <button
          onClick={handleAddAppointment}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-4 sm:mt-0"
        >
          <HiCalendar className="w-5 h-5 mr-2" />
          Schedule Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by patient, doctor, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <HiFilter className="text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Appointments</p>
          <p className="text-2xl font-bold mt-2">{appointments.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Today's Appointments</p>
          <p className="text-2xl font-bold mt-2">
            {
              appointments.filter(
                (a) => a.date === new Date().toISOString().split("T")[0],
              ).length
            }
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold mt-2">
            {appointments.filter((a) => a.status === "completed").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold mt-2">
            {appointments.filter((a) => a.status === "pending").length}
          </p>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Appointment Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient & Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
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
              {filteredAppointments.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        #{appointment.id}
                      </div>
                      <div className="text-sm text-gray-500">
                        {appointment.type}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {appointment.reason}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <HiUser className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.patient.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {appointment.patient.id}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Doctor:</span>{" "}
                      {appointment.doctor.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {appointment.doctor.specialization}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <HiCalendar className="w-4 h-4 mr-2 text-gray-400" />
                      {appointment.date}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <HiClock className="w-4 h-4 mr-2 text-gray-400" />
                      {appointment.time} • {appointment.duration}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[appointment.status]}`}
                    >
                      {appointment.status.charAt(0).toUpperCase() +
                        appointment.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {appointment.status === "scheduled" && (
                        <>
                          <button
                            onClick={() =>
                              handleStatusUpdate(appointment.id, "confirmed")
                            }
                            className="flex items-center text-green-600 hover:text-green-900"
                          >
                            <HiCheckCircle className="w-5 h-5 mr-1" />
                            Confirm
                          </button>
                          <button
                            onClick={() =>
                              handleStatusUpdate(appointment.id, "cancelled")
                            }
                            className="flex items-center text-red-600 hover:text-red-900"
                          >
                            <HiXCircle className="w-5 h-5 mr-1" />
                            Cancel
                          </button>
                        </>
                      )}
                      {appointment.status === "confirmed" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(appointment.id, "completed")
                          }
                          className="flex items-center text-blue-600 hover:text-blue-900"
                        >
                          <HiCheckCircle className="w-5 h-5 mr-1" />
                          Complete
                        </button>
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

export default Appointments;
