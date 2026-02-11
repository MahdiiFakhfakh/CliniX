import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar } from "react-chartjs-2";
import axios from "axios";
import Loader from "../components/common/Loader";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const Analytics = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/admin/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  if (isLoading) return <Loader />;

  const appointmentData = {
    labels: data.last7Days,
    datasets: [
      {
        label: "Appointments per day",
        data: data.appointmentsPerDay,
        backgroundColor: "rgba(59, 130, 246, 0.6)", // blue
      },
    ],
  };

  const prescriptionData = {
    labels: data.prescriptionsPerDoctor.map((d) => d.doctor),
    datasets: [
      {
        label: "Prescriptions per doctor",
        data: data.prescriptionsPerDoctor.map((d) => d.count),
        backgroundColor: "rgba(16, 185, 129, 0.6)", // green
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-gray-600">Overview of your clinic performance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">
            Appointments (Last 7 Days)
          </h3>
          <Bar data={appointmentData} />
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">
            Prescriptions per Doctor
          </h3>
          <Bar data={prescriptionData} />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
