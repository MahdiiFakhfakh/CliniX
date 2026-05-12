import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '@/src/core/theme/tokens';
import AppIcon from '@/src/shared/components/AppIcon';

const palette = {
    background: '#F3F4F8',
    surface: '#FFFFFF',
    primary: '#1D4ED8',
    text: '#111827',
    muted: '#6B7280',
    border: '#E5E7EB',
    segmentBg: '#E5E7EB',
    danger: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
};

const TABS = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'resolved', label: 'Resolved' },
];

const ALERTS = [
    {
        id: 'alert-oxygen-low',
        status: 'active',
        severity: 'critical',
        categoryLabel: 'ACTIVE • CRITICAL',
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
        severity: 'acknowledged',
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
        severity: 'resolved',
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
        severity: 'resolved',
        categoryLabel: 'RESOLVED',
        title: 'Elevated Body Temp',
        time: '2 days ago',
        metric: '101.4°F',
        detail: 'Logged by Caregiver',
        icon: 'thermometer',
        tone: 'success',
    },
];

const toneStyle = {
    danger: {
        accent: palette.danger,
        chipColor: palette.danger,
        iconBg: '#FEE2E2',
        iconColor: palette.danger,
    },
    warning: {
        accent: palette.warning,
        chipColor: '#D97706',
        iconBg: '#FEF3C7',
        iconColor: palette.warning,
    },
    success: {
        accent: palette.success,
        chipColor: '#10B981',
        iconBg: '#D1FAE5',
        iconColor: palette.success,
    },
};

export function NotificationsScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('all');

    const visibleAlerts = useMemo(() => {
        if (activeTab === 'all') {
            return ALERTS;
        }
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
                        style={styles.backLink}
                    >
                        <AppIcon color={palette.primary} name="chevron-back" size={22} />
                        <Text style={styles.backText}>CliniX</Text>
                    </Pressable>

                    <Text style={styles.topTitle}>My Vital Alerts</Text>

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="More actions"
                        onPress={() => {}}
                        style={styles.moreButton}
                    >
                        <AppIcon color="#475569" name="ellipsis-horizontal" size={22} />
                    </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={styles.heading}>Vital Alerts</Text>
                    <Text style={styles.subtitle}>Real-time health monitoring notifications</Text>

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
                        {visibleAlerts.map((alert) => {
                            const tone = toneStyle[alert.tone];
                            return (
                                <Pressable
                                    key={alert.id}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Open alert ${alert.title}`}
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
                                            <Text style={[styles.alertCategory, { color: tone.chipColor }]}>
                                                {alert.categoryLabel}
                                            </Text>
                                            <AppIcon color="#CBD5E1" name="chevron-forward" size={24} />
                                        </View>

                                        <Text style={styles.alertTitle}>{alert.title}</Text>

                                        <View style={styles.alertTimeRow}>
                                            <AppIcon color={palette.muted} name="time-outline" size={18} />
                                            <Text style={styles.alertTime}>{alert.time}</Text>
                                        </View>

                                        <View style={styles.alertMetricRow}>
                                            <View style={[styles.metricIconWrap, { backgroundColor: tone.iconBg }]}>
                                                <AppIcon color={tone.iconColor} name={alert.icon} size={22} />
                                            </View>
                                            <View>
                                                <Text style={styles.metricText}>{alert.metric}</Text>
                                                <Text style={styles.metricDetail}>{alert.detail}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>

                    <Text style={styles.footerInfo}>Viewing alerts from the last 7 days.</Text>
                    <Pressable accessibilityRole="button" onPress={() => {}} style={styles.archiveButton}>
                        <Text style={styles.archiveButtonText}>Archive All Resolved Alerts</Text>
                    </Pressable>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: palette.background,
    },
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    topRow: {
        height: 78,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
    },
    backLink: {
        minWidth: 98,
        height: 44,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        color: palette.primary,
        fontSize: 16,
        lineHeight: 22,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    topTitle: {
        color: palette.text,
        fontSize: 21,
        lineHeight: 28,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    moreButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 22,
        paddingBottom: 28,
    },
    heading: {
        marginTop: 16,
        color: palette.text,
        fontSize: 46,
        lineHeight: 48,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    subtitle: {
        marginTop: 8,
        color: palette.muted,
        fontSize: 16,
        lineHeight: 22,
        fontFamily: fonts.bodyRegular,
    },
    segmentedControl: {
        marginTop: 18,
        backgroundColor: palette.segmentBg,
        borderRadius: 18,
        padding: 5,
        flexDirection: 'row',
    },
    segmentButton: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentButtonActive: {
        backgroundColor: '#FFFFFF',
    },
    segmentText: {
        color: palette.muted,
        fontSize: 16,
        lineHeight: 20,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    segmentTextActive: {
        color: palette.text,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    alertList: {
        marginTop: 16,
        gap: 12,
    },
    alertCard: {
        borderRadius: 16,
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.border,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    alertAccent: {
        width: 4,
    },
    alertBody: {
        flex: 1,
        padding: 14,
    },
    alertHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    alertCategory: {
        fontSize: 13,
        lineHeight: 17,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        letterSpacing: 0.4,
    },
    alertTitle: {
        marginTop: 2,
        color: palette.text,
        fontSize: 22,
        lineHeight: 28,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    alertTimeRow: {
        marginTop: 6,
        flexDirection: 'row',
        alignItems: 'center',
    },
    alertTime: {
        marginLeft: 6,
        color: palette.muted,
        fontSize: 16,
        lineHeight: 20,
        fontFamily: fonts.bodyMedium,
    },
    alertMetricRow: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    metricIconWrap: {
        width: 54,
        height: 54,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    metricText: {
        color: palette.text,
        fontSize: 22,
        lineHeight: 26,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    metricDetail: {
        color: palette.muted,
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodyRegular,
    },
    footerInfo: {
        marginTop: 28,
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodyRegular,
    },
    archiveButton: {
        marginTop: 8,
        alignSelf: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    archiveButtonText: {
        color: palette.primary,
        fontSize: 17,
        lineHeight: 22,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
});
