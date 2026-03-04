const express = require("express");
const router = express.Router();
const Medication = require("../models/Medication");

router.post("/batch", async (req, res) => {
  try {
    const medsArray = req.body; // expect an array of medicines
    if (!Array.isArray(medsArray)) {
      return res.status(400).json({ error: "Body must be an array of medicines" });
    }

    const saved = await Medication.insertMany(medsArray);
    res.status(201).json(saved);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const meds = await Medication.find({ isActive: true }); // only active meds
    res.json(meds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;