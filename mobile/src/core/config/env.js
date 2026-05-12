import Constants from 'expo-constants';


const DEFAULT_BASE_URL = 'http://localhost:5000/api';


const sanitizeBaseUrl = (value) => {
    if (typeof value !== 'string') {
        return '';
    }
    return value.trim().replace(/\/+$/, '');
};

const buildDevBaseUrlFromHostUri = (hostUri) => {
    if (typeof hostUri !== 'string' || !hostUri.trim()) {
        return '';
    }

    const hostname = hostUri.split(':')[0]?.trim();
    if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
        return '';
    }

    return `http://${hostname}:5000/api`;
};

const resolveApiBaseUrl = () => {
    const envBaseUrl = sanitizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
    if (envBaseUrl) {
        return envBaseUrl;
    }

    const derivedBaseUrl = buildDevBaseUrlFromHostUri(Constants.expoConfig?.hostUri);
    if (derivedBaseUrl) {
        return derivedBaseUrl;
    }

    return DEFAULT_BASE_URL;
};

export const config = {
    apiBaseUrl: resolveApiBaseUrl(),
    enableMockServer: (process.env.EXPO_PUBLIC_ENABLE_MOCK_SERVER ?? 'false') === 'true',
    enableMockFallback: (process.env.EXPO_PUBLIC_ENABLE_MOCK_FALLBACK ?? 'true') === 'true',
    appName: 'CliniX Mobile',
     enableMockFallback: false,
};
