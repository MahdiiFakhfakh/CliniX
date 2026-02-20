import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/src/core/theme/tokens';
import { useNursePatientsQuery } from '@/src/features/patients/hooks/useNursePatientsQuery';
import { Card } from '@/src/shared/components/Card';
import { LoadingView } from '@/src/shared/components/LoadingView';
import { PrimaryButton } from '@/src/shared/components/PrimaryButton';
import { Screen } from '@/src/shared/components/Screen';
import { useAuthStore } from '@/src/store/authStore';

export function NurseDashboardScreen(): React.JSX.Element {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const { data, isLoading, isRefetching, refetch } = useNursePatientsQuery();

  if (isLoading) {
    return (
      <Screen title="Nurse Dashboard" subtitle="Loading ward assignments..." scroll={false}>
        <LoadingView />
      </Screen>
    );
  }

  const highRiskCount = data?.filter((patient) => patient.riskLevel === 'high').length ?? 0;

  return (
    <Screen
      title={`Welcome, ${session?.user.profile.fullName ?? 'Nurse'}`}
      subtitle="Track assigned patients, priorities, and alerts from one place."
      refreshing={isRefetching}
      onRefresh={() => {
        void refetch();
      }}
    >
      <Card>
        <Text style={styles.metricLabel}>High-risk patients</Text>
        <Text style={styles.metricValue}>{highRiskCount}</Text>
        <Text style={styles.metricHint}>Patient list remains available offline from cache.</Text>
      </Card>

      <View style={styles.actions}>
        <PrimaryButton label="Open Patient List" onPress={() => router.push('/(app)/(nurse)/patients')} />
        <PrimaryButton label="Open Notifications" onPress={() => router.push('/(app)/notifications')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  metricLabel: {
    color: colors.textMuted,
    fontSize: typography.body,
    marginBottom: spacing.xs,
  },
  metricValue: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  metricHint: {
    color: colors.text,
    fontSize: typography.body,
  },
  actions: {
    gap: spacing.sm,
  },
});
