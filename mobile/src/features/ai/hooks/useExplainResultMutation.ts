import { useMutation } from '@tanstack/react-query';

import { explainResult } from '@/src/services/api/endpoints/aiApi';

export function useExplainResultMutation() {
  return useMutation({
    mutationFn: explainResult,
  });
}
