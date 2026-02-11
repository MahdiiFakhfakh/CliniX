const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor"); // adjust path if needed

// GET all doctors
router.get("/", async (req, res) => {
  try {
    const doctors = await Doctor.find(); // fetch all doctors from DB
    res.status(200).json({ success: true, data: doctors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
