import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors, radius, spacing, typography } from '@/src/core/theme/tokens';
import { usePrescriptionsQuery } from '@/src/features/patient/hooks/usePrescriptionsQuery';
import { Card } from '@/src/shared/components/Card';
import { EmptyState } from '@/src/shared/components/EmptyState';
import { LoadingView } from '@/src/shared/components/LoadingView';
import { Screen } from '@/src/shared/components/Screen';

export function PatientPrescriptionDetailScreen(): React.JSX.Element {
  const params = useLocalSearchParams<{ prescriptionId: string }>();
  const prescriptionId = params.prescriptionId ?? '';

  const prescriptionsQuery = usePrescriptionsQuery();

  if (prescriptionsQuery.isLoading) {
    return (
      <Screen title="Prescription Details" subtitle="Loading prescription..." scroll={false}>
        <LoadingView />
      </Screen>
    );
  }

  const prescription = prescriptionsQuery.data?.find((item) => item.id === prescriptionId);

  if (!prescription) {
    return (
      <Screen title="Prescription Details" subtitle="Prescription not found.">
        <EmptyState title="Not found" subtitle="This prescription is unavailable." />
      </Screen>
    );
  }

  return (
    <Screen title="Prescription Details" subtitle="Medication instructions and schedule.">
      <Card>
        <Text style={styles.title}>{prescription.medication}</Text>
        <Text style={styles.line}>Dosage: {prescription.dosage}</Text>
        <Text style={styles.line}>Frequency: {prescription.frequency}</Text>
        <Text style={styles.line}>Duration: {prescription.duration}</Text>
        <Text style={styles.line}>Status: {prescription.status.toUpperCase()}</Text>
        <Text style={styles.line}>Prescribed by: {prescription.prescribedBy}</Text>
        <Text style={styles.line}>Issued: {new Date(prescription.issuedAt).toDateString()}</Text>

        <Card>
          <Text style={styles.instructionsLabel}>Instructions</Text>
          <Text style={styles.instructions}>{prescription.instructions}</Text>
        </Card>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  line: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  instructionsLabel: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  instructions: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 24,
  },
});
