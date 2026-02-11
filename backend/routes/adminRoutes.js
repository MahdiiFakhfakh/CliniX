const express = require("express");
const router = express.Router();

const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");

// -----------------------------
// GET Dashboard Stats
// -----------------------------
router.get("/dashboard/stats", async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const totalAppointments = await Appointment.countDocuments();

    // Today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayAppointments = await Appointment.countDocuments({
      date: { $gte: today, $lt: tomorrow },
    });

    // Recent appointments (last 5)
    const recentAppointments = await Appointment.find()
      .populate("patient")
      .populate("doctor")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalPatients,
        totalDoctors,
        totalAppointments,
        todayAppointments,
      },
      recentAppointments,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
    });
  }
});

// -----------------------------
// GET All Appointments
// -----------------------------
router.get("/appointments", async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("patient", "firstName lastName patientId")
      .populate("doctor", "firstName lastName specialization")
      .sort({ date: -1 }); // newest first

    res.status(200).json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
    });
  }
});

module.exports = router;
