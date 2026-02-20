import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/src/core/theme/tokens';
import { useNotificationsQuery } from '@/src/features/notifications/hooks/useNotificationsQuery';
import { Card } from '@/src/shared/components/Card';
import { EmptyState } from '@/src/shared/components/EmptyState';
import { LoadingView } from '@/src/shared/components/LoadingView';
import { PrimaryButton } from '@/src/shared/components/PrimaryButton';
import { Screen } from '@/src/shared/components/Screen';
import { scheduleLocalNotification } from '@/src/services/notifications/notificationsService';
import { usePreferencesStore } from '@/src/store/preferencesStore';

export function NotificationsScreen(): React.JSX.Element {
  const { data, isLoading, isRefetching, refetch } = useNotificationsQuery();
  const notificationsEnabled = usePreferencesStore((state) => state.notificationsEnabled);

  const handleTestReminder = async () => {
    if (!notificationsEnabled) {
      Alert.alert('Reminders disabled', 'Enable reminders from Preferences first.');
      return;
    }

    const id = await scheduleLocalNotification({
      title: 'CliniX Reminder',
      body: 'This is a local notification from expo-notifications.',
      secondsFromNow: 6,
    });

    if (!id) {
      Alert.alert('Permission required', 'Please grant notification permissions on device settings.');
      return;
    }

    Alert.alert('Reminder scheduled', 'A local reminder will appear shortly.');
  };

  if (isLoading) {
    return (
      <Screen title="Notifications List" subtitle="Loading feed..." scroll={false}>
        <LoadingView />
      </Screen>
    );
  }

  return (
    <Screen
      title="Notifications List"
      subtitle="Uses expo-notifications with local fallback."
      refreshing={isRefetching}
      onRefresh={() => {
        void refetch();
      }}
    >
      <PrimaryButton label="Schedule Test Reminder" onPress={handleTestReminder} />

      {!data || data.length === 0 ? (
        <EmptyState title="No notifications" subtitle="You are all caught up." />
      ) : (
        <View style={styles.list}>
          {data.map((item) => (
            <Card key={item.id}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.meta}>{new Date(item.sentAt).toLocaleString()}</Text>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  body: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 24,
    marginBottom: spacing.xs,
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.caption,
  },
});
