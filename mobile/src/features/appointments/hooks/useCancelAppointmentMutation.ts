import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/src/core/constants/queryKeys';
import { cancelAppointment } from '@/src/services/api/endpoints/appointmentsApi';

export function useCancelAppointmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appointmentId: string) => cancelAppointment(appointmentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.appointments.list('patient') });
      await queryClient.invalidateQueries({ queryKey: queryKeys.appointments.list('doctor') });
    },
  });
}
