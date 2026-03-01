import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '@/src/core/theme/tokens';
export function PrimaryButton({ label, onPress, loading = false, disabled = false, accessibilityLabel, }) {
    const isDisabled = loading || disabled;
    return (<Pressable accessibilityLabel={accessibilityLabel ?? label} accessibilityRole="button" disabled={isDisabled} onPress={onPress} style={({ pressed }) => [styles.button, isDisabled && styles.disabled, pressed && styles.pressed]}>
      {loading ? <ActivityIndicator color={colors.surface}/> : <Text style={styles.label}>{label}</Text>}
    </Pressable>);
}
const styles = StyleSheet.create({
    button: {
        alignItems: 'center',
        backgroundColor: colors.primary,
        borderRadius: radius.sm,
        justifyContent: 'center',
        minHeight: 50,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    disabled: {
        backgroundColor: '#88A9E9',
    },
    pressed: {
        opacity: 0.9,
    },
    label: {
        color: colors.surface,
        fontSize: typography.button,
        fontWeight: '700',
    },
});
