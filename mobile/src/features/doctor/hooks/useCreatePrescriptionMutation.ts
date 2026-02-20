import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/src/core/constants/queryKeys';
import { createPrescription } from '@/src/services/api/endpoints/doctorActionsApi';

export function useCreatePrescriptionMutation(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPrescription,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.doctor.patientDetail(patientId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.list(patientId) });
    },
  });
}
