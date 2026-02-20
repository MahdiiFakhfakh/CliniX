import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/src/core/theme/tokens';
import { useAppointmentsQuery } from '@/src/features/appointments/hooks/useAppointmentsQuery';
import { useChatMessagesQuery } from '@/src/features/chat/hooks/useChatMessagesQuery';
import { useDoctorAlertsQuery } from '@/src/features/doctor/hooks/useDoctorAlertsQuery';
import { Card } from '@/src/shared/components/Card';
import { LoadingView } from '@/src/shared/components/LoadingView';
import { PrimaryButton } from '@/src/shared/components/PrimaryButton';
import { Screen } from '@/src/shared/components/Screen';
import { useAuthStore } from '@/src/store/authStore';

export function DoctorDashboardScreen(): React.JSX.Element {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const scheduleQuery = useAppointmentsQuery('doctor');
  const alertsQuery = useDoctorAlertsQuery();
  const messagesQuery = useChatMessagesQuery('doctor');
  const isRefreshing = scheduleQuery.isRefetching || alertsQuery.isRefetching || messagesQuery.isRefetching;
  const handleRefresh = () => {
    void Promise.all([scheduleQuery.refetch(), alertsQuery.refetch(), messagesQuery.refetch()]);
  };

  if (scheduleQuery.isLoading || alertsQuery.isLoading || messagesQuery.isLoading) {
    return (
      <Screen title="Doctor Dashboard" subtitle="Loading schedule and alerts..." scroll={false}>
        <LoadingView />
      </Screen>
    );
  }

  const today = new Date().toDateString();
  const todaySchedule =
    scheduleQuery.data?.filter(
      (item) => new Date(item.date).toDateString() === today && item.status !== 'cancelled',
    ) ?? [];
  const unreadMessages =
    messagesQuery.data?.filter((item) => item.senderRole === 'patient').length ?? 0;

  return (
    <Screen
      title={`Welcome, ${session?.user.profile.fullName ?? 'Doctor'}`}
      subtitle="Today schedule, unread messages, and critical alerts."
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
    >
      <View style={styles.metricsRow}>
        <Card>
          <Text style={styles.metricLabel}>Today schedule</Text>
          <Text style={styles.metricValue}>{todaySchedule.length}</Text>
        </Card>
        <Card>
          <Text style={styles.metricLabel}>Unread messages</Text>
          <Text style={styles.metricValue}>{unreadMessages}</Text>
        </Card>
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Today Agenda Preview</Text>
        {todaySchedule.length === 0 ? (
          <Text style={styles.emptyText}>No appointments scheduled for today.</Text>
        ) : (
          <View style={styles.agendaList}>
            {todaySchedule.slice(0, 3).map((appointment) => (
              <View key={appointment.id} style={styles.agendaItem}>
                <Text style={styles.agendaMain}>
                  {appointment.time} - {appointment.patientName}
                </Text>
                <Text style={styles.agendaMeta}>
                  {appointment.department} | {appointment.room}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Alerts</Text>
        <View style={styles.alertList}>
          {(alertsQuery.data ?? []).map((alert) => (
            <View key={alert.id} style={styles.alertRow}>
              <Text style={styles.alertTitle}>[{alert.severity.toUpperCase()}] {alert.title}</Text>
              <Text style={styles.alertDescription}>{alert.description}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.actions}>
        <PrimaryButton label="Open Day/Week Schedule" onPress={() => router.push('/(app)/(doctor)/schedule')} />
        <PrimaryButton label="Open Patient List" onPress={() => router.push('/(app)/(doctor)/patients')} />
        <PrimaryButton label="Open Messages" onPress={() => router.push('/(app)/(doctor)/messages')} />
        <PrimaryButton label="Open CliniX AI" onPress={() => router.push('/(app)/(doctor)/clinix-ai')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  metricsRow: {
    gap: spacing.sm,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: typography.body,
    marginBottom: spacing.xs,
  },
  metricValue: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: '800',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  agendaList: {
    gap: spacing.sm,
  },
  agendaItem: {
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    padding: spacing.sm,
  },
  agendaMain: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  agendaMeta: {
    color: colors.textMuted,
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.body,
  },
  alertList: {
    gap: spacing.sm,
  },
  alertRow: {
    backgroundColor: '#F8FBFF',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.sm,
  },
  alertTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  alertDescription: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  actions: {
    gap: spacing.sm,
  },
});
