import React from 'react';

import { ClinixAIChatScreen } from '@/src/features/ai/screens/ClinixAIChatScreen';

export function ClinixAIScreen(): React.JSX.Element {
  return (
    <ClinixAIChatScreen
      role="patient"
      title="CliniX AI"
      subtitle="Ask for plain-language result explanations and medication-use guidance."
    />
  );
}
