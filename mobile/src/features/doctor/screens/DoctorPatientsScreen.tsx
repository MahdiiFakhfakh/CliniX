import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/src/core/theme/tokens';
import { useDoctorPatientsQuery } from '@/src/features/doctor/hooks/useDoctorPatientsQuery';
import { EmptyState } from '@/src/shared/components/EmptyState';
import { LoadingView } from '@/src/shared/components/LoadingView';
import { Screen } from '@/src/shared/components/Screen';

export function DoctorPatientsScreen(): React.JSX.Element {
  const router = useRouter();
  const patientsQuery = useDoctorPatientsQuery();
  const handleRefresh = () => {
    void patientsQuery.refetch();
  };

  if (patientsQuery.isLoading) {
    return (
      <Screen title="Patient List" subtitle="Loading assigned patients..." scroll={false}>
        <LoadingView />
      </Screen>
    );
  }

  if (!patientsQuery.data || patientsQuery.data.length === 0) {
    return (
      <Screen
        title="Patient List"
        subtitle="No patients assigned."
        refreshing={patientsQuery.isRefetching}
        onRefresh={handleRefresh}
      >
        <EmptyState title="No patients" subtitle="Patient assignments will appear here." />
      </Screen>
    );
  }

  return (
    <Screen
      title="Patient List"
      subtitle="Open a patient to review history and create orders."
      refreshing={patientsQuery.isRefetching}
      onRefresh={handleRefresh}
    >
      <View style={styles.list}>
        {patientsQuery.data.map((patient) => (
          <Pressable
            key={patient.id}
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/(app)/(doctor)/patient/[patientId]',
                params: { patientId: patient.id },
              })
            }
            style={styles.patientRow}
          >
            <Text style={styles.patientName}>{patient.fullName}</Text>
            <Text style={styles.patientMeta}>Age {patient.age} | Risk {patient.riskLevel.toUpperCase()}</Text>
            <Text style={styles.patientMeta}>{patient.condition}</Text>
            <Text style={styles.patientMeta}>Last visit: {new Date(patient.lastVisit).toDateString()}</Text>
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
  patientRow: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 88,
    padding: spacing.md,
  },
  patientName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  patientMeta: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 20,
  },
});
