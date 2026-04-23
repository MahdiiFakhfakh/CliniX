import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, textStyles, typography } from '@/src/core/theme/tokens';
import AppIcon from '@/src/shared/components/AppIcon';

export function EmptyState({ title, subtitle, icon = 'file-tray-outline' }) {
    return (
        <View style={styles.container}>
            <View style={styles.iconWrap}>
                <AppIcon color={colors.textSubtle} name={icon} size={36} />
            </View>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xxl,
    },
    iconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.surfaceTint,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
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
        maxWidth: 260,
    },
});
