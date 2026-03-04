import React from 'react';
import ClinixAIChatScreen from '../../ai/screens/ChatbotScreen.js';

export function DoctorClinixAIScreen() {
  return (
    <ClinixAIChatScreen
      role="doctor"
      title="CliniX AI Assistant"
      subtitle="Draft note and prescription text faster, then verify before finalizing."
    />
  );
}