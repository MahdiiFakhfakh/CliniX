import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/src/core/constants/queryKeys';
import { fetchNursePatients } from '@/src/services/api/endpoints/patientsApi';

export function useNursePatientsQuery() {
  return useQuery({
    queryKey: queryKeys.nursePatients.list,
    queryFn: fetchNursePatients,
  });
}
