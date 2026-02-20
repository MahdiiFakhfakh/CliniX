import React from 'react';

import { SettingsScreen } from '@/src/features/settings/screens/SettingsScreen';

export default function PatientPreferencesRoute(): React.JSX.Element {
  return <SettingsScreen subtitle="Configure accessibility and notification preferences." />;
}
