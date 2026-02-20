import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/src/core/constants/queryKeys';
import { fetchPatientMedicalSummary } from '@/src/services/api/endpoints/recordsApi';

export function usePatientMedicalSummaryQuery() {
  return useQuery({
    queryKey: queryKeys.patient.medicalSummary,
    queryFn: fetchPatientMedicalSummary,
  });
}
