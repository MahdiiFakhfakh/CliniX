const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    unique: true,
    required: true,
    default: () => `APT${Date.now()}${Math.floor(Math.random() * 1000)}`,
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  duration: {
    type: Number, // in minutes
    default: 30,
  },
  type: {
    type: String,
    enum: ["consultation", "follow-up", "checkup", "emergency", "video"],
    default: "consultation",
  },
  reason: {
    type: String,
    required: true,
  },
  symptoms: [String],
  status: {
    type: String,
    enum: [
      "scheduled",
      "confirmed",
      "in_progress",
      "completed",
      "cancelled",
      "no_show",
    ],
    default: "scheduled",
  },
  fee: {
    type: Number,
    default: 0,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "partial", "cancelled"],
    default: "pending",
  },
  notes: String,
  diagnosis: String,
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Prescription",
  },
  followUpDate: Date,
  reminderSent: {
    type: Boolean,
    default: false,
  },
  reminderDate: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for efficient queries
appointmentSchema.index({ date: 1 });
appointmentSchema.index({ patient: 1 });
appointmentSchema.index({ doctor: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ appointmentId: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
