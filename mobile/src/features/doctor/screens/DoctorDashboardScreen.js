import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadows, spacing, typography } from '@/src/core/theme/tokens';
import { useAppointmentsQuery } from '@/src/features/appointments/hooks/useAppointmentsQuery';
import { useDoctorAlertsQuery } from '@/src/features/doctor/hooks/useDoctorAlertsQuery';
import { LoadingView } from '@/src/shared/components/LoadingView';
import AppIcon from '@/src/shared/components/AppIcon';

const formatDay = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Date TBD';
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    }).format(date);
};

const severityStyle = (severity) => {
    if (severity === 'high') return { color: colors.danger, icon: 'alert-circle', bg: colors.dangerSoft };
    if (severity === 'medium') return { color: colors.warningText, icon: 'warning', bg: colors.warningSoft };
    return { color: colors.success, icon: 'checkmark-circle', bg: colors.successSoft };
};

function StatItem({ label, value }) {
    return (
        <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{value}</Text>
            <Text style={styles.heroStatLabel}>{label}</Text>
        </View>
    );
}

export function DoctorDashboardScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const scheduleQuery = useAppointmentsQuery('doctor');
    const alertsQuery = useDoctorAlertsQuery();

    const isRefreshing = scheduleQuery.isRefetching || alertsQuery.isRefetching;
    const appointments = scheduleQuery.data ?? [];
    const alerts = alertsQuery.data ?? [];
    const now = Date.now();
    const todayKey = new Date().toDateString();

    const activeAppointments = appointments.filter((item) => item.status !== 'cancelled');
    const sortedUpcoming = [...activeAppointments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const nextAppointment = sortedUpcoming.find((item) => new Date(item.date).getTime() >= now) ?? sortedUpcoming[0];
    const todayAppointments = activeAppointments.filter((item) => new Date(item.date).toDateString() === todayKey);
    const urgentAlerts = alerts.filter((item) => item.severity === 'high');

    const handleRefresh = () => {
        void Promise.all([scheduleQuery.refetch(), alertsQuery.refetch()]);
    };

    if (scheduleQuery.isLoading || alertsQuery.isLoading) {
        return (
            <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
                <LoadingView label="Loading doctor dashboard..." />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
            <View style={styles.container}>
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
                    refreshControl={<RefreshControl onRefresh={handleRefresh} refreshing={isRefreshing} tintColor={colors.primary} />}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.heroCard}>
                        <View style={styles.heroTopRow}>
                            <View style={styles.heroIcon}>
                                <AppIcon color="#FFFFFF" name="briefcase-plus" size={26} />
                            </View>
                            <View style={styles.heroBadge}>
                                <View style={styles.badgeDot} />
                                <Text style={styles.heroBadgeText}>On duty</Text>
                            </View>
                        </View>

                        <Text style={styles.heroTitle}>Doctor Home</Text>
                        <Text style={styles.heroSubtitle}>Track consultations, patient files, and clinical alerts in one place.</Text>

                        <View style={styles.nextVisitCard}>
                            {nextAppointment ? (
                                <>
                                    <Text style={styles.nextVisitLabel}>Next consultation</Text>
                                    <Text style={styles.nextVisitDoctor}>{nextAppointment.patientName}</Text>
                                    <Text style={styles.nextVisitMeta}>
                                        {formatDay(nextAppointment.date)} at {nextAppointment.time || 'Time TBD'}
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.nextVisitLabel}>Next consultation</Text>
                                    <Text style={styles.nextVisitDoctor}>No scheduled consultation</Text>
                                    <Text style={styles.nextVisitMeta}>Your schedule is clear right now.</Text>
                                </>
                            )}
                        </View>

                        <View style={styles.heroStatsRow}>
                            <StatItem label="Today" value={todayAppointments.length} />
                            <View style={styles.heroStatDivider} />
                            <StatItem label="Upcoming" value={sortedUpcoming.length} />
                            <View style={styles.heroStatDivider} />
                            <StatItem label="Urgent" value={urgentAlerts.length} />
                        </View>
                    </View>

                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Next Consultation</Text>
                            <Text style={styles.sectionMeta}>Open the file or review the full schedule</Text>
                        </View>
                        <Pressable onPress={() => router.push('/(app)/(doctor)/schedule')} style={({ pressed }) => [styles.textAction, pressed && { opacity: 0.7 }]}>
                            <Text style={styles.viewAll}>Schedule</Text>
                        </Pressable>
                    </View>

                    {nextAppointment ? (
                        <View style={styles.appointmentCard}>
                            <View style={styles.cardTopRow}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>
                                        {(nextAppointment.patientName ?? 'Patient').split(' ').slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('')}
                                    </Text>
                                </View>
                                <View style={styles.cardTextWrap}>
                                    <Text style={styles.patientName}>{nextAppointment.patientName}</Text>
                                    <Text style={styles.departmentText}>{nextAppointment.department}</Text>
                                    <Text style={styles.reasonText}>{nextAppointment.reason}</Text>
                                </View>
                            </View>

                            <View style={styles.metaGrid}>
                                <View style={styles.metaBox}>
                                    <AppIcon color={colors.primary} name="calendar-outline" size={18} />
                                    <Text style={styles.metaText}>{formatDay(nextAppointment.date)}</Text>
                                </View>
                                <View style={styles.metaBox}>
                                    <AppIcon color={colors.primary} name="time-outline" size={18} />
                                    <Text style={styles.metaText}>{nextAppointment.time || 'Time TBD'}</Text>
                                </View>
                            </View>

                            <View style={styles.buttonRow}>
                                {nextAppointment.patientId ? (
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel="Open patient file"
                                        onPress={() =>
                                            router.push({
                                                pathname: '/(app)/(doctor)/patient/[patientId]',
                                                params: { patientId: nextAppointment.patientId },
                                            })
                                        }
                                        style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
                                    >
                                        <AppIcon color="#FFFFFF" name="folder-open" size={17} />
                                        <Text style={styles.primaryButtonText}>Open File</Text>
                                    </Pressable>
                                ) : null}
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Open schedule"
                                    onPress={() => router.push('/(app)/(doctor)/schedule')}
                                    style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
                                >
                                    <AppIcon color={colors.primary} name="calendar-outline" size={17} />
                                    <Text style={styles.secondaryButtonText}>Schedule</Text>
                                </Pressable>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.emptyCard}>
                            <View style={styles.emptyIcon}>
                                <AppIcon color={colors.primary} name="calendar-outline" size={28} />
                            </View>
                            <Text style={styles.emptyTitle}>No consultations scheduled</Text>
                            <Text style={styles.emptyText}>New bookings will appear here when patients reserve a visit.</Text>
                        </View>
                    )}

                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Clinical Alerts</Text>
                            <Text style={styles.sectionMeta}>{alerts.length} active alert{alerts.length === 1 ? '' : 's'}</Text>
                        </View>
                        <Pressable onPress={() => router.push('/(app)/(doctor)/notifications')} style={({ pressed }) => [styles.textAction, pressed && { opacity: 0.7 }]}>
                            <Text style={styles.viewAll}>Alerts</Text>
                        </Pressable>
                    </View>

                    <View style={styles.alertList}>
                        {alerts.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <View style={styles.emptyIcon}>
                                    <AppIcon color={colors.primary} name="checkmark-circle" size={28} />
                                </View>
                                <Text style={styles.emptyTitle}>No active alerts</Text>
                                <Text style={styles.emptyText}>Critical updates and urgent review items will show here.</Text>
                            </View>
                        ) : (
                            alerts.slice(0, 3).map((alert) => {
                                const severity = severityStyle(alert.severity);
                                return (
                                    <View key={alert.id} style={styles.alertCard}>
                                        <View style={[styles.alertIcon, { backgroundColor: severity.bg }]}>
                                            <AppIcon color={severity.color} name={severity.icon} size={20} />
                                        </View>
                                        <View style={styles.alertTextWrap}>
                                            <Text style={styles.alertTitle}>{alert.title}</Text>
                                            <Text style={styles.alertDescription}>{alert.description}</Text>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </View>

                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.quickActionsRow}>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Open patient list"
                            onPress={() => router.push('/(app)/(doctor)/patients')}
                            style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.82 }]}
                        >
                            <View style={styles.quickIconWrap}>
                                <AppIcon color={colors.primary} name="people" size={23} />
                            </View>
                            <Text style={styles.quickLabel}>Patients</Text>
                        </Pressable>

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Open schedule"
                            onPress={() => router.push('/(app)/(doctor)/schedule')}
                            style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.82 }]}
                        >
                            <View style={styles.quickIconWrap}>
                                <AppIcon color={colors.primary} name="calendar" size={23} />
                            </View>
                            <Text style={styles.quickLabel}>Schedule</Text>
                        </Pressable>
                    </View>
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
    scrollContent: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        gap: spacing.md,
    },
    heroCard: {
        borderRadius: radius.lg,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        ...shadows.card,
    },
    heroTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    heroIcon: {
        width: 52,
        height: 52,
        borderRadius: 17,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroBadge: {
        minHeight: 34,
        borderRadius: radius.full,
        backgroundColor: colors.successSoft,
        borderWidth: 1,
        borderColor: colors.successBorder,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: spacing.sm,
    },
    badgeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.success,
    },
    heroBadgeText: {
        color: colors.text,
        fontSize: typography.caption,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    heroTitle: {
        color: colors.text,
        fontSize: 30,
        lineHeight: 36,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    heroSubtitle: {
        marginTop: spacing.xs,
        color: colors.textMuted,
        fontSize: typography.body,
        lineHeight: 22,
        fontFamily: fonts.bodyRegular,
    },
    nextVisitCard: {
        marginTop: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.sm,
    },
    nextVisitLabel: {
        color: colors.textMuted,
        fontSize: typography.caption,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    nextVisitDoctor: {
        marginTop: 3,
        color: colors.text,
        fontSize: typography.bodyLarge,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    nextVisitMeta: {
        marginTop: 2,
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyRegular,
    },
    heroStatsRow: {
        marginTop: spacing.sm,
        borderRadius: radius.md,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
    },
    heroStat: {
        flex: 1,
        alignItems: 'center',
    },
    heroStatValue: {
        color: colors.text,
        fontSize: 22,
        lineHeight: 27,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    heroStatLabel: {
        color: colors.textMuted,
        fontSize: typography.caption,
        fontFamily: fonts.bodyMedium,
    },
    heroStatDivider: {
        width: 1,
        height: 36,
        backgroundColor: colors.border,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: spacing.sm,
    },
    sectionTitle: {
        color: colors.text,
        fontSize: typography.heading,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    sectionMeta: {
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyRegular,
    },
    textAction: {
        minHeight: 34,
        justifyContent: 'center',
    },
    viewAll: {
        color: colors.primary,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    appointmentCard: {
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: spacing.sm,
        ...shadows.card,
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 18,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    cardTextWrap: {
        flex: 1,
        minWidth: 0,
    },
    patientName: {
        color: colors.text,
        fontSize: typography.bodyLarge,
        lineHeight: 22,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    departmentText: {
        marginTop: 2,
        color: colors.primary,
        fontSize: typography.body,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    reasonText: {
        marginTop: 4,
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyRegular,
    },
    metaGrid: {
        marginTop: spacing.sm,
        flexDirection: 'row',
        gap: spacing.xs,
    },
    metaBox: {
        flex: 1,
        minHeight: 42,
        borderRadius: radius.sm,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: spacing.xs,
    },
    metaText: {
        flex: 1,
        color: colors.text,
        fontSize: typography.caption,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    buttonRow: {
        marginTop: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    primaryButton: {
        flex: 1,
        minHeight: 46,
        borderRadius: radius.sm,
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    primaryButtonPressed: {
        backgroundColor: colors.primaryMid,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: typography.body,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    secondaryButton: {
        flex: 1,
        minHeight: 46,
        borderRadius: radius.sm,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    secondaryButtonPressed: {
        backgroundColor: colors.surfaceTint,
    },
    secondaryButtonText: {
        color: colors.primary,
        fontSize: typography.body,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    alertList: {
        gap: spacing.xs,
    },
    alertCard: {
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: spacing.sm,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    alertIcon: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.xs,
    },
    alertTextWrap: {
        flex: 1,
    },
    alertTitle: {
        color: colors.text,
        fontSize: typography.body,
        lineHeight: 20,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    alertDescription: {
        marginTop: 2,
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        lineHeight: 18,
        fontFamily: fonts.bodyRegular,
    },
    quickActionsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    quickAction: {
        flex: 1,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: spacing.sm,
        alignItems: 'center',
        ...shadows.card,
    },
    quickIconWrap: {
        width: 58,
        height: 58,
        borderRadius: 20,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xs,
    },
    quickLabel: {
        color: colors.text,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    emptyCard: {
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: spacing.lg,
        alignItems: 'center',
        gap: spacing.xs,
    },
    emptyIcon: {
        width: 58,
        height: 58,
        borderRadius: 20,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        color: colors.text,
        fontSize: typography.bodyLarge,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        textAlign: 'center',
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: typography.body,
        lineHeight: 21,
        fontFamily: fonts.bodyRegular,
        textAlign: 'center',
    },
});
