import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { UserRole } from '@/src/core/types/auth';
import { queryKeys } from '@/src/core/constants/queryKeys';
import { getDefaultThreadId, sendChatMessage } from '@/src/services/api/endpoints/chatApi';

type SendMessageInput = {
  body: string;
  role: UserRole;
  senderName: string;
};

export function useSendChatMessageMutation(role: UserRole) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SendMessageInput) => {
      return sendChatMessage({
        threadId: getDefaultThreadId(role),
        role: payload.role,
        senderName: payload.senderName,
        body: payload.body,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.chat.thread(role) });
    },
  });
}
