import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/src/core/constants/queryKeys';
import { fetchNotifications } from '@/src/services/api/endpoints/notificationsApi';

export function useNotificationsQuery() {
  return useQuery({
    queryKey: queryKeys.notifications.list,
    queryFn: fetchNotifications,
  });
}
