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

// Helper function to generate random date
const randomDate = (start, end) => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
};

// Helper function to generate random time
const randomTime = () => {
  const hours = Math.floor(Math.random() * 12) + 8; // 8 AM to 8 PM
  const minutes = Math.random() < 0.5 ? "00" : "30";
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
};

// ✅ Helper function to generate valid phone number (only digits)
const generatePhoneNumber = () => {
  const areaCode = Math.floor(Math.random() * 900 + 100); // 100-999
  const prefix = Math.floor(Math.random() * 900 + 100); // 100-999
  const lineNumber = Math.floor(Math.random() * 9000 + 1000); // 1000-9999
  return `${areaCode}${prefix}${lineNumber}`; // Returns only digits: 1234567890
};

const seedDatabase = async () => {
  try {
    await connectDB();
    await clearDatabase();

    console.log("🌱 Seeding database with extensive data...");

    // ============================================
    // 1. ADMIN USER
    // ============================================
    const adminPassword = process.env.ADMIN_PASSWORD || "password123";
    const adminEmail = process.env.ADMIN_EMAIL || "admin@clinix.com";

    const adminUser = await User.create({
      name: "Admin User",
      email: adminEmail,
      password: adminPassword,
      role: "admin",
    });

    await Admin.create({
      user: adminUser._id,
      firstName: "Admin",
      lastName: "User",
      fullName: "Admin User",
      phone: generatePhoneNumber(), // ✅ Fixed: digits only
      department: "management",
    });

    console.log("👑 Admin created:", adminEmail);

    // ============================================
    // 2. DOCTORS - 25 Doctors
    // ============================================

    const doctorSpecializations = [
      { spec: "Cardiology", dept: "Cardiology", fee: 250, exp: 15 },
      { spec: "Pediatrics", dept: "Pediatrics", fee: 180, exp: 12 },
      { spec: "Orthopedics", dept: "Orthopedics", fee: 220, exp: 14 },
      { spec: "Neurology", dept: "Neurology", fee: 300, exp: 18 },
      { spec: "Dermatology", dept: "Dermatology", fee: 160, exp: 10 },
      { spec: "Gynecology", dept: "Gynecology", fee: 200, exp: 13 },
      { spec: "Ophthalmology", dept: "Ophthalmology", fee: 170, exp: 11 },
      { spec: "Psychiatry", dept: "Psychiatry", fee: 190, exp: 12 },
      { spec: "Oncology", dept: "Oncology", fee: 350, exp: 20 },
      { spec: "Endocrinology", dept: "Endocrinology", fee: 210, exp: 14 },
      { spec: "Gastroenterology", dept: "Gastroenterology", fee: 230, exp: 16 },
      { spec: "Nephrology", dept: "Nephrology", fee: 240, exp: 15 },
      { spec: "Pulmonology", dept: "Pulmonology", fee: 220, exp: 13 },
      { spec: "Urology", dept: "Urology", fee: 250, exp: 17 },
      { spec: "Rheumatology", dept: "Rheumatology", fee: 210, exp: 14 },
      { spec: "Hematology", dept: "Hematology", fee: 260, exp: 16 },
      {
        spec: "Infectious Disease",
        dept: "Internal Medicine",
        fee: 230,
        exp: 15,
      },
      { spec: "Allergy & Immunology", dept: "Allergy", fee: 170, exp: 11 },
      { spec: "Emergency Medicine", dept: "Emergency", fee: 280, exp: 12 },
      { spec: "Family Medicine", dept: "Family Medicine", fee: 150, exp: 9 },
      { spec: "Geriatrics", dept: "Geriatrics", fee: 180, exp: 14 },
      { spec: "Neonatology", dept: "Pediatrics", fee: 290, exp: 16 },
      { spec: "Vascular Surgery", dept: "Surgery", fee: 400, exp: 19 },
      { spec: "Plastic Surgery", dept: "Surgery", fee: 450, exp: 17 },
      { spec: "Cardiothoracic Surgery", dept: "Surgery", fee: 500, exp: 22 },
    ];

    const firstNames = [
      "James",
      "Mary",
      "Robert",
      "Patricia",
      "John",
      "Jennifer",
      "Michael",
      "Linda",
      "William",
      "Elizabeth",
      "David",
      "Susan",
      "Richard",
      "Jessica",
      "Joseph",
      "Sarah",
      "Thomas",
      "Karen",
      "Charles",
      "Nancy",
      "Christopher",
      "Lisa",
      "Daniel",
      "Margaret",
      "Matthew",
      "Betty",
      "Anthony",
      "Sandra",
      "Donald",
      "Ashley",
      "Mark",
      "Kimberly",
      "Paul",
      "Emily",
      "Steven",
      "Donna",
      "Andrew",
      "Michelle",
      "Kenneth",
      "Carol",
      "Joshua",
      "Amanda",
      "Kevin",
      "Melissa",
      "Brian",
      "Deborah",
      "George",
      "Stephanie",
    ];

    const lastNames = [
      "Smith",
      "Johnson",
      "Williams",
      "Brown",
      "Jones",
      "Garcia",
      "Miller",
      "Davis",
      "Rodriguez",
      "Martinez",
      "Hernandez",
      "Lopez",
      "Gonzalez",
      "Wilson",
      "Anderson",
      "Thomas",
      "Taylor",
      "Moore",
      "Jackson",
      "Martin",
      "Lee",
      "Perez",
      "Thompson",
      "White",
      "Harris",
      "Sanchez",
      "Clark",
      "Ramirez",
      "Lewis",
      "Robinson",
      "Walker",
      "Young",
      "Allen",
      "King",
      "Wright",
      "Scott",
      "Torres",
      "Nguyen",
      "Hill",
      "Flores",
      "Green",
      "Adams",
      "Nelson",
      "Baker",
      "Hall",
      "Rivera",
      "Campbell",
      "Mitchell",
    ];

    const hospitals = [
      "City General Hospital",
      "St. Mary's Medical Center",
      "University Medical Center",
      "Community Health Hospital",
      "Memorial Hospital",
      "Presbyterian Medical Center",
      "Mercy General Hospital",
      "Veterans Affairs Medical Center",
      "Children's Hospital",
      "Regional Medical Center",
      "Harborview Medical Center",
      "Cedars-Sinai Medical Center",
      "Johns Hopkins Hospital",
      "Mayo Clinic",
      "Cleveland Clinic",
      "Massachusetts General",
      "Stanford Health Care",
      "UCLA Medical Center",
      "NYU Langone Health",
      "Mount Sinai Hospital",
    ];

    const qualifications = [
      ["MD", "PhD"],
      ["MD", "FACC"],
      ["MD", "FAAP"],
      ["MD", "FACS"],
      ["MD", "FACP"],
      ["MD", "FRCP"],
      ["MBBS", "MRCP"],
      ["DO", "FACC"],
      ["MD", "MPH"],
      ["MD", "FACOG"],
      ["MD", "FAAAAI"],
      ["MD", "FASN"],
      ["MD", "FACG"],
      ["MD", "FACR"],
      ["MD", "FACEP"],
      ["MD", "FAAEM"],
      ["MD", "FACOEM"],
      ["MD", "FCCP"],
      ["MD", "FSCAI"],
      ["MD", "FHRS"],
      ["MD", "FACMG"],
      ["MD", "FACNP"],
      ["MD", "FAAN"],
      ["MD", "FACOG"],
      ["MD", "FACS"],
    ];

    console.log("👨‍⚕️ Creating 25 doctors...");

    const doctors = [];
    const doctorUsers = [];

    for (let i = 0; i < 25; i++) {
      const spec = doctorSpecializations[i];
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      const fullName = `Dr. ${firstName} ${lastName}`;
      const email = `dr.${firstName.toLowerCase()}.${lastName.toLowerCase()}@clinix.com`;

      const user = await User.create({
        name: fullName,
        email,
        password: "password123",
        role: "doctor",
      });

      doctorUsers.push(user);

      // Generate availability schedule
      const availability = [];
      const days = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      for (let d = 0; d < 5 + Math.floor(Math.random() * 2); d++) {
        if (d < 5 || Math.random() > 0.5) {
          availability.push({
            day: days[d],
            startTime: `${8 + Math.floor(Math.random() * 2)}:00`,
            endTime: `${16 + Math.floor(Math.random() * 2)}:00`,
            isAvailable: true,
          });
        }
      }

      // Create doctor profile
      const doctor = await Doctor.create({
        user: user._id,
        doctorId: `DOC${2000 + i + 1}`,
        firstName,
        lastName,
        fullName,
        specialization: spec.spec,
        qualifications: qualifications[i % qualifications.length],
        licenseNumber: `${spec.spec.substring(0, 4).toUpperCase()}${100000 + i}`,
        experience: spec.exp,
        hospital: hospitals[Math.floor(Math.random() * hospitals.length)],
        department: spec.dept,
        phone: generatePhoneNumber(), // ✅ Fixed: digits only
        email,
        consultationFee: spec.fee + Math.floor(Math.random() * 50),
        availability,
        workingHours: { start: "09:00", end: "17:00" },
        bio: `Dr. ${lastName} is a board-certified ${spec.spec.toLowerCase()} specialist with ${spec.exp} years of experience.`,
        ratings: {
          average: Number((4 + Math.random()).toFixed(1)),
          totalReviews: Math.floor(Math.random() * 200 + 50),
        },
        status:
          Math.random() > 0.2
            ? "available"
            : Math.random() > 0.5
              ? "on_leave"
              : "unavailable",
      });

      doctors.push(doctor);
    }

    console.log(`✅ ${doctors.length} doctors created`);

    // ============================================
    // 3. PATIENTS - 50 Patients
    // ============================================
    console.log("👤 Creating 50 patients...");

    const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const cities = [
      "New York",
      "Los Angeles",
      "Chicago",
      "Houston",
      "Phoenix",
      "Philadelphia",
      "San Antonio",
      "San Diego",
      "Dallas",
      "San Jose",
      "Austin",
      "Jacksonville",
      "Fort Worth",
      "Columbus",
      "Charlotte",
      "San Francisco",
      "Indianapolis",
      "Seattle",
      "Denver",
      "Washington",
      "Boston",
      "Nashville",
      "Baltimore",
      "Portland",
    ];

    const conditions = [
      ["Hypertension"],
      ["Type 2 Diabetes"],
      ["Asthma"],
      ["Arthritis"],
      ["Migraine"],
      ["Hypothyroidism"],
      ["Anxiety"],
      ["Depression"],
      ["GERD"],
      ["Allergies"],
      ["Hypertension", "Type 2 Diabetes"],
      ["Asthma", "Allergies"],
      ["Arthritis", "Hypertension"],
      ["Migraine", "Anxiety"],
      ["Hypothyroidism", "Depression"],
      ["GERD", "Anxiety"],
      ["Heart Disease"],
      ["COPD"],
      ["Chronic Kidney Disease"],
      ["Osteoporosis"],
      ["Rheumatoid Arthritis"],
      ["Multiple Sclerosis"],
      ["Parkinson's Disease"],
      ["Epilepsy"],
      ["Crohn's Disease"],
    ];

    const allergies = [
      ["Penicillin"],
      ["Sulfa"],
      ["Aspirin"],
      ["Ibuprofen"],
      ["Codeine"],
      ["Latex"],
      ["Pollen"],
      ["Dust Mites"],
      ["Peanuts"],
      ["Shellfish"],
      ["Penicillin", "Sulfa"],
      ["Peanuts", "Shellfish"],
      ["Dust Mites", "Pollen"],
      [],
      [],
      [],
      [],
    ];

    const patients = [];
    const patientUsers = [];

    for (let i = 0; i < 50; i++) {
      const firstName =
        firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const fullName = `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@example.com`;

      const user = await User.create({
        name: fullName,
        email,
        password: "password123",
        role: "patient",
      });

      patientUsers.push(user);

      const birthDate = randomDate(
        new Date(1950, 0, 1),
        new Date(2005, 11, 31),
      );
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      const randomConditions =
        conditions[Math.floor(Math.random() * conditions.length)];
      const randomAllergies =
        allergies[Math.floor(Math.random() * allergies.length)];
      const primaryDoctor = doctors[Math.floor(Math.random() * doctors.length)];

      // ✅ Create patient profile with valid phone number (digits only)
      const patient = await Patient.create({
        user: user._id,
        patientId: `PAT${3000 + i + 1}`,
        firstName,
        lastName,
        fullName,
        dateOfBirth: birthDate,
        age,
        gender: Math.random() > 0.5 ? "male" : "female",
        bloodGroup: bloodGroups[Math.floor(Math.random() * bloodGroups.length)],
        address: {
          street: `${Math.floor(Math.random() * 9999) + 100} ${["Main", "Oak", "Pine", "Maple", "Cedar"][Math.floor(Math.random() * 5)]} ${["St", "Ave", "Blvd", "Dr", "Ln"][Math.floor(Math.random() * 5)]}`,
          city: cities[Math.floor(Math.random() * cities.length)],
          state: ["CA", "NY", "TX", "FL", "IL", "PA", "OH", "GA", "NC", "MI"][
            Math.floor(Math.random() * 10)
          ],
          country: "USA",
          zipCode: `${Math.floor(Math.random() * 90000 + 10000)}`,
        },
        phone: generatePhoneNumber(), // ✅ Fixed: digits only (e.g., 1234567890)
        email,
        emergencyContact: {
          name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
          relationship: ["Spouse", "Parent", "Child", "Sibling", "Friend"][
            Math.floor(Math.random() * 5)
          ],
          phone: generatePhoneNumber(), // ✅ Fixed: digits only
        },
        height: Math.floor(Math.random() * 50 + 150),
        weight: Math.floor(Math.random() * 50 + 60),
        allergies: randomAllergies.map((name) => ({
          name,
          severity: ["mild", "moderate", "severe"][
            Math.floor(Math.random() * 3)
          ],
          notes: `Patient reports ${name} allergy`,
        })),
        chronicConditions: randomConditions.map((name) => ({
          name,
          diagnosedDate: randomDate(
            new Date(2015, 0, 1),
            new Date(2023, 11, 31),
          ),
          status: ["active", "in remission", "resolved"][
            Math.floor(Math.random() * 3)
          ],
          treatment: `Standard treatment protocol for ${name}`,
        })),
        insurance: {
          provider: [
            "Blue Cross",
            "Aetna",
            "Cigna",
            "UnitedHealth",
            "Humana",
            "Kaiser",
          ][Math.floor(Math.random() * 6)],
          policyNumber: `POL${Math.floor(Math.random() * 90000000 + 10000000)}`,
          expiryDate: new Date(2025, 11, 31),
        },
        primaryDoctor: primaryDoctor._id,
        lastVisit: randomDate(new Date(2024, 0, 1), new Date()),
        nextAppointment: randomDate(new Date(), new Date(2024, 5, 30)),
        status: Math.random() > 0.1 ? "active" : "inactive",
        notes:
          Math.random() > 0.7 ? "Patient requires follow-up in 3 months" : "",
      });

      patients.push(patient);
    }

    console.log(`✅ ${patients.length} patients created`);

    // ============================================
    // 4. APPOINTMENTS - 150+ Appointments
    // ============================================
    console.log("📅 Creating 150+ appointments...");

    const appointmentReasons = [
      "Routine checkup",
      "Follow-up visit",
      "Annual physical",
      "Consultation",
      "Vaccination",
      "Blood pressure check",
      "Diabetes management",
      "Pregnancy checkup",
      "Allergy testing",
      "Skin rash",
      "Headache",
      "Back pain",
      "Joint pain",
      "Chest pain",
      "Shortness of breath",
      "Fatigue",
      "Fever",
      "Cough",
      "Sore throat",
      "Ear pain",
      "Vision problems",
      "Depression",
      "Anxiety",
    ];

    const appointmentStatuses = [
      "completed",
      "completed",
      "completed",
      "completed",
      "scheduled",
      "confirmed",
      "cancelled",
      "no_show",
    ];
    const paymentStatuses = [
      "paid",
      "paid",
      "paid",
      "paid",
      "pending",
      "pending",
      "cancelled",
    ];

    const appointments = [];

    // Generate appointments from Jan 2024 to Jun 2024
    const startDate = new Date(2024, 0, 1);
    const endDate = new Date(2024, 5, 30);

    for (let i = 0; i < 175; i++) {
      const patient = patients[Math.floor(Math.random() * patients.length)];
      const doctor = doctors[Math.floor(Math.random() * doctors.length)];
      const appointmentDate = randomDate(startDate, endDate);

      const appointment = await Appointment.create({
        appointmentId: `APT${4000 + i + 1}`,
        patient: patient._id,
        doctor: doctor._id,
        date: appointmentDate,
        time: randomTime(),
        duration: [15, 30, 45, 60][Math.floor(Math.random() * 4)],
        type: ["consultation", "follow-up", "checkup", "emergency", "video"][
          Math.floor(Math.random() * 5)
        ],
        reason:
          appointmentReasons[
            Math.floor(Math.random() * appointmentReasons.length)
          ],
        symptoms:
          Math.random() > 0.5
            ? ["Pain", "Discomfort", "Fatigue"].slice(
                0,
                Math.floor(Math.random() * 3 + 1),
              )
            : [],
        status:
          appointmentStatuses[
            Math.floor(Math.random() * appointmentStatuses.length)
          ],
        fee: doctor.consultationFee,
        paymentStatus:
          paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
        notes: Math.random() > 0.7 ? "Patient reported improvement" : "",
        diagnosis:
          appointmentDate < new Date() && Math.random() > 0.3
            ? [
                "Hypertension",
                "Diabetes",
                "Common cold",
                "Influenza",
                "Allergic rhinitis",
              ][Math.floor(Math.random() * 5)]
            : "",
        followUpDate:
          Math.random() > 0.6
            ? new Date(
                appointmentDate.getTime() +
                  Math.floor(Math.random() * 90 + 30) * 24 * 60 * 60 * 1000,
              )
            : null,
        reminderSent: appointmentDate < new Date() ? true : Math.random() > 0.5,
      });

      appointments.push(appointment);
    }

    console.log(`✅ ${appointments.length} appointments created`);

    // ============================================
    // 5. PRESCRIPTIONS - 120+ Prescriptions
    // ============================================
    console.log("💊 Creating 120+ prescriptions...");

    const medications = [
      { name: "Lisinopril", dosage: "10mg", frequency: "Once daily" },
      { name: "Metformin", dosage: "500mg", frequency: "Twice daily" },
      { name: "Amlodipine", dosage: "5mg", frequency: "Once daily" },
      { name: "Simvastatin", dosage: "20mg", frequency: "Once daily" },
      { name: "Omeprazole", dosage: "20mg", frequency: "Once daily" },
      { name: "Levothyroxine", dosage: "50mcg", frequency: "Once daily" },
      { name: "Albuterol", dosage: "2 puffs", frequency: "As needed" },
      { name: "Gabapentin", dosage: "300mg", frequency: "Three times daily" },
      { name: "Losartan", dosage: "50mg", frequency: "Once daily" },
      { name: "Sertraline", dosage: "50mg", frequency: "Once daily" },
      { name: "Ibuprofen", dosage: "400mg", frequency: "Every 6 hours" },
      { name: "Acetaminophen", dosage: "500mg", frequency: "Every 8 hours" },
      { name: "Amoxicillin", dosage: "500mg", frequency: "Three times daily" },
      { name: "Azithromycin", dosage: "250mg", frequency: "Once daily" },
      { name: "Prednisone", dosage: "10mg", frequency: "Once daily" },
      { name: "Warfarin", dosage: "5mg", frequency: "Once daily" },
      { name: "Metoprolol", dosage: "25mg", frequency: "Twice daily" },
      { name: "Hydrochlorothiazide", dosage: "25mg", frequency: "Once daily" },
      { name: "Escitalopram", dosage: "10mg", frequency: "Once daily" },
      { name: "Fluoxetine", dosage: "20mg", frequency: "Once daily" },
    ];

    const prescriptionStatuses = [
      "active",
      "active",
      "active",
      "completed",
      "cancelled",
      "expired",
    ];

    const prescriptions = [];

    for (let i = 0; i < 130; i++) {
      const appointment =
        appointments[Math.floor(Math.random() * appointments.length)];
      const patient = patients.find(
        (p) => p._id.toString() === appointment.patient.toString(),
      );
      const doctor = doctors.find(
        (d) => d._id.toString() === appointment.doctor.toString(),
      );

      if (!patient || !doctor) continue;

      const numMedications = Math.floor(Math.random() * 3) + 1;
      const selectedMedications = [];

      for (let m = 0; m < numMedications; m++) {
        const med = medications[Math.floor(Math.random() * medications.length)];
        selectedMedications.push({
          name: med.name,
          genericName: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: `${Math.floor(Math.random() * 30 + 7)} days`,
          quantity: Math.floor(Math.random() * 60 + 30),
          instructions: [
            "Take with food",
            "Take on empty stomach",
            "Avoid alcohol",
            "Take at bedtime",
          ][Math.floor(Math.random() * 4)],
          beforeMeal: Math.random() > 0.5,
          refills: Math.floor(Math.random() * 5),
        });
      }

      const prescription = await Prescription.create({
        prescriptionId: `RX${5000 + i + 1}`,
        patient: patient._id,
        doctor: doctor._id,
        appointment: appointment._id,
        date: appointment.date,
        medications: selectedMedications,
        instructions: `Take as directed. Follow up in ${Math.floor(Math.random() * 4 + 1)} weeks.`,
        notes:
          Math.random() > 0.7
            ? "Patient advised to monitor blood pressure"
            : "",
        status:
          prescriptionStatuses[
            Math.floor(Math.random() * prescriptionStatuses.length)
          ],
        pharmacyNotes:
          Math.random() > 0.8 ? "Generic substitution allowed" : "",
        followUpDate:
          Math.random() > 0.6
            ? new Date(
                appointment.date.getTime() +
                  Math.floor(Math.random() * 60 + 30) * 24 * 60 * 60 * 1000,
              )
            : null,
      });

      prescriptions.push(prescription);

      if (Math.random() > 0.3) {
        await Appointment.findByIdAndUpdate(appointment._id, {
          prescription: prescription._id,
        });
      }
    }

    console.log(`✅ ${prescriptions.length} prescriptions created`);

    // ============================================
    // UPDATE DOCTOR PATIENT COUNTS
    // ============================================
    console.log("📊 Updating doctor statistics...");

    for (const doctor of doctors) {
      const doctorAppointments = appointments.filter(
        (a) => a.doctor.toString() === doctor._id.toString(),
      );

      const uniquePatients = [
        ...new Set(doctorAppointments.map((a) => a.patient.toString())),
      ];

      await Doctor.findByIdAndUpdate(doctor._id, {
        $set: {
          patients: uniquePatients,
          appointments: doctorAppointments.map((a) => a._id),
          "ratings.totalReviews": doctorAppointments.length,
        },
      });
    }

    console.log("✅ Doctor statistics updated");

    // ============================================
    // UPDATE PATIENT APPOINTMENT COUNTS
    // ============================================
    for (const patient of patients) {
      const patientAppointments = appointments.filter(
        (a) => a.patient.toString() === patient._id.toString(),
      );

      await Patient.findByIdAndUpdate(patient._id, {
        $set: {
          appointments: patientAppointments.map((a) => a._id),
        },
      });
    }

    console.log("✅ Patient statistics updated");

    // ============================================
    // UPDATE RELATIONSHIPS
    // ============================================
    console.log("🔄 Updating patient relationships...");

    for (const patient of patients) {
      // Find all appointments for this patient
      const patientAppointments = appointments.filter(
        (a) => a.patient.toString() === patient._id.toString(),
      );

      // Find all prescriptions for this patient
      const patientPrescriptions = prescriptions.filter(
        (p) => p.patient.toString() === patient._id.toString(),
      );

      // Update patient with appointments and prescriptions
      await Patient.findByIdAndUpdate(patient._id, {
        $set: {
          appointments: patientAppointments.map((a) => a._id),
          prescriptions: patientPrescriptions.map((p) => p._id),
          lastVisit:
            patientAppointments.length > 0
              ? patientAppointments.sort(
                  (a, b) => new Date(b.date) - new Date(a.date),
                )[0].date
              : null,
          nextAppointment:
            patientAppointments
              .filter(
                (a) =>
                  new Date(a.date) > new Date() && a.status === "scheduled",
              )
              .sort((a, b) => new Date(a.date) - new Date(b.date))[0]?.date ||
            null,
        },
      });
    }
    console.log(`✅ Updated ${patients.length} patients with relationships`);

    console.log("🔄 Updating doctor relationships...");

    for (const doctor of doctors) {
      // Find all appointments for this doctor
      const doctorAppointments = appointments.filter(
        (a) => a.doctor.toString() === doctor._id.toString(),
      );

      // Get unique patients for this doctor
      const uniquePatientIds = [
        ...new Set(doctorAppointments.map((a) => a.patient.toString())),
      ];

      // Update doctor with patients and appointments
      await Doctor.findByIdAndUpdate(doctor._id, {
        $set: {
          appointments: doctorAppointments.map((a) => a._id),
          patients: uniquePatientIds,
          "ratings.totalReviews": doctorAppointments.length,
        },
      });
    }
    console.log(`✅ Updated ${doctors.length} doctors with relationships`);

    console.log("🔄 Updating appointment prescription references...");

    for (const appointment of appointments) {
      // Find prescription for this appointment
      const prescription = prescriptions.find(
        (p) => p.appointment?.toString() === appointment._id.toString(),
      );

      if (prescription) {
        await Appointment.findByIdAndUpdate(appointment._id, {
          $set: { prescription: prescription._id },
        });
      }
    }
    console.log(`✅ Updated appointment prescription references`);

    // ============================================
    // SUMMARY REPORT
    // ============================================
    console.log("\n========================================");
    console.log("✅✅✅ DATABASE SEEDING COMPLETE! ✅✅✅");
    console.log("========================================\n");

    console.log("📊 DATABASE STATISTICS:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`👨‍⚕️  Doctors:        ${doctors.length}`);
    console.log(`👤  Patients:       ${patients.length}`);
    console.log(`📅  Appointments:   ${appointments.length}`);
    console.log(`💊  Prescriptions:  ${prescriptions.length}`);
    console.log(`👑  Admin:          1`);
    console.log("");

    console.log("🏥 DOCTORS BY SPECIALIZATION:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    const specCounts = {};
    doctors.forEach((d) => {
      specCounts[d.specialization] = (specCounts[d.specialization] || 0) + 1;
    });
    Object.entries(specCounts).forEach(([spec, count]) => {
      console.log(`   ${spec.padEnd(25)}: ${count}`);
    });
    console.log("");

    console.log("📅 APPOINTMENTS BY STATUS:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
    const statusCounts = {};
    appointments.forEach((a) => {
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    });
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status.padEnd(15)}: ${count}`);
    });
    console.log("");

    console.log("🔐 LOGIN CREDENTIALS:");
    console.log("━━━━━━━━━━━━━━━━━━━━");
    console.log(`   Admin:     admin@clinix.com / password123`);
    console.log(`   Doctors:   dr.firstname.lastname@clinix.com / password123`);
    console.log(`   Patients:  patient.email@example.com / password123`);
    console.log("");

    console.log("🌐 DATABASE:", process.env.MONGO_URI);
    console.log(
      `📦 Total Documents Created: ${doctors.length + patients.length + appointments.length + prescriptions.length + 2}`,
    );
    console.log("\n========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
};

seedDatabase();
