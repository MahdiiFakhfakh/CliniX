import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/src/core/constants/queryKeys';
import { fetchAppointments } from '@/src/services/api/endpoints/appointmentsApi';
export function useAppointmentsQuery(role) {
    return useQuery({
        queryKey: queryKeys.appointments.list(role),
        queryFn: () => fetchAppointments(role),
    });
}
