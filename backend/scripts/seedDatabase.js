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

    // --------------------
    // 1. Admin User
    // --------------------
    const adminPassword = process.env.ADMIN_PASSWORD || "password123";
    const adminEmail = process.env.ADMIN_EMAIL || "admin@clinix.com";
    const salt = await bcrypt.genSalt(10);
    const hashedAdminPassword = await bcrypt.hash(adminPassword, salt);

    const adminUser = await User.create({
      name: "Admin User",
      email: adminEmail,
      password: hashedAdminPassword,
      role: "admin",
      isActive: true,
      lastLogin: new Date(),
    });

    await Admin.create({
      user: adminUser._id,
      firstName: "Admin",
      lastName: "User",
      fullName: "Admin User",
      phone: "16515114567",
      department: "management",
    });

    console.log("👑 Admin created:", adminEmail);

    // --------------------
    // 2. Doctors
    // --------------------
    const doctorData = [
      {
        name: "Robert Smith",
        email: "dr.smith@clinix.com",
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
        phone: "16515114567",
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
        name: "Sarah Johnson",
        email: "dr.johnson@clinix.com",
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
        phone: "16515114567",
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
    ];

    // Create User accounts for doctors
    const doctorUsers = await Promise.all(
      doctorData.map(async (doc) => {
        const hashedPassword = await bcrypt.hash("password123", 10);
        return User.create({
          name: doc.name,
          email: doc.email,
          password: hashedPassword,
          role: "doctor",
          isActive: true,
          lastLogin: new Date(),
        });
      }),
    );

    // Create Doctor profiles
    const doctors = await Doctor.insertMany(
      doctorData.map((doc, i) => ({
        ...doc,
        user: doctorUsers[i]._id,
      })),
    );

    console.log(`👨‍⚕️ ${doctors.length} doctors created`);

    // --------------------
    // 3. Patients
    // --------------------
    const patientData = [
      {
        name: "John Doe",
        email: "john.doe@example.com",
        patientId: "PAT1001",
        firstName: "John",
        lastName: "Doe",
        fullName: "John Doe",
        dateOfBirth: new Date("1985-06-15"),
        gender: "male",
        bloodGroup: "O+",
        phone: "16515114567",
        primaryDoctor: doctors[0]._id,
        status: "active",
      },
      {
        name: "Jane Smith",
        email: "jane.smith@example.com",
        patientId: "PAT1002",
        firstName: "Jane",
        lastName: "Smith",
        fullName: "Jane Smith",
        dateOfBirth: new Date("1992-11-22"),
        gender: "female",
        bloodGroup: "A+",
        phone: "16515114567",
        primaryDoctor: doctors[1]._id,
        status: "active",
      },
    ];

    const patientUsers = await Promise.all(
      patientData.map(async (p) => {
        const hashedPassword = await bcrypt.hash("password123", 10);
        return User.create({
          name: p.name,
          email: p.email,
          password: hashedPassword,
          role: "patient",
          isActive: true,
          lastLogin: new Date(),
        });
      }),
    );

    const patients = await Patient.insertMany(
      patientData.map((p, i) => ({
        ...p,
        user: patientUsers[i]._id,
      })),
    );

    console.log(`👤 ${patients.length} patients created`);

    // --------------------
    // 4. Appointments
    // --------------------
    const appointments = await Appointment.insertMany([
      {
        appointmentId: "APT1001",
        patient: patients[0]._id,
        doctor: doctors[0]._id,
        date: new Date("2024-03-15"),
        time: "10:30",
        duration: 30,
        type: "consultation",
        reason: "Routine checkup",
        status: "completed",
        fee: 200,
        paymentStatus: "paid",
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
      },
    ]);

    console.log(`📅 ${appointments.length} appointments created`);

    console.log("========================================");
    console.log("✅ DATABASE SEEDING COMPLETE!");
    console.log("========================================");
    console.log("Database:", process.env.MONGO_URI);
    console.log("Admin Login:", adminEmail, "/", adminPassword);
    console.log("Doctor Login: dr.smith@clinix.com / password123");
    console.log("Doctor Login: dr.johnson@clinix.com / password123");
    console.log("Patient Login: john.doe@example.com / password123");
    console.log("Patient Login: jane.smith@example.com / password123");
    console.log("========================================");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
};

seedDatabase();
