import { config } from '@/src/core/config/env';
import type { AIChatPayload, AIChatResponse, AssistantTextResponse, DraftAssistantPayload, ExplainResultPayload } from '@/src/core/types/domain';
import { mockAIChat, mockDraftClinicalText, mockExplainResult } from '@/src/mocks/ai';
import { apiRequest } from '@/src/services/api/client';

export async function explainResult(payload: ExplainResultPayload): Promise<AssistantTextResponse> {
  try {
    const response = await apiRequest<{
      success: boolean;
      explanation?: AssistantTextResponse;
    }>({
      method: 'POST',
      url: '/ai/explain-result',
      data: payload,
    });

    if (!response.success || !response.explanation) {
      if (!config.enableMockFallback) {
        throw new Error('Invalid explain result response');
      }

      return mockExplainResult(payload);
    }

    return response.explanation;
  } catch (error) {
    if (!config.enableMockFallback) {
      throw error;
    }

    return mockExplainResult(payload);
  }
}

export async function draftClinicalText(payload: DraftAssistantPayload): Promise<AssistantTextResponse> {
  try {
    const response = await apiRequest<{
      success: boolean;
      draft?: AssistantTextResponse;
    }>({
      method: 'POST',
      url: '/ai/draft',
      data: payload,
    });

    if (!response.success || !response.draft) {
      if (!config.enableMockFallback) {
        throw new Error('Invalid AI draft response');
      }

      return mockDraftClinicalText(payload);
    }

    return response.draft;
  } catch (error) {
    if (!config.enableMockFallback) {
      throw error;
    }

    return mockDraftClinicalText(payload);
  }
}

export async function chatWithClinixAI(payload: AIChatPayload): Promise<AIChatResponse> {
  try {
    const response = await apiRequest<{
      success: boolean;
      content?: string;
      caution?: string;
      reply?: {
        content?: string;
        caution?: string;
      };
    }>({
      method: 'POST',
      url: '/ai/chat',
      data: payload,
    });

    const content = response.reply?.content ?? response.content;
    const caution = response.reply?.caution ?? response.caution;

    if (!response.success || !content || !caution) {
      if (!config.enableMockFallback) {
        throw new Error('Invalid AI chat response');
      }

      return mockAIChat(payload);
    }

    return { content, caution };
  } catch (error) {
    if (!config.enableMockFallback) {
      throw error;
    }

    return mockAIChat(payload);
  }
}
