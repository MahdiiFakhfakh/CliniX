import { config } from '@/src/core/config/env';
import { mockAIChat, mockDraftClinicalText, mockExplainResult } from '@/src/mocks/ai';
import { apiRequest } from '@/src/services/api/client';
export async function chatWithClinixAI(payload) {
    console.log('Calling chatbot with:', payload);  
    try {
        const response = await apiRequest({
            method: 'POST',
            url: '/chatbot/chat',
            data: {
                // only send the latest user message
                // backend handles history from MongoDB
                message: payload.messages[payload.messages.length - 1].content,
            },
        });
        console.log('Backend response:', JSON.stringify(response));
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
        console.log('CHAT ERROR:', error.message, error.statusCode);
        if (!config.enableMockFallback) {
            throw error;
        }
        return mockAIChat(payload);
    }
}