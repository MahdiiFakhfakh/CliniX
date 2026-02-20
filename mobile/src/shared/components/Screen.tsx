import React, { type PropsWithChildren } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/src/core/theme/tokens';

type ScreenProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}>;

export function Screen({
  title,
  subtitle,
  scroll = true,
  refreshing = false,
  onRefresh,
  children,
}: ScreenProps): React.JSX.Element {
  const content = (
    <View style={styles.body}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            ) : undefined
          }
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
  },
});
