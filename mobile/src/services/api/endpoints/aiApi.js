import { apiRequest } from '@/src/services/api/client';
export async function chatWithClinixAI(payload) {
    const response = await apiRequest({
        method: 'POST',
        url: '/chatbot/chat',
        timeout: 180000,
        data: {
            message: payload.messages[payload.messages.length - 1].content,
        },
    });
    const content = response.reply?.content ?? response.content;
    const caution = response.reply?.caution ?? response.caution;
    if (!response.success || !content || !caution) {
        throw new Error('Invalid AI chat response');
    }
    return { content, caution };
}
export async function explainResult(payload) {
    const response = await apiRequest({
        method: 'POST',
        url: '/ai/explain-result',
        data: payload,
    });
    if (!response.success || !response.explanation) {
        throw new Error('Invalid AI explanation response');
    }
    return response.explanation;
}
export async function draftClinicalText(payload) {
    const response = await apiRequest({
        method: 'POST',
        url: '/ai/draft',
        data: payload,
    });
    if (!response.success || !response.draft) {
        throw new Error('Invalid AI draft response');
    }
    return response.draft;
}
