import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/src/core/theme/tokens';
import { usePrescriptionsQuery } from '@/src/features/patient/hooks/usePrescriptionsQuery';
import { EmptyState } from '@/src/shared/components/EmptyState';
import { LoadingView } from '@/src/shared/components/LoadingView';
import { Screen } from '@/src/shared/components/Screen';

export function PatientPrescriptionsListScreen(): React.JSX.Element {
  const router = useRouter();
  const prescriptionsQuery = usePrescriptionsQuery();
  const handleRefresh = () => {
    void prescriptionsQuery.refetch();
  };

  if (prescriptionsQuery.isLoading) {
    return (
      <Screen title="Prescriptions" subtitle="Loading prescriptions..." scroll={false}>
        <LoadingView />
      </Screen>
    );
  }

  if (!prescriptionsQuery.data || prescriptionsQuery.data.length === 0) {
    return (
      <Screen
        title="Prescriptions"
        subtitle="No prescriptions found."
        refreshing={prescriptionsQuery.isRefetching}
        onRefresh={handleRefresh}
      >
        <EmptyState title="No prescriptions" subtitle="Your medication list will appear here." />
      </Screen>
    );
  }

  return (
    <Screen
      title="Prescriptions"
      subtitle="Open any prescription to view details."
      refreshing={prescriptionsQuery.isRefetching}
      onRefresh={handleRefresh}
    >
      <View style={styles.list}>
        {prescriptionsQuery.data.map((prescription) => (
          <Pressable
            key={prescription.id}
            onPress={() =>
              router.push({
                pathname: '/(app)/(patient)/prescription/[prescriptionId]',
                params: { prescriptionId: prescription.id },
              })
            }
            style={styles.card}
          >
            <Text style={styles.title}>{prescription.medication}</Text>
            <Text style={styles.meta}>{prescription.dosage} - {prescription.frequency}</Text>
            <Text style={styles.meta}>Duration: {prescription.duration}</Text>
            <Text style={styles.meta}>Status: {prescription.status.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 20,
  },
});
