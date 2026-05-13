import { config } from '@/src/core/config/env';
import { isUserRole } from '@/src/core/types/auth';
import { mockForgotPassword, mockLogin, mockRegister, mockUpdateProfile } from '@/src/mocks/auth';
import { ApiClientError, apiRequest } from '@/src/services/api/client';
const mapRole = (incomingRole, fallbackRole) => {
    if (isUserRole(incomingRole)) {
        return incomingRole;
    }
    if (incomingRole === 'admin') {
        return 'doctor';
    }
    return fallbackRole;
};
const mapBackendSession = (response, fallbackRole) => {
    return {
        token: response.token,
        user: {
            id: response.user.id,
            email: response.user.email,
            role: mapRole(response.user.role, fallbackRole),
            status: response.user.status ?? null,
            profile: {
                fullName: response.user.profile?.fullName ??
                    response.user.name ??
                    response.user.email.split('@')[0],
                department: response.user.profile?.department ?? response.user.department,
                phone: response.user.profile?.phone ?? response.user.phone,
            },
        },
    };
};
export async function register(payload) {
    try {
        const backendResponse = await apiRequest({
            method: 'POST',
            url: '/auth/register',
            data: {
                email: payload.email,
                password: payload.password,
                role: payload.role,
                firstName: payload.firstName,
                lastName: payload.lastName,
                dateOfBirth: payload.dateOfBirth,
                gender: payload.gender,
                phone: payload.phone,
                bloodGroup: payload.bloodGroup,
                height: payload.height,
                weight: payload.weight,
                address: payload.address,
                emergencyContact: payload.emergencyContact,
            },
        });
        if (!backendResponse.success || !backendResponse.token) {
            throw new ApiClientError('Invalid register response from API');
        }
        return mapBackendSession(backendResponse, payload.role);
    } catch (error) {
        if (!config.enableMockFallback) {
            throw error;
        }
        return mockRegister(payload);
    }
}
export async function login(payload) {
    const requestData = {
        email: payload.email,
        password: payload.password,
    };
    if (payload.role) {
        requestData.role = payload.role;
    }
    try {
        const backendResponse = await apiRequest({
            method: 'POST',
            url: '/auth/login',
            data: requestData,
        });
        if (!backendResponse.success || !backendResponse.token) {
            throw new ApiClientError('Invalid login response from API');
        }
        return mapBackendSession(backendResponse, payload.role ?? 'patient');
    }
    catch (error) {
        if (!config.enableMockFallback) {
            throw error;
        }
        return mockLogin(payload);
    }
}
export async function refreshSession() {
    try {
        const response = await apiRequest({
            method: 'POST',
            url: '/auth/refresh',
        });
        if (!response.success || !response.token) {
            throw new ApiClientError('Unable to refresh session');
        }
        return { token: response.token };
    }
    catch (error) {
        if (!config.enableMockFallback) {
            throw error;
        }
        return { token: 'mock-token-patient-u-patient-1' };
    }
}
export async function forgotPassword(payload) {
    try {
        const response = await apiRequest({
            method: 'POST',
            url: '/auth/forgot-password',
            data: payload,
        });
        if (!response.success) {
            throw new ApiClientError(response.message ?? 'Unable to process forgot password request');
        }
        return { message: response.message ?? 'Password reset instructions have been sent.' };
    }
    catch (error) {
        if (!config.enableMockFallback) {
            throw error;
        }
        return mockForgotPassword(payload);
    }
}
export async function getMe() {
    try {
        const response = await apiRequest({
            method: 'GET',
            url: '/auth/me',
        });
        if (!response.success || !response.user) {
            throw new ApiClientError('Invalid getMe response');
        }
        return {
            id: response.user.id,
            email: response.user.email,
            role: mapRole(response.user.role, 'patient'),
            status: response.user.status ?? null,
            profile: {
                fullName: response.user.profile?.fullName ?? response.user.name ?? response.user.email.split('@')[0],
                department: response.user.profile?.department ?? response.user.department ?? '',
                phone: response.user.profile?.phone ?? response.user.phone ?? '',
            },
        };
    } catch {
        return null;
    }
}

export async function updateProfile(params) {
    try {
        const response = await apiRequest({
            method: 'PUT',
            url: '/auth/profile',
            data: params.payload,
        });
        if (!response.success || !response.user) {
            throw new ApiClientError('Invalid update profile response');
        }
        return {
            id: response.user.id,
            email: response.user.email,
            role: mapRole(response.user.role, params.role),
            status: response.user.status ?? null,
            profile: {
                fullName: response.user.profile?.fullName ??
                    response.user.name ??
                    response.user.email.split('@')[0],
                department: response.user.profile?.department ?? response.user.department ?? '',
                phone: response.user.profile?.phone ?? response.user.phone ?? '',
            },
        };
    }
    catch (error) {
        if (!config.enableMockFallback) {
            throw error;
        }
        return mockUpdateProfile(params.userId, params.role, params.payload);
    }
}
