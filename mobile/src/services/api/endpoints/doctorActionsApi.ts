import { config } from '@/src/core/config/env';
import type {
  ConsultationNote,
  ConsultationNotePayload,
  LabImagingResult,
  LabRequestPayload,
  Prescription,
  PrescriptionPayload,
} from '@/src/core/types/domain';
import { addMockConsultationNote, addMockLabRequest, addMockPrescription } from '@/src/mocks/records';
import { apiRequest } from '@/src/services/api/client';

export async function createConsultationNote(payload: ConsultationNotePayload): Promise<ConsultationNote> {
  try {
    const response = await apiRequest<{
      success: boolean;
      note?: ConsultationNote;
    }>({
      method: 'POST',
      url: `/patients/${payload.patientId}/notes`,
      data: payload,
    });

    if (!response.success || !response.note) {
      if (!config.enableMockFallback) {
        throw new Error('Invalid create note response');
      }

      return addMockConsultationNote(payload);
    }

    return response.note;
  } catch (error) {
    if (!config.enableMockFallback) {
      throw error;
    }

    return addMockConsultationNote(payload);
  }
}

export async function createPrescription(payload: PrescriptionPayload): Promise<Prescription> {
  try {
    const response = await apiRequest<{
      success: boolean;
      prescription?: Prescription;
    }>({
      method: 'POST',
      url: `/patients/${payload.patientId}/prescriptions`,
      data: payload,
    });

    if (!response.success || !response.prescription) {
      if (!config.enableMockFallback) {
        throw new Error('Invalid create prescription response');
      }

      return addMockPrescription(payload);
    }

    return response.prescription;
  } catch (error) {
    if (!config.enableMockFallback) {
      throw error;
    }

    return addMockPrescription(payload);
  }
}

export async function requestLabOrImaging(payload: LabRequestPayload): Promise<LabImagingResult> {
  try {
    const response = await apiRequest<{
      success: boolean;
      result?: LabImagingResult;
    }>({
      method: 'POST',
      url: `/patients/${payload.patientId}/orders`,
      data: payload,
    });

    if (!response.success || !response.result) {
      if (!config.enableMockFallback) {
        throw new Error('Invalid create order response');
      }

      return addMockLabRequest(payload);
    }

    return response.result;
  } catch (error) {
    if (!config.enableMockFallback) {
      throw error;
    }

    return addMockLabRequest(payload);
  }
}
