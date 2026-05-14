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

const fullNameFromPatient = (patient) =>
    (patient.fullName ?? `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim()) ||
    'Unknown Patient';

const buildPatientDetail = (patient, detail = {}) => ({
    ...detail,
    profile: detail.profile ?? {
        id: patient._id,
        patientId: patient.patientId,
        fullName: fullNameFromPatient(patient),
        age: patient.age ?? calcAge(patient.dateOfBirth) ?? null,
        gender: patient.gender,
        dateOfBirth: patient.dateOfBirth,
        phone: cleanPhone(patient.phone),
        email: patient.email,
        emergencyContact: patient.emergencyContact?.phone ?? patient.emergencyContact,
    },
    history: detail.history ?? [],
    prescriptions: detail.prescriptions ?? [],
    results: detail.results ?? [],
    vitals: detail.vitals ?? [],
});

export async function fetchPatientProfile() {
    const response = await apiRequest({
        method: 'GET',
        url: '/patients/me',
    });
    if (!response.success || !response.patient) {
        throw new Error('Invalid patient profile response');
    }
    return response.patient;
}

export async function fetchPatientMedicalSummary() {
    const response = await apiRequest({
        method: 'GET',
        url: '/patients/me',
    });
    if (!response.success || !response.summary) {
        throw new Error('Invalid medical summary response');
    }
    return response.summary;
}

export async function fetchPrescriptions(patientId) {
    const response = await apiRequest({
        method: 'GET',
        url: patientId ? `/patients/${patientId}/prescriptions` : '/patients/me/prescriptions',
    });
    if (!response.success || !Array.isArray(response.prescriptions)) {
        throw new Error(patientId ? 'Invalid doctor patient prescription response' : 'Invalid patient prescriptions response');
    }
    return response.prescriptions;
}

export async function fetchLabResults(patientId) {
    const response = await apiRequest({
        method: 'GET',
        url: patientId ? `/patients/${patientId}` : '/patients/me/results',
    });

    if (!response.success) {
        throw new Error(patientId ? 'Invalid doctor patient results response' : 'Invalid patient results response');
    }

    if (patientId) {
        if (Array.isArray(response.detail?.results)) {
            return response.detail.results;
        }
        if (Array.isArray(response.results)) {
            return response.results;
        }
        throw new Error('Missing results in doctor patient response');
    }

    if (!Array.isArray(response.results)) {
        throw new Error('Invalid patient results response');
    }
    return response.results;
}

export async function fetchDoctorAlerts() {
    const response = await apiRequest({
        method: 'GET',
        url: '/doctor/alerts',
    });
    if (!response.success || !Array.isArray(response.alerts)) {
        throw new Error('Invalid doctor alerts response');
    }
    return response.alerts;
}

export async function fetchDoctorPatients() {
    const response = await apiRequest({
        method: 'GET',
        url: '/doctors/me/patients',
    });
    if (!response.success || !Array.isArray(response.patients)) {
        throw new Error('Invalid doctor patients response');
    }
    return response.patients.map((item) => ({
        id: item._id,
        fullName: fullNameFromPatient(item),
        age: item.age ?? calcAge(item.dateOfBirth) ?? 0,
        condition: item.condition ?? item.medicalHistory?.[0]?.condition ?? 'General care',
        riskLevel: mapRiskFromStatus(item.status),
        lastVisit: item.updatedAt ?? item.createdAt ?? new Date().toISOString(),
    }));
}

export async function fetchDoctorPatientDetail(patientId) {
    const response = await apiRequest({
        method: 'GET',
        url: `/patients/${patientId}`,
    });
    if (!response.success) {
        throw new Error('Invalid doctor patient detail response');
    }
    if (response.detail?.profile) {
        return buildPatientDetail(response.detail.profile, response.detail);
    }
    if (!response.patient) {
        throw new Error('Missing patient detail response payload');
    }
    return buildPatientDetail(response.patient, response.detail);
}
