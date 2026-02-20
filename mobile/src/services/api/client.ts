import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

import { config } from '@/src/core/config/env';
import { asApiClientError, mockApiRequest } from '@/src/services/api/mockServer';

export class ApiClientError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
  }
}

let sessionToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 12000,
});

export const setApiToken = (token: string | null): void => {
  sessionToken = token;
};

export const registerUnauthorizedHandler = (handler: (() => void) | null): void => {
  onUnauthorized = handler;
};

apiClient.interceptors.request.use((requestConfig) => {
  const nextConfig = requestConfig;

  if (sessionToken) {
    nextConfig.headers.Authorization = `Bearer ${sessionToken}`;
  }

  nextConfig.headers.Accept = 'application/json';
  nextConfig.headers['Content-Type'] = 'application/json';

  return nextConfig;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    const statusCode = error.response?.status;
    const message =
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      'Unexpected network error';

    if (statusCode === 401 && onUnauthorized) {
      onUnauthorized();
    }

    return Promise.reject(new ApiClientError(message, statusCode));
  },
);

export async function apiRequest<T>(requestConfig: AxiosRequestConfig): Promise<T> {
  if (config.enableMockServer) {
    try {
      return await mockApiRequest<T>(requestConfig, sessionToken);
    } catch (error) {
      const mockError = asApiClientError(error) as ApiClientError;

      if (mockError.statusCode === 401 && onUnauthorized) {
        onUnauthorized();
      }

      throw new ApiClientError(mockError.message, mockError.statusCode);
    }
  }

  const response = await apiClient.request<T>(requestConfig);
  return response.data;
}
