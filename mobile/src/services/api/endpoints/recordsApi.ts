import { config } from '@/src/core/config/env';
import type {
  DoctorAlert,
  DoctorPatientDetail,
  DoctorPatientListItem,
  LabImagingResult,
  MedicalSummary,
  PatientProfile,
  Prescription,
} from '@/src/core/types/domain';
import {
  getMockDoctorAlerts,
  getMockDoctorPatientDetail,
  getMockDoctorPatients,
  getMockLabResults,
  getMockMedicalSummary,
  getMockPatientProfile,
  getMockPrescriptions,
} from '@/src/mocks/records';
import { apiRequest } from '@/src/services/api/client';

interface BackendPatientItem {
  _id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  email?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  patientId?: string;
}

interface BackendPatientsResponse {
  success: boolean;
  patients: BackendPatientItem[];
}

const mapRiskFromStatus = (status?: string): DoctorPatientListItem['riskLevel'] => {
  if (status === 'inactive') {
    return 'high';
  }

  if (status === 'pending') {
    return 'medium';
  }

  return 'low';
};

const ensureFallbackEnabled = (message: string): void => {
  if (!config.enableMockFallback) {
    throw new Error(message);
  }
};

export async function fetchPatientProfile(): Promise<PatientProfile> {
  try {
    const response = await apiRequest<{
      success: boolean;
      patient?: PatientProfile;
    }>({
      method: 'GET',
      url: '/patients/me',
    });

    if (!response.success || !response.patient) {
      ensureFallbackEnabled('Invalid patient profile response');
      return getMockPatientProfile();
    }

    const fallback = getMockPatientProfile();

    return {
      ...fallback,
      ...response.patient,
    };
  } catch (error) {
    if (!config.enableMockFallback) {
      throw error;
    }

    return getMockPatientProfile();
  }
}

export async function fetchPatientMedicalSummary(): Promise<MedicalSummary> {
  try {
    const response = await apiRequest<{
      success: boolean;
      summary?: MedicalSummary;
    }>({
      method: 'GET',
      url: '/patients/me',
    });

    if (!response.success || !response.summary) {
      ensureFallbackEnabled('Invalid medical summary response');
      return getMockMedicalSummary();
    }

    return response.summary;
  } catch (error) {
    if (!config.enableMockFallback) {
      throw error;
    }

    return getMockMedicalSummary();
  }
}

export async function fetchPrescriptions(patientId?: string): Promise<Prescription[]> {
  if (patientId) {
    try {
      const response = await apiRequest<{
        success: boolean;
        detail?: DoctorPatientDetail;
        prescriptions?: Prescription[];
      }>({
        method: 'GET',
        url: `/patients/${patientId}`,
      });

      if (!response.success) {
        ensureFallbackEnabled('Invalid doctor patient prescription response');
        return getMockPrescriptions(patientId);
      }

      if (Array.isArray(response.detail?.prescriptions)) {
        return response.detail.prescriptions;
      }

      if (Array.isArray(response.prescriptions)) {
        return response.prescriptions;
      }

      ensureFallbackEnabled('Missing prescriptions in doctor patient response');
      return getMockPrescriptions(patientId);
    } catch (error) {
      if (!config.enableMockFallback) {
        throw error;
      }

      return getMockPrescriptions(patientId);
    }
  }

  try {
    const response = await apiRequest<{
      success: boolean;
      prescriptions?: Prescription[];
    }>({
      method: 'GET',
      url: '/patients/me/prescriptions',
    });

    if (!response.success || !response.prescriptions) {
      ensureFallbackEnabled('Invalid patient prescriptions response');
      return getMockPrescriptions();
    }

    return response.prescriptions;
  } catch (error) {
    if (!config.enableMockFallback) {
      throw error;
    }

    return getMockPrescriptions();
  }
}

export async function fetchLabResults(patientId?: string): Promise<LabImagingResult[]> {
  if (patientId) {
    try {
      const response = await apiRequest<{
        success: boolean;
        detail?: DoctorPatientDetail;
        results?: LabImagingResult[];
      }>({
        method: 'GET',
        url: `/patients/${patientId}`,
      });

      if (!response.success) {
        ensureFallbackEnabled('Invalid doctor patient results response');
        return getMockLabResults(patientId);
      }

      if (Array.isArray(response.detail?.results)) {
        return response.detail.results;
      }

      if (Array.isArray(response.results)) {
        return response.results;
      }

      ensureFallbackEnabled('Missing results in doctor patient response');
      return getMockLabResults(patientId);
    } catch (error) {
      if (!config.enableMockFallback) {
        throw error;
      }

      return getMockLabResults(patientId);
    }
  }

  try {
    const response = await apiRequest<{
      success: boolean;
      results?: LabImagingResult[];
    }>({
      method: 'GET',
      url: '/patients/me/results',
    });

    if (!response.success || !response.results) {
      ensureFallbackEnabled('Invalid patient results response');
      return getMockLabResults();
    }

    return response.results;
  } catch (error) {
    if (!config.enableMockFallback) {
      throw error;
    }

    return getMockLabResults();
  }
}

export async function fetchDoctorAlerts(): Promise<DoctorAlert[]> {
  try {
    const response = await apiRequest<{
      success: boolean;
      alerts?: DoctorAlert[];
    }>({
      method: 'GET',
      url: '/doctor/alerts',
    });

    if (!response.success || !response.alerts) {
      ensureFallbackEnabled('Invalid doctor alerts response');
      return getMockDoctorAlerts();
    }

    return response.alerts;
  } catch (error) {
    if (!config.enableMockFallback) {
      throw error;
    }

    return getMockDoctorAlerts();
  }
}

export async function fetchDoctorPatients(): Promise<DoctorPatientListItem[]> {
  try {
    const response = await apiRequest<BackendPatientsResponse>({
      method: 'GET',
      url: '/doctors/me/patients',
    });

    if (!response.success || !Array.isArray(response.patients) || response.patients.length === 0) {
      ensureFallbackEnabled('Invalid doctor patients response');
      return getMockDoctorPatients();
    }

    return response.patients.map((item) => ({
      id: item._id,
      fullName:
        (item.fullName ?? `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim()) || 'Unknown Patient',
      age: item.age ?? 0,
      condition: 'Follow-up assessment',
      riskLevel: mapRiskFromStatus(item.status),
      lastVisit: item.updatedAt ?? item.createdAt ?? new Date().toISOString(),
    }));
  } catch (error) {
    if (!config.enableMockFallback) {
      throw error;
    }

    return getMockDoctorPatients();
  }
}

export async function fetchDoctorPatientDetail(patientId: string): Promise<DoctorPatientDetail> {
  try {
    const response = await apiRequest<{
      success: boolean;
      patient?: BackendPatientItem;
      detail?: DoctorPatientDetail;
    }>({
      method: 'GET',
      url: `/patients/${patientId}`,
    });

    if (!response.success) {
      ensureFallbackEnabled('Invalid doctor patient detail response');
      return getMockDoctorPatientDetail(patientId);
    }

    if (response.detail) {
      return response.detail;
    }

    if (!response.patient) {
      ensureFallbackEnabled('Missing patient detail response payload');
      return getMockDoctorPatientDetail(patientId);
    }

    const fallback = getMockDoctorPatientDetail(patientId);
    const profile = {
      ...fallback.profile,
      id: response.patient._id,
      patientId: response.patient.patientId ?? fallback.profile.patientId,
      fullName:
        (response.patient.fullName ??
          `${response.patient.firstName ?? ''} ${response.patient.lastName ?? ''}`.trim()) ||
        fallback.profile.fullName,
      age: response.patient.age ?? fallback.profile.age,
      gender: response.patient.gender ?? fallback.profile.gender,
      phone: response.patient.phone ?? fallback.profile.phone,
      email: response.patient.email ?? fallback.profile.email,
    };

    return {
      ...fallback,
      profile,
    };
  } catch (error) {
    if (!config.enableMockFallback) {
      throw error;
    }

    return getMockDoctorPatientDetail(patientId);
  }
}