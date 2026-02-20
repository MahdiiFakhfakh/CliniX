import type { UserRole } from './auth';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'in_progress'
  | 'no_show';

export interface Appointment {
  id: string;
  role: UserRole;
  patientId?: string;
  patientName: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  reason: string;
  room: string;
}

export interface BookAppointmentPayload {
  doctorName: string;
  date: string;
  time: string;
  reason: string;
  department: string;
}

export interface UpdateAppointmentPayload {
  id: string;
  date?: string;
  time?: string;
  reason?: string;
}

export interface PatientSummary {
  id: string;
  fullName: string;
  age: number;
  bedNumber: string;
  condition: string;
  riskLevel: 'low' | 'medium' | 'high';
  updatedAt: string;
}

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  sentAt: string;
  read: boolean;
}

export interface PatientProfile {
  id: string;
  patientId: string;
  fullName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  phone: string;
  email: string;
  emergencyContact: string;
}

export interface MedicalSummary {
  bloodGroup: string;
  allergies: string[];
  chronicConditions: string[];
  activeMedications: string[];
  primaryDoctor: string;
  lastVisit: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  status: 'active' | 'completed' | 'cancelled';
  prescribedBy: string;
  issuedAt: string;
}

export interface LabImagingResult {
  id: string;
  patientId: string;
  kind: 'lab' | 'imaging';
  name: string;
  status: 'pending' | 'ready' | 'reviewed';
  orderedBy: string;
  collectedAt: string;
  summary: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderRole: UserRole;
  senderName: string;
  body: string;
  sentAt: string;
  encrypted: boolean;
}

export interface DoctorAlert {
  id: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  createdAt: string;
}

export interface DoctorPatientListItem {
  id: string;
  fullName: string;
  age: number;
  condition: string;
  riskLevel: 'low' | 'medium' | 'high';
  lastVisit: string;
}

export interface VitalRecord {
  id: string;
  label: string;
  value: string;
  recordedAt: string;
}

export interface ConsultationNote {
  id: string;
  patientId: string;
  doctorName: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  createdAt: string;
}

export interface DoctorPatientDetail {
  profile: PatientProfile;
  history: string[];
  notes: ConsultationNote[];
  prescriptions: Prescription[];
  results: LabImagingResult[];
  vitals: VitalRecord[];
}

export interface ConsultationNotePayload {
  patientId: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface PrescriptionPayload {
  patientId: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface LabRequestPayload {
  patientId: string;
  kind: 'lab' | 'imaging';
  name: string;
  clinicalQuestion: string;
  priority: 'routine' | 'urgent';
}

export interface ChatSendPayload {
  threadId: string;
  role: UserRole;
  senderName: string;
  body: string;
}

export interface ExplainResultPayload {
  resultId: string;
  patientQuestion: string;
}

export interface DraftAssistantPayload {
  kind: 'consultation-note' | 'prescription';
  patientId: string;
  context: string;
}

export interface AssistantTextResponse {
  title: string;
  content: string;
  caution: string;
}

export type ClinixAIMessageRole = 'user' | 'assistant';

export interface ClinixAIMessageInput {
  role: ClinixAIMessageRole;
  content: string;
}

export interface ClinixAIMessage extends ClinixAIMessageInput {
  id: string;
  createdAt: string;
}

export interface AIChatPayload {
  role: UserRole;
  messages: ClinixAIMessageInput[];
  patientContext?: string;
}

export interface AIChatResponse {
  content: string;
  caution: string;
}
