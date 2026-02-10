import React from "react";
import { useQuery } from "@tanstack/react-query";
import { HiUsers, HiUserGroup, HiCalendar } from "react-icons/hi";
import axios from "axios";
import Loader from "../components/common/Loader";

const Dashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get(
          "http://localhost:5000/api/admin/dashboard/stats",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        return response.data;
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return {
          stats: {
            totalPatients: 0,
            totalDoctors: 0,
            totalAppointments: 0,
            todayAppointments: 0,
          },
          recentAppointments: [],
        };
      }
    },
  });

  const statCards = [
    {
      title: "Total Patients",
      value: stats?.stats?.totalPatients || 0,
      icon: <HiUsers className="w-8 h-8 text-blue-500" />,
      change: "+12%",
      color: "blue",
    },
    {
      title: "Total Doctors",
      value: stats?.stats?.totalDoctors || 0,
      icon: <HiUserGroup className="w-8 h-8 text-green-500" />,
      change: "+5%",
      color: "green",
    },
    {
      title: "Total Appointments",
      value: stats?.stats?.totalAppointments || 0,
      icon: <HiCalendar className="w-8 h-8 text-purple-500" />,
      change: "+18%",
      color: "purple",
    },
    {
      title: "Today's Appointments",
      value: stats?.stats?.todayAppointments || 0,
      icon: <HiCalendar className="w-8 h-8 text-orange-500" />,
      change: "+3%",
      color: "orange",
    },
  ];

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to CliniX Admin Dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
                <p
                  className={`text-sm mt-1 ${stat.change.startsWith("+") ? "text-green-600" : "text-red-600"}`}
                >
                  {stat.change} from last month
                </p>
              </div>
              <div className="p-3 rounded-full bg-gray-50">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/dashboard/patients"
            className="group bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <HiUsers className="w-8 h-8 text-blue-600 mb-2" />
                <p className="font-medium text-blue-900">Patients</p>
                <p className="text-sm text-blue-700 mt-1">
                  Manage patient records
                </p>
              </div>
              <span className="text-blue-600 group-hover:text-blue-800">→</span>
            </div>
          </a>

          <a
            href="/dashboard/doctors"
            className="group bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200 hover:border-green-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <HiUserGroup className="w-8 h-8 text-green-600 mb-2" />
                <p className="font-medium text-green-900">Doctors</p>
                <p className="text-sm text-green-700 mt-1">
                  Manage doctor profiles
                </p>
              </div>
              <span className="text-green-600 group-hover:text-green-800">
                →
              </span>
            </div>
          </a>

          <a
            href="/dashboard/appointments"
            className="group bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 hover:border-purple-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <HiCalendar className="w-8 h-8 text-purple-600 mb-2" />
                <p className="font-medium text-purple-900">Appointments</p>
                <p className="text-sm text-purple-700 mt-1">
                  Schedule & manage
                </p>
              </div>
              <span className="text-purple-600 group-hover:text-purple-800">
                →
              </span>
            </div>
          </a>

          <a
            href="/dashboard/prescriptions"
            className="group bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200 hover:border-orange-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <HiCalendar className="w-8 h-8 text-orange-600 mb-2" />
                <p className="font-medium text-orange-900">Prescriptions</p>
                <p className="text-sm text-orange-700 mt-1">
                  Manage medications
                </p>
              </div>
              <span className="text-orange-600 group-hover:text-orange-800">
                →
              </span>
            </div>
          </a>
        </div>
      </div>

      {/* Recent Appointments Table */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Recent Appointments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Patient</th>
                <th className="table-header">Doctor</th>
                <th className="table-header">Date & Time</th>
                <th className="table-header">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats?.recentAppointments?.map((appointment) => (
                <tr key={appointment._id || Math.random()}>
                  <td className="table-cell">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {appointment.patient?.firstName}{" "}
                        {appointment.patient?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {appointment.patient?.patientId}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">
                      Dr. {appointment.doctor?.firstName}{" "}
                      {appointment.doctor?.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {appointment.doctor?.specialization}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">
                      {new Date(appointment.date).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {appointment.time}
                    </div>
                  </td>
                  <td className="table-cell">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        appointment.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : appointment.status === "scheduled"
                            ? "bg-blue-100 text-blue-800"
                            : appointment.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </td>
                </tr>
              )) || (
                <tr>
                  <td
                    colSpan="4"
                    className="table-cell text-center text-gray-500"
                  >
                    No appointments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
