import React from 'react';

import { SettingsScreen } from '@/src/features/settings/screens/SettingsScreen';

type PreferencesScreenProps = {
  title?: string;
  subtitle?: string;
};

export function PreferencesScreen({ title, subtitle }: PreferencesScreenProps): React.JSX.Element {
  return <SettingsScreen subtitle={subtitle ?? title} />;
}
