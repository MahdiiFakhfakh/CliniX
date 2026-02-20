import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/src/core/theme/tokens';
import type { PatientSummary } from '@/src/core/types/domain';
import { useNursePatientsQuery } from '@/src/features/patients/hooks/useNursePatientsQuery';
import { Card } from '@/src/shared/components/Card';
import { EmptyState } from '@/src/shared/components/EmptyState';
import { LoadingView } from '@/src/shared/components/LoadingView';
import { Screen } from '@/src/shared/components/Screen';

const riskStyles: Record<PatientSummary['riskLevel'], { color: string; backgroundColor: string; label: string }> = {
  low: { color: '#087A51', backgroundColor: '#E8F8F2', label: 'Low' },
  medium: { color: '#A76C08', backgroundColor: '#FFF6E7', label: 'Medium' },
  high: { color: '#C0392B', backgroundColor: '#FDECEA', label: 'High' },
};

export function NursePatientsScreen(): React.JSX.Element {
  const { data, isLoading, isRefetching, refetch } = useNursePatientsQuery();

  if (isLoading) {
    return (
      <Screen title="Assigned Patients" subtitle="Loading patients..." scroll={false}>
        <LoadingView />
      </Screen>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Screen
        title="Assigned Patients"
        subtitle="No current assignments."
        refreshing={isRefetching}
        onRefresh={() => {
          void refetch();
        }}
      >
        <EmptyState title="No patients found" subtitle="Patient assignments will appear here." />
      </Screen>
    );
  }

  return (
    <Screen
      title="Assigned Patients"
      subtitle="Cached list for nurse offline mode."
      refreshing={isRefetching}
      onRefresh={() => {
        void refetch();
      }}
    >
      <View style={styles.list}>
        {data.map((patient) => {
          const risk = riskStyles[patient.riskLevel];
          return (
            <Card key={patient.id}>
              <View style={styles.row}>
                <Text style={styles.name}>{patient.fullName}</Text>
                <View style={[styles.riskBadge, { backgroundColor: risk.backgroundColor }]}> 
                  <Text style={[styles.riskText, { color: risk.color }]}>{risk.label}</Text>
                </View>
              </View>
              <Text style={styles.meta}>Bed: {patient.bedNumber}</Text>
              <Text style={styles.meta}>Age: {patient.age}</Text>
              <Text style={styles.condition}>{patient.condition}</Text>
              <Text style={styles.updated}>Updated: {new Date(patient.updatedAt).toLocaleTimeString()}</Text>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  name: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  riskBadge: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  riskText: {
    fontSize: typography.caption,
    fontWeight: '700',
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.body,
    marginBottom: spacing.xs,
  },
  condition: {
    color: colors.text,
    fontSize: typography.body,
  },
  updated: {
    color: colors.textMuted,
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
});
