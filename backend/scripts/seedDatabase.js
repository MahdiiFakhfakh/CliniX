const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Import models
const User = require("../models/User");
const Admin = require("../models/Admin");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await Admin.deleteMany({});
    await Patient.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});
    await Prescription.deleteMany({});
    console.log("🗑️  Database cleared");
  } catch (error) {
    console.error("Error clearing database:", error);
  }
};

const seedDatabase = async () => {
  try {
    await connectDB();
    await clearDatabase();

    console.log("🌱 Seeding database...");

    // 1. Create Admin User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD || "password123",
      salt,
    );

    const adminUser = await User.create({
      email: process.env.ADMIN_EMAIL || "admin@clinix.com",
      password: hashedPassword,
      role: "admin",
      isActive: true,
      lastLogin: new Date(),
    });

    const adminProfile = await Admin.create({
      user: adminUser._id,
      firstName: "Admin",
      lastName: "User",
      fullName: "Admin User",
      phone: "+1 (555) 123-4567",
      department: "management",
    });

    console.log("👑 Admin created:", adminUser.email);

    // 2. Create Sample Doctors
    const doctors = await Doctor.insertMany([
      {
        doctorId: "DOC1001",
        firstName: "Robert",
        lastName: "Smith",
        fullName: "Robert Smith",
        specialization: "Cardiology",
        qualifications: ["MD", "FACC"],
        licenseNumber: "CARD123456",
        experience: 15,
        hospital: "City General Hospital",
        department: "Cardiology",
        phone: "+1 (555) 234-5678",
        email: "dr.smith@clinix.com",
        consultationFee: 200,
        availability: [
          {
            day: "monday",
            startTime: "09:00",
            endTime: "17:00",
            isAvailable: true,
          },
          {
            day: "tuesday",
            startTime: "09:00",
            endTime: "17:00",
            isAvailable: true,
          },
          {
            day: "wednesday",
            startTime: "09:00",
            endTime: "17:00",
            isAvailable: true,
          },
          {
            day: "thursday",
            startTime: "09:00",
            endTime: "17:00",
            isAvailable: true,
          },
          {
            day: "friday",
            startTime: "09:00",
            endTime: "16:00",
            isAvailable: true,
          },
        ],
        workingHours: { start: "09:00", end: "17:00" },
        bio: "Senior Cardiologist with 15 years of experience in heart diseases.",
        ratings: { average: 4.8, totalReviews: 124 },
        status: "available",
      },
      {
        doctorId: "DOC1002",
        firstName: "Sarah",
        lastName: "Johnson",
        fullName: "Sarah Johnson",
        specialization: "Pediatrics",
        qualifications: ["MD", "FAAP"],
        licenseNumber: "PED123456",
        experience: 10,
        hospital: "Children's Medical Center",
        department: "Pediatrics",
        phone: "+1 (555) 345-6789",
        email: "dr.johnson@clinix.com",
        consultationFee: 150,
        availability: [
          {
            day: "monday",
            startTime: "08:00",
            endTime: "16:00",
            isAvailable: true,
          },
          {
            day: "tuesday",
            startTime: "08:00",
            endTime: "16:00",
            isAvailable: true,
          },
          {
            day: "wednesday",
            startTime: "08:00",
            endTime: "16:00",
            isAvailable: true,
          },
          {
            day: "thursday",
            startTime: "08:00",
            endTime: "16:00",
            isAvailable: true,
          },
          {
            day: "friday",
            startTime: "08:00",
            endTime: "15:00",
            isAvailable: true,
          },
        ],
        workingHours: { start: "08:00", end: "16:00" },
        bio: "Pediatric specialist focusing on child healthcare and development.",
        ratings: { average: 4.9, totalReviews: 89 },
        status: "available",
      },
    ]);

    console.log(`👨‍⚕️ ${doctors.length} doctors created`);

    // 3. Create Sample Patients
    const patients = await Patient.insertMany([
      {
        patientId: "PAT1001",
        firstName: "John",
        lastName: "Doe",
        fullName: "John Doe",
        dateOfBirth: new Date("1985-06-15"),
        gender: "male",
        bloodGroup: "O+",
        address: {
          street: "123 Main Street",
          city: "New York",
          state: "NY",
          country: "USA",
          zipCode: "10001",
        },
        phone: "+1 (555) 456-7890",
        email: "john.doe@example.com",
        emergencyContact: {
          name: "Mary Doe",
          relationship: "Spouse",
          phone: "+1 (555) 456-7891",
        },
        height: 180,
        weight: 75,
        allergies: [
          {
            name: "Penicillin",
            severity: "severe",
            notes: "Causes anaphylaxis",
          },
        ],
        chronicConditions: [
          {
            name: "Hypertension",
            diagnosedDate: new Date("2020-03-10"),
            status: "active",
            treatment: "Lisinopril 10mg daily",
          },
        ],
        insurance: {
          provider: "Blue Cross",
          policyNumber: "BC123456789",
          expiryDate: new Date("2024-12-31"),
        },
        primaryDoctor: doctors[0]._id,
        lastVisit: new Date("2024-03-15"),
        nextAppointment: new Date("2024-04-15"),
        status: "active",
      },
      {
        patientId: "PAT1002",
        firstName: "Jane",
        lastName: "Smith",
        fullName: "Jane Smith",
        dateOfBirth: new Date("1992-11-22"),
        gender: "female",
        bloodGroup: "A+",
        address: {
          street: "456 Oak Avenue",
          city: "Los Angeles",
          state: "CA",
          country: "USA",
          zipCode: "90001",
        },
        phone: "+1 (555) 567-8901",
        email: "jane.smith@example.com",
        emergencyContact: {
          name: "James Smith",
          relationship: "Husband",
          phone: "+1 (555) 567-8902",
        },
        height: 165,
        weight: 58,
        allergies: [],
        chronicConditions: [],
        insurance: {
          provider: "Aetna",
          policyNumber: "AE987654321",
          expiryDate: new Date("2024-11-30"),
        },
        primaryDoctor: doctors[1]._id,
        lastVisit: new Date("2024-03-10"),
        nextAppointment: new Date("2024-04-10"),
        status: "active",
      },
    ]);

    console.log(`👤 ${patients.length} patients created`);

    // 4. Create Sample Appointments
    const appointments = await Appointment.insertMany([
      {
        appointmentId: "APT1001",
        patient: patients[0]._id,
        doctor: doctors[0]._id,
        date: new Date("2024-03-15"),
        time: "10:30",
        duration: 30,
        type: "consultation",
        reason: "Routine checkup and blood pressure review",
        symptoms: ["Headache", "Fatigue"],
        status: "completed",
        fee: 200,
        paymentStatus: "paid",
        notes: "Patient showed improvement",
        diagnosis: "Hypertension under control",
        followUpDate: new Date("2024-06-15"),
      },
      {
        appointmentId: "APT1002",
        patient: patients[1]._id,
        doctor: doctors[1]._id,
        date: new Date("2024-03-20"),
        time: "14:00",
        duration: 45,
        type: "checkup",
        reason: "Annual pediatric checkup",
        status: "scheduled",
        fee: 150,
        paymentStatus: "pending",
        notes: "First visit, need vaccination records",
      },
    ]);

    console.log(`📅 ${appointments.length} appointments created`);

    console.log("========================================");
    console.log("✅ DATABASE SEEDING COMPLETE!");
    console.log("========================================");
    console.log("Database:", process.env.MONGO_URI);
    console.log(
      "Admin Login:",
      process.env.ADMIN_EMAIL,
      "/",
      process.env.ADMIN_PASSWORD,
    );
    console.log("========================================");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
};

seedDatabase();
