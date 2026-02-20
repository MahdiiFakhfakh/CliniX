import { config } from '@/src/core/config/env';
import type { InAppNotification } from '@/src/core/types/domain';
import { mockNotifications } from '@/src/mocks/notifications';
import { apiRequest } from '@/src/services/api/client';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchNotifications(): Promise<InAppNotification[]> {
  try {
    const response = await apiRequest<{
      success: boolean;
      notifications?: InAppNotification[];
    }>({
      method: 'GET',
      url: '/notifications',
    });

    if (!response.success || !Array.isArray(response.notifications)) {
      if (!config.enableMockFallback) {
        throw new Error('Invalid notifications response');
      }

      await delay(120);
      return mockNotifications;
    }

    return response.notifications;
  } catch (error) {
    if (!config.enableMockFallback) {
      throw error;
    }

    await delay(120);
    return mockNotifications;
  }
}
