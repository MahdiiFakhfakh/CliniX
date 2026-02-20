import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/src/core/theme/tokens';
import { useAppointmentsQuery } from '@/src/features/appointments/hooks/useAppointmentsQuery';
import { AppointmentCard } from '@/src/features/appointments/components/AppointmentCard';
import { EmptyState } from '@/src/shared/components/EmptyState';
import { LoadingView } from '@/src/shared/components/LoadingView';
import { PrimaryButton } from '@/src/shared/components/PrimaryButton';
import { Screen } from '@/src/shared/components/Screen';

export function PatientAppointmentsScreen(): React.JSX.Element {
  const router = useRouter();
  const appointmentsQuery = useAppointmentsQuery('patient');
  const handleRefresh = () => {
    void appointmentsQuery.refetch();
  };

  if (appointmentsQuery.isLoading) {
    return (
      <Screen title="Appointments" subtitle="Loading your appointment list..." scroll={false}>
        <LoadingView />
      </Screen>
    );
  }

  if (!appointmentsQuery.data || appointmentsQuery.data.length === 0) {
    return (
      <Screen
        title="Appointments"
        subtitle="No scheduled visits yet."
        refreshing={appointmentsQuery.isRefetching}
        onRefresh={handleRefresh}
      >
        <EmptyState title="No appointments" subtitle="Book your first visit to get started." />
        <PrimaryButton label="Book Appointment" onPress={() => router.push('/(app)/(patient)/book-appointment')} />
      </Screen>
    );
  }

  return (
    <Screen
      title="Appointments"
      subtitle="Tap any appointment to open details."
      refreshing={appointmentsQuery.isRefetching}
      onRefresh={handleRefresh}
    >
      <PrimaryButton label="Book Appointment" onPress={() => router.push('/(app)/(patient)/book-appointment')} />

      <View style={styles.list}>
        {appointmentsQuery.data.map((appointment) => (
          <Pressable
            key={appointment.id}
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/(app)/(patient)/appointment/[appointmentId]',
                params: { appointmentId: appointment.id },
              })
            }
            style={styles.pressableCard}
          >
            <AppointmentCard appointment={appointment} />
            <Text style={styles.openLabel}>Open details</Text>
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
  pressableCard: {
    borderRadius: radius.md,
  },
  openLabel: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
});
