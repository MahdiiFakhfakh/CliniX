const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
  getDashboardStats,
  getAllPatients,
  getAllDoctors,
  getAllAppointments,
  getSystemAnalytics,
  manageUser,
  sendNotification,
  getActivityLogs,
  backupDatabase,
  getSystemSettings,
  updateSystemSettings,
} = require("../controllers/adminController");

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize("admin"));

// Dashboard
router.get("/dashboard/stats", getDashboardStats);
router.get("/analytics", getSystemAnalytics);

// Patient Management
router.get("/patients", getAllPatients);

// Doctor Management
router.get("/doctors", getAllDoctors);

// Appointment Management
router.get("/appointments", getAllAppointments);

// User Management
router.put("/users/:id/status", manageUser);

// Notifications
router.post("/notifications/send", sendNotification);

// System Management
router.get("/activity-logs", getActivityLogs);
router.post("/backup", backupDatabase);
router.get("/settings", getSystemSettings);
router.put("/settings", updateSystemSettings);

module.exports = router;
