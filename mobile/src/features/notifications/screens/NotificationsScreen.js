import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing, typography } from '@/src/core/theme/tokens';
import AppIcon from '@/src/shared/components/AppIcon';

const TABS = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'resolved', label: 'Resolved' },
];

const ALERTS = [
    {
        id: 'alert-oxygen-low',
        status: 'active',
        categoryLabel: 'ACTIVE · CRITICAL',
        title: 'Low Oxygen Level',
        time: '2 mins ago',
        metric: 'SpO2: 88%',
        detail: 'Threshold: 92%',
        icon: 'airplane',
        tone: 'danger',
    },
    {
        id: 'alert-bp-high',
        status: 'active',
        categoryLabel: 'ACKNOWLEDGED',
        title: 'High Blood Pressure',
        time: '1 hour ago',
        metric: '152/98 mmHg',
        detail: 'Nurse notified at 2:15 PM',
        icon: 'pulse',
        tone: 'warning',
    },
    {
        id: 'alert-arrhythmia-resolved',
        status: 'resolved',
        categoryLabel: 'RESOLVED',
        title: 'Arrhythmia Detected',
        time: 'Yesterday, 4:30 PM',
        metric: 'Normal Sinus Rhythm',
        detail: 'Auto-resolved after 5 mins',
        icon: 'medkit',
        tone: 'success',
    },
    {
        id: 'alert-temp-resolved',
        status: 'resolved',
        categoryLabel: 'RESOLVED',
        title: 'Elevated Body Temp',
        time: '2 days ago',
        metric: '101.4°F',
        detail: 'Logged by Caregiver',
        icon: 'thermometer',
        tone: 'success',
    },
];

const TONE = {
    danger: {
        accent: colors.danger,
        label: colors.danger,
        iconBg: colors.dangerSoft,
        iconColor: colors.danger,
    },
    warning: {
        accent: colors.warning,
        label: colors.warningText,
        iconBg: colors.warningSoft,
        iconColor: colors.warning,
    },
    success: {
        accent: colors.success,
        label: colors.success,
        iconBg: colors.successSoft,
        iconColor: colors.success,
    },
};

export function NotificationsScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('all');

    const visibleAlerts = useMemo(() => {
        if (activeTab === 'all') return ALERTS;
        return ALERTS.filter((item) => item.status === activeTab);
    }, [activeTab]);

    return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.topRow}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Back"
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <AppIcon color={colors.primary} name="chevron-back" size={22} />
                    </Pressable>
                    <Text style={styles.topTitle}>Vital Alerts</Text>
                    <View style={styles.topSpacer} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.segmentedControl}>
                        {TABS.map((tab) => {
                            const active = activeTab === tab.key;
                            return (
                                <Pressable
                                    key={tab.key}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Show ${tab.label} alerts`}
                                    onPress={() => setActiveTab(tab.key)}
                                    style={[styles.segmentButton, active && styles.segmentButtonActive]}
                                >
                                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                                        {tab.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    <View style={styles.alertList}>
                        {visibleAlerts.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <AppIcon color={colors.textMuted} name="checkmark-circle-outline" size={36} />
                                <Text style={styles.emptyText}>No alerts in this category.</Text>
                            </View>
                        ) : (
                            visibleAlerts.map((alert) => {
                                const tone = TONE[alert.tone] ?? TONE.success;
                                return (
                                    <Pressable
                                        key={alert.id}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Open alert: ${alert.title}`}
                                        onPress={() =>
                                            router.push({
                                                pathname: '/(app)/alert/[alertId]',
                                                params: { alertId: alert.id },
                                            })
                                        }
                                        style={styles.alertCard}
                                    >
                                        <View style={[styles.alertAccent, { backgroundColor: tone.accent }]} />

                                        <View style={styles.alertBody}>
                                            <View style={styles.alertHeaderRow}>
                                                <Text style={[styles.alertCategory, { color: tone.label }]}>
                                                    {alert.categoryLabel}
                                                </Text>
                                                <AppIcon color={colors.border} name="chevron-forward" size={20} />
                                            </View>

                                            <Text style={styles.alertTitle}>{alert.title}</Text>

                                            <View style={styles.alertTimeRow}>
                                                <AppIcon color={colors.textMuted} name="time-outline" size={15} />
                                                <Text style={styles.alertTime}>{alert.time}</Text>
                                            </View>

                                            <View style={styles.alertMetricRow}>
                                                <View style={[styles.metricIconWrap, { backgroundColor: tone.iconBg }]}>
                                                    <AppIcon color={tone.iconColor} name={alert.icon} size={20} />
                                                </View>
                                                <View style={styles.metricTextWrap}>
                                                    <Text style={styles.metricValue}>{alert.metric}</Text>
                                                    <Text style={styles.metricDetail}>{alert.detail}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </Pressable>
                                );
                            })
                        )}
                    </View>

                    <Text style={styles.footerInfo}>Showing alerts from the last 7 days.</Text>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    topRow: {
        height: 64,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
    },
    backButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    topTitle: {
        color: colors.text,
        fontSize: typography.heading,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    topSpacer: { width: 44 },
    scrollContent: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.xl,
    },
    segmentedControl: {
        backgroundColor: colors.border,
        borderRadius: radius.sm,
        padding: 4,
        flexDirection: 'row',
    },
    segmentButton: {
        flex: 1,
        borderRadius: 10,
        paddingVertical: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentButtonActive: {
        backgroundColor: colors.surface,
    },
    segmentText: {
        color: colors.textMuted,
        fontSize: typography.body,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    segmentTextActive: {
        color: colors.primary,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    alertList: {
        marginTop: spacing.sm,
        gap: spacing.sm,
    },
    alertCard: {
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    alertAccent: {
        width: 4,
    },
    alertBody: {
        flex: 1,
        padding: spacing.sm,
    },
    alertHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    alertCategory: {
        fontSize: typography.caption,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        letterSpacing: 0.4,
    },
    alertTitle: {
        marginTop: 3,
        color: colors.text,
        fontSize: typography.bodyLarge,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    alertTimeRow: {
        marginTop: 5,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    alertTime: {
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyMedium,
    },
    alertMetricRow: {
        marginTop: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    metricIconWrap: {
        width: 48,
        height: 48,
        borderRadius: radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    metricTextWrap: {
        flex: 1,
    },
    metricValue: {
        color: colors.text,
        fontSize: typography.bodyLarge,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    metricDetail: {
        marginTop: 2,
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyRegular,
    },
    emptyCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.xl,
        alignItems: 'center',
        gap: spacing.xs,
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: typography.body,
        fontFamily: fonts.bodyRegular,
        textAlign: 'center',
    },
    footerInfo: {
        marginTop: spacing.lg,
        textAlign: 'center',
        color: colors.textSubtle,
        fontSize: typography.caption,
        fontFamily: fonts.bodyRegular,
    },
});
