import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/src/core/constants/queryKeys';
import { fetchDoctorPatients } from '@/src/services/api/endpoints/recordsApi';

export function useDoctorPatientsQuery() {
  return useQuery({
    queryKey: queryKeys.doctor.patients,
    queryFn: fetchDoctorPatients,
  });
}
