const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  patientId: {
    type: String,
    unique: true,
    required: true,
    default: () => `PAT${Date.now()}${Math.floor(Math.random() * 1000)}`,
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
  dateOfBirth: {
    type: Date,
    required: [true, "Date of birth is required"],
  },
  age: {
    type: Number,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    required: true,
  },
  bloodGroup: {
    type: String,
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"],
    default: "Unknown",
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: {
      type: String,
      default: "USA",
    },
    zipCode: String,
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    match: [/^[0-9]{10,15}$/, "Please add a valid phone number"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please add a valid email"],
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
  },
  height: {
    type: Number, // in cm
    min: [50, "Height must be at least 50cm"],
    max: [300, "Height cannot exceed 300cm"],
  },
  weight: {
    type: Number, // in kg
    min: [2, "Weight must be at least 2kg"],
    max: [300, "Weight cannot exceed 300kg"],
  },
  bmi: {
    type: Number,
    min: [10, "BMI must be at least 10"],
    max: [60, "BMI cannot exceed 60"],
  },
  allergies: [
    {
      name: String,
      severity: {
        type: String,
        enum: ["mild", "moderate", "severe"],
      },
      notes: String,
    },
  ],
  chronicConditions: [
    {
      name: String,
      diagnosedDate: Date,
      status: {
        type: String,
        enum: ["active", "in remission", "resolved"],
      },
      treatment: String,
    },
  ],
  currentMedications: [
    {
      name: String,
      dosage: String,
      frequency: String,
      startDate: Date,
      endDate: Date,
      prescribedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
      },
    },
  ],
  insurance: {
    provider: String,
    policyNumber: String,
    expiryDate: Date,
  },
  primaryDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
  },
  appointments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
  ],

  prescriptions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
    },
  ],
  lastVisit: Date,
  nextAppointment: Date,
  status: {
    type: String,
    enum: ["active", "inactive", "pending"],
    default: "active",
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

// Auto-calculate age, full name, and BMI
patientSchema.pre("save", function (next) {
  this.fullName = `${this.firstName} ${this.lastName}`.trim();

  // Calculate age
  if (this.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    this.age = age;
  }

  // Calculate BMI
  if (this.height && this.weight) {
    const heightInMeters = this.height / 100;
    this.bmi = parseFloat(
      (this.weight / (heightInMeters * heightInMeters)).toFixed(2),
    );
  }

  this.updatedAt = Date.now();
  next();
});

// Indexes
patientSchema.index({ patientId: 1 });
patientSchema.index({ fullName: "text", email: "text", phone: "text" });
patientSchema.index({ status: 1 });
patientSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Patient", patientSchema);
