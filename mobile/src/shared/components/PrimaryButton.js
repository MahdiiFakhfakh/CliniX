import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, components, spacing, textStyles, typography } from '@/src/core/theme/tokens';
const variantStyles = {
    primary: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
        textColor: colors.surface,
        borderWidth: 0,
    },
    secondary: {
        backgroundColor: colors.inverse,
        borderColor: colors.inverse,
        textColor: colors.surface,
        borderWidth: 0,
    },
    outline: {
        backgroundColor: colors.surface,
        borderColor: colors.primary,
        textColor: colors.primary,
        borderWidth: 1,
    },
    ghost: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        textColor: colors.primary,
        borderWidth: 0,
    },
    danger: {
        backgroundColor: colors.danger,
        borderColor: colors.danger,
        textColor: colors.surface,
        borderWidth: 0,
    },
};
const sizeStyles = {
    small: {
        minHeight: components.button.heights.small,
        paddingHorizontal: spacing.sm,
    },
    medium: {
        minHeight: components.button.heights.medium,
        paddingHorizontal: spacing.md,
    },
    large: {
        minHeight: components.button.heights.large,
        paddingHorizontal: spacing.md,
    },
};
export function PrimaryButton({ label, onPress, loading = false, disabled = false, accessibilityLabel, variant = 'primary', size = 'large', fullWidth = true, style, textStyle, }) {
    const isDisabled = loading || disabled;
    const palette = variantStyles[variant] ?? variantStyles.primary;
    const buttonSize = sizeStyles[size] ?? sizeStyles.large;
    return (<Pressable accessibilityLabel={accessibilityLabel ?? label} accessibilityRole="button" disabled={isDisabled} onPress={onPress} style={({ pressed }) => [
            styles.button,
            buttonSize,
            fullWidth && styles.fullWidth,
            {
                backgroundColor: palette.backgroundColor,
                borderColor: palette.borderColor,
                borderWidth: palette.borderWidth,
            },
            isDisabled && styles.disabled,
            pressed && !isDisabled && styles.pressed,
            style,
        ]}>
      {loading ? <ActivityIndicator color={palette.textColor}/> : <Text style={[styles.label, { color: palette.textColor }, textStyle]}>{label}</Text>}
    </Pressable>);
}
const styles = StyleSheet.create({
    button: {
        alignItems: 'center',
        borderRadius: components.button.radius,
        justifyContent: 'center',
        paddingVertical: spacing.sm,
    },
    fullWidth: {
        width: '100%',
    },
    disabled: {
        backgroundColor: colors.disabled,
        borderColor: colors.disabled,
    },
    pressed: {
        opacity: 0.92,
    },
    label: {
        fontSize: typography.button,
        fontFamily: textStyles.bodySemiBold.fontFamily,
        fontWeight: '700',
    },
});
