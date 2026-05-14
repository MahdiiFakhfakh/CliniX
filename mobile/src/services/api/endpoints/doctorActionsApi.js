import { apiRequest } from '@/src/services/api/client';
export async function createConsultationNote(payload) {
    const response = await apiRequest({
        method: 'POST',
        url: `/patients/${payload.patientId}/notes`,
        data: payload,
    });
    if (!response.success || !response.note) {
        throw new Error('Invalid create note response');
    }
    return response.note;
}
export async function createPrescription(payload) {
    const response = await apiRequest({
        method: 'POST',
        url: `/patients/${payload.patientId}/prescriptions`,
        data: payload,
    });
    if (!response.success || !response.prescription) {
        throw new Error('Invalid create prescription response');
    }
    return response.prescription;
}
export async function updatePatientMedicalRecord(payload) {
    const response = await apiRequest({
        method: 'PATCH',
        url: `/patients/${payload.patientId}/medical-record`,
        data: payload,
    });
    if (!response.success || !response.medicalRecord) {
        throw new Error('Invalid update medical record response');
    }
    return response.medicalRecord;
}
