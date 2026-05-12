import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing, typography } from '@/src/core/theme/tokens';
import { useNursePatientsQuery } from '@/src/features/patients/hooks/useNursePatientsQuery';
import { LoadingView } from '@/src/shared/components/LoadingView';
import { useAuthStore } from '@/src/store/authStore';
import AppIcon from '@/src/shared/components/AppIcon';

function StatCard({ icon, iconBg, iconColor, value, label }) {
    return (
        <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
                <AppIcon color={iconColor} name={icon} size={20} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

function QuickAction({ icon, label, onPress, variant = 'default' }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={onPress}
            style={({ pressed }) => [
                styles.quickAction,
                variant === 'primary' && styles.quickActionPrimary,
                pressed && styles.quickActionPressed,
            ]}
        >
            <AppIcon
                color={variant === 'primary' ? '#fff' : colors.primary}
                name={icon}
                size={20}
            />
            <Text style={[styles.quickActionText, variant === 'primary' && styles.quickActionTextPrimary]}>
                {label}
            </Text>
        </Pressable>
    );
}

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
};

export function NurseDashboardScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const session = useAuthStore((state) => state.session);
    const { data, isLoading, isRefetching, refetch } = useNursePatientsQuery();

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
                <LoadingView label="Loading ward assignments…" />
            </SafeAreaView>
        );
    }

    const patients = data ?? [];
    const highRiskCount = patients.filter((p) => p.riskLevel === 'high').length;
    const mediumRiskCount = patients.filter((p) => p.riskLevel === 'medium').length;
    const firstName = session?.user.profile.fullName?.split(' ')[0] ?? 'Nurse';

    return (
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={() => void refetch()}
                        tintColor={colors.primary}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Greeting */}
                <View style={styles.greeting}>
                    <Text style={styles.greetingLine}>{getGreeting()},</Text>
                    <Text style={styles.greetingName}>{firstName}</Text>
                    <Text style={styles.greetingSub}>Here's your ward at a glance.</Text>
                </View>

                {/* Stats row */}
                <View style={styles.statsRow}>
                    <StatCard
                        icon="people-outline"
                        iconBg={colors.primarySoft}
                        iconColor={colors.primary}
                        value={patients.length}
                        label="Assigned"
                    />
                    <StatCard
                        icon="alert-circle-outline"
                        iconBg={colors.dangerSoft}
                        iconColor={colors.danger}
                        value={highRiskCount}
                        label="High Risk"
                    />
                    <StatCard
                        icon="warning-outline"
                        iconBg={colors.warningSoft}
                        iconColor={colors.warning}
                        value={mediumRiskCount}
                        label="Medium Risk"
                    />
                </View>

                {/* High-risk alert if any */}
                {highRiskCount > 0 ? (
                    <View style={styles.alertBanner}>
                        <AppIcon color={colors.danger} name="alert-circle" size={18} />
                        <Text style={styles.alertBannerText}>
                            {highRiskCount} patient{highRiskCount > 1 ? 's' : ''} require immediate attention.
                        </Text>
                    </View>
                ) : null}

                {/* Quick actions */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.quickActionsGrid}>
                    <QuickAction
                        icon="people"
                        label="Patient List"
                        variant="primary"
                        onPress={() => router.push('/(app)/(nurse)/patients')}
                    />
                    <QuickAction
                        icon="notifications-outline"
                        label="Notifications"
                        onPress={() => router.push('/(app)/notifications')}
                    />
                </View>

                {/* Offline note */}
                <View style={styles.offlineNote}>
                    <AppIcon color={colors.textSubtle} name="cloud-done-outline" size={15} />
                    <Text style={styles.offlineNoteText}>Patient list is cached for offline access.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: 16,
    },
    greeting: {
        marginBottom: spacing.md,
    },
    greetingLine: {
        color: colors.textMuted,
        fontSize: typography.bodyLarge,
        fontFamily: fonts.bodyRegular,
    },
    greetingName: {
        color: colors.text,
        fontSize: typography.h2,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        marginBottom: spacing.xxs,
    },
    greetingSub: {
        color: colors.textMuted,
        fontSize: typography.body,
        fontFamily: fonts.bodyRegular,
    },
    statsRow: {
        flexDirection: 'row',
        gap: spacing.xs,
        marginBottom: spacing.sm,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.sm,
        alignItems: 'center',
        shadowColor: '#142850',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xs,
    },
    statValue: {
        color: colors.text,
        fontSize: 26,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        lineHeight: 30,
    },
    statLabel: {
        color: colors.textMuted,
        fontSize: typography.caption,
        fontFamily: fonts.bodyMedium,
        marginTop: 2,
        textAlign: 'center',
    },
    alertBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: colors.dangerSoft,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.dangerBorder,
        padding: spacing.sm,
        marginBottom: spacing.md,
    },
    alertBannerText: {
        flex: 1,
        color: colors.danger,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    sectionTitle: {
        color: colors.textSubtle,
        fontSize: typography.caption,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: spacing.xs,
    },
    quickActionsGrid: {
        gap: spacing.xs,
        marginBottom: spacing.md,
    },
    quickAction: {
        height: 58,
        borderRadius: radius.sm,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
    },
    quickActionPrimary: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    quickActionPressed: {
        opacity: 0.85,
    },
    quickActionText: {
        color: colors.primary,
        fontSize: typography.button,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    quickActionTextPrimary: {
        color: '#fff',
    },
    offlineNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
    },
    offlineNoteText: {
        color: colors.textSubtle,
        fontSize: typography.caption,
        fontFamily: fonts.bodyRegular,
    },
});
