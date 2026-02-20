import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/src/core/theme/tokens';
import { useOfflineStatus } from '@/src/shared/hooks/useOfflineStatus';

export function OfflineBanner(): React.JSX.Element | null {
  const { isOffline } = useOfflineStatus();

  if (!isOffline) {
    return null;
  }

  return (
    <View accessibilityRole="alert" style={styles.container}>
      <Text style={styles.label}>Offline mode: showing cached data.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.offlineBanner,
    borderColor: colors.warning,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
  },
});
