import { config } from '@/src/core/config/env';
import type {
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  UpdateProfilePayload,
  UserRole,
} from '@/src/core/types/auth';
import { isUserRole } from '@/src/core/types/auth';
import { mockForgotPassword, mockLogin, mockUpdateProfile } from '@/src/mocks/auth';
import { ApiClientError, apiRequest } from '@/src/services/api/client';

interface BackendLoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    profile?: {
      fullName?: string;
      department?: string;
      phone?: string;
    };
    name?: string;
    department?: string;
    phone?: string;
  };
}

const mapRole = (incomingRole: string, fallbackRole: UserRole): UserRole => {
  if (isUserRole(incomingRole)) {
    return incomingRole;
  }

  if (incomingRole === 'admin') {
    return 'doctor';
  }

  return fallbackRole;
};

const mapBackendSession = (
  response: BackendLoginResponse,
  fallbackRole: UserRole,
): LoginResponse => {
  return {
    token: response.token,
    user: {
      id: response.user.id,
      email: response.user.email,
      role: mapRole(response.user.role, fallbackRole),
      profile: {
        fullName:
          response.user.profile?.fullName ??
          response.user.name ??
          response.user.email.split('@')[0],
        department: response.user.profile?.department ?? response.user.department,
        phone: response.user.profile?.phone ?? response.user.phone,
      },
    },
  };
};

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  try {
    const backendResponse = await apiRequest<BackendLoginResponse>({
      method: 'POST',
      url: '/auth/login',
      data: {
        email: payload.email,
        password: payload.password,
        role: payload.role,
      },
    });

    if (!backendResponse.success || !backendResponse.token) {
      throw new ApiClientError('Invalid login response from API');
    }

    return mapBackendSession(backendResponse, payload.role);
  } catch (error) {
    if (!config.enableMockFallback) {
      throw error;
    }

    return mockLogin(payload);
  }
}

export async function refreshSession(): Promise<{ token: string }> {
  try {
    const response = await apiRequest<{
      success: boolean;
      token?: string;
    }>({
      method: 'POST',
      url: '/auth/refresh',
    });

    if (!response.success || !response.token) {
      throw new ApiClientError('Unable to refresh session');
    }

    return { token: response.token };
  } catch (error) {
    if (!config.enableMockFallback) {
      throw error;
    }

    return { token: 'mock-token-patient-u-patient-1' };
  }
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<{ message: string }> {
  try {
    const response = await apiRequest<{
      success: boolean;
      message?: string;
    }>({
      method: 'POST',
      url: '/auth/forgot-password',
      data: payload,
    });

    if (!response.success) {
      throw new ApiClientError(response.message ?? 'Unable to process forgot password request');
    }

    return { message: response.message ?? 'Password reset instructions have been sent.' };
  } catch (error) {
    if (!config.enableMockFallback) {
      throw error;
    }

    return mockForgotPassword(payload);
  }
}

export async function updateProfile(params: {
  userId: string;
  role: UserRole;
  payload: UpdateProfilePayload;
}): Promise<LoginResponse['user']> {
  try {
    const response = await apiRequest<{
      success: boolean;
      user?: {
        id: string;
        email: string;
        role: string;
        profile?: {
          fullName?: string;
          department?: string;
          phone?: string;
        };
        name?: string;
        department?: string;
        phone?: string;
      };
    }>({
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
        fullName:
          response.user.profile?.fullName ??
          response.user.name ??
          response.user.email.split('@')[0],
        department: response.user.profile?.department ?? response.user.department,
        phone: response.user.profile?.phone ?? response.user.phone,
      },
    };
  } catch (error) {
    if (!config.enableMockFallback) {
      throw error;
    }

    return mockUpdateProfile(params.userId, params.role, params.payload);
  }
}
