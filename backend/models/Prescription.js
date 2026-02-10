const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema({
  prescriptionId: {
    type: String,
    unique: true,
    required: true,
    default: () => `RX${Date.now()}${Math.floor(Math.random() * 1000)}`,
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
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  medications: [
    {
      name: {
        type: String,
        required: true,
      },
      genericName: String,
      dosage: {
        type: String,
        required: true,
      },
      frequency: {
        type: String,
        required: true,
      },
      duration: {
        type: String,
        required: true,
      },
      quantity: Number,
      instructions: String,
      beforeMeal: Boolean,
      refills: {
        type: Number,
        default: 0,
      },
    },
  ],
  instructions: String,
  notes: String,
  status: {
    type: String,
    enum: ["active", "completed", "cancelled", "expired"],
    default: "active",
  },
  pharmacyNotes: String,
  followUpDate: Date,
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

// Indexes
prescriptionSchema.index({ prescriptionId: 1 });
prescriptionSchema.index({ patient: 1 });
prescriptionSchema.index({ doctor: 1 });
prescriptionSchema.index({ date: -1 });
prescriptionSchema.index({ status: 1 });

module.exports = mongoose.model("Prescription", prescriptionSchema);
