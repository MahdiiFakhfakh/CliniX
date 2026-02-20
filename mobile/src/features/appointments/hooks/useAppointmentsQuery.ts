import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/src/core/constants/queryKeys';
import type { UserRole } from '@/src/core/types/auth';
import { fetchAppointments } from '@/src/services/api/endpoints/appointmentsApi';

export function useAppointmentsQuery(role: UserRole) {
  return useQuery({
    queryKey: queryKeys.appointments.list(role),
    queryFn: () => fetchAppointments(role),
  });
}
