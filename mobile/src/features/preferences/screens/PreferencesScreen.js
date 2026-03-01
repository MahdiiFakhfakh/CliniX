import React from 'react';
import { SettingsScreen } from '@/src/features/settings/screens/SettingsScreen';
export function PreferencesScreen({ title, subtitle }) {
    return <SettingsScreen subtitle={subtitle ?? title}/>;
}
