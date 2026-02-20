const DEFAULT_BASE_URL = 'http://localhost:5000/api';

export const config = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL,
  enableMockServer: (process.env.EXPO_PUBLIC_ENABLE_MOCK_SERVER ?? 'false') === 'true',
  enableMockFallback: (process.env.EXPO_PUBLIC_ENABLE_MOCK_FALLBACK ?? 'false') === 'true',
  appName: 'CliniX Mobile',
};
