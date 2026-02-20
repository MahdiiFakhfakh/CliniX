import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppointmentStatus } from '@/src/core/types/domain';
import { colors, radius, spacing, typography } from '@/src/core/theme/tokens';

type StatusPillProps = {
  status: AppointmentStatus;
};

const statusStyles: Record<AppointmentStatus, { backgroundColor: string; color: string; label: string }> = {
  scheduled: { backgroundColor: '#E8F0FF', color: colors.primary, label: 'Scheduled' },
  confirmed: { backgroundColor: '#E6F7EF', color: colors.success, label: 'Confirmed' },
  completed: { backgroundColor: '#EDF2F8', color: colors.text, label: 'Completed' },
  cancelled: { backgroundColor: '#FFE9E9', color: colors.danger, label: 'Cancelled' },
  in_progress: { backgroundColor: '#FFF2E0', color: colors.warning, label: 'In Progress' },
  no_show: { backgroundColor: '#FFF0F0', color: colors.danger, label: 'No Show' },
};

export function StatusPill({ status }: StatusPillProps): React.JSX.Element {
  const style = statusStyles[status];

  return (
    <View style={[styles.pill, { backgroundColor: style.backgroundColor }]}> 
      <Text style={[styles.text, { color: style.color }]}>{style.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  text: {
    fontSize: typography.caption,
    fontWeight: '700',
  },
});
