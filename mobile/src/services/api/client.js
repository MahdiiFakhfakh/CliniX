import axios from 'axios';
import { config } from '@/src/core/config/env';
import { asApiClientError, mockApiRequest } from '@/src/services/api/mockServer';
export class ApiClientError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.name = 'ApiClientError';
        this.statusCode = statusCode;
    }
}
let sessionToken = null;
let onUnauthorized = null;
export const apiClient = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: 30000,
});
export const setApiToken = (token) => {
    sessionToken = token;
};
export const registerUnauthorizedHandler = (handler) => {
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
apiClient.interceptors.response.use((response) => response, (error) => {
    const statusCode = error.response?.status;
    const fallbackMessage = error.response?.data?.message ??
        error.response?.data?.error ??
        error.message ??
        'Unexpected network error';
    const message = statusCode
        ? fallbackMessage
        : error.code === 'ECONNABORTED'
            ? `Request timed out while waiting for API at ${config.apiBaseUrl}`
            : `Network error. Unable to reach API at ${config.apiBaseUrl}`;
    if (statusCode === 401 && onUnauthorized) {
        onUnauthorized();
    }
    return Promise.reject(new ApiClientError(message, statusCode));
});
export async function apiRequest(requestConfig) {
     console.log('apiRequest:', requestConfig.url, 'token:', sessionToken ? 'YES' : 'NO', 'baseURL:', config.apiBaseUrl);
    if (config.enableMockServer) {
        try {
            return await mockApiRequest(requestConfig, sessionToken);
        }
        catch (error) {
            const mockError = asApiClientError(error);
            if (mockError.statusCode === 401 && onUnauthorized) {
                onUnauthorized();
            }
            throw new ApiClientError(mockError.message, mockError.statusCode);
        }
    }
    const response = await apiClient.request(requestConfig);
    return response.data;
}
