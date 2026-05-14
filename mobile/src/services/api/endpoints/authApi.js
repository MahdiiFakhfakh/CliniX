import { isUserRole } from '@/src/core/types/auth';
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
}
export async function login(payload) {
    const requestData = {
        email: payload.email,
        password: payload.password,
    };
    if (payload.role) {
        requestData.role = payload.role;
    }
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
export async function refreshSession() {
    const response = await apiRequest({
        method: 'POST',
        url: '/auth/refresh',
    });
    if (!response.success || !response.token) {
        throw new ApiClientError('Unable to refresh session');
    }
    return { token: response.token };
}
export async function forgotPassword(payload) {
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
export async function updateProfile(params) {
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
        profile: {
            fullName: response.user.profile?.fullName ??
                response.user.name ??
                response.user.email.split('@')[0],
            department: response.user.profile?.department ?? response.user.department,
            phone: response.user.profile?.phone ?? response.user.phone,
        },
    };
}
