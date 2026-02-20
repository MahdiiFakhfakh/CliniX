import React from 'react';

import { ClinixAIChatScreen } from '@/src/features/ai/screens/ClinixAIChatScreen';

export function DoctorClinixAIScreen(): React.JSX.Element {
  return (
    <ClinixAIChatScreen
      role="doctor"
      title="CliniX AI Assistant"
      subtitle="Draft note and prescription text faster, then verify before finalizing."
    />
  );
}
