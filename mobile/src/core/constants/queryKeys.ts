import type { UserRole } from '@/src/core/types/auth';

export const queryKeys = {
  appointments: {
    list: (role: UserRole) => ['appointments', role] as const,
  },
  patient: {
    profile: ['patient-profile'] as const,
    medicalSummary: ['patient-medical-summary'] as const,
  },
  prescriptions: {
    list: (patientId?: string) => ['prescriptions', patientId ?? 'self'] as const,
  },
  results: {
    list: (patientId?: string) => ['results', patientId ?? 'self'] as const,
  },
  chat: {
    thread: (role: UserRole) => ['chat-thread', role] as const,
  },
  doctor: {
    alerts: ['doctor-alerts'] as const,
    patients: ['doctor-patients'] as const,
    patientDetail: (patientId: string) => ['doctor-patient-detail', patientId] as const,
  },
  nursePatients: {
    list: ['nurse-patients'] as const,
  },
  notifications: {
    list: ['notifications'] as const,
  },
};
