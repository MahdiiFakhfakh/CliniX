const User = require("../models/User");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");
const Admin = require("../models/Admin");

// adminController.js

exports.getProfile = async (req, res) => {
  try {
    // find the Admin document linked to this user
    const admin = await Admin.findOne({ user: req.user._id }).populate(
      "user",
      "-password",
    );

    if (!admin)
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });

    // merge Admin (firstName, lastName) with User (email, phone)
    const userData = {
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.user.email,
      phone: admin.user.phone || "",
    };

    res.status(200).json({ user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// Update admin profile
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;

    // Find the admin document linked to this user
    const admin = await Admin.findOne({ user: req.user._id });
    if (!admin)
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });

    // Update admin and user fields
    admin.firstName = firstName;
    admin.lastName = lastName;
    await admin.save();

    const user = await User.findById(req.user._id);
    user.email = email;
    user.phone = phone;
    await user.save();

    // Return the updated data
    res.json({
      success: true,
      user: {
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      message: "Profile updated",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

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

// Search patients, doctors, appointments by name or ID
exports.searchAll = async (req, res) => {
  const query = req.query.query?.trim();
  if (!query) return res.status(400).json({ success: false, results: [] });

  try {
    const regex = new RegExp(query, "i"); // case-insensitive

    // Search doctors
    const doctors = await Doctor.find({
      $or: [{ firstName: regex }, { lastName: regex }],
    }).limit(5);

    // Search patients
    const patients = await Patient.find({
      $or: [{ firstName: regex }, { lastName: regex }],
    }).limit(5);

    // Search appointments by patient or doctor name
    const appointments = await Appointment.find()
      .populate("patient", "firstName lastName")
      .populate("doctor", "firstName lastName")
      .sort({ date: -1 });

    const filteredAppointments = appointments.filter(
      (a) =>
        regex.test(a.patient.firstName + " " + a.patient.lastName) ||
        regex.test(a.doctor.firstName + " " + a.doctor.lastName)
    ).slice(0, 5);

    res.json({
      success: true,
      results: {
        doctors,
        patients,
        appointments: filteredAppointments,
      },
    });
  } catch (err) {
    console.error("Universal search error:", err);
    res.status(500).json({ success: false, results: {} });
  }
};

