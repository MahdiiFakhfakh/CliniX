import type {
  ConsultationNote,
  ConsultationNotePayload,
  DoctorAlert,
  DoctorPatientDetail,
  DoctorPatientListItem,
  LabImagingResult,
  LabRequestPayload,
  MedicalSummary,
  PatientProfile,
  Prescription,
  PrescriptionPayload,
} from '@/src/core/types/domain';

const isoDaysAgo = (days: number): string => {
  const value = new Date();
  value.setDate(value.getDate() - days);
  return value.toISOString();
};

const isoHoursAgo = (hours: number): string => {
  const value = new Date();
  value.setHours(value.getHours() - hours);
  return value.toISOString();
};

const patientProfile: PatientProfile = {
  id: 'p-self',
  patientId: 'PT-2201',
  fullName: 'Mariam Hassan',
  age: 32,
  gender: 'female',
  dateOfBirth: '1993-09-17',
  phone: '+1 555-0101',
  email: 'patient@clinix.app',
  emergencyContact: '+1 555-0199',
};

const medicalSummary: MedicalSummary = {
  bloodGroup: 'A+',
  allergies: ['Penicillin'],
  chronicConditions: ['Asthma'],
  activeMedications: ['Salbutamol inhaler'],
  primaryDoctor: 'Dr. Kareem Adel',
  lastVisit: isoDaysAgo(14),
};

let prescriptionsStore: Prescription[] = [
  {
    id: 'rx-1001',
    patientId: 'p-self',
    medication: 'Atorvastatin',
    dosage: '20 mg',
    frequency: 'Once daily',
    duration: '30 days',
    instructions: 'Take after dinner',
    status: 'active',
    prescribedBy: 'Dr. Kareem Adel',
    issuedAt: isoDaysAgo(10),
  },
  {
    id: 'rx-1002',
    patientId: 'p-201',
    medication: 'Metformin',
    dosage: '500 mg',
    frequency: 'Twice daily',
    duration: '60 days',
    instructions: 'Take with food',
    status: 'active',
    prescribedBy: 'Dr. Kareem Adel',
    issuedAt: isoDaysAgo(6),
  },
];

let resultsStore: LabImagingResult[] = [
  {
    id: 'res-1001',
    patientId: 'p-self',
    kind: 'lab',
    name: 'Complete Blood Count',
    status: 'ready',
    orderedBy: 'Dr. Kareem Adel',
    collectedAt: isoDaysAgo(5),
    summary: 'Hemoglobin is slightly below reference range.',
  },
  {
    id: 'res-1002',
    patientId: 'p-self',
    kind: 'imaging',
    name: 'Chest X-Ray',
    status: 'reviewed',
    orderedBy: 'Dr. Kareem Adel',
    collectedAt: isoDaysAgo(3),
    summary: 'No acute pulmonary findings.',
  },
  {
    id: 'res-1003',
    patientId: 'p-201',
    kind: 'lab',
    name: 'Fasting Glucose',
    status: 'ready',
    orderedBy: 'Dr. Kareem Adel',
    collectedAt: isoDaysAgo(1),
    summary: 'Elevated fasting glucose, monitor trend.',
  },
];

let consultationNotesStore: ConsultationNote[] = [
  {
    id: 'note-9001',
    patientId: 'p-201',
    doctorName: 'Dr. Kareem Adel',
    subjective: 'Patient reports intermittent palpitations.',
    objective: 'Heart rate 96 bpm, BP 138/88.',
    assessment: 'Likely stress-related tachycardia.',
    plan: 'Order ECG, encourage hydration, follow-up in one week.',
    createdAt: isoDaysAgo(2),
  },
  {
    id: 'note-9002',
    patientId: 'p-self',
    doctorName: 'Dr. Kareem Adel',
    subjective: 'Mild chest tightness after exercise.',
    objective: 'No respiratory distress. O2 sat 98%.',
    assessment: 'Exercise-induced bronchospasm.',
    plan: 'Continue inhaler before activity and monitor symptoms.',
    createdAt: isoDaysAgo(8),
  },
];

const vitalsStore: Record<string, DoctorPatientDetail['vitals']> = {
  'p-201': [
    { id: 'v-1', label: 'Blood Pressure', value: '138/88 mmHg', recordedAt: isoHoursAgo(4) },
    { id: 'v-2', label: 'Heart Rate', value: '96 bpm', recordedAt: isoHoursAgo(4) },
    { id: 'v-3', label: 'SpO2', value: '97%', recordedAt: isoHoursAgo(4) },
  ],
  'p-202': [
    { id: 'v-4', label: 'Blood Pressure', value: '124/80 mmHg', recordedAt: isoHoursAgo(5) },
    { id: 'v-5', label: 'Temperature', value: '37.0 C', recordedAt: isoHoursAgo(5) },
    { id: 'v-6', label: 'Heart Rate', value: '82 bpm', recordedAt: isoHoursAgo(5) },
  ],
  'p-self': [
    { id: 'v-7', label: 'Blood Pressure', value: '120/76 mmHg', recordedAt: isoHoursAgo(6) },
    { id: 'v-8', label: 'SpO2', value: '98%', recordedAt: isoHoursAgo(6) },
  ],
};

const doctorPatientsStore: DoctorPatientListItem[] = [
  {
    id: 'p-201',
    fullName: 'Youssef Fathi',
    age: 58,
    condition: 'Arrhythmia follow-up',
    riskLevel: 'high',
    lastVisit: isoDaysAgo(2),
  },
  {
    id: 'p-202',
    fullName: 'Nadia Tarek',
    age: 47,
    condition: 'Post-op hypertension review',
    riskLevel: 'medium',
    lastVisit: isoDaysAgo(1),
  },
  {
    id: 'p-203',
    fullName: 'Omar Mahmoud',
    age: 36,
    condition: 'Wound management',
    riskLevel: 'low',
    lastVisit: isoDaysAgo(3),
  },
];

const patientProfilesById: Record<string, PatientProfile> = {
  'p-self': patientProfile,
  'p-201': {
    id: 'p-201',
    patientId: 'PT-3101',
    fullName: 'Youssef Fathi',
    age: 58,
    gender: 'male',
    dateOfBirth: '1968-02-11',
    phone: '+1 555-0201',
    email: 'youssef.fathi@clinix.app',
    emergencyContact: '+1 555-0301',
  },
  'p-202': {
    id: 'p-202',
    patientId: 'PT-3102',
    fullName: 'Nadia Tarek',
    age: 47,
    gender: 'female',
    dateOfBirth: '1979-12-03',
    phone: '+1 555-0202',
    email: 'nadia.tarek@clinix.app',
    emergencyContact: '+1 555-0302',
  },
  'p-203': {
    id: 'p-203',
    patientId: 'PT-3103',
    fullName: 'Omar Mahmoud',
    age: 36,
    gender: 'male',
    dateOfBirth: '1990-04-22',
    phone: '+1 555-0203',
    email: 'omar.mahmoud@clinix.app',
    emergencyContact: '+1 555-0303',
  },
};

const doctorAlertsStore: DoctorAlert[] = [
  {
    id: 'alert-1',
    severity: 'high',
    title: 'Critical lab pending review',
    description: 'Patient Youssef Fathi has elevated glucose trend.',
    createdAt: isoHoursAgo(2),
  },
  {
    id: 'alert-2',
    severity: 'medium',
    title: 'Consultation note overdue',
    description: 'Complete post-op note for Nadia Tarek.',
    createdAt: isoHoursAgo(5),
  },
];

export function getMockPatientProfile(): PatientProfile {
  return { ...patientProfile };
}

export function getMockMedicalSummary(): MedicalSummary {
  return { ...medicalSummary, allergies: [...medicalSummary.allergies], chronicConditions: [...medicalSummary.chronicConditions], activeMedications: [...medicalSummary.activeMedications] };
}

export function getMockPrescriptions(patientId?: string): Prescription[] {
  const targetId = patientId ?? 'p-self';
  return prescriptionsStore.filter((item) => item.patientId === targetId).map((item) => ({ ...item }));
}

export function getMockLabResults(patientId?: string): LabImagingResult[] {
  const targetId = patientId ?? 'p-self';
  return resultsStore.filter((item) => item.patientId === targetId).map((item) => ({ ...item }));
}

export function getMockDoctorAlerts(): DoctorAlert[] {
  return doctorAlertsStore.map((item) => ({ ...item }));
}

export function getMockDoctorPatients(): DoctorPatientListItem[] {
  return doctorPatientsStore.map((item) => ({ ...item }));
}

export function getMockDoctorPatientDetail(patientId: string): DoctorPatientDetail {
  const profile = patientProfilesById[patientId] ?? patientProfilesById['p-self'];

  const history = [
    'Known hypertension under treatment.',
    'No history of drug abuse or smoking.',
    'Previous admission for chest pain in 2025.',
  ];

  return {
    profile: { ...profile },
    history,
    notes: consultationNotesStore.filter((item) => item.patientId === patientId).map((item) => ({ ...item })),
    prescriptions: getMockPrescriptions(patientId),
    results: getMockLabResults(patientId),
    vitals: (vitalsStore[patientId] ?? []).map((item) => ({ ...item })),
  };
}

export function addMockConsultationNote(payload: ConsultationNotePayload): ConsultationNote {
  const created: ConsultationNote = {
    id: `note-${Math.random().toString(16).slice(2, 8)}`,
    patientId: payload.patientId,
    doctorName: 'Dr. Kareem Adel',
    subjective: payload.subjective,
    objective: payload.objective,
    assessment: payload.assessment,
    plan: payload.plan,
    createdAt: new Date().toISOString(),
  };

  consultationNotesStore = [created, ...consultationNotesStore];
  return { ...created };
}

export function addMockPrescription(payload: PrescriptionPayload): Prescription {
  const created: Prescription = {
    id: `rx-${Math.random().toString(16).slice(2, 8)}`,
    patientId: payload.patientId,
    medication: payload.medication,
    dosage: payload.dosage,
    frequency: payload.frequency,
    duration: payload.duration,
    instructions: payload.instructions,
    status: 'active',
    prescribedBy: 'Dr. Kareem Adel',
    issuedAt: new Date().toISOString(),
  };

  prescriptionsStore = [created, ...prescriptionsStore];
  return { ...created };
}

export function addMockLabRequest(payload: LabRequestPayload): LabImagingResult {
  const created: LabImagingResult = {
    id: `res-${Math.random().toString(16).slice(2, 8)}`,
    patientId: payload.patientId,
    kind: payload.kind,
    name: payload.name,
    status: 'pending',
    orderedBy: 'Dr. Kareem Adel',
    collectedAt: new Date().toISOString(),
    summary: `${payload.priority.toUpperCase()} request: ${payload.clinicalQuestion}`,
  };

  resultsStore = [created, ...resultsStore];
  return { ...created };
}
