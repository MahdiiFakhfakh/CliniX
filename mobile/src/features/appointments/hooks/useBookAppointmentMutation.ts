import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/src/core/constants/queryKeys';
import type { BookAppointmentPayload } from '@/src/core/types/domain';
import { bookAppointment } from '@/src/services/api/endpoints/appointmentsApi';

export function useBookAppointmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BookAppointmentPayload) => bookAppointment(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.appointments.list('patient') });
      await queryClient.invalidateQueries({ queryKey: queryKeys.appointments.list('doctor') });
    },
  });
}
