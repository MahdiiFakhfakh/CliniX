import { config } from '@/src/core/config/env';
import { mockAIChat, mockDraftClinicalText, mockExplainResult } from '@/src/mocks/ai';
import { apiRequest } from '@/src/services/api/client';
export async function explainResult(payload) {
    try {
        const response = await apiRequest({
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
    }
    catch (error) {
        if (!config.enableMockFallback) {
            throw error;
        }
        return mockExplainResult(payload);
    }
}
export async function draftClinicalText(payload) {
    try {
        const response = await apiRequest({
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
    }
    catch (error) {
        if (!config.enableMockFallback) {
            throw error;
        }
        return mockDraftClinicalText(payload);
    }
}
export async function chatWithClinixAI(payload) {
    try {
        const response = await apiRequest({
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
    }
    catch (error) {
        if (!config.enableMockFallback) {
            throw error;
        }
        return mockAIChat(payload);
    }
}
