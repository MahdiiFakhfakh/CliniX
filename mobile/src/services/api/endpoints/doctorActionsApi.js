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
export async function requestLabOrImaging(payload) {
    const response = await apiRequest({
        method: 'POST',
        url: `/patients/${payload.patientId}/orders`,
        data: payload,
    });
    if (!response.success || !response.result) {
        throw new Error('Invalid create order response');
    }
    return response.result;
}
