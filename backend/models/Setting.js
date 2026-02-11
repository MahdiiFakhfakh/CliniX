const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
  admin: {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // hashed
  },
  clinic: {
    name: { type: String, default: "CliniX Clinic" },
    address: { type: String, default: "123 Main St" },
    phone: { type: String, default: "+123456789" },
    hours: { type: String, default: "Mon-Fri 9:00-18:00" },
  },
  preferences: {
    theme: { type: String, enum: ["light", "dark"], default: "light" },
    notifications: { type: Boolean, default: true },
  },
});

module.exports = mongoose.model("Setting", settingSchema);
