import { apiRequest } from '@/src/services/api/client';
export async function fetchNotifications() {
    const response = await apiRequest({
        method: 'GET',
        url: '/notifications',
    });
    if (!response.success || !Array.isArray(response.notifications)) {
        throw new Error('Invalid notifications response');
    }
    return response.notifications;
}
