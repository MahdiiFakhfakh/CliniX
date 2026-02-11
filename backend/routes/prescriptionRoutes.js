const express = require("express");
const router = express.Router();
const Prescription = require("../models/Prescription");

router.get("/", async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .populate("patient")
      .populate("doctor");

    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
