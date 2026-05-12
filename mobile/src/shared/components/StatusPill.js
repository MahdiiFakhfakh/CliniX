import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, components, spacing, textStyles, typography } from '@/src/core/theme/tokens';
const statusStyles = {
    scheduled: { backgroundColor: colors.primarySoft, color: colors.primary, label: 'Scheduled' },
    confirmed: { backgroundColor: colors.successSoft, color: colors.success, label: 'Confirmed' },
    completed: { backgroundColor: colors.surfaceTint, color: colors.text, label: 'Completed' },
    cancelled: { backgroundColor: colors.dangerSoft, color: colors.danger, label: 'Cancelled' },
    in_progress: { backgroundColor: colors.warningSoft, color: colors.warning, label: 'In Progress' },
    no_show: { backgroundColor: colors.dangerSoft, color: colors.danger, label: 'No Show' },
};
export function StatusPill({ status }) {
    const style = statusStyles[status] ?? statusStyles.scheduled;
    return (<View style={[styles.pill, { backgroundColor: style.backgroundColor }]}> 
      <Text style={[styles.text, { color: style.color }]}>{style.label}</Text>
    </View>);
}
const styles = StyleSheet.create({
    pill: {
        alignSelf: 'flex-start',
        borderRadius: components.statusPill.radius,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
    },
    text: {
        fontSize: typography.caption,
        fontFamily: textStyles.caption.fontFamily,
        fontWeight: '700',
    },
});
