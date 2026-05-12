import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadows, spacing, textStyles, typography } from '@/src/core/theme/tokens';
import { useToastStore } from '@/src/store/toastStore';
const toastPalette = {
    error: {
        backgroundColor: colors.dangerSoft,
        borderColor: colors.dangerBorder,
        textColor: colors.danger,
    },
    info: {
        backgroundColor: colors.primarySoft,
        borderColor: colors.infoBorder,
        textColor: colors.primary,
    },
    success: {
        backgroundColor: colors.successSoft,
        borderColor: colors.successBorder,
        textColor: colors.success,
    },
};
export function ToastHost() {
    const toasts = useToastStore((state) => state.toasts);
    const dismissToast = useToastStore((state) => state.dismissToast);
    if (toasts.length === 0) {
        return null;
    }
    return (<SafeAreaView pointerEvents="box-none" style={styles.safeArea} edges={['top']}>
      <View pointerEvents="box-none" style={styles.container}>
        {toasts.map((toast) => {
            const palette = toastPalette[toast.type];
            return (<Pressable key={toast.id} accessibilityRole="alert" onPress={() => dismissToast(toast.id)} style={[
                    styles.toast,
                    {
                        backgroundColor: palette.backgroundColor,
                        borderColor: palette.borderColor,
                    },
                ]}>
              <Text style={[styles.message, { color: palette.textColor }]}>{toast.message}</Text>
            </Pressable>);
        })}
      </View>
    </SafeAreaView>);
}
const styles = StyleSheet.create({
    safeArea: {
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 40,
    },
    container: {
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xs,
    },
    toast: {
        borderRadius: radius.md,
        borderWidth: 1,
        minHeight: 44,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        ...shadows.card,
    },
    message: {
        fontSize: typography.caption,
        fontFamily: textStyles.caption.fontFamily,
        fontWeight: '700',
        lineHeight: 20,
    },
});
