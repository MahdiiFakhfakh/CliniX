import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/src/core/constants/queryKeys';
import { fetchLabResults } from '@/src/services/api/endpoints/recordsApi';

export function useLabResultsQuery(patientId?: string) {
  return useQuery({
    queryKey: queryKeys.results.list(patientId),
    queryFn: () => fetchLabResults(patientId),
  });
}
