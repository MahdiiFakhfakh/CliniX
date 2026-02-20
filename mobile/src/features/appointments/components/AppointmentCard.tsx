import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Appointment } from '@/src/core/types/domain';
import { colors, spacing, typography } from '@/src/core/theme/tokens';
import { Card } from '@/src/shared/components/Card';
import { StatusPill } from '@/src/shared/components/StatusPill';

type AppointmentCardProps = {
  appointment: Appointment;
};

export function AppointmentCard({ appointment }: AppointmentCardProps): React.JSX.Element {
  return (
    <Card>
      <View style={styles.row}>
        <Text style={styles.heading}>{appointment.patientName}</Text>
        <StatusPill status={appointment.status} />
      </View>
      <Text style={styles.meta}>{appointment.doctorName}</Text>
      <Text style={styles.meta}>{appointment.department}</Text>
      <Text style={styles.meta}>
        {new Date(appointment.date).toDateString()} at {appointment.time}
      </Text>
      <Text style={styles.reason}>{appointment.reason}</Text>
      <Text style={styles.room}>Room: {appointment.room}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  heading: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.body,
    marginBottom: spacing.xs,
  },
  reason: {
    color: colors.text,
    fontSize: typography.body,
    marginTop: spacing.sm,
  },
  room: {
    color: colors.textMuted,
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
});
