import { config } from '@/src/core/config/env';
import type { ChatMessage, ChatSendPayload } from '@/src/core/types/domain';
import type { UserRole } from '@/src/core/types/auth';
import { addMockChatMessage, getMockChatMessages, getMockThreadId } from '@/src/mocks/chats';
import { apiRequest } from '@/src/services/api/client';

interface ChatThread {
  id: string;
  title?: string;
}

export function getDefaultThreadId(role: UserRole): string {
  return getMockThreadId(role);
}

export async function fetchThreads(role: UserRole): Promise<ChatThread[]> {
  try {
    const response = await apiRequest<{
      success: boolean;
      threads?: ChatThread[];
    }>({
      method: 'GET',
      url: '/threads',
      params: { role },
    });

    if (!response.success || !Array.isArray(response.threads) || response.threads.length === 0) {
      if (!config.enableMockFallback) {
        throw new Error('Invalid threads response');
      }

      return [{ id: getMockThreadId(role), title: role === 'doctor' ? 'Patient Messages' : 'Care Team' }];
    }

    return response.threads;
  } catch (error) {
    if (!config.enableMockFallback) {
      throw error;
    }

    return [{ id: getMockThreadId(role), title: role === 'doctor' ? 'Patient Messages' : 'Care Team' }];
  }
}

export async function fetchChatMessages(role: UserRole): Promise<ChatMessage[]> {
  const fallbackThreadId = getMockThreadId(role);

  try {
    const threads = await fetchThreads(role);
    const threadId = threads[0]?.id ?? fallbackThreadId;

    const response = await apiRequest<{
      success: boolean;
      messages?: ChatMessage[];
    }>({
      method: 'GET',
      url: `/threads/${threadId}/messages`,
    });

    if (!response.success || !Array.isArray(response.messages)) {
      if (!config.enableMockFallback) {
        throw new Error('Invalid messages response');
      }

      return getMockChatMessages(role);
    }

    return response.messages.map((item) => ({ ...item, encrypted: true }));
  } catch (error) {
    if (!config.enableMockFallback) {
      throw error;
    }

    return getMockChatMessages(role);
  }
}

export async function sendChatMessage(payload: ChatSendPayload): Promise<ChatMessage> {
  try {
    const response = await apiRequest<{
      success: boolean;
      message?: ChatMessage;
    }>({
      method: 'POST',
      url: `/threads/${payload.threadId}/messages`,
      data: {
        role: payload.role,
        senderName: payload.senderName,
        body: payload.body,
      },
    });

    if (!response.success || !response.message) {
      if (!config.enableMockFallback) {
        throw new Error('Invalid send message response');
      }

      return addMockChatMessage(payload);
    }

    return { ...response.message, encrypted: true };
  } catch (error) {
    if (!config.enableMockFallback) {
      throw error;
    }

    return addMockChatMessage(payload);
  }
}
