import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/src/core/theme/tokens';
import { Card } from '@/src/shared/components/Card';
import { PrimaryButton } from '@/src/shared/components/PrimaryButton';
import { Screen } from '@/src/shared/components/Screen';
import { useAuthStore } from '@/src/store/authStore';
import { usePreferencesStore } from '@/src/store/preferencesStore';

export function SettingsScreen({ subtitle }: { subtitle?: string }): React.JSX.Element {
  const router = useRouter();
  const signOut = useAuthStore((state) => state.signOut);

  const largeText = usePreferencesStore((state) => state.largeText);
  const setLargeText = usePreferencesStore((state) => state.setLargeText);
  const highContrast = usePreferencesStore((state) => state.highContrast);
  const setHighContrast = usePreferencesStore((state) => state.setHighContrast);
  const notificationsEnabled = usePreferencesStore((state) => state.notificationsEnabled);
  const setNotificationsEnabled = usePreferencesStore((state) => state.setNotificationsEnabled);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <Screen title="Settings" subtitle={subtitle ?? 'Configure accessibility, notifications, and session controls.'}>
      <Card>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Large text mode</Text>
          <Switch value={largeText} onValueChange={setLargeText} />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>High contrast</Text>
          <Switch value={highContrast} onValueChange={setHighContrast} />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Enable reminders</Text>
          <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
        </View>
      </Card>

      <PrimaryButton label="Notifications List" onPress={() => router.push('/(app)/notifications')} />
      <PrimaryButton label="Sign Out" onPress={handleSignOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingVertical: spacing.xs,
  },
  label: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
  },
});
