import * as SecureStore from 'expo-secure-store';
const SESSION_KEY = 'clinix.mobile.session.v1';
const SESSION_VERSION = 2;
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

const decodeBase64Url = (value) => {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));

    if (typeof atob !== 'function') {
        return '';
    }

    try {
        return atob(base64 + padding);
    }
    catch {
        return '';
    }
};

const isJwtExpired = (token) => {
    if (typeof token !== 'string' || !token.includes('.')) {
        return false;
    }

    const parts = token.split('.');
    if (parts.length < 2) {
        return false;
    }

    const payloadString = decodeBase64Url(parts[1]);
    if (!payloadString) {
        return false;
    }

    try {
        const payload = JSON.parse(payloadString);
        if (typeof payload.exp !== 'number') {
            return false;
        }
        return payload.exp * 1000 <= Date.now();
    }
    catch {
        return false;
    }
};

export async function saveSession(session) {
    const payload = {
        version: SESSION_VERSION,
        savedAt: Date.now(),
        session,
    };
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(payload));
}
export async function loadSession() {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    if (!raw) {
        return null;
    }
    try {
        const parsed = JSON.parse(raw);

        if (parsed?.version !== SESSION_VERSION || !parsed?.session) {
            await clearSession();
            return null;
        }

        if (typeof parsed.savedAt !== 'number' || Date.now() - parsed.savedAt > SESSION_MAX_AGE_MS) {
            await clearSession();
            return null;
        }

        if (isJwtExpired(parsed.session?.token)) {
            await clearSession();
            return null;
        }

        return parsed.session;
    }
    catch {
        await clearSession();
        return null;
    }
}
export async function clearSession() {
    await SecureStore.deleteItemAsync(SESSION_KEY);
}
