import { useMutation } from '@tanstack/react-query';

import { chatWithClinixAI } from '@/src/services/api/endpoints/aiApi';

export function useClinixAIChatMutation() {
  return useMutation({
    mutationFn: chatWithClinixAI,
  });
}
