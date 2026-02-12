const express = require("express");
const router = express.Router();
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");
const Admin = require("../models/Admin");
const User = require("../models/User");
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
  format,
  subDays,
  subMonths,
  startOfMonth,
  endOfMonth,
} = require("date-fns");

// ============================================
// DASHBOARD STATS – FULL REAL DATA
// ============================================
router.get(
  "/dashboard/stats",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      // 1. Basic counts
      const totalPatients = await Patient.countDocuments();
      const totalDoctors = await Doctor.countDocuments();
      const totalAppointments = await Appointment.countDocuments();
      const totalPrescriptions = await Prescription.countDocuments();

      // 2. Today's appointments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const todayAppointments = await Appointment.countDocuments({
        date: { $gte: today, $lt: tomorrow },
      });

      // 3. Pending appointments
      const pendingAppointments = await Appointment.countDocuments({
        status: { $in: ["scheduled", "confirmed"] },
      });

      // 4. Completed & cancelled
      const completedAppointments = await Appointment.countDocuments({
        status: "completed",
      });
      const cancelledAppointments = await Appointment.countDocuments({
        status: "cancelled",
      });

      // 5. Revenue (sum of fees from paid completed appointments)
      const revenueResult = await Appointment.aggregate([
        { $match: { status: "completed", paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$fee" } } },
      ]);
      const revenue = revenueResult[0]?.total || 0;

      // 6. Recent appointments (last 5)
      const recentAppointments = await Appointment.find()
        .populate("patient", "firstName lastName patientId")
        .populate("doctor", "firstName lastName specialization")
        .sort({ date: -1, time: -1 })
        .limit(5);

      // 7. Chart data: last 7 days appointments
      const last7Days = [];
      const appointmentsPerDay = [];
      for (let i = 6; i >= 0; i--) {
        const day = subDays(new Date(), i);
        last7Days.push(format(day, "EEE"));
        const start = new Date(day.setHours(0, 0, 0, 0));
        const end = new Date(day.setHours(23, 59, 59, 999));
        const count = await Appointment.countDocuments({
          date: { $gte: start, $lte: end },
        });
        appointmentsPerDay.push(count);
      }

      // 8. Patient growth (last 6 months)
      const growthLabels = [];
      const patientGrowth = [];
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(new Date(), i);
        growthLabels.push(format(month, "MMM"));
        const start = startOfMonth(month);
        const end = endOfMonth(month);
        const count = await Patient.countDocuments({
          createdAt: { $gte: start, $lte: end },
        });
        patientGrowth.push(count);
      }

      // 9. Stats object
      const stats = {
        totalPatients,
        totalDoctors,
        totalAppointments,
        totalPrescriptions,
        todayAppointments,
        pendingAppointments,
        completedAppointments,
        cancelledAppointments,
        revenue,
      };

      res.json({
        success: true,
        stats,
        recentAppointments,
        last7Days,
        appointmentsPerDay,
        patientGrowth,
        growthLabels,
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch dashboard stats" });
    }
  },
);

// ============================================
// SETTINGS PROFILE – WORKS WITH YOUR SCHEMA
// ============================================
router.get(
  "/settings/profile",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const admin = await Admin.findOne({ user: req.user._id });
      if (!admin) {
        return res
          .status(404)
          .json({ success: false, message: "Admin profile not found" });
      }

      res.json({
        success: true,
        user: {
          firstName: admin.firstName,
          lastName: admin.lastName,
          fullName: admin.fullName,
          phone: admin.phone,
          department: admin.department,
          email: req.user.email, // from User model
        },
      });
    } catch (error) {
      console.error("GET /settings/profile error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch profile" });
    }
  },
);

router.put(
  "/settings/profile",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const { firstName, lastName, phone, department, email } = req.body;

      // Update Admin
      const admin = await Admin.findOneAndUpdate(
        { user: req.user._id },
        {
          firstName,
          lastName,
          fullName: `${firstName} ${lastName}`.trim(),
          phone,
          department,
          updatedAt: new Date(),
        },
        { new: true, runValidators: true },
      );

      if (!admin) {
        return res
          .status(404)
          .json({ success: false, message: "Admin profile not found" });
      }

      // Update email in User if changed
      if (email && email !== req.user.email) {
        await User.findByIdAndUpdate(req.user._id, { email });
      }

      res.json({
        success: true,
        user: {
          firstName: admin.firstName,
          lastName: admin.lastName,
          fullName: admin.fullName,
          phone: admin.phone,
          department: admin.department,
          email: email || req.user.email,
        },
      });
    } catch (error) {
      console.error("PUT /settings/profile error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to update profile" });
    }
  },
);

// ============================================
// SETTINGS PASSWORD
// ============================================
router.put(
  "/settings/password",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id).select("+password");

      if (!(await user.matchPassword(currentPassword))) {
        return res
          .status(401)
          .json({ success: false, message: "Current password is incorrect" });
      }

      user.password = newPassword;
      await user.save();

      res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error("PUT /settings/password error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to update password" });
    }
  },
);

// ============================================
// PATIENTS STATS (for Patients page)
// ============================================
router.get("/patients/stats", protect, authorize("admin"), async (req, res) => {
  try {
    const total = await Patient.countDocuments();
    const active = await Patient.countDocuments({ status: "active" });
    const inactive = await Patient.countDocuments({ status: "inactive" });
    const pending = await Patient.countDocuments({ status: "pending" });

    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );
    const newThisMonth = await Patient.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    const male = await Patient.countDocuments({ gender: "male" });
    const female = await Patient.countDocuments({ gender: "female" });
    const other = await Patient.countDocuments({ gender: "other" });

    const ageResult = await Patient.aggregate([
      { $match: { age: { $exists: true } } },
      { $group: { _id: null, avg: { $avg: "$age" } } },
    ]);
    const avgAge = ageResult[0]?.avg || 0;

    res.json({
      success: true,
      data: {
        total,
        active,
        inactive,
        pending,
        newThisMonth,
        male,
        female,
        other,
        avgAge,
      },
    });
  } catch (error) {
    console.error("Patients stats error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch patient stats" });
  }
});

// ============================================
// DOCTORS STATS (for Doctors page)
// ============================================
router.get("/doctors/stats", protect, authorize("admin"), async (req, res) => {
  try {
    const total = await Doctor.countDocuments();
    const available = await Doctor.countDocuments({ status: "available" });
    const onLeave = await Doctor.countDocuments({ status: "on_leave" });
    const unavailable = await Doctor.countDocuments({ status: "unavailable" });

    const specializations = await Doctor.aggregate([
      { $group: { _id: "$specialization", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const avgRatingResult = await Doctor.aggregate([
      { $match: { "ratings.average": { $exists: true } } },
      { $group: { _id: null, avg: { $avg: "$ratings.average" } } },
    ]);
    const avgRating = avgRatingResult[0]?.avg || 0;

    res.json({
      success: true,
      data: {
        total,
        available,
        onLeave,
        unavailable,
        specializations,
        avgRating,
      },
    });
  } catch (error) {
    console.error("Doctors stats error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch doctor stats" });
  }
});

// ============================================
// APPOINTMENTS STATS (for Appointments page)
// ============================================
router.get(
  "/appointments/stats",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const total = await Appointment.countDocuments();
      const scheduled = await Appointment.countDocuments({
        status: "scheduled",
      });
      const confirmed = await Appointment.countDocuments({
        status: "confirmed",
      });
      const completed = await Appointment.countDocuments({
        status: "completed",
      });
      const cancelled = await Appointment.countDocuments({
        status: "cancelled",
      });
      const noShow = await Appointment.countDocuments({ status: "no_show" });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayAppointments = await Appointment.countDocuments({
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      });

      const revenueResult = await Appointment.aggregate([
        { $match: { status: "completed", paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$fee" } } },
      ]);
      const revenue = revenueResult[0]?.total || 0;

      res.json({
        success: true,
        data: {
          total,
          scheduled,
          confirmed,
          completed,
          cancelled,
          noShow,
          todayAppointments,
          revenue,
        },
      });
    } catch (error) {
      console.error("Appointments stats error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch appointment stats" });
    }
  },
);

// ============================================
// PRESCRIPTIONS STATS (for Prescriptions page)
// ============================================
router.get(
  "/prescriptions/stats",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const total = await Prescription.countDocuments();
      const active = await Prescription.countDocuments({ status: "active" });
      const completed = await Prescription.countDocuments({
        status: "completed",
      });
      const expired = await Prescription.countDocuments({ status: "expired" });
      const cancelled = await Prescription.countDocuments({
        status: "cancelled",
      });

      const topDoctors = await Prescription.aggregate([
        { $group: { _id: "$doctor", count: { $sum: 1 } } },
        {
          $lookup: {
            from: "doctors",
            localField: "_id",
            foreignField: "_id",
            as: "doctor",
          },
        },
        { $unwind: "$doctor" },
        { $project: { doctor: "$doctor.fullName", count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);

      res.json({
        success: true,
        data: { total, active, completed, expired, cancelled, topDoctors },
      });
    } catch (error) {
      console.error("Prescriptions stats error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch prescription stats",
      });
    }
  },
);
// ============================================
// PATIENTS MANAGEMENT - FULL CRUD
// ============================================

// GET all patients
router.get("/patients", protect, authorize("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { patientId: { $regex: search, $options: "i" } },
      ];
    }

    if (status && status !== "all") {
      query.status = status;
    }

    const patients = await Patient.find(query)
      .populate("primaryDoctor", "firstName lastName specialization")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Patient.countDocuments(query);

    res.status(200).json({
      success: true,
      patients,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patients",
    });
  }
});

// GET patient statistics
router.get("/patients/stats", protect, authorize("admin"), async (req, res) => {
  try {
    const [
      total,
      active,
      inactive,
      pending,
      newThisMonth,
      male,
      female,
      highRisk,
      mediumRisk,
      lowRisk,
    ] = await Promise.all([
      Patient.countDocuments(),
      Patient.countDocuments({ status: "active" }),
      Patient.countDocuments({ status: "inactive" }),
      Patient.countDocuments({ status: "pending" }),
      Patient.countDocuments({
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      }),
      Patient.countDocuments({ gender: "male" }),
      Patient.countDocuments({ gender: "female" }),
      Patient.countDocuments({ "chronicConditions.2": { $exists: true } }),
      Patient.countDocuments({
        "chronicConditions.1": { $exists: true },
        "chronicConditions.2": { $exists: false },
      }),
      Patient.countDocuments({
        "chronicConditions.0": { $exists: true },
        "chronicConditions.1": { $exists: false },
      }),
    ]);

    const avgAgeResult = await Patient.aggregate([
      { $match: { age: { $exists: true, $ne: null } } },
      { $group: { _id: null, avgAge: { $avg: "$age" } } },
    ]);

    const bloodGroups = await Patient.aggregate([
      { $match: { bloodGroup: { $exists: true, $ne: null } } },
      { $group: { _id: "$bloodGroup", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        active,
        inactive,
        pending,
        newThisMonth,
        male,
        female,
        avgAge: avgAgeResult[0]?.avgAge || 0,
        bloodGroups,
        riskLevels: {
          high: highRisk,
          medium: mediumRisk,
          low: lowRisk,
          none: total - (highRisk + mediumRisk + lowRisk),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching patient stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient statistics",
    });
  }
});
// GET single patient - NOW IT WILL WORK!
router.get("/patients/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate(
        "primaryDoctor",
        "firstName lastName specialization email phone consultationFee",
      )
      .populate({
        path: "appointments",
        options: { sort: { date: -1 }, limit: 10 },
        populate: {
          path: "doctor",
          select: "firstName lastName specialization",
        },
      })
      .populate({
        path: "prescriptions",
        options: { sort: { date: -1 }, limit: 10 },
        populate: { path: "doctor", select: "firstName lastName" },
      });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Calculate metrics
    const totalAppointments = patient.appointments?.length || 0;
    const completedAppointments =
      patient.appointments?.filter((a) => a.status === "completed").length || 0;

    res.status(200).json({
      success: true,
      patient: {
        ...patient.toObject(),
        metrics: {
          totalAppointments,
          completedAppointments,
          completionRate: totalAppointments
            ? Math.round((completedAppointments / totalAppointments) * 100)
            : 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching patient:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient",
    });
  }
});

// GET single doctor - NOW IT WILL WORK!
router.get("/doctors/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate("patients", "fullName patientId email phone lastVisit status")
      .populate({
        path: "appointments",
        options: { sort: { date: -1 }, limit: 20 },
        populate: { path: "patient", select: "firstName lastName patientId" },
      });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const upcomingAppointments =
      doctor.appointments
        ?.filter(
          (a) =>
            new Date(a.date) > new Date() &&
            ["scheduled", "confirmed"].includes(a.status),
        )
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 10) || [];

    res.status(200).json({
      success: true,
      doctor: {
        ...doctor.toObject(),
        upcomingAppointments,
      },
    });
  } catch (error) {
    console.error("Error fetching doctor:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctor",
    });
  }
});
// GET single patient
router.get("/patients/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate(
        "primaryDoctor",
        "firstName lastName specialization email phone consultationFee",
      )
      .populate({
        path: "appointments",
        options: { sort: { date: -1 }, limit: 10 },
        populate: {
          path: "doctor",
          select: "firstName lastName specialization",
        },
      })
      .populate({
        path: "prescriptions",
        options: { sort: { date: -1 }, limit: 10 },
        populate: { path: "doctor", select: "firstName lastName" },
      });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Calculate metrics
    const totalAppointments = patient.appointments?.length || 0;
    const completedAppointments =
      patient.appointments?.filter((a) => a.status === "completed").length || 0;

    res.status(200).json({
      success: true,
      patient: {
        ...patient.toObject(),
        metrics: {
          totalAppointments,
          completedAppointments,
          completionRate: totalAppointments
            ? Math.round((completedAppointments / totalAppointments) * 100)
            : 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching patient:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient",
    });
  }
});

// CREATE patient
router.post("/patients", protect, authorize("admin"), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      bloodGroup,
      email,
      phone,
      address,
      emergencyContact,
      height,
      weight,
      insurance,
      primaryDoctor,
      notes,
    } = req.body;

    const existingPatient = await Patient.findOne({ email });
    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: "Patient with this email already exists",
      });
    }

    const patientCount = await Patient.countDocuments();
    const patientId = `PAT${(patientCount + 1001).toString().padStart(4, "0")}`;

    // Create user account
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Welcome123!", salt);

    const user = await User.create({
      email,
      password: hashedPassword,
      role: "patient",
      isActive: true,
    });

    const patient = await Patient.create({
      user: user._id,
      patientId,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      dateOfBirth,
      gender,
      bloodGroup,
      email,
      phone,
      address,
      emergencyContact,
      height,
      weight,
      insurance,
      primaryDoctor,
      notes,
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "Patient created successfully",
      patient,
    });
  } catch (error) {
    console.error("Error creating patient:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create patient",
    });
  }
});

// UPDATE patient
router.put("/patients/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const updates = req.body;
    delete updates._id;
    delete updates.patientId;
    delete updates.user;
    delete updates.createdAt;

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).populate("primaryDoctor", "firstName lastName specialization");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient updated successfully",
      patient,
    });
  } catch (error) {
    console.error("Error updating patient:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update patient",
    });
  }
});

// UPDATE patient status
router.put(
  "/patients/:id/status",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const { status } = req.body;

      const patient = await Patient.findByIdAndUpdate(
        req.params.id,
        { status, updatedAt: new Date() },
        { new: true, runValidators: true },
      );

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      res.status(200).json({
        success: true,
        message: `Patient status updated to ${status}`,
        patient,
      });
    } catch (error) {
      console.error("Error updating patient status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update patient status",
      });
    }
  },
);

// DELETE patient
router.delete(
  "/patients/:id",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const patient = await Patient.findById(req.params.id);

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      if (patient.user) {
        await User.findByIdAndDelete(patient.user);
      }

      await Appointment.deleteMany({ patient: patient._id });
      await Prescription.deleteMany({ patient: patient._id });
      await patient.deleteOne();

      res.status(200).json({
        success: true,
        message: "Patient and all associated data deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting patient:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete patient",
      });
    }
  },
);

// ============================================
// DOCTORS MANAGEMENT - FULL CRUD
// ============================================

// GET all doctors
router.get("/doctors", protect, authorize("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, specialization, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
      ];
    }

    if (specialization && specialization !== "all") {
      query.specialization = specialization;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    const doctors = await Doctor.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Doctor.countDocuments(query);

    res.status(200).json({
      success: true,
      doctors,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctors",
    });
  }
});

// GET doctor statistics
router.get("/doctors/stats", protect, authorize("admin"), async (req, res) => {
  try {
    const [
      total,
      available,
      onLeave,
      unavailable,
      specializationStats,
      ratingStats,
    ] = await Promise.all([
      Doctor.countDocuments(),
      Doctor.countDocuments({ status: "available" }),
      Doctor.countDocuments({ status: "on_leave" }),
      Doctor.countDocuments({ status: "unavailable" }),
      Doctor.aggregate([
        { $group: { _id: "$specialization", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Doctor.aggregate([
        { $match: { "ratings.average": { $exists: true } } },
        { $group: { _id: null, avg: { $avg: "$ratings.average" } } },
      ]),
    ]);

    const totalPatientsServed = await Doctor.aggregate([
      { $project: { patientCount: { $size: { $ifNull: ["$patients", []] } } } },
      { $group: { _id: null, total: { $sum: "$patientCount" } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        available,
        onLeave,
        unavailable,
        specializationStats,
        avgRating: ratingStats[0]?.avg || 0,
        totalPatientsServed: totalPatientsServed[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching doctor stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctor statistics",
    });
  }
});

// GET single doctor
router.get("/doctors/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate("patients", "fullName patientId email phone lastVisit")
      .populate({
        path: "appointments",
        options: { sort: { date: -1 }, limit: 20 },
        populate: { path: "patient", select: "firstName lastName patientId" },
      });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const upcomingAppointments = await Appointment.find({
      doctor: doctor._id,
      date: { $gte: new Date() },
      status: { $in: ["scheduled", "confirmed"] },
    })
      .populate("patient", "firstName lastName patientId")
      .sort({ date: 1, time: 1 })
      .limit(10);

    res.status(200).json({
      success: true,
      doctor: {
        ...doctor.toObject(),
        upcomingAppointments,
      },
    });
  } catch (error) {
    console.error("Error fetching doctor:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctor",
    });
  }
});

// CREATE doctor
router.post("/doctors", protect, authorize("admin"), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      specialization,
      qualifications,
      licenseNumber,
      experience,
      hospital,
      department,
      email,
      phone,
      consultationFee,
      availability,
      workingHours,
      bio,
      status,
    } = req.body;

    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: "Doctor with this email already exists",
      });
    }

    const doctorCount = await Doctor.countDocuments();
    const doctorId = `DOC${(doctorCount + 1001).toString().padStart(4, "0")}`;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password123", salt);

    const user = await User.create({
      email,
      password: hashedPassword,
      role: "doctor",
      isActive: true,
    });

    const doctor = await Doctor.create({
      user: user._id,
      doctorId,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      specialization,
      qualifications: qualifications || [],
      licenseNumber,
      experience: experience || 0,
      hospital: hospital || "City General Hospital",
      department: department || specialization,
      email,
      phone,
      consultationFee: consultationFee || 200,
      availability: availability || [],
      workingHours: workingHours || { start: "09:00", end: "17:00" },
      bio: bio || `Dr. ${lastName} is a specialist in ${specialization}.`,
      ratings: { average: 0, totalReviews: 0 },
      status: status || "available",
    });

    res.status(201).json({
      success: true,
      message: "Doctor created successfully",
      doctor,
    });
  } catch (error) {
    console.error("Error creating doctor:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create doctor",
    });
  }
});

// UPDATE doctor
router.put("/doctors/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const updates = req.body;
    delete updates._id;
    delete updates.doctorId;
    delete updates.user;
    delete updates.createdAt;
    delete updates.ratings;

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true },
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Doctor updated successfully",
      doctor,
    });
  } catch (error) {
    console.error("Error updating doctor:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update doctor",
    });
  }
});

// UPDATE doctor status
router.put(
  "/doctors/:id/status",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const { status } = req.body;

      const doctor = await Doctor.findByIdAndUpdate(
        req.params.id,
        { status, updatedAt: new Date() },
        { new: true, runValidators: true },
      );

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      res.status(200).json({
        success: true,
        message: `Doctor status updated to ${status}`,
        doctor,
      });
    } catch (error) {
      console.error("Error updating doctor status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update doctor status",
      });
    }
  },
);

// DELETE doctor
router.delete("/doctors/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    if (doctor.user) {
      await User.findByIdAndDelete(doctor.user);
    }

    await Appointment.updateMany(
      { doctor: doctor._id, status: { $in: ["scheduled", "confirmed"] } },
      { status: "cancelled", notes: "Cancelled - doctor removed from system" },
    );

    await Patient.updateMany(
      { primaryDoctor: doctor._id },
      { $unset: { primaryDoctor: 1 } },
    );

    await doctor.deleteOne();

    res.status(200).json({
      success: true,
      message: "Doctor deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete doctor",
    });
  }
});

// GET doctor's patients
router.get(
  "/doctors/:id/patients",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const patients = await Patient.find({ primaryDoctor: req.params.id })
        .select("fullName patientId email phone lastVisit status")
        .sort({ lastName: 1 });

      res.status(200).json({
        success: true,
        patients,
      });
    } catch (error) {
      console.error("Error fetching doctor's patients:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch doctor's patients",
      });
    }
  },
);

// GET doctor's appointments
router.get(
  "/doctors/:id/appointments",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const appointments = await Appointment.find({ doctor: req.params.id })
        .populate("patient", "firstName lastName patientId")
        .sort({ date: -1 });

      res.status(200).json({
        success: true,
        appointments,
      });
    } catch (error) {
      console.error("Error fetching doctor's appointments:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch doctor's appointments",
      });
    }
  },
);

// UPDATE doctor availability
router.put(
  "/doctors/:id/availability",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const { availability } = req.body;

      const doctor = await Doctor.findByIdAndUpdate(
        req.params.id,
        { availability, updatedAt: new Date() },
        { new: true, runValidators: true },
      );

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Availability updated successfully",
        availability: doctor.availability,
      });
    } catch (error) {
      console.error("Error updating availability:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update availability",
      });
    }
  },
);

// ============================================
// APPOINTMENTS MANAGEMENT
// ============================================

// GET all appointments
router.get("/appointments", protect, authorize("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, date } = req.query;
    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const appointments = await Appointment.find(query)
      .populate("patient", "firstName lastName patientId")
      .populate("doctor", "firstName lastName specialization")
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(query);

    res.status(200).json({
      success: true,
      appointments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
    });
  }
});

// GET appointment statistics
router.get(
  "/appointments/stats",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const [
        total,
        scheduled,
        confirmed,
        completed,
        cancelled,
        noShow,
        today,
        thisWeek,
        thisMonth,
      ] = await Promise.all([
        Appointment.countDocuments(),
        Appointment.countDocuments({ status: "scheduled" }),
        Appointment.countDocuments({ status: "confirmed" }),
        Appointment.countDocuments({ status: "completed" }),
        Appointment.countDocuments({ status: "cancelled" }),
        Appointment.countDocuments({ status: "no_show" }),
        Appointment.countDocuments({
          date: {
            $gte: new Date().setHours(0, 0, 0, 0),
            $lt: new Date().setHours(23, 59, 59, 999),
          },
        }),
        Appointment.countDocuments({
          date: {
            $gte: new Date(
              new Date().setDate(new Date().getDate() - new Date().getDay()),
            ),
            $lt: new Date(
              new Date().setDate(
                new Date().getDate() - new Date().getDay() + 7,
              ),
            ),
          },
        }),
        Appointment.countDocuments({
          date: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            $lt: new Date(
              new Date().getFullYear(),
              new Date().getMonth() + 1,
              0,
            ),
          },
        }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          total,
          scheduled,
          confirmed,
          completed,
          cancelled,
          noShow,
          today,
          thisWeek,
          thisMonth,
        },
      });
    } catch (error) {
      console.error("Error fetching appointment stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch appointment statistics",
      });
    }
  },
);

// GET single appointment
router.get(
  "/appointments/:id",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const appointment = await Appointment.findById(req.params.id)
        .populate("patient")
        .populate("doctor")
        .populate("prescription");

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      res.status(200).json({
        success: true,
        appointment,
      });
    } catch (error) {
      console.error("Error fetching appointment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch appointment",
      });
    }
  },
);

// UPDATE appointment status
router.put(
  "/appointments/:id/status",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const { status } = req.body;

      const appointment = await Appointment.findByIdAndUpdate(
        req.params.id,
        { status, updatedAt: new Date() },
        { new: true, runValidators: true },
      );

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      res.status(200).json({
        success: true,
        message: `Appointment status updated to ${status}`,
        appointment,
      });
    } catch (error) {
      console.error("Error updating appointment status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update appointment status",
      });
    }
  },
);

// ============================================
// PRESCRIPTIONS MANAGEMENT
// ============================================

// GET all prescriptions
router.get("/prescriptions", protect, authorize("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    const prescriptions = await Prescription.find(query)
      .populate("patient", "firstName lastName patientId email phone fullName")
      .populate(
        "doctor",
        "firstName lastName specialization email phone fullName",
      )
      .populate("appointment")
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Prescription.countDocuments(query);

    res.status(200).json({
      success: true,
      prescriptions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch prescriptions",
    });
  }
});

// GET single prescription
router.get(
  "/prescriptions/:id",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const prescription = await Prescription.findById(req.params.id)
        .populate("patient")
        .populate("doctor")
        .populate("appointment");

      if (!prescription) {
        return res.status(404).json({
          success: false,
          message: "Prescription not found",
        });
      }

      res.status(200).json({
        success: true,
        prescription,
      });
    } catch (error) {
      console.error("Error fetching prescription:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch prescription",
      });
    }
  },
);

// UPDATE prescription status
router.put(
  "/prescriptions/:id/status",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const { status } = req.body;

      const prescription = await Prescription.findByIdAndUpdate(
        req.params.id,
        { status, updatedAt: new Date() },
        { new: true, runValidators: true },
      );

      if (!prescription) {
        return res.status(404).json({
          success: false,
          message: "Prescription not found",
        });
      }

      res.status(200).json({
        success: true,
        message: `Prescription status updated to ${status}`,
        prescription,
      });
    } catch (error) {
      console.error("Error updating prescription status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update prescription status",
      });
    }
  },
);

// DELETE prescription
router.delete(
  "/prescriptions/:id",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const prescription = await Prescription.findById(req.params.id);

      if (!prescription) {
        return res.status(404).json({
          success: false,
          message: "Prescription not found",
        });
      }

      await prescription.deleteOne();

      res.status(200).json({
        success: true,
        message: "Prescription deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting prescription:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete prescription",
      });
    }
  },
);

// ============================================
// ANALYTICS & REPORTING – FULL INSIGHTS
// ============================================
router.get("/analytics", protect, authorize("admin"), async (req, res) => {
  try {
    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      totalPrescriptions,
      totalRevenue,

      // Last 7 days appointments
      last7Days,
      appointmentsPerDay,
      appointmentsScheduled,
      appointmentsCompleted,
      appointmentsCancelled,

      // Prescriptions per doctor
      prescriptionsPerDoctor,

      // Demographics
      ageDistribution,
      bloodGroupDistribution,
      genderDistribution,

      // Monthly trends
      monthlyRevenue,

      // Status distribution
      completedAppointments,
      scheduledAppointments,
      inProgressAppointments,
      cancelledAppointments,
      noShowAppointments,

      // Top conditions
      topConditions,

      // Peak hours
      peakHours,

      // Growth metrics
      patientGrowth,
      doctorGrowth,
      appointmentGrowth,
      revenueGrowth,
      prescriptionGrowth,
      completionRate,
      completionTrend,
    ] = await Promise.all([
      Patient.countDocuments(),
      Doctor.countDocuments(),
      Appointment.countDocuments(),
      Prescription.countDocuments(),

      // Total revenue from paid completed appointments
      Appointment.aggregate([
        { $match: { status: "completed", paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$fee" } } },
      ]).then((r) => r[0]?.total || 0),

      // Last 7 days labels
      getLast7Days(),

      // Appointments per day (all)
      getAppointmentsPerDay(),

      // Scheduled appointments per day
      getAppointmentsByStatusPerDay("scheduled"),

      // Completed appointments per day
      getAppointmentsByStatusPerDay("completed"),

      // Cancelled appointments per day
      getAppointmentsByStatusPerDay("cancelled"),

      // Prescriptions per doctor (top 5)
      Prescription.aggregate([
        { $group: { _id: "$doctor", count: { $sum: 1 } } },
        {
          $lookup: {
            from: "doctors",
            localField: "_id",
            foreignField: "_id",
            as: "doctorInfo",
          },
        },
        { $unwind: "$doctorInfo" },
        { $project: { doctor: "$doctorInfo.fullName", count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),

      // Age distribution
      Patient.aggregate([
        { $match: { age: { $exists: true } } },
        {
          $bucket: {
            groupBy: "$age",
            boundaries: [0, 18, 30, 45, 60, 120],
            default: "Unknown",
            output: { count: { $sum: 1 } },
          },
        },
      ]),

      // Blood group distribution
      Patient.aggregate([
        { $match: { bloodGroup: { $ne: null } } },
        { $group: { _id: "$bloodGroup", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Gender distribution
      Promise.all([
        Patient.countDocuments({ gender: "male" }),
        Patient.countDocuments({ gender: "female" }),
        Patient.countDocuments({ gender: "other" }),
      ]),

      // Monthly revenue (last 6 months)
      getMonthlyRevenue(),

      // Status counts
      Appointment.countDocuments({ status: "completed" }),
      Appointment.countDocuments({ status: "scheduled" }),
      Appointment.countDocuments({ status: "in_progress" }),
      Appointment.countDocuments({ status: "cancelled" }),
      Appointment.countDocuments({ status: "no_show" }),

      // Top chronic conditions
      getTopConditions(),

      // Peak hours
      getPeakHours(),

      // Growth rates
      calculateGrowth(Patient, "patient"),
      calculateGrowth(Doctor, "doctor"),
      calculateGrowth(Appointment, "appointment"),
      calculateRevenueGrowth(),
      calculateGrowth(Prescription, "prescription"),
      calculateCompletionRate(),
      calculateCompletionTrend(),
    ]);

    res.status(200).json({
      success: true,
      // KPI Cards
      totalPatients,
      totalDoctors,
      totalAppointments,
      totalPrescriptions,
      totalRevenue,

      // Appointments Chart
      last7Days,
      appointmentsPerDay,
      appointmentsScheduled,
      appointmentsCompleted,
      appointmentsCancelled,

      // Prescriptions Chart
      prescriptionsPerDoctor,

      // Demographics
      ageGroups: ageDistribution.map((a) => a._id),
      ageDistribution: ageDistribution.map((a) => a.count),
      bloodGroups: bloodGroupDistribution.map((b) => b._id),
      bloodGroupDistribution: bloodGroupDistribution.map((b) => b.count),
      malePatients: genderDistribution[0],
      femalePatients: genderDistribution[1],
      otherPatients: genderDistribution[2],

      // Revenue
      last6Months: getLast6Months(),
      monthlyRevenue,

      // Status Distribution
      completedAppointments,
      scheduledAppointments,
      inProgressAppointments,
      cancelledAppointments,
      noShowAppointments,

      // Medical Insights
      topConditions: topConditions.map((c) => c._id),
      conditionCounts: topConditions.map((c) => c.count),

      // Peak Hours
      peakHours,

      // Growth Metrics
      patientGrowth,
      doctorGrowth,
      appointmentGrowth,
      revenueGrowth,
      prescriptionGrowth,
      completionRate,
      completionTrend,
    });
  } catch (error) {
    console.error("❌ Analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics data",
    });
  }
});

// ============================================
// ANALYTICS HELPER FUNCTIONS
// ============================================

async function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    days.push(format(subDays(new Date(), i), "EEE"));
  }
  return days;
}

async function getAppointmentsPerDay() {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    const count = await Appointment.countDocuments({
      date: { $gte: date, $lt: nextDate },
    });
    data.push(count);
  }
  return data;
}

async function getAppointmentsByStatusPerDay(status) {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    const count = await Appointment.countDocuments({
      date: { $gte: date, $lt: nextDate },
      status,
    });
    data.push(count);
  }
  return data;
}

async function getMonthlyRevenue() {
  const data = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const revenue = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth, $lte: endOfMonth },
          status: "completed",
          paymentStatus: "paid",
        },
      },
      { $group: { _id: null, total: { $sum: "$fee" } } },
    ]);
    data.push(revenue[0]?.total || 0);
  }
  return data;
}

function getLast6Months() {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    months.push(format(date, "MMM"));
  }
  return months;
}

async function getTopConditions() {
  return Patient.aggregate([
    { $unwind: "$chronicConditions" },
    { $group: { _id: "$chronicConditions.name", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);
}

async function getPeakHours() {
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  const data = [];

  for (const hour of hours) {
    const hourStr = hour.toString().padStart(2, "0");
    const count = await Appointment.countDocuments({
      time: { $regex: `^${hourStr}` },
    });
    data.push(count);
  }
  return data;
}

async function calculateGrowth(model, type) {
  const thisMonth = await model.countDocuments({
    createdAt: {
      $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    },
  });

  const lastMonth = await model.countDocuments({
    createdAt: {
      $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      $lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    },
  });

  if (lastMonth === 0) return "+100%";
  const growth = (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(0);
  return `${growth > 0 ? "+" : ""}${growth}%`;
}

async function calculateRevenueGrowth() {
  const thisMonth = await Appointment.aggregate([
    {
      $match: {
        date: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
        status: "completed",
        paymentStatus: "paid",
      },
    },
    { $group: { _id: null, total: { $sum: "$fee" } } },
  ]);

  const lastMonth = await Appointment.aggregate([
    {
      $match: {
        date: {
          $gte: new Date(
            new Date().getFullYear(),
            new Date().getMonth() - 1,
            1,
          ),
          $lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
        status: "completed",
        paymentStatus: "paid",
      },
    },
    { $group: { _id: null, total: { $sum: "$fee" } } },
  ]);

  const thisMonthTotal = thisMonth[0]?.total || 0;
  const lastMonthTotal = lastMonth[0]?.total || 0;

  if (lastMonthTotal === 0) return "+100%";
  const growth = (
    ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) *
    100
  ).toFixed(0);
  return `${growth > 0 ? "+" : ""}${growth}%`;
}

async function calculateCompletionRate() {
  const total = await Appointment.countDocuments();
  const completed = await Appointment.countDocuments({ status: "completed" });
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

async function calculateCompletionTrend() {
  const thisMonth = await Appointment.countDocuments({
    status: "completed",
    date: {
      $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    },
  });

  const lastMonth = await Appointment.countDocuments({
    status: "completed",
    date: {
      $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      $lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    },
  });

  if (lastMonth === 0) return "+3%";
  const growth = (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(0);
  return `${growth > 0 ? "+" : ""}${growth}%`;
}
module.exports = router;
