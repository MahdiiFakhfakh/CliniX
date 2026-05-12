import { config } from '@/src/core/config/env';
import { getMockDoctorAlerts, getMockDoctorPatientDetail, getMockDoctorPatients, getMockLabResults, getMockMedicalSummary, getMockPatientProfile, getMockPrescriptions, } from '@/src/mocks/records';
import { apiRequest } from '@/src/services/api/client';
const mapRiskFromStatus = (status) => {
    if (status === 'inactive') return 'high';
    if (status === 'pending') return 'medium';
    return 'low';
};

const calcAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
};

const cleanPhone = (phone) =>
    !phone || phone === '00000000' ? null : phone;
const ensureFallbackEnabled = (message) => {
    if (!config.enableMockFallback) {
        throw new Error(message);
    }
};
export async function fetchPatientProfile() {
    try {
        const response = await apiRequest({
            method: 'GET',
            url: '/patients/me',
        });
        if (!response.success || !response.patient) {
            ensureFallbackEnabled('Invalid patient profile response');
            return getMockPatientProfile();
        }
        return response.patient;
    }
    catch (error) {
        if (!config.enableMockFallback) {
            throw error;
        }
        return getMockPatientProfile();
    }
}
export async function fetchPatientMedicalSummary() {
    try {
        const response = await apiRequest({
            method: 'GET',
            url: '/patients/me',
        });
        if (!response.success || !response.summary) {
            ensureFallbackEnabled('Invalid medical summary response');
            return getMockMedicalSummary();
        }
        return response.summary;
    }
    catch (error) {
        if (!config.enableMockFallback) {
            throw error;
        }
        return getMockMedicalSummary();
    }
}
export async function fetchPrescriptions(patientId) {
    if (patientId) {
        try {
            const response = await apiRequest({
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
        }
        catch (error) {
            if (!config.enableMockFallback) {
                throw error;
            }
            return getMockPrescriptions(patientId);
        }
    }
    try {
        const response = await apiRequest({
            method: 'GET',
            url: '/patients/me/prescriptions',
        });
        if (!response.success || !response.prescriptions) {
            ensureFallbackEnabled('Invalid patient prescriptions response');
            return getMockPrescriptions();
        }
        return response.prescriptions;
    }
    catch (error) {
        if (!config.enableMockFallback) {
            throw error;
        }
        return getMockPrescriptions();
    }
}
export async function fetchLabResults(patientId) {
    if (patientId) {
        try {
            const response = await apiRequest({
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
        }
        catch (error) {
            if (!config.enableMockFallback) {
                throw error;
            }
            return getMockLabResults(patientId);
        }
    }
    try {
        const response = await apiRequest({
            method: 'GET',
            url: '/patients/me/results',
        });
        if (!response.success || !response.results) {
            ensureFallbackEnabled('Invalid patient results response');
            return getMockLabResults();
        }
        return response.results;
    }
    catch (error) {
        if (!config.enableMockFallback) {
            throw error;
        }
        return getMockLabResults();
    }
}
export async function fetchDoctorAlerts() {
    try {
        const response = await apiRequest({
            method: 'GET',
            url: '/doctor/alerts',
        });
        if (!response.success || !response.alerts) {
            ensureFallbackEnabled('Invalid doctor alerts response');
            return getMockDoctorAlerts();
        }
        return response.alerts;
    }
    catch (error) {
        if (!config.enableMockFallback) {
            throw error;
        }
        return getMockDoctorAlerts();
    }
}
export async function fetchDoctorPatients() {
    try {
        const response = await apiRequest({
            method: 'GET',
            url: '/doctors/me/patients',
        });
        if (!response.success || !Array.isArray(response.patients) || response.patients.length === 0) {
            ensureFallbackEnabled('Invalid doctor patients response');
            return getMockDoctorPatients();
        }
        return response.patients.map((item) => ({
            id: item._id,
            fullName: (item.fullName ?? `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim()) || 'Unknown Patient',
            age: item.age ?? calcAge(item.dateOfBirth) ?? 0,
            condition: item.condition ?? item.medicalHistory?.[0]?.condition ?? 'General care',
            riskLevel: mapRiskFromStatus(item.status),
            lastVisit: item.updatedAt ?? item.createdAt ?? new Date().toISOString(),
        }));
    }
    catch (error) {
        if (!config.enableMockFallback) {
            throw error;
        }
        return getMockDoctorPatients();
    }
}
export async function fetchDoctorPatientDetail(patientId) {
    try {
        const response = await apiRequest({
            method: 'GET',
            url: `/patients/${patientId}`,
        });
        if (!response.success) {
            ensureFallbackEnabled('Invalid doctor patient detail response');
            return getMockDoctorPatientDetail(patientId);
        }
        if (response.detail?.profile) {
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
            fullName: (response.patient.fullName ??
                `${response.patient.firstName ?? ''} ${response.patient.lastName ?? ''}`.trim()) ||
                fallback.profile.fullName,
            age: response.patient.age ?? calcAge(response.patient.dateOfBirth) ?? fallback.profile.age,
            gender: response.patient.gender ?? fallback.profile.gender,
            phone: cleanPhone(response.patient.phone) ?? fallback.profile.phone,
            email: response.patient.email ?? fallback.profile.email,
        };
        return {
            ...fallback,
            profile,
        };
    }
    catch (error) {
        if (!config.enableMockFallback) {
            throw error;
        }
        return getMockDoctorPatientDetail(patientId);
    }
}
