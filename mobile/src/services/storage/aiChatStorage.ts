import AsyncStorage from '@react-native-async-storage/async-storage';

import type { UserRole } from '@/src/core/types/auth';
import type { ClinixAIMessage } from '@/src/core/types/domain';

const AI_CHAT_STORAGE_PREFIX = 'clinix.mobile.ai-chat.v1';
const MAX_STORED_MESSAGES = 80;

type AIChatStorageKey = {
  userId: string;
  role: UserRole;
};

function getAIChatStorageKey({ userId, role }: AIChatStorageKey): string {
  return `${AI_CHAT_STORAGE_PREFIX}:${role}:${userId}`;
}

function isClinixAIMessage(value: unknown): value is ClinixAIMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ClinixAIMessage>;

  return (
    typeof candidate.id === 'string' &&
    (candidate.role === 'user' || candidate.role === 'assistant') &&
    typeof candidate.content === 'string' &&
    typeof candidate.createdAt === 'string'
  );
}

export async function loadAIChatMessages(key: AIChatStorageKey): Promise<ClinixAIMessage[]> {
  const raw = await AsyncStorage.getItem(getAIChatStorageKey(key));

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isClinixAIMessage).slice(-MAX_STORED_MESSAGES);
  } catch {
    return [];
  }
}

export async function saveAIChatMessages(key: AIChatStorageKey, messages: ClinixAIMessage[]): Promise<void> {
  const trimmed = messages.slice(-MAX_STORED_MESSAGES);
  await AsyncStorage.setItem(getAIChatStorageKey(key), JSON.stringify(trimmed));
}

export async function clearAIChatMessages(key: AIChatStorageKey): Promise<void> {
  await AsyncStorage.removeItem(getAIChatStorageKey(key));
}

export async function clearAllAIChatMessages(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const targetKeys = keys.filter((item) => item.startsWith(`${AI_CHAT_STORAGE_PREFIX}:`));

  if (targetKeys.length === 0) {
    return;
  }

  await AsyncStorage.multiRemove(targetKeys);
}
