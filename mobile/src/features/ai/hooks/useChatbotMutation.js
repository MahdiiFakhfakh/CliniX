import { useMutation } from '@tanstack/react-query';
import { chatWithClinixAI } from '@/src/services/api/endpoints/aiApi';

export function useChatbotMutation() {
  return useMutation({
    mutationFn: async ({ message, history }) => {
      return chatWithClinixAI({
        message,
        history,
      });
    },
  });
}