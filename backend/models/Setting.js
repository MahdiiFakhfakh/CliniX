const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      sparse: true,
    },
    clinic: {
      name: { type: String, default: "CliniX Clinic" },
      address: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      website: { type: String, default: "" },
      hours: { type: String, default: "Mon-Fri 9:00-18:00" },
      timezone: { type: String, default: "Africa/Lagos" },
      appointmentDuration: { type: Number, default: 30, min: 10, max: 240 },
    },
    preferences: {
      notifications: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: true },
      appointmentReminders: { type: Boolean, default: true },
      doctorApprovalAlerts: { type: Boolean, default: true },
      prescriptionAlerts: { type: Boolean, default: true },
      compactTables: { type: Boolean, default: false },
      defaultDashboardRange: {
        type: String,
        enum: ["7d", "30d", "90d"],
        default: "7d",
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Setting", settingSchema);
