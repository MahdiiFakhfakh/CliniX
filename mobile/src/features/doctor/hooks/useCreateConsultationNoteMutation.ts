import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/src/core/constants/queryKeys';
import { createConsultationNote } from '@/src/services/api/endpoints/doctorActionsApi';

export function useCreateConsultationNoteMutation(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createConsultationNote,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.doctor.patientDetail(patientId) });
    },
  });
}
