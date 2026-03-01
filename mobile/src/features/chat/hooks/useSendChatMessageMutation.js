import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/core/constants/queryKeys';
import { getDefaultThreadId, sendChatMessage } from '@/src/services/api/endpoints/chatApi';
export function useSendChatMessageMutation(role) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload) => {
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
