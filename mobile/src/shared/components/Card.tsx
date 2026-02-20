import React, { type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, shadows, spacing } from '@/src/core/theme/tokens';

export function Card({ children }: PropsWithChildren): React.JSX.Element {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    ...shadows.card,
  },
});
