import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/src/core/constants/queryKeys';
import { fetchPatientProfile } from '@/src/services/api/endpoints/recordsApi';

export function usePatientProfileQuery() {
  return useQuery({
    queryKey: queryKeys.patient.profile,
    queryFn: fetchPatientProfile,
  });
}
