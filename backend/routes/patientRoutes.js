const express = require("express");
const router = express.Router();
const {
  getAllPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  updatePatientStatus,
  getPatientStats,
} = require("../controllers/patientController");

// All routes require authentication (you'll add middleware later)

// GET /api/patients
router.get("/", getAllPatients);

// GET /api/patients/stats
router.get("/stats", getPatientStats);

// GET /api/patients/:id
router.get("/:id", getPatient);

// POST /api/patients
router.post("/", createPatient);

// PUT /api/patients/:id
router.put("/:id", updatePatient);

// DELETE /api/patients/:id
router.delete("/:id", deletePatient);

// PUT /api/patients/:id/status
router.put("/:id/status", updatePatientStatus);

module.exports = router;
