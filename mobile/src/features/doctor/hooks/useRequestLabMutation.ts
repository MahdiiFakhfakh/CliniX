import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/src/core/constants/queryKeys';
import { requestLabOrImaging } from '@/src/services/api/endpoints/doctorActionsApi';

export function useRequestLabMutation(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: requestLabOrImaging,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.doctor.patientDetail(patientId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.results.list(patientId) });
    },
  });
}
