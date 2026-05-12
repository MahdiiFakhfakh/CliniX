import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineRefresh,
  HiOutlineClock,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineCalendar,
  HiOutlineInformationCircle,
  HiOutlineBadgeCheck,
} from "react-icons/hi";

const DoctorApprovals = () => {
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingDoctors();
  }, []);

  const fetchPendingDoctors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) { navigate("/login"); return; }

      const response = await axios.get(
        "http://localhost:5000/api/admin/doctors",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const all = response.data.doctors || [];
      setPendingDoctors(all.filter((d) => d.status === "pending"));
    } catch (err) {
      toast.error("Failed to load pending approvals");
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (doctor) => {
    setActionLoading(doctor._id);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/admin/doctors/${doctor._id}/status`,
        { status: "available" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPendingDoctors((prev) => prev.filter((d) => d._id !== doctor._id));
      toast.success(`Dr. ${doctor.fullName} has been approved`);
    } catch {
      toast.error("Failed to approve doctor");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (doctor) => {
    if (
      !window.confirm(
        `Reject and permanently remove Dr. ${doctor.fullName}'s account?\n\nThis cannot be undone.`
      )
    )
      return;

    setActionLoading(doctor._id);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/admin/doctors/${doctor._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPendingDoctors((prev) => prev.filter((d) => d._id !== doctor._id));
      toast.success(`Dr. ${doctor.fullName}'s application has been rejected`);
    } catch {
      toast.error("Failed to reject application");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Unknown";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (fullName) =>
    fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "DR";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-orange-200 rounded-full animate-spin border-t-orange-500 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <HiOutlineClock className="w-8 h-8 text-orange-500 animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-lg text-gray-600 animate-pulse">
            Loading pending approvals...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 p-4 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
              Doctor Approvals
            </h1>
            <p className="text-gray-600 mt-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
              Review and approve new doctor account registrations
            </p>
          </div>
          <button
            onClick={fetchPendingDoctors}
            className="self-start md:self-auto px-4 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 border border-gray-300 shadow-sm"
          >
            <HiOutlineRefresh className="w-5 h-5" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Review</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {pendingDoctors.length}
                </p>
                <p className="text-xs text-orange-600 mt-1">Awaiting decision</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-2xl">
                <HiOutlineClock className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Approve Action</p>
                <p className="text-sm font-semibold text-green-700 mt-2">
                  Sets status to Available
                </p>
                <p className="text-xs text-gray-500 mt-1">Doctor can log in</p>
              </div>
              <div className="bg-green-100 p-3 rounded-2xl">
                <HiOutlineCheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Reject Action</p>
                <p className="text-sm font-semibold text-red-700 mt-2">
                  Permanently removes account
                </p>
                <p className="text-xs text-gray-500 mt-1">Cannot be undone</p>
              </div>
              <div className="bg-red-100 p-3 rounded-2xl">
                <HiOutlineXCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Pending List */}
        {pendingDoctors.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-16 text-center">
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <HiOutlineBadgeCheck className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">
              All caught up!
            </h3>
            <p className="text-gray-500">
              There are no pending doctor applications to review.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 px-1">
              <HiOutlineInformationCircle className="w-4 h-4" />
              <span>
                {pendingDoctors.length} application
                {pendingDoctors.length !== 1 ? "s" : ""} pending review
              </span>
            </div>

            {pendingDoctors.map((doctor) => {
              const isActing = actionLoading === doctor._id;
              return (
                <div
                  key={doctor._id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Avatar + Name */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                        {getInitials(doctor.fullName)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-gray-900">
                            {doctor.fullName}
                          </h3>
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                            Pending
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                          <span className="flex items-center gap-1 text-sm text-gray-500">
                            <HiOutlineMail className="w-3.5 h-3.5" />
                            {doctor.email}
                          </span>
                          {doctor.phone && doctor.phone !== "00000000" && (
                            <span className="flex items-center gap-1 text-sm text-gray-500">
                              <HiOutlinePhone className="w-3.5 h-3.5" />
                              {doctor.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-sm text-gray-500">
                            <HiOutlineCalendar className="w-3.5 h-3.5" />
                            Applied {formatDate(doctor.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button
                        onClick={() => handleApprove(doctor)}
                        disabled={isActing}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-sm"
                      >
                        <HiOutlineCheckCircle className="w-5 h-5" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(doctor)}
                        disabled={isActing}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                      >
                        <HiOutlineXCircle className="w-5 h-5" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorApprovals;
