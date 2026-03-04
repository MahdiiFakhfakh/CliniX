import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, textStyles, typography } from '@/src/core/theme/tokens';
export function EmptyState({ title, subtitle }) {
    return (<View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>);
}
const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xl,
    },
    title: {
        color: colors.text,
        fontSize: typography.heading,
        fontFamily: textStyles.heading.fontFamily,
        fontWeight: '700',
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        color: colors.textMuted,
        fontSize: typography.body,
        fontFamily: textStyles.body.fontFamily,
        lineHeight: textStyles.body.lineHeight,
        textAlign: 'center',
    },
});
