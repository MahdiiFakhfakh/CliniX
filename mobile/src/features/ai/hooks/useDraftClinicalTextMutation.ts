import { useMutation } from '@tanstack/react-query';

import { draftClinicalText } from '@/src/services/api/endpoints/aiApi';

export function useDraftClinicalTextMutation() {
  return useMutation({
    mutationFn: draftClinicalText,
  });
}
