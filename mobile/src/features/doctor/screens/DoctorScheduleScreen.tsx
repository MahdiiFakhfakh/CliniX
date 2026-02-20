import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/src/core/theme/tokens';
import { useAppointmentsQuery } from '@/src/features/appointments/hooks/useAppointmentsQuery';
import { EmptyState } from '@/src/shared/components/EmptyState';
import { LoadingView } from '@/src/shared/components/LoadingView';
import { Screen } from '@/src/shared/components/Screen';

type ViewMode = 'day' | 'week';

export function DoctorScheduleScreen(): React.JSX.Element {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const appointmentsQuery = useAppointmentsQuery('doctor');
  const handleRefresh = () => {
    void appointmentsQuery.refetch();
  };

  const agendaAppointments = useMemo(() => {
    const appointments = appointmentsQuery.data ?? [];

    if (viewMode === 'day') {
      const today = new Date().toDateString();
      return appointments
        .filter((item) => new Date(item.date).toDateString() === today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    const now = new Date();
    const weekLater = new Date();
    weekLater.setDate(now.getDate() + 7);

    return appointments.filter((item) => {
      const date = new Date(item.date);
      return date >= now && date <= weekLater;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointmentsQuery.data, viewMode]);

  if (appointmentsQuery.isLoading) {
    return (
      <Screen title="Schedule Agenda" subtitle="Loading day/week agenda..." scroll={false}>
        <LoadingView />
      </Screen>
    );
  }

  return (
    <Screen
      title="Schedule Agenda"
      subtitle="Agenda view for day and week planning."
      refreshing={appointmentsQuery.isRefetching}
      onRefresh={handleRefresh}
    >
      <View style={styles.toggleRow}>
        <Pressable style={[styles.toggleButton, viewMode === 'day' && styles.toggleButtonActive]} onPress={() => setViewMode('day')}>
          <Text style={[styles.toggleLabel, viewMode === 'day' && styles.toggleLabelActive]}>Day</Text>
        </Pressable>
        <Pressable style={[styles.toggleButton, viewMode === 'week' && styles.toggleButtonActive]} onPress={() => setViewMode('week')}>
          <Text style={[styles.toggleLabel, viewMode === 'week' && styles.toggleLabelActive]}>Week</Text>
        </Pressable>
      </View>

      {agendaAppointments.length === 0 ? (
        <EmptyState title="No appointments" subtitle={`No ${viewMode} appointments found.`} />
      ) : (
        <View style={styles.list}>
          {agendaAppointments.map((appointment) => (
            <View key={appointment.id} style={styles.agendaItem}>
              <Text style={styles.timeText}>{appointment.time}</Text>
              <Text style={styles.mainText}>{appointment.patientName}</Text>
              <Text style={styles.metaText}>
                {appointment.department} | {new Date(appointment.date).toDateString()} | {appointment.room}
              </Text>
              <Text style={styles.metaText}>{appointment.reason}</Text>
              {appointment.patientId ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/(doctor)/patient/[patientId]',
                      params: { patientId: appointment.patientId as string },
                    })
                  }
                  style={styles.openPatientButton}
                >
                  <Text style={styles.openPatientText}>Open patient file</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    padding: spacing.xs,
  },
  toggleButton: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  toggleLabelActive: {
    color: colors.surface,
  },
  list: {
    gap: spacing.sm,
  },
  agendaItem: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  timeText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  mainText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 20,
  },
  openPatientButton: {
    marginTop: spacing.sm,
  },
  openPatientText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
});
