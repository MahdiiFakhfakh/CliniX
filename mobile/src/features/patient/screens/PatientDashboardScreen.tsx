import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/src/core/theme/tokens';
import { useAppointmentsQuery } from '@/src/features/appointments/hooks/useAppointmentsQuery';
import { useLabResultsQuery } from '@/src/features/patient/hooks/useLabResultsQuery';
import { usePatientMedicalSummaryQuery } from '@/src/features/patient/hooks/usePatientMedicalSummaryQuery';
import { usePatientProfileQuery } from '@/src/features/patient/hooks/usePatientProfileQuery';
import { Card } from '@/src/shared/components/Card';
import { LoadingView } from '@/src/shared/components/LoadingView';
import { PrimaryButton } from '@/src/shared/components/PrimaryButton';
import { Screen } from '@/src/shared/components/Screen';

export function PatientDashboardScreen(): React.JSX.Element {
  const router = useRouter();
  const appointmentsQuery = useAppointmentsQuery('patient');
  const profileQuery = usePatientProfileQuery();
  const summaryQuery = usePatientMedicalSummaryQuery();
  const resultsQuery = useLabResultsQuery();
  const isRefreshing =
    appointmentsQuery.isRefetching || profileQuery.isRefetching || summaryQuery.isRefetching || resultsQuery.isRefetching;

  const handleRefresh = () => {
    void Promise.all([
      appointmentsQuery.refetch(),
      profileQuery.refetch(),
      summaryQuery.refetch(),
      resultsQuery.refetch(),
    ]);
  };

  if (appointmentsQuery.isLoading || profileQuery.isLoading || summaryQuery.isLoading || resultsQuery.isLoading) {
    return (
      <Screen title="Patient Home" subtitle="Loading your care overview..." scroll={false}>
        <LoadingView />
      </Screen>
    );
  }

  const nextAppointment = appointmentsQuery.data?.[0];
  const recentResults = (resultsQuery.data ?? []).slice(0, 2);

  return (
    <Screen
      title={`Welcome, ${profileQuery.data?.fullName.split(' ')[0] ?? 'Patient'}`}
      subtitle="Next appointment, recent results, and quick actions."
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
    >
      <Card>
        <Text style={styles.cardTitle}>Next Appointment</Text>
        {nextAppointment ? (
          <>
            <Text style={styles.primaryText}>{nextAppointment.department}</Text>
            <Text style={styles.metaText}>{nextAppointment.doctorName}</Text>
            <Text style={styles.metaText}>
              {new Date(nextAppointment.date).toDateString()} at {nextAppointment.time}
            </Text>
            <PrimaryButton
              label="View Appointment Details"
              onPress={() =>
                router.push({
                  pathname: '/(app)/(patient)/appointment/[appointmentId]',
                  params: { appointmentId: nextAppointment.id },
                })
              }
            />
          </>
        ) : (
          <>
            <Text style={styles.metaText}>No upcoming appointment.</Text>
            <PrimaryButton label="Book Appointment" onPress={() => router.push('/(app)/(patient)/book-appointment')} />
          </>
        )}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Recent Results</Text>
        {recentResults.length === 0 ? (
          <Text style={styles.metaText}>No recent results.</Text>
        ) : (
          <View style={styles.resultList}>
            {recentResults.map((result) => (
              <View key={result.id} style={styles.resultRow}>
                <Text style={styles.resultName}>{result.name}</Text>
                <Text style={styles.metaText}>{result.kind.toUpperCase()} - {result.status}</Text>
                <Text style={styles.metaText}>{new Date(result.collectedAt).toDateString()}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Medical Summary</Text>
        <Text style={styles.metaText}>Primary doctor: {summaryQuery.data?.primaryDoctor ?? 'Not assigned'}</Text>
        <Text style={styles.metaText}>Blood group: {summaryQuery.data?.bloodGroup ?? 'N/A'}</Text>
        <Text style={styles.metaText}>Last visit: {summaryQuery.data?.lastVisit ? new Date(summaryQuery.data.lastVisit).toDateString() : 'N/A'}</Text>
      </Card>

      <View style={styles.quickActions}>
        <PrimaryButton label="Appointments" onPress={() => router.push('/(app)/(patient)/appointments')} />
        <PrimaryButton label="Book Appointment" onPress={() => router.push('/(app)/(patient)/book-appointment')} />
        <PrimaryButton label="Results" onPress={() => router.push('/(app)/(patient)/results')} />
        <PrimaryButton label="Prescriptions" onPress={() => router.push('/(app)/(patient)/prescriptions')} />
        <PrimaryButton label="Chat With Doctor" onPress={() => router.push('/(app)/(patient)/chat')} />
        <PrimaryButton label="CliniX AI" onPress={() => router.push('/(app)/(patient)/clinix-ai')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  primaryText: {
    color: colors.primary,
    fontSize: typography.heading,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  quickActions: {
    gap: spacing.sm,
  },
  resultList: {
    gap: spacing.sm,
  },
  resultRow: {
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.sm,
  },
  resultName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
});
