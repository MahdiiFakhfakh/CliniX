import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/src/core/constants/queryKeys';
import { fetchDoctorAlerts } from '@/src/services/api/endpoints/recordsApi';

export function useDoctorAlertsQuery() {
  return useQuery({
    queryKey: queryKeys.doctor.alerts,
    queryFn: fetchDoctorAlerts,
  });
}
