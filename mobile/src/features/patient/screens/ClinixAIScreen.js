import React from 'react';
// Use default import if ChatbotScreen is exported as default
import ChatbotScreen from '@/src/features/ai/screens/ChatbotScreen.js';

export function ClinixAIScreen() {
  return (
    <ChatbotScreen
      role="patient"
      title="CliniX AI"
      subtitle="Ask for plain-language result explanations and medication-use guidance."
    />
  );
}