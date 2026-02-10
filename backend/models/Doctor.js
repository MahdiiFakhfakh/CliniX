const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  doctorId: {
    type: String,
    unique: true,
    required: true,
    default: () => `DOC${Date.now()}${Math.floor(Math.random() * 1000)}`,
  },
  firstName: {
    type: String,
    required: [true, "First name is required"],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
    trim: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  specialization: {
    type: String,
    required: [true, "Specialization is required"],
  },
  qualifications: [String],
  licenseNumber: {
    type: String,
    required: [true, "License number is required"],
    unique: true,
  },
  experience: {
    type: Number, // in years
    min: 0,
    default: 0,
  },
  hospital: String,
  department: {
    type: String,
    required: [true, "Department is required"],
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
  },
  consultationFee: {
    type: Number,
    required: [true, "Consultation fee is required"],
    min: 0,
  },
  availability: [
    {
      day: {
        type: String,
        enum: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ],
      },
      startTime: String,
      endTime: String,
      isAvailable: { type: Boolean, default: true },
    },
  ],
  workingHours: {
    start: String,
    end: String,
  },
  profileImage: String,
  bio: String,
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  status: {
    type: String,
    enum: ["available", "on_leave", "unavailable"],
    default: "available",
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-generate full name
doctorSchema.pre("save", function (next) {
  this.fullName = `${this.firstName} ${this.lastName}`.trim();
  this.updatedAt = Date.now();
  next();
});

// Indexes
doctorSchema.index({ doctorId: 1 });
doctorSchema.index({ fullName: "text", specialization: "text", email: "text" });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ department: 1 });
doctorSchema.index({ status: 1 });

module.exports = mongoose.model("Doctor", doctorSchema);
