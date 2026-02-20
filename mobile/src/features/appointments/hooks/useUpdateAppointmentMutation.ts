import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/src/core/constants/queryKeys';
import type { UpdateAppointmentPayload } from '@/src/core/types/domain';
import { updateAppointment } from '@/src/services/api/endpoints/appointmentsApi';

export function useUpdateAppointmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAppointmentPayload) => updateAppointment(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.appointments.list('patient') });
      await queryClient.invalidateQueries({ queryKey: queryKeys.appointments.list('doctor') });
    },
  });
}
