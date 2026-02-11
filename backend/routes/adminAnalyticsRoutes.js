const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");

// GET /api/admin/analytics
router.get("/", async (req, res) => {
  try {
    // 1. Appointments per day (last 7 days)
    const last7Days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split("T")[0]); // "YYYY-MM-DD"
    }

    const appointments = await Appointment.find({
      date: { $gte: new Date(new Date().setDate(today.getDate() - 6)) },
    });

    const appointmentsPerDay = last7Days.map((day) => {
      return appointments.filter(
        (apt) => apt.date.toISOString().split("T")[0] === day,
      ).length;
    });

    // 2. Prescriptions per doctor
    const doctors = await Doctor.find();
    const prescriptions = await Prescription.find();

    const prescriptionsPerDoctor = doctors.map((doc) => {
      return {
        doctor: `${doc.firstName} ${doc.lastName}`,
        count: prescriptions.filter(
          (rx) => rx.doctor.toString() === doc._id.toString(),
        ).length,
      };
    });

    res.status(200).json({
      appointmentsPerDay,
      last7Days,
      prescriptionsPerDoctor,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

module.exports = router;
