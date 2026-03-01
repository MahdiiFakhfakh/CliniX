import AsyncStorage from '@react-native-async-storage/async-storage';
const AI_CHAT_STORAGE_PREFIX = 'clinix.mobile.ai-chat.v1';
const MAX_STORED_MESSAGES = 80;
function getAIChatStorageKey({ userId, role }) {
    return `${AI_CHAT_STORAGE_PREFIX}:${role}:${userId}`;
}
function isClinixAIMessage(value) {
    if (!value || typeof value !== 'object') {
        return false;
    }
    const candidate = value;
    return (typeof candidate.id === 'string' &&
        (candidate.role === 'user' || candidate.role === 'assistant') &&
        typeof candidate.content === 'string' &&
        typeof candidate.createdAt === 'string');
}
export async function loadAIChatMessages(key) {
    const raw = await AsyncStorage.getItem(getAIChatStorageKey(key));
    if (!raw) {
        return [];
    }
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed.filter(isClinixAIMessage).slice(-MAX_STORED_MESSAGES);
    }
    catch {
        return [];
    }
}
export async function saveAIChatMessages(key, messages) {
    const trimmed = messages.slice(-MAX_STORED_MESSAGES);
    await AsyncStorage.setItem(getAIChatStorageKey(key), JSON.stringify(trimmed));
}
export async function clearAIChatMessages(key) {
    await AsyncStorage.removeItem(getAIChatStorageKey(key));
}
export async function clearAllAIChatMessages() {
    const keys = await AsyncStorage.getAllKeys();
    const targetKeys = keys.filter((item) => item.startsWith(`${AI_CHAT_STORAGE_PREFIX}:`));
    if (targetKeys.length === 0) {
        return;
    }
    await AsyncStorage.multiRemove(targetKeys);
}
