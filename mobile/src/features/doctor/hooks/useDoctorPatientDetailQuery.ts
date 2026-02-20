import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/src/core/constants/queryKeys';
import { fetchDoctorPatientDetail } from '@/src/services/api/endpoints/recordsApi';

export function useDoctorPatientDetailQuery(patientId: string) {
  return useQuery({
    queryKey: queryKeys.doctor.patientDetail(patientId),
    queryFn: () => fetchDoctorPatientDetail(patientId),
    enabled: Boolean(patientId),
  });
}
