import React, { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/src/core/theme/tokens';

type LoadingViewProps = {
  label?: string;
  skeletonRows?: number;
  showSpinner?: boolean;
};

export function LoadingView({
  label = 'Loading...',
  skeletonRows = 3,
  showSpinner = true,
}: LoadingViewProps): React.JSX.Element {
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pulse]);

  const rows = useMemo<Array<{ id: string; width: `${number}%` }>>(
    () =>
      Array.from({ length: Math.max(1, skeletonRows) }, (_, index) => ({
        id: `skeleton-row-${index}`,
        width: index === 0 ? '90%' : index % 2 === 0 ? '100%' : '75%',
      })),
    [skeletonRows],
  );

  return (
    <View style={styles.container}>
      {showSpinner ? <ActivityIndicator color={colors.primary} size="small" /> : null}
      <Text style={styles.label}>{label}</Text>
      <View style={styles.skeletonWrap}>
        {rows.map((row) => (
          <Animated.View
            key={row.id}
            style={[
              styles.skeletonLine,
              {
                width: row.width,
                opacity: pulse,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.body,
    marginTop: spacing.sm,
  },
  skeletonWrap: {
    gap: spacing.xs,
    marginTop: spacing.sm,
    width: '100%',
  },
  skeletonLine: {
    backgroundColor: colors.border,
    borderRadius: radius.sm,
    height: 14,
  },
});
