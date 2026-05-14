import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  HiUsers,
  HiUserGroup,
  HiCalendar,
  HiClock,
  HiTrendingUp,
  HiOutlineUserAdd,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from "react-icons/hi";
import { Line } from "react-chartjs-2";
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
        throw error;
      }
    },
  });

  const stats = data?.stats || {};
  const totalAppointments = stats.totalAppointments || 0;
  const percentOfAppointments = (value) =>
    totalAppointments ? Math.round((value / totalAppointments) * 100) : 0;

  // Calculate derived stats
  const completionRate =
    totalAppointments && stats.completedAppointments
      ? ((stats.completedAppointments / totalAppointments) * 100).toFixed(1)
      : "0.0";

  const pendingRate =
    totalAppointments && stats.pendingAppointments
      ? ((stats.pendingAppointments / totalAppointments) * 100).toFixed(1)
      : "0.0";

  // Stats cards configuration
  const statCards = [
    {
      title: "Total Patients",
      value: stats.totalPatients ?? 0,
      icon: <HiUsers className="w-6 h-6" />,
      meta: "Registered records",
      bgGradient: "from-teal-600 to-teal-700",
      lightBg: "bg-teal-50",
      iconColor: "text-teal-700",
      borderColor: "border-teal-200",
    },
    {
      title: "Total Doctors",
      value: stats.totalDoctors ?? 0,
      icon: <HiUserGroup className="w-6 h-6" />,
      meta: "Clinical team",
      bgGradient: "from-emerald-500 to-emerald-600",
      lightBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      borderColor: "border-emerald-200",
    },
    {
      title: "Total Appointments",
      value: stats.totalAppointments ?? 0,
      icon: <HiCalendar className="w-6 h-6" />,
      meta: `${completionRate}% completed`,
      bgGradient: "from-sky-500 to-sky-600",
      lightBg: "bg-sky-50",
      iconColor: "text-sky-700",
      borderColor: "border-sky-200",
    },
    {
      title: "Today's Appointments",
      value: stats.todayAppointments ?? 0,
      icon: <HiClock className="w-6 h-6" />,
      meta: `${percentOfAppointments(stats.todayAppointments || 0)}% of all visits`,
      bgGradient: "from-orange-500 to-orange-600",
      lightBg: "bg-orange-50",
      iconColor: "text-orange-600",
      borderColor: "border-orange-200",
    },
    {
      title: "Pending",
      value: stats.pendingAppointments ?? 0,
      icon: <HiOutlineXCircle className="w-6 h-6" />,
      meta: `${pendingRate}% awaiting action`,
      bgGradient: "from-yellow-500 to-yellow-600",
      lightBg: "bg-yellow-50",
      iconColor: "text-yellow-600",
      borderColor: "border-yellow-200",
    },
    {
      title: "Completion Rate",
      value: `${completionRate}%`,
      icon: <HiOutlineCheckCircle className="w-6 h-6" />,
      meta: `${stats.completedAppointments || 0} completed`,
      bgGradient: "from-green-500 to-green-600",
      lightBg: "bg-green-50",
      iconColor: "text-green-600",
      borderColor: "border-green-200",
    },
    {
      title: "Prescriptions",
      value: stats.totalPrescriptions ?? 0,
      icon: <HiOutlineDocumentText className="w-6 h-6" />,
      meta: "Medication orders",
      bgGradient: "from-rose-500 to-rose-600",
      lightBg: "bg-rose-50",
      iconColor: "text-rose-600",
      borderColor: "border-rose-200",
    },
  ];

  // Chart data for appointments per day
  const appointmentsChartData = {
    labels: data?.last7Days || [],
    datasets: [
      {
        label: "Appointments",
        data: data?.appointmentsPerDay || [],
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
    labels: data?.growthLabels || [],
    datasets: [
      {
        label: "Patients",
        data: data?.patientGrowth || [],
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
            <div className="w-20 h-20 border-4 border-teal-200 rounded-full animate-spin border-t-teal-700 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <HiTrendingUp className="w-8 h-8 text-teal-700 animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-lg text-slate-600 animate-pulse">
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-700 via-emerald-600 to-sky-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-600 mt-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></span>
            Welcome back,{" "}
            {JSON.parse(localStorage.getItem("user") || "{}")?.firstName ||
              "Admin"}
            !
          </p>
        </div>
        <div className="px-4 py-2 bg-white rounded-lg border border-slate-200 text-sm text-slate-700 shadow-sm">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </div>
      </div>

      {/* Stats Grid – 8 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className="group relative min-h-[142px] bg-white rounded-lg border border-slate-200 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-16 h-16 opacity-5 group-hover:opacity-10 transition-opacity">
              <div
                className={`w-full h-full bg-gradient-to-br ${stat.bgGradient} rounded-bl-full`}
              ></div>
            </div>
            <div className="relative z-10 flex h-full flex-col justify-between gap-4">
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${stat.lightBg}`}
                >
                  <div className={stat.iconColor}>{stat.icon}</div>
                </div>
                <span className="max-w-[9rem] rounded-full bg-slate-50 px-2.5 py-1 text-right text-[11px] font-semibold leading-4 text-slate-600 ring-1 ring-slate-100">
                  {stat.meta}
                </span>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {stat.title}
                </h3>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">
                Appointments
              </h3>
              <p className="text-sm text-slate-500">Last 7 days</p>
            </div>
            <div className="bg-teal-50 p-2 rounded-lg">
              <HiCalendar className="w-5 h-5 text-teal-700" />
            </div>
          </div>
          <div className="h-64">
            <Line data={appointmentsChartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">
                Patient Growth
              </h3>
              <p className="text-sm text-slate-500">Last 6 months</p>
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
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950 mb-4 flex items-center gap-2">
          <HiOutlineUserAdd className="w-5 h-5 text-teal-700" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/dashboard/patients"
            className="group flex flex-col items-center p-4 bg-teal-50 rounded-lg hover:bg-teal-50 transition-colors border border-teal-200"
          >
            <HiUsers className="w-8 h-8 text-teal-700 mb-2" />
            <span className="text-sm font-medium text-teal-950">Patients</span>
          </a>
          <a
            href="/dashboard/doctors"
            className="group flex flex-col items-center p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200"
          >
            <HiUserGroup className="w-8 h-8 text-emerald-600 mb-2" />
            <span className="text-sm font-medium text-emerald-900">
              Doctors
            </span>
          </a>
          <a
            href="/dashboard/appointments"
            className="group flex flex-col items-center p-4 bg-sky-50 rounded-lg hover:bg-sky-50 transition-colors border border-sky-200"
          >
            <HiCalendar className="w-8 h-8 text-sky-700 mb-2" />
            <span className="text-sm font-medium text-sky-950">
              Appointments
            </span>
          </a>
          <a
            href="/dashboard/prescriptions"
            className="group flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors border border-orange-200"
          >
            <HiOutlineDocumentText className="w-8 h-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-orange-900">
              Prescriptions
            </span>
          </a>
        </div>
      </div>

      {/* Recent Appointments Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-950">
            Recent Appointments
          </h3>
          <a
            href="/dashboard/appointments"
            className="text-sm text-teal-700 hover:text-teal-900 font-medium"
          >
            View All →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {data?.recentAppointments?.length > 0 ? (
                data.recentAppointments.slice(0, 5).map((apt) => (
                  <tr
                    key={apt._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-teal-50 rounded-full flex items-center justify-center">
                          <span className="text-teal-700 text-sm font-medium">
                            {apt.patient?.firstName?.charAt(0)}
                            {apt.patient?.lastName?.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-slate-950">
                            {apt.patient?.firstName} {apt.patient?.lastName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {apt.patient?.patientId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-950">
                        Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {apt.doctor?.specialization}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-950">
                        {apt.date
                          ? new Date(apt.date).toLocaleDateString()
                          : "N/A"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {apt.time || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          apt.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : apt.status === "scheduled"
                              ? "bg-teal-50 text-teal-900"
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
                    className="px-6 py-8 text-center text-slate-500"
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
