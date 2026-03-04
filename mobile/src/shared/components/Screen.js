import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, textStyles, typography } from '@/src/core/theme/tokens';
export function Screen({ title, subtitle, scroll = true, refreshing = false, onRefresh, children, }) {
    const content = (<View style={styles.body}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>);
    return (<SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      {scroll ? (<ScrollView contentContainerStyle={styles.scrollContent} refreshControl={onRefresh ? (<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary}/>) : undefined}>
          {content}
        </ScrollView>) : (content)}
    </SafeAreaView>);
}
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingBottom: spacing.xl + spacing.md,
    },
    body: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        gap: spacing.md,
    },
    title: {
        color: colors.text,
        fontSize: typography.title,
        fontFamily: textStyles.title.fontFamily,
        fontWeight: '700',
    },
    subtitle: {
        color: colors.textMuted,
        fontSize: typography.body,
        fontFamily: textStyles.body.fontFamily,
        lineHeight: textStyles.body.lineHeight,
    },
});
