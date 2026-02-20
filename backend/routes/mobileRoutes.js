const { randomUUID } = require("crypto");
const express = require("express");

const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Notification = require("../models/Notifications");
const Patient = require("../models/Patient");
const Prescription = require("../models/Prescription");
const { authorize, protect } = require("../middlewares/authMiddleware");

const router = express.Router();

const noteStore = new Map();
const resultStore = new Map();
const threadStore = new Map();

const APPOINTMENT_STATUSES = new Set([
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "in_progress",
  "no_show",
]);

const toIso = (value) => {
  if (!value) {
    return new Date().toISOString();
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const toDateOnly = (value) => toIso(value).split("T")[0];

const toSafeString = (value, fallback = "") =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

const toArray = (value) => (Array.isArray(value) ? value : []);

const mapPrescriptionStatus = (status) => {
  if (status === "cancelled") {
    return "cancelled";
  }

  if (status === "completed" || status === "expired") {
    return "completed";
  }

  return "active";
};

const mapPatientRiskStatus = (patient) => {
  const chronicCount = toArray(patient.chronicConditions).length;

  if (chronicCount >= 3) {
    return "inactive";
  }

  if (chronicCount >= 1) {
    return "pending";
  }

  return "active";
};

const asFullName = (entity, fallback = "Unknown") => {
  if (!entity) {
    return fallback;
  }

  if (entity.fullName) {
    return entity.fullName;
  }

  const first = toSafeString(entity.firstName);
  const last = toSafeString(entity.lastName);
  const combined = `${first} ${last}`.trim();

  return combined || fallback;
};

const mapAppointmentRecord = (appointment) => {
  const patient = appointment.patient || {};
  const doctor = appointment.doctor || {};

  return {
    _id: appointment._id.toString(),
    date: toIso(appointment.date),
    time: toSafeString(appointment.time, "09:00"),
    status: APPOINTMENT_STATUSES.has(appointment.status) ? appointment.status : "scheduled",
    reason: toSafeString(appointment.reason, "Consultation"),
    room: toSafeString(appointment.type, "consultation"),
    patient: {
      _id: patient._id ? patient._id.toString() : undefined,
      firstName: toSafeString(patient.firstName),
      lastName: toSafeString(patient.lastName),
      fullName: asFullName(patient, "Unknown Patient"),
    },
    doctor: {
      firstName: toSafeString(doctor.firstName),
      lastName: toSafeString(doctor.lastName),
      fullName: asFullName(doctor, "Unknown Doctor"),
      specialization: toSafeString(doctor.specialization, toSafeString(doctor.department, "General Medicine")),
    },
  };
};

const mapPatientProfile = (patient) => ({
  id: patient._id.toString(),
  patientId: toSafeString(patient.patientId, `PT-${patient._id.toString().slice(-6)}`),
  fullName: asFullName(patient, "Unknown Patient"),
  age: Number.isFinite(patient.age) ? patient.age : 0,
  gender: ["male", "female", "other"].includes(patient.gender) ? patient.gender : "other",
  dateOfBirth: toDateOnly(patient.dateOfBirth),
  phone: toSafeString(patient.phone),
  email: toSafeString(patient.email),
  emergencyContact:
    toSafeString(patient?.emergencyContact?.phone) ||
    toSafeString(patient?.emergencyContact?.name) ||
    "Not available",
});

const mapMedicalSummary = (patient, primaryDoctorName) => {
  const allergies = toArray(patient.allergies)
    .map((item) => toSafeString(item.name))
    .filter(Boolean);

  const chronicConditions = toArray(patient.chronicConditions)
    .map((item) => toSafeString(item.name))
    .filter(Boolean);

  const activeMedications = toArray(patient.currentMedications)
    .map((item) => toSafeString(item.name))
    .filter(Boolean);

  return {
    bloodGroup: toSafeString(patient.bloodGroup, "Unknown"),
    allergies,
    chronicConditions,
    activeMedications,
    primaryDoctor: primaryDoctorName || "Not assigned",
    lastVisit: toIso(patient.lastVisit),
  };
};

const mapPrescriptionForMobile = (prescription, patient, doctor) => {
  const medication = toArray(prescription.medications)[0] || {};

  return {
    id: prescription._id.toString(),
    patientId: patient._id.toString(),
    medication: toSafeString(medication.name, "Medication"),
    dosage: toSafeString(medication.dosage, "As directed"),
    frequency: toSafeString(medication.frequency, "Once daily"),
    duration: toSafeString(medication.duration, "7 days"),
    instructions: toSafeString(medication.instructions, toSafeString(prescription.instructions, "Follow doctor instructions")),
    status: mapPrescriptionStatus(prescription.status),
    prescribedBy: asFullName(doctor, "Doctor"),
    issuedAt: toIso(prescription.date || prescription.createdAt),
  };
};

const buildResultRecord = ({ id, patientId, kind, name, status, orderedBy, collectedAt, summary }) => ({
  id,
  patientId,
  kind,
  name,
  status,
  orderedBy,
  collectedAt: toIso(collectedAt),
  summary,
});

const getPatientResults = (patientId, doctorName) => {
  if (!resultStore.has(patientId)) {
    const seeded = [
      buildResultRecord({
        id: `res-${patientId}-1`,
        patientId,
        kind: "lab",
        name: "Complete Blood Count",
        status: "ready",
        orderedBy: doctorName || "Doctor",
        collectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
        summary: "Mild anemia pattern; correlate clinically.",
      }),
      buildResultRecord({
        id: `res-${patientId}-2`,
        patientId,
        kind: "imaging",
        name: "Chest X-Ray",
        status: "reviewed",
        orderedBy: doctorName || "Doctor",
        collectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
        summary: "No acute cardiopulmonary findings.",
      }),
    ];

    resultStore.set(patientId, seeded);
  }

  return resultStore.get(patientId);
};

const createVitalSnapshot = (seedDate) => {
  const base = toIso(seedDate);
  const createdAt = new Date(base).toISOString();

  return [
    { id: randomUUID(), label: "Blood Pressure", value: "124/78 mmHg", recordedAt: createdAt },
    { id: randomUUID(), label: "Heart Rate", value: "78 bpm", recordedAt: createdAt },
    { id: randomUUID(), label: "SpO2", value: "98%", recordedAt: createdAt },
  ];
};

const ensureThread = (threadId, title, seedMessages = []) => {
  if (!threadStore.has(threadId)) {
    threadStore.set(threadId, {
      id: threadId,
      title,
      messages: seedMessages,
    });
  }

  return threadStore.get(threadId);
};

const toChatSenderRole = (role) => (role === "admin" ? "doctor" : role);

const getPatientByUserId = (userId) =>
  Patient.findOne({ user: userId }).populate("primaryDoctor", "fullName firstName lastName specialization");

const getDoctorByUserId = (userId) => Doctor.findOne({ user: userId });

const getEffectivePatient = async (user) => {
  if (user.role === "patient") {
    return getPatientByUserId(user._id);
  }

  return Patient.findOne().populate("primaryDoctor", "fullName firstName lastName specialization");
};

const getEffectiveDoctor = async (user) => {
  if (user.role === "doctor") {
    return getDoctorByUserId(user._id);
  }

  return Doctor.findOne();
};

const ensurePatientCanAccess = (requestUser, patient) => {
  if (requestUser.role !== "patient") {
    return true;
  }

  return patient.user?.toString() === requestUser._id.toString();
};

const resolveMobileRole = (requestedRole, userRole) => {
  if (requestedRole === "patient" || requestedRole === "doctor") {
    return requestedRole;
  }

  if (userRole === "patient") {
    return "patient";
  }

  return "doctor";
};

const extractLatestUserPrompt = (messages) => {
  const list = toArray(messages);

  for (let index = list.length - 1; index >= 0; index -= 1) {
    const item = list[index];
    if (item?.role === "user" && toSafeString(item?.content)) {
      return toSafeString(item.content);
    }
  }

  return "";
};

router.get("/patients/me", protect, authorize("patient", "admin"), async (req, res) => {
  try {
    const patient = await getEffectivePatient(req.user);

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient profile not found" });
    }

    const primaryDoctorName = asFullName(patient.primaryDoctor, "Not assigned");

    res.json({
      success: true,
      patient: mapPatientProfile(patient),
      summary: mapMedicalSummary(patient, primaryDoctorName),
    });
  } catch (error) {
    console.error("GET /patients/me failed:", error);
    res.status(500).json({ success: false, message: "Failed to load patient profile" });
  }
});

router.get("/patients/me/appointments", protect, authorize("patient", "admin"), async (req, res) => {
  try {
    const patient = await getEffectivePatient(req.user);

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient profile not found" });
    }

    const appointments = await Appointment.find({ patient: patient._id })
      .populate("patient", "firstName lastName fullName")
      .populate("doctor", "firstName lastName fullName specialization department")
      .sort({ date: 1, time: 1 });

    res.json({
      success: true,
      appointments: appointments.map(mapAppointmentRecord),
    });
  } catch (error) {
    console.error("GET /patients/me/appointments failed:", error);
    res.status(500).json({ success: false, message: "Failed to fetch appointments" });
  }
});

router.post("/appointments", protect, authorize("patient", "admin"), async (req, res) => {
  try {
    const patient = await getEffectivePatient(req.user);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient profile not found" });
    }

    const doctorName = toSafeString(req.body.doctorName);
    const department = toSafeString(req.body.department);
    const reason = toSafeString(req.body.reason, "Consultation");
    const date = req.body.date ? new Date(req.body.date) : null;
    const time = toSafeString(req.body.time, "09:00");

    if (!doctorName || !date || Number.isNaN(date.getTime())) {
      return res.status(400).json({ success: false, message: "Doctor and valid date are required" });
    }

    const doctor = await Doctor.findOne({
      $or: [
        { fullName: doctorName },
        {
          $and: [
            { firstName: { $regex: doctorName.split(" ")[0], $options: "i" } },
            { lastName: { $regex: doctorName.split(" ").slice(1).join(" "), $options: "i" } },
          ],
        },
        ...(department ? [{ specialization: { $regex: department, $options: "i" } }] : []),
      ],
    });

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    const appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      date,
      time,
      reason,
      status: "scheduled",
      type: "consultation",
      fee: doctor.consultationFee || 0,
      paymentStatus: "pending",
      createdBy: req.user._id,
    });

    await Promise.all([
      Patient.findByIdAndUpdate(patient._id, { $addToSet: { appointments: appointment._id }, nextAppointment: date }),
      Doctor.findByIdAndUpdate(doctor._id, { $addToSet: { appointments: appointment._id, patients: patient._id } }),
    ]);

    const hydrated = await Appointment.findById(appointment._id)
      .populate("patient", "firstName lastName fullName")
      .populate("doctor", "firstName lastName fullName specialization department");

    res.status(201).json({
      success: true,
      appointment: mapAppointmentRecord(hydrated),
    });
  } catch (error) {
    console.error("POST /appointments failed:", error);
    res.status(500).json({ success: false, message: "Failed to create appointment" });
  }
});

router.patch("/appointments/:id", protect, authorize("patient", "admin"), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patient", "user firstName lastName fullName")
      .populate("doctor", "firstName lastName fullName specialization department");

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    if (req.user.role === "patient" && appointment.patient?.user?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to modify this appointment" });
    }

    if (req.body.date) {
      const updatedDate = new Date(req.body.date);
      if (Number.isNaN(updatedDate.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid date format" });
      }
      appointment.date = updatedDate;
    }

    if (req.body.time) {
      appointment.time = toSafeString(req.body.time, appointment.time);
    }

    if (req.body.reason) {
      appointment.reason = toSafeString(req.body.reason, appointment.reason);
    }

    if (req.body.status && APPOINTMENT_STATUSES.has(req.body.status)) {
      appointment.status = req.body.status;
    }

    appointment.updatedAt = new Date();
    await appointment.save();

    const refreshed = await Appointment.findById(appointment._id)
      .populate("patient", "firstName lastName fullName")
      .populate("doctor", "firstName lastName fullName specialization department");

    res.json({
      success: true,
      appointment: mapAppointmentRecord(refreshed),
    });
  } catch (error) {
    console.error("PATCH /appointments/:id failed:", error);
    res.status(500).json({ success: false, message: "Failed to update appointment" });
  }
});

router.get("/patients/me/results", protect, authorize("patient", "admin"), async (req, res) => {
  try {
    const patient = await getEffectivePatient(req.user);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient profile not found" });
    }

    const doctorName = asFullName(patient.primaryDoctor, "Doctor");
    const results = getPatientResults(patient._id.toString(), doctorName);

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("GET /patients/me/results failed:", error);
    res.status(500).json({ success: false, message: "Failed to fetch results" });
  }
});

router.get("/patients/me/prescriptions", protect, authorize("patient", "admin"), async (req, res) => {
  try {
    const patient = await getEffectivePatient(req.user);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient profile not found" });
    }

    const prescriptions = await Prescription.find({ patient: patient._id })
      .populate("doctor", "firstName lastName fullName")
      .sort({ date: -1 });

    res.json({
      success: true,
      prescriptions: prescriptions.map((item) => mapPrescriptionForMobile(item, patient, item.doctor)),
    });
  } catch (error) {
    console.error("GET /patients/me/prescriptions failed:", error);
    res.status(500).json({ success: false, message: "Failed to fetch prescriptions" });
  }
});

router.get("/doctors/me/schedule", protect, authorize("doctor", "admin"), async (req, res) => {
  try {
    const doctor = await getEffectiveDoctor(req.user);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor profile not found" });
    }

    const appointments = await Appointment.find({ doctor: doctor._id })
      .populate("patient", "firstName lastName fullName")
      .populate("doctor", "firstName lastName fullName specialization department")
      .sort({ date: 1, time: 1 });

    res.json({
      success: true,
      appointments: appointments.map(mapAppointmentRecord),
    });
  } catch (error) {
    console.error("GET /doctors/me/schedule failed:", error);
    res.status(500).json({ success: false, message: "Failed to fetch schedule" });
  }
});

router.get("/doctors/me/patients", protect, authorize("doctor", "admin"), async (req, res) => {
  try {
    const doctor = await getEffectiveDoctor(req.user);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor profile not found" });
    }

    const appointmentPatientIds = await Appointment.distinct("patient", { doctor: doctor._id });
    const patientIds = new Set([
      ...appointmentPatientIds.map((item) => item.toString()),
      ...toArray(doctor.patients).map((item) => item.toString()),
    ]);

    const patients = await Patient.find({ _id: { $in: Array.from(patientIds) } }).sort({ lastName: 1 });

    res.json({
      success: true,
      patients: patients.map((patient) => ({
        _id: patient._id.toString(),
        firstName: toSafeString(patient.firstName),
        lastName: toSafeString(patient.lastName),
        fullName: asFullName(patient, "Unknown Patient"),
        age: Number.isFinite(patient.age) ? patient.age : 0,
        condition:
          toArray(patient.chronicConditions)
            .map((item) => toSafeString(item.name))
            .filter(Boolean)
            .slice(0, 2)
            .join(", ") || "General follow-up",
        status: mapPatientRiskStatus(patient),
        updatedAt: toIso(patient.updatedAt || patient.lastVisit),
        patientId: toSafeString(patient.patientId),
      })),
    });
  } catch (error) {
    console.error("GET /doctors/me/patients failed:", error);
    res.status(500).json({ success: false, message: "Failed to fetch doctor patients" });
  }
});

router.get("/patients/:id", protect, authorize("doctor", "patient", "admin"), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate(
      "primaryDoctor",
      "firstName lastName fullName specialization department",
    );

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    if (!ensurePatientCanAccess(req.user, patient)) {
      return res.status(403).json({ success: false, message: "Not authorized to access this patient" });
    }

    const prescriptions = await Prescription.find({ patient: patient._id })
      .populate("doctor", "firstName lastName fullName")
      .sort({ date: -1 });

    const doctorName = asFullName(patient.primaryDoctor, "Doctor");
    const patientId = patient._id.toString();
    const results = getPatientResults(patientId, doctorName);
    const mappedProfile = mapPatientProfile(patient);
    const mappedPrescriptions = prescriptions.map((item) =>
      mapPrescriptionForMobile(item, patient, item.doctor),
    );

    const existingNotes = noteStore.get(patientId) || [];
    const history = [];

    history.push(`Blood group: ${toSafeString(patient.bloodGroup, "Unknown")}`);

    const chronicConditions = toArray(patient.chronicConditions)
      .map((item) => toSafeString(item.name))
      .filter(Boolean);
    if (chronicConditions.length > 0) {
      history.push(`Chronic conditions: ${chronicConditions.join(", ")}`);
    }

    const allergies = toArray(patient.allergies)
      .map((item) => toSafeString(item.name))
      .filter(Boolean);
    if (allergies.length > 0) {
      history.push(`Allergies: ${allergies.join(", ")}`);
    }

    if (history.length === 1) {
      history.push("No significant chronic history documented.");
    }

    res.json({
      success: true,
      patient: {
        _id: patientId,
        firstName: toSafeString(patient.firstName),
        lastName: toSafeString(patient.lastName),
        fullName: asFullName(patient),
        age: Number.isFinite(patient.age) ? patient.age : 0,
        gender: toSafeString(patient.gender, "other"),
        phone: toSafeString(patient.phone),
        email: toSafeString(patient.email),
        patientId: toSafeString(patient.patientId),
        status: mapPatientRiskStatus(patient),
        updatedAt: toIso(patient.updatedAt || patient.lastVisit),
      },
      detail: {
        profile: mappedProfile,
        history,
        notes: existingNotes,
        prescriptions: mappedPrescriptions,
        results,
        vitals: createVitalSnapshot(patient.lastVisit || new Date()),
      },
    });
  } catch (error) {
    console.error("GET /patients/:id failed:", error);
    res.status(500).json({ success: false, message: "Failed to fetch patient details" });
  }
});

router.post("/patients/:id/notes", protect, authorize("doctor", "admin"), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    const doctor = await getEffectiveDoctor(req.user);
    const doctorName = asFullName(doctor, "Doctor");
    const patientId = patient._id.toString();

    const note = {
      id: randomUUID(),
      patientId,
      doctorName,
      subjective: toSafeString(req.body.subjective, "Subjective notes pending."),
      objective: toSafeString(req.body.objective, "Objective findings pending."),
      assessment: toSafeString(req.body.assessment, "Assessment pending."),
      plan: toSafeString(req.body.plan, "Plan pending."),
      createdAt: new Date().toISOString(),
    };

    const existing = noteStore.get(patientId) || [];
    noteStore.set(patientId, [note, ...existing]);

    res.status(201).json({ success: true, note });
  } catch (error) {
    console.error("POST /patients/:id/notes failed:", error);
    res.status(500).json({ success: false, message: "Failed to create note" });
  }
});

router.post("/patients/:id/prescriptions", protect, authorize("doctor", "admin"), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    const doctor = await getEffectiveDoctor(req.user);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor profile not found" });
    }

    const prescription = await Prescription.create({
      patient: patient._id,
      doctor: doctor._id,
      date: new Date(),
      status: "active",
      instructions: toSafeString(req.body.instructions, "Follow doctor instructions."),
      medications: [
        {
          name: toSafeString(req.body.medication, "Medication"),
          dosage: toSafeString(req.body.dosage, "As directed"),
          frequency: toSafeString(req.body.frequency, "Once daily"),
          duration: toSafeString(req.body.duration, "7 days"),
          instructions: toSafeString(req.body.instructions, "Follow doctor instructions."),
          quantity: 30,
          beforeMeal: false,
          refills: 0,
        },
      ],
      createdBy: req.user._id,
    });

    await Patient.findByIdAndUpdate(patient._id, {
      $addToSet: { prescriptions: prescription._id },
    });

    res.status(201).json({
      success: true,
      prescription: mapPrescriptionForMobile(prescription, patient, doctor),
    });
  } catch (error) {
    console.error("POST /patients/:id/prescriptions failed:", error);
    res.status(500).json({ success: false, message: "Failed to create prescription" });
  }
});

router.post("/patients/:id/orders", protect, authorize("doctor", "admin"), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate("primaryDoctor", "fullName");
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    const doctor = await getEffectiveDoctor(req.user);
    const doctorName = asFullName(doctor || patient.primaryDoctor, "Doctor");
    const patientId = patient._id.toString();
    const kind = req.body.kind === "imaging" ? "imaging" : "lab";

    const result = buildResultRecord({
      id: randomUUID(),
      patientId,
      kind,
      name: toSafeString(req.body.name, "Diagnostic Order"),
      status: "pending",
      orderedBy: doctorName,
      collectedAt: new Date(),
      summary: `${toSafeString(req.body.priority, "routine").toUpperCase()} - ${toSafeString(req.body.clinicalQuestion, "Pending review")}`,
    });

    const existing = getPatientResults(patientId, doctorName);
    resultStore.set(patientId, [result, ...existing]);

    res.status(201).json({ success: true, result });
  } catch (error) {
    console.error("POST /patients/:id/orders failed:", error);
    res.status(500).json({ success: false, message: "Failed to create lab/imaging order" });
  }
});

router.get("/threads", protect, authorize("patient", "doctor", "admin"), async (req, res) => {
  try {
    const requestedRole = toSafeString(req.query.role).toLowerCase();
    const mobileRole = resolveMobileRole(requestedRole, req.user.role);

    if (mobileRole === "patient") {
      const patient = await getEffectivePatient(req.user);
      if (!patient) {
        return res.status(404).json({ success: false, message: "Patient profile not found" });
      }

      const threadId = "thread-patient-doctor";
      const doctorName = asFullName(patient.primaryDoctor, "Care Team");
      const thread = ensureThread(threadId, doctorName, [
        {
          id: randomUUID(),
          threadId,
          senderRole: "doctor",
          senderName: doctorName,
          body: "Hello, please share any symptom updates before your next visit.",
          sentAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          encrypted: true,
        },
      ]);

      return res.json({
        success: true,
        threads: [
          {
            id: thread.id,
            title: thread.title,
            unreadCount: 0,
            lastMessagePreview: thread.messages[thread.messages.length - 1]?.body || "",
            lastMessageAt: thread.messages[thread.messages.length - 1]?.sentAt || new Date().toISOString(),
          },
        ],
      });
    }

    const doctor = await getEffectiveDoctor(req.user);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor profile not found" });
    }

    const threadId = "thread-doctor-patients";
    const thread = ensureThread(threadId, "Patient Messages", [
      {
        id: randomUUID(),
        threadId,
        senderRole: "patient",
        senderName: "Patient",
        body: "Could we review my medication instructions?",
        sentAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        encrypted: true,
      },
    ]);

    return res.json({
      success: true,
      threads: [
        {
          id: thread.id,
          title: thread.title,
          unreadCount: thread.messages.filter((item) => item.senderRole === "patient").length,
          lastMessagePreview: thread.messages[thread.messages.length - 1]?.body || "",
          lastMessageAt: thread.messages[thread.messages.length - 1]?.sentAt || new Date().toISOString(),
        },
      ],
    });
  } catch (error) {
    console.error("GET /threads failed:", error);
    res.status(500).json({ success: false, message: "Failed to fetch threads" });
  }
});

router.get("/threads/:id/messages", protect, authorize("patient", "doctor", "admin"), async (req, res) => {
  try {
    const thread = ensureThread(req.params.id, "Care Team");

    res.json({
      success: true,
      messages: thread.messages.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt)),
    });
  } catch (error) {
    console.error("GET /threads/:id/messages failed:", error);
    res.status(500).json({ success: false, message: "Failed to fetch messages" });
  }
});

router.post("/threads/:id/messages", protect, authorize("patient", "doctor", "admin"), async (req, res) => {
  try {
    const thread = ensureThread(req.params.id, "Care Team");
    const senderRole = toChatSenderRole(req.user.role);

    const message = {
      id: randomUUID(),
      threadId: thread.id,
      senderRole,
      senderName: toSafeString(req.body.senderName, senderRole === "doctor" ? "Doctor" : "Patient"),
      body: toSafeString(req.body.body, ""),
      sentAt: new Date().toISOString(),
      encrypted: true,
    };

    if (!message.body) {
      return res.status(400).json({ success: false, message: "Message body is required" });
    }

    thread.messages.push(message);

    res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("POST /threads/:id/messages failed:", error);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
});

router.post("/ai/explain-result", protect, authorize("patient", "doctor", "admin"), async (req, res) => {
  try {
    const question = toSafeString(req.body?.patientQuestion, "Please explain my latest result.");
    const resultId = toSafeString(req.body?.resultId, "latest");

    return res.json({
      success: true,
      explanation: {
        title: "Result Explanation",
        content: `Result ${resultId}: ${question} Based on available data, there is no immediate emergency signal, but discuss this with your clinician for diagnosis.`,
        caution:
          "This explanation is educational only and cannot replace in-person medical advice.",
      },
    });
  } catch (error) {
    console.error("POST /ai/explain-result failed:", error);
    return res.status(500).json({ success: false, message: "Failed to generate AI explanation" });
  }
});

router.post("/ai/draft", protect, authorize("doctor", "admin"), async (req, res) => {
  try {
    const kind = toSafeString(req.body?.kind);
    const context = toSafeString(req.body?.context, "Follow-up encounter.");
    const title = kind === "prescription" ? "Prescription Draft" : "Clinical Draft";
    const payloadLabel =
      kind === "prescription"
        ? "Take medication as prescribed, monitor symptoms, and return if worsening."
        : "Assessment: stable today. Plan: continue therapy, monitor, and review within 2 weeks.";

    return res.json({
      success: true,
      draft: {
        title,
        content: `${payloadLabel} Context: ${context}`,
        caution: "AI output is draft support only. Final clinical judgment remains with the treating clinician.",
      },
    });
  } catch (error) {
    console.error("POST /ai/draft failed:", error);
    return res.status(500).json({ success: false, message: "Failed to generate AI draft" });
  }
});

router.post("/ai/chat", protect, authorize("patient", "doctor", "admin"), async (req, res) => {
  try {
    const requestedRole = toSafeString(req.body?.role).toLowerCase();
    const role = resolveMobileRole(requestedRole, req.user.role);
    const latestPrompt = extractLatestUserPrompt(req.body?.messages);
    const patientContext = toSafeString(req.body?.patientContext);

    if (role === "doctor") {
      const contextSuffix = patientContext ? ` Context used: ${patientContext}` : "";
      return res.json({
        success: true,
        reply: {
          content: `Draft response: ${latestPrompt || "Summarize this encounter."} Provide concise assessment and plan.${contextSuffix}`,
          caution:
            "AI draft support only. Review for clinical accuracy and patient safety before use.",
        },
      });
    }

    return res.json({
      success: true,
      reply: {
        content: `Patient-friendly explanation: ${latestPrompt || "Please explain my result."} This appears non-urgent, but confirm treatment decisions with your doctor.`,
        caution:
          "AI information is educational only and should not replace advice from your licensed clinician.",
      },
    });
  } catch (error) {
    console.error("POST /ai/chat failed:", error);
    return res.status(500).json({ success: false, message: "Failed to generate AI response" });
  }
});

router.get("/notifications", protect, authorize("patient", "doctor", "admin"), async (req, res) => {
  try {
    const notificationDocs = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    const mapped = notificationDocs.map((item) => ({
      id: item._id.toString(),
      title: toSafeString(item.title, "Notification"),
      body: toSafeString(item.message, ""),
      sentAt: toIso(item.sentAt || item.createdAt),
      read: Boolean(item.isRead),
    }));

    if (mapped.length > 0) {
      return res.json({ success: true, notifications: mapped });
    }

    const fallback = [
      {
        id: randomUUID(),
        title: "Welcome to CliniX Mobile",
        body: "You are connected to the live backend.",
        sentAt: new Date().toISOString(),
        read: false,
      },
    ];

    return res.json({ success: true, notifications: fallback });
  } catch (error) {
    console.error("GET /notifications failed:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
});

router.get("/doctor/alerts", protect, authorize("doctor", "admin"), async (req, res) => {
  try {
    const doctor = await getEffectiveDoctor(req.user);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor profile not found" });
    }

    const upcomingCount = await Appointment.countDocuments({
      doctor: doctor._id,
      date: { $gte: new Date() },
      status: { $in: ["scheduled", "confirmed"] },
    });

    const highRiskPatients = await Patient.countDocuments({
      _id: { $in: toArray(doctor.patients) },
      "chronicConditions.2": { $exists: true },
    });

    const alerts = [
      {
        id: randomUUID(),
        severity: upcomingCount > 8 ? "high" : "medium",
        title: "Upcoming schedule load",
        description: `You have ${upcomingCount} upcoming appointments.`,
        createdAt: new Date().toISOString(),
      },
      {
        id: randomUUID(),
        severity: highRiskPatients > 0 ? "high" : "low",
        title: "High-risk follow ups",
        description:
          highRiskPatients > 0
            ? `${highRiskPatients} high-risk patients require close monitoring.`
            : "No high-risk follow-ups flagged today.",
        createdAt: new Date().toISOString(),
      },
    ];

    res.json({ success: true, alerts });
  } catch (error) {
    console.error("GET /doctor/alerts failed:", error);
    res.status(500).json({ success: false, message: "Failed to fetch doctor alerts" });
  }
});

module.exports = router;
