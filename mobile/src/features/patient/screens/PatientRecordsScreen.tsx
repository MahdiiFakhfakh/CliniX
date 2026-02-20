import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/src/core/theme/tokens';
import type { AssistantTextResponse, LabImagingResult } from '@/src/core/types/domain';
import { useExplainResultMutation } from '@/src/features/ai/hooks/useExplainResultMutation';
import { useLabResultsQuery } from '@/src/features/patient/hooks/useLabResultsQuery';
import { usePatientMedicalSummaryQuery } from '@/src/features/patient/hooks/usePatientMedicalSummaryQuery';
import { usePatientProfileQuery } from '@/src/features/patient/hooks/usePatientProfileQuery';
import { usePrescriptionsQuery } from '@/src/features/patient/hooks/usePrescriptionsQuery';
import { Card } from '@/src/shared/components/Card';
import { EmptyState } from '@/src/shared/components/EmptyState';
import { LoadingView } from '@/src/shared/components/LoadingView';
import { PrimaryButton } from '@/src/shared/components/PrimaryButton';
import { Screen } from '@/src/shared/components/Screen';

export function PatientRecordsScreen(): React.JSX.Element {
  const profileQuery = usePatientProfileQuery();
  const summaryQuery = usePatientMedicalSummaryQuery();
  const prescriptionsQuery = usePrescriptionsQuery();
  const resultsQuery = useLabResultsQuery();
  const explainMutation = useExplainResultMutation();
  const [explanation, setExplanation] = useState<AssistantTextResponse | null>(null);
  const isRefreshing =
    profileQuery.isRefetching ||
    summaryQuery.isRefetching ||
    prescriptionsQuery.isRefetching ||
    resultsQuery.isRefetching;

  const handleRefresh = () => {
    void Promise.all([
      profileQuery.refetch(),
      summaryQuery.refetch(),
      prescriptionsQuery.refetch(),
      resultsQuery.refetch(),
    ]);
  };

  const isLoading =
    profileQuery.isLoading || summaryQuery.isLoading || prescriptionsQuery.isLoading || resultsQuery.isLoading;

  const handleExplain = async (result: LabImagingResult) => {
    try {
      const response = await explainMutation.mutateAsync({
        resultId: result.id,
        patientQuestion: `Explain ${result.name} in simple language`,
      });

      setExplanation(response);
    } catch {
      // Error toasts are shown globally by query mutation cache.
    }
  };

  if (isLoading) {
    return (
      <Screen title="Medical Records" subtitle="Loading profile and results..." scroll={false}>
        <LoadingView />
      </Screen>
    );
  }

  return (
    <Screen
      title="Medical Records"
      subtitle="Profile, prescriptions, and lab/imaging summaries."
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
    >
      <Card>
        <Text style={styles.sectionTitle}>Profile</Text>
        <Text style={styles.line}>{profileQuery.data?.fullName}</Text>
        <Text style={styles.line}>Patient ID: {profileQuery.data?.patientId}</Text>
        <Text style={styles.line}>DOB: {profileQuery.data?.dateOfBirth}</Text>
        <Text style={styles.line}>Phone: {profileQuery.data?.phone}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Medical Summary</Text>
        <Text style={styles.line}>Primary doctor: {summaryQuery.data?.primaryDoctor}</Text>
        <Text style={styles.line}>Blood group: {summaryQuery.data?.bloodGroup}</Text>
        <Text style={styles.line}>Allergies: {summaryQuery.data?.allergies.join(', ') || 'None'}</Text>
        <Text style={styles.line}>Conditions: {summaryQuery.data?.chronicConditions.join(', ') || 'None'}</Text>
        <Text style={styles.line}>Active meds: {summaryQuery.data?.activeMedications.join(', ') || 'None'}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Prescriptions</Text>
        {!prescriptionsQuery.data || prescriptionsQuery.data.length === 0 ? (
          <EmptyState title="No prescriptions" subtitle="New prescriptions will appear here." />
        ) : (
          <View style={styles.list}>
            {prescriptionsQuery.data.map((prescription) => (
              <View key={prescription.id} style={styles.itemRow}>
                <Text style={styles.itemTitle}>{prescription.medication}</Text>
                <Text style={styles.itemMeta}>
                  {prescription.dosage} - {prescription.frequency} - {prescription.duration}
                </Text>
                <Text style={styles.itemMeta}>By {prescription.prescribedBy}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Lab & Imaging Results</Text>
        {!resultsQuery.data || resultsQuery.data.length === 0 ? (
          <EmptyState title="No results" subtitle="Completed results will appear here." />
        ) : (
          <View style={styles.list}>
            {resultsQuery.data.map((result) => (
              <View key={result.id} style={styles.resultRow}>
                <View>
                  <Text style={styles.itemTitle}>{result.name}</Text>
                  <Text style={styles.itemMeta}>{result.kind.toUpperCase()} - {result.status}</Text>
                  <Text style={styles.itemMeta}>{result.summary}</Text>
                </View>
                <PrimaryButton
                  label={explainMutation.isPending ? 'Explaining...' : 'Explain with AI'}
                  loading={explainMutation.isPending}
                  onPress={() => handleExplain(result)}
                />
              </View>
            ))}
          </View>
        )}
      </Card>

      {explanation ? (
        <Card>
          <Text style={styles.aiTitle}>{explanation.title}</Text>
          <Text style={styles.aiBody}>{explanation.content}</Text>
          <View style={styles.aiCautionWrap}>
            <Text style={styles.aiCaution}>{explanation.caution}</Text>
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
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
  list: {
    gap: spacing.sm,
  },
  itemRow: {
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.sm,
  },
  itemTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  itemMeta: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 20,
  },
  resultRow: {
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.sm,
  },
  aiTitle: {
    color: colors.primary,
    fontSize: typography.heading,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  aiBody: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 24,
  },
  aiCautionWrap: {
    backgroundColor: '#FFF5DD',
    borderRadius: radius.sm,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  aiCaution: {
    color: '#8A6100',
    fontSize: typography.caption,
    fontWeight: '600',
  },
});
