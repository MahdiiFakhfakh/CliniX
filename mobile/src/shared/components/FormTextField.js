import React from 'react';
import { Controller } from 'react-hook-form';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/src/core/theme/tokens';
export function FormTextField({ control, name, label, placeholder, secureTextEntry = false, keyboardType = 'default', }) {
    return (<Controller control={control} name={name} render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (<View style={styles.fieldContainer}>
          <Text style={styles.label}>{label}</Text>
          <TextInput accessibilityLabel={label} onBlur={onBlur} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.textMuted} secureTextEntry={secureTextEntry} style={[styles.input, error && styles.inputError]} value={String(value ?? '')} keyboardType={keyboardType}/>
          {error?.message ? <Text style={styles.error}>{error.message}</Text> : null}
        </View>)}/>);
}
const styles = StyleSheet.create({
    fieldContainer: {
        gap: spacing.xs,
    },
    label: {
        color: colors.text,
        fontSize: typography.body,
        fontWeight: '600',
    },
    input: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: radius.sm,
        borderWidth: 1,
        color: colors.text,
        fontSize: typography.body,
        minHeight: 50,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    inputError: {
        borderColor: colors.danger,
    },
    error: {
        color: colors.danger,
        fontSize: typography.caption,
        fontWeight: '600',
    },
});
