import { useQuery } from '@tanstack/react-query';

import type { UserRole } from '@/src/core/types/auth';
import { queryKeys } from '@/src/core/constants/queryKeys';
import { fetchChatMessages } from '@/src/services/api/endpoints/chatApi';

export function useChatMessagesQuery(role: UserRole) {
  return useQuery({
    queryKey: queryKeys.chat.thread(role),
    queryFn: () => fetchChatMessages(role),
  });
}
