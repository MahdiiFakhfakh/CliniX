import React, { useState, useEffect } from "react";
import {
  HiSearch,
  HiFilter,
  HiEye,
  HiPencil,
  HiTrash,
  HiUserAdd,
  HiStar,
} from "react-icons/hi";
import { toast } from "react-hot-toast";

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("all");

  // Mock data for doctors
  const mockDoctors = [
    {
      id: "DOC1001",
      name: "Dr. Robert Smith",
      specialization: "Cardiology",
      experience: 15,
      phone: "+1 (555) 111-2222",
      email: "dr.smith@clinix.com",
      availability: "Mon-Fri, 9AM-5PM",
      ratings: 4.8,
      patients: 124,
      status: "available",
    },
    {
      id: "DOC1002",
      name: "Dr. Sarah Johnson",
      specialization: "Pediatrics",
      experience: 10,
      phone: "+1 (555) 222-3333",
      email: "dr.johnson@clinix.com",
      availability: "Mon-Sat, 8AM-4PM",
      ratings: 4.9,
      patients: 89,
      status: "available",
    },
    {
      id: "DOC1003",
      name: "Dr. Michael Wilson",
      specialization: "Orthopedics",
      experience: 12,
      phone: "+1 (555) 333-4444",
      email: "dr.wilson@clinix.com",
      availability: "Mon-Fri, 10AM-6PM",
      ratings: 4.7,
      patients: 156,
      status: "on-leave",
    },
    {
      id: "DOC1004",
      name: "Dr. Emily Davis",
      specialization: "Neurology",
      experience: 8,
      phone: "+1 (555) 444-5555",
      email: "dr.davis@clinix.com",
      availability: "Tue-Sat, 9AM-5PM",
      ratings: 4.6,
      patients: 67,
      status: "available",
    },
    {
      id: "DOC1005",
      name: "Dr. James Brown",
      specialization: "Dermatology",
      experience: 20,
      phone: "+1 (555) 555-6666",
      email: "dr.brown@clinix.com",
      availability: "Mon-Fri, 8AM-4PM",
      ratings: 4.9,
      patients: 203,
      status: "available",
    },
    {
      id: "DOC1006",
      name: "Dr. Lisa Taylor",
      specialization: "Gynecology",
      experience: 14,
      phone: "+1 (555) 666-7777",
      email: "dr.taylor@clinix.com",
      availability: "Mon-Thu, 9AM-5PM",
      ratings: 4.8,
      patients: 142,
      status: "available",
    },
    {
      id: "DOC1007",
      name: "Dr. David Miller",
      specialization: "Psychiatry",
      experience: 16,
      phone: "+1 (555) 777-8888",
      email: "dr.miller@clinix.com",
      availability: "Mon-Fri, 10AM-6PM",
      ratings: 4.7,
      patients: 98,
      status: "available",
    },
    {
      id: "DOC1008",
      name: "Dr. Anna Clark",
      specialization: "Ophthalmology",
      experience: 11,
      phone: "+1 (555) 888-9999",
      email: "dr.clark@clinix.com",
      availability: "Wed-Sun, 9AM-5PM",
      ratings: 4.9,
      patients: 113,
      status: "on-leave",
    },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setDoctors(mockDoctors);
      setLoading(false);
    }, 1000);
  }, []);

  const specializations = [
    "all",
    ...new Set(mockDoctors.map((d) => d.specialization)),
  ];

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpecialization =
      specializationFilter === "all" ||
      doctor.specialization === specializationFilter;

    return matchesSearch && matchesSpecialization;
  });

  const handleAddDoctor = () => {
    toast.success("Add doctor functionality coming soon!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading doctors...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Doctors
          </h1>
          <p className="text-gray-600 mt-1">
            Manage doctor profiles and schedules
          </p>
        </div>
        <button
          onClick={handleAddDoctor}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-4 sm:mt-0"
        >
          <HiUserAdd className="w-5 h-5 mr-2" />
          Add Doctor
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
          <div className="flex-1">
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search doctors by name, specialization, or email..."
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
                value={specializationFilter}
                onChange={(e) => setSpecializationFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec === "all" ? "All Specializations" : spec}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Doctors</p>
          <p className="text-2xl font-bold mt-2">{doctors.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Average Rating</p>
          <div className="flex items-center mt-2">
            <HiStar className="w-5 h-5 text-yellow-400 mr-1" />
            <p className="text-2xl font-bold">
              {(
                doctors.reduce((sum, d) => sum + d.ratings, 0) / doctors.length
              ).toFixed(1)}
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Available Now</p>
          <p className="text-2xl font-bold mt-2">
            {doctors.filter((d) => d.status === "available").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Patients</p>
          <p className="text-2xl font-bold mt-2">
            {doctors.reduce((sum, d) => sum + d.patients, 0)}
          </p>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredDoctors.map((doctor) => (
          <div
            key={doctor.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {doctor.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {doctor.name}
                      </h3>
                      <p className="text-sm text-blue-600 font-medium">
                        {doctor.specialization}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">Experience:</span>
                      {doctor.experience} years
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">Contact:</span>
                      {doctor.phone}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">Availability:</span>
                      {doctor.availability}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      doctor.status === "available"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {doctor.status === "available" ? "Available" : "On Leave"}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <HiStar className="w-5 h-5 text-yellow-400 mr-1" />
                    <span className="font-medium">{doctor.ratings}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({doctor.patients} patients)
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toast.success(`Viewing ${doctor.name}`)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="View"
                    >
                      <HiEye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => toast.success(`Editing ${doctor.name}`)}
                      className="text-green-600 hover:text-green-900 p-1"
                      title="Edit"
                    >
                      <HiPencil className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Doctors;
