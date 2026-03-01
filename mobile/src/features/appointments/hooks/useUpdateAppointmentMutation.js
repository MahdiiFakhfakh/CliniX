import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/core/constants/queryKeys';
import { updateAppointment } from '@/src/services/api/endpoints/appointmentsApi';
export function useUpdateAppointmentMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => updateAppointment(payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.appointments.list('patient') });
            await queryClient.invalidateQueries({ queryKey: queryKeys.appointments.list('doctor') });
        },
    });
}
