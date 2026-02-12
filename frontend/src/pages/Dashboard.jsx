import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  HiUsers,
  HiUserGroup,
  HiCalendar,
  HiCurrencyDollar,
  HiClipboardList,
  HiClock,
  HiTrendingUp,
  HiOutlineUserAdd,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from "react-icons/hi";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import axios from "axios";
import { format } from "date-fns";
import Loader from "../components/common/Loader";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const Dashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get(
          "http://localhost:5000/api/admin/dashboard/stats",
          { headers: { Authorization: `Bearer ${token}` } },
        );
        return response.data;
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        // Return mock data for development
        return {
          stats: {
            totalPatients: 156,
            totalDoctors: 24,
            totalAppointments: 432,
            todayAppointments: 18,
            pendingAppointments: 12,
            completedAppointments: 312,
            cancelledAppointments: 28,
            revenue: 24560,
          },
          recentAppointments: [
            {
              _id: "1",
              patient: {
                firstName: "John",
                lastName: "Doe",
                patientId: "PAT1001",
              },
              doctor: {
                firstName: "Robert",
                lastName: "Smith",
                specialization: "Cardiology",
              },
              date: new Date().toISOString(),
              time: "10:30",
              status: "completed",
            },
            {
              _id: "2",
              patient: {
                firstName: "Jane",
                lastName: "Smith",
                patientId: "PAT1002",
              },
              doctor: {
                firstName: "Sarah",
                lastName: "Johnson",
                specialization: "Pediatrics",
              },
              date: new Date().toISOString(),
              time: "11:45",
              status: "scheduled",
            },
            // ... more mock
          ],
          // Mock chart data
          last7Days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          appointmentsPerDay: [12, 19, 15, 17, 14, 13, 18],
          patientGrowth: [120, 125, 132, 140, 148, 156],
          growthLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        };
      }
    },
  });

  // Calculate derived stats
  const completionRate =
    data?.stats?.completedAppointments && data?.stats?.totalAppointments
      ? (
          (data.stats.completedAppointments / data.stats.totalAppointments) *
          100
        ).toFixed(1)
      : "72.3";

  const pendingRate =
    data?.stats?.pendingAppointments && data?.stats?.totalAppointments
      ? (
          (data.stats.pendingAppointments / data.stats.totalAppointments) *
          100
        ).toFixed(1)
      : "2.8";

  // Stats cards configuration
  const statCards = [
    {
      title: "Total Patients",
      value: data?.stats?.totalPatients || 0,
      icon: <HiUsers className="w-6 h-6" />,
      change: "+12%",
      trend: "up",
      bgGradient: "from-blue-500 to-blue-600",
      lightBg: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200",
    },
    {
      title: "Total Doctors",
      value: data?.stats?.totalDoctors || 0,
      icon: <HiUserGroup className="w-6 h-6" />,
      change: "+5%",
      trend: "up",
      bgGradient: "from-emerald-500 to-emerald-600",
      lightBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      borderColor: "border-emerald-200",
    },
    {
      title: "Total Appointments",
      value: data?.stats?.totalAppointments || 0,
      icon: <HiCalendar className="w-6 h-6" />,
      change: "+18%",
      trend: "up",
      bgGradient: "from-purple-500 to-purple-600",
      lightBg: "bg-purple-50",
      iconColor: "text-purple-600",
      borderColor: "border-purple-200",
    },
    {
      title: "Today's Appointments",
      value: data?.stats?.todayAppointments || 0,
      icon: <HiClock className="w-6 h-6" />,
      change: "+3%",
      trend: "up",
      bgGradient: "from-orange-500 to-orange-600",
      lightBg: "bg-orange-50",
      iconColor: "text-orange-600",
      borderColor: "border-orange-200",
    },
    {
      title: "Revenue",
      value: `$${data?.stats?.revenue?.toLocaleString() || "24,560"}`,
      icon: <HiCurrencyDollar className="w-6 h-6" />,
      change: "+22%",
      trend: "up",
      bgGradient: "from-indigo-500 to-indigo-600",
      lightBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      borderColor: "border-indigo-200",
    },
    {
      title: "Pending",
      value: data?.stats?.pendingAppointments || 12,
      icon: <HiOutlineXCircle className="w-6 h-6" />,
      change: "-2%",
      trend: "down",
      bgGradient: "from-yellow-500 to-yellow-600",
      lightBg: "bg-yellow-50",
      iconColor: "text-yellow-600",
      borderColor: "border-yellow-200",
    },
    {
      title: "Completion Rate",
      value: `${completionRate}%`,
      icon: <HiOutlineCheckCircle className="w-6 h-6" />,
      change: "+5%",
      trend: "up",
      bgGradient: "from-green-500 to-green-600",
      lightBg: "bg-green-50",
      iconColor: "text-green-600",
      borderColor: "border-green-200",
    },
    {
      title: "Prescriptions",
      value: data?.stats?.totalPrescriptions || 328,
      icon: <HiOutlineDocumentText className="w-6 h-6" />,
      change: "+8%",
      trend: "up",
      bgGradient: "from-pink-500 to-pink-600",
      lightBg: "bg-pink-50",
      iconColor: "text-pink-600",
      borderColor: "border-pink-200",
    },
  ];

  // Chart data for appointments per day
  const appointmentsChartData = {
    labels: data?.last7Days || [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ],
    datasets: [
      {
        label: "Appointments",
        data: data?.appointmentsPerDay || [12, 19, 15, 17, 14, 13, 18],
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
        pointBackgroundColor: "white",
        pointBorderColor: "rgba(59, 130, 246, 1)",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
        fill: true,
      },
    ],
  };

  // Chart data for patient growth
  const patientGrowthData = {
    labels: data?.growthLabels || ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Patients",
        data: data?.patientGrowth || [120, 125, 132, 140, 148, 156],
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 2,
        pointBackgroundColor: "white",
        pointBorderColor: "rgba(16, 185, 129, 1)",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "white",
        titleColor: "#1f2937",
        bodyColor: "#4b5563",
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 12 } } },
      y: {
        beginAtZero: true,
        grid: { color: "#f3f4f6" },
        ticks: { stepSize: 5, font: { size: 12 } },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <HiTrendingUp className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-lg text-gray-600 animate-pulse">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
            Welcome back,{" "}
            {JSON.parse(localStorage.getItem("user") || "{}")?.firstName ||
              "Admin"}
            !
          </p>
        </div>
        <div className="px-4 py-2 bg-white rounded-xl border border-gray-200 text-sm text-gray-700 shadow-sm">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </div>
      </div>

      {/* Stats Grid – 8 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className="group relative bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-16 h-16 opacity-5 group-hover:opacity-10 transition-opacity">
              <div
                className={`w-full h-full bg-gradient-to-br ${stat.bgGradient} rounded-bl-full`}
              ></div>
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${stat.lightBg}`}>
                  <div className={stat.iconColor}>{stat.icon}</div>
                </div>
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    stat.trend === "up"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {stat.change}
                </div>
              </div>
              <h3 className="text-xs font-medium text-gray-500 mb-1">
                {stat.title}
              </h3>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Appointments
              </h3>
              <p className="text-sm text-gray-500">Last 7 days</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-lg">
              <HiCalendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="h-64">
            <Line data={appointmentsChartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Patient Growth
              </h3>
              <p className="text-sm text-gray-500">Last 6 months</p>
            </div>
            <div className="bg-emerald-100 p-2 rounded-lg">
              <HiTrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="h-64">
            <Line data={patientGrowthData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiOutlineUserAdd className="w-5 h-5 text-blue-600" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/dashboard/patients"
            className="group flex flex-col items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200"
          >
            <HiUsers className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-900">Patients</span>
          </a>
          <a
            href="/dashboard/doctors"
            className="group flex flex-col items-center p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-200"
          >
            <HiUserGroup className="w-8 h-8 text-emerald-600 mb-2" />
            <span className="text-sm font-medium text-emerald-900">
              Doctors
            </span>
          </a>
          <a
            href="/dashboard/appointments"
            className="group flex flex-col items-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors border border-purple-200"
          >
            <HiCalendar className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-900">
              Appointments
            </span>
          </a>
          <a
            href="/dashboard/prescriptions"
            className="group flex flex-col items-center p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors border border-orange-200"
          >
            <HiOutlineDocumentText className="w-8 h-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-orange-900">
              Prescriptions
            </span>
          </a>
        </div>
      </div>

      {/* Recent Appointments Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Appointments
          </h3>
          <a
            href="/dashboard/appointments"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.recentAppointments?.length > 0 ? (
                data.recentAppointments.slice(0, 5).map((apt) => (
                  <tr
                    key={apt._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm font-medium">
                            {apt.patient?.firstName?.charAt(0)}
                            {apt.patient?.lastName?.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {apt.patient?.firstName} {apt.patient?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {apt.patient?.patientId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {apt.doctor?.specialization}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {apt.date
                          ? new Date(apt.date).toLocaleDateString()
                          : "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {apt.time || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          apt.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : apt.status === "scheduled"
                              ? "bg-blue-100 text-blue-800"
                              : apt.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {apt.status?.charAt(0).toUpperCase() +
                          apt.status?.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No recent appointments found.
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
