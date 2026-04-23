import React from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, textStyles, typography } from '@/src/core/theme/tokens';

export function Screen({ title, subtitle, scroll = true, refreshing = false, onRefresh, children }) {
    const insets = useSafeAreaInsets();

    const content = (
        <View style={styles.body}>
            {title ? (
                <Text accessibilityRole="header" style={styles.title}>
                    {title}
                </Text>
            ) : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            {children}
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
            {scroll ? (
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.lg }]}
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
                    showsVerticalScrollIndicator={false}
                >
                    {content}
                </ScrollView>
            ) : (
                <View style={{ flex: 1, paddingBottom: insets.bottom }}>{content}</View>
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
        flexGrow: 1,
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
