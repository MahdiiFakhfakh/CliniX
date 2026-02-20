import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, shadows, spacing, typography } from '@/src/core/theme/tokens';
import { useToastStore } from '@/src/store/toastStore';

const toastPalette = {
  error: {
    backgroundColor: '#FDECEE',
    borderColor: '#F2C8CD',
    textColor: colors.danger,
  },
  info: {
    backgroundColor: '#EAF2FF',
    borderColor: '#CADDFE',
    textColor: colors.primary,
  },
  success: {
    backgroundColor: '#E8F8F2',
    borderColor: '#CBECDD',
    textColor: colors.success,
  },
} as const;

export function ToastHost(): React.JSX.Element | null {
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <SafeAreaView pointerEvents="box-none" style={styles.safeArea} edges={['top']}>
      <View pointerEvents="box-none" style={styles.container}>
        {toasts.map((toast) => {
          const palette = toastPalette[toast.type];

          return (
            <Pressable
              key={toast.id}
              accessibilityRole="alert"
              onPress={() => dismissToast(toast.id)}
              style={[
                styles.toast,
                {
                  backgroundColor: palette.backgroundColor,
                  borderColor: palette.borderColor,
                },
              ]}
            >
              <Text style={[styles.message, { color: palette.textColor }]}>{toast.message}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
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
    borderRadius: radius.sm,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    ...shadows.card,
  },
  message: {
    fontSize: typography.caption,
    fontWeight: '700',
    lineHeight: 20,
  },
});
