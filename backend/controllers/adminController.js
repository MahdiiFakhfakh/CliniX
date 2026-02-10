const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    // Get counts from database
    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      totalPrescriptions,
      pendingAppointments,
      todayAppointments,
      recentAppointments,
    ] = await Promise.all([
      Patient.countDocuments(),
      Doctor.countDocuments(),
      Appointment.countDocuments(),
      Prescription.countDocuments(),
      Appointment.countDocuments({ status: "scheduled" }),
      Appointment.countDocuments({
        date: {
          $gte: new Date().setHours(0, 0, 0, 0),
          $lt: new Date().setHours(23, 59, 59, 999),
        },
      }),
      Appointment.find()
        .populate("patient", "firstName lastName patientId")
        .populate("doctor", "firstName lastName specialization")
        .sort({ date: -1 })
        .limit(5),
    ]);

    // Get patient growth (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const patientGrowth = await Patient.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
      {
        $limit: 6,
      },
    ]);

    // Calculate revenue (example: sum of completed appointment fees)
    const revenueStats = await Appointment.aggregate([
      {
        $match: { status: "completed" },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$fee" },
          averageFee: { $avg: "$fee" },
        },
      },
    ]);

    res.json({
      success: true,
      stats: {
        totalPatients,
        totalDoctors,
        totalAppointments,
        totalPrescriptions,
        pendingAppointments,
        todayAppointments,
        revenue: revenueStats[0] || { totalRevenue: 0, averageFee: 0 },
      },
      recentAppointments,
      patientGrowth: patientGrowth.map((item) => ({
        month: `${item._id.year}-${item._id.month.toString().padStart(2, "0")}`,
        count: item.count,
      })),
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};
