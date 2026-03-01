import { config } from '@/src/core/config/env';
import { mockNursePatients } from '@/src/mocks/patients';
import { apiRequest } from '@/src/services/api/client';
const mapRiskLevel = (status) => {
    if (status === 'critical' || status === 'inactive') {
        return 'high';
    }
    if (status === 'pending') {
        return 'medium';
    }
    return 'low';
};
export async function fetchNursePatients() {
    try {
        const response = await apiRequest({
            method: 'GET',
            url: '/admin/patients',
            params: { limit: 30 },
        });
        if (!response.success || !Array.isArray(response.patients) || response.patients.length === 0) {
            if (!config.enableMockFallback) {
                throw new Error('Invalid nurse patients response');
            }
            return mockNursePatients;
        }
        return response.patients.slice(0, 20).map((item, index) => ({
            id: item._id,
            fullName: (item.fullName ?? `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim()) || 'Unknown Patient',
            age: item.age ?? 0,
            bedNumber: `ER-${(index + 1).toString().padStart(2, '0')}`,
            condition: item.condition ?? 'Observation',
            riskLevel: mapRiskLevel(item.status),
            updatedAt: item.updatedAt ?? new Date().toISOString(),
        }));
    }
    catch (error) {
        if (!config.enableMockFallback) {
            throw error;
        }
        return mockNursePatients;
    }
}
