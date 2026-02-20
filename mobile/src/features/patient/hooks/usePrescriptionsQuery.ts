import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/src/core/constants/queryKeys';
import { fetchPrescriptions } from '@/src/services/api/endpoints/recordsApi';

export function usePrescriptionsQuery(patientId?: string) {
  return useQuery({
    queryKey: queryKeys.prescriptions.list(patientId),
    queryFn: () => fetchPrescriptions(patientId),
  });
}
