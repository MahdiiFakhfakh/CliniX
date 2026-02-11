const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");

exports.getDashboardStats = async (req, res) => {
  try {
    const [totalPatients, totalDoctors, totalAppointments, totalPrescriptions] =
      await Promise.all([
        Patient.countDocuments(),
        Doctor.countDocuments(),
        Appointment.countDocuments(),
        Prescription.countDocuments(),
      ]);

    res.json({
      success: true,
      stats: {
        totalPatients,
        totalDoctors,
        totalAppointments,
        totalPrescriptions,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};
