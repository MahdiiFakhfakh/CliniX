import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing, typography } from '@/src/core/theme/tokens';
import { useAppointmentsQuery } from '@/src/features/appointments/hooks/useAppointmentsQuery';
import { useChatMessagesQuery } from '@/src/features/chat/hooks/useChatMessagesQuery';
import { useDoctorAlertsQuery } from '@/src/features/doctor/hooks/useDoctorAlertsQuery';
import { LoadingView } from '@/src/shared/components/LoadingView';
import AppIcon from '@/src/shared/components/AppIcon';

const formatDay = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Today';
    }
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    }).format(date);
};

const buildDateTime = (appointment) => {
    const day = formatDay(appointment.date);
    const time = appointment.time || '09:00 AM';
    return `${day}  ${time}`;
};

const severityStyle = (severity) => {
    if (severity === 'high') {
        return { color: colors.danger, icon: 'alert-circle' };
    }
    if (severity === 'medium') {
        return { color: colors.warning, icon: 'warning' };
    }
    return { color: '#16A34A', icon: 'checkmark-circle' };
};

export function DoctorDashboardScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const scheduleQuery = useAppointmentsQuery('doctor');
    const alertsQuery = useDoctorAlertsQuery();
    const messagesQuery = useChatMessagesQuery('doctor');

    const isRefreshing = scheduleQuery.isRefetching || alertsQuery.isRefetching || messagesQuery.isRefetching;

    const handleRefresh = () => {
        void Promise.all([scheduleQuery.refetch(), alertsQuery.refetch(), messagesQuery.refetch()]);
    };

    const appointments = scheduleQuery.data ?? [];
    const now = Date.now();
    const sortedUpcoming = [...appointments]
        .filter((item) => item.status !== 'cancelled')
        .sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateA - dateB;
        });

    const nextAppointment = sortedUpcoming.find((item) => new Date(item.date).getTime() >= now) ?? sortedUpcoming[0];
    const todayAppointments = sortedUpcoming.filter((item) => {
        const itemDay = new Date(item.date).toDateString();
        return itemDay === new Date().toDateString();
    });

    const unreadCount = useMemo(
        () => (messagesQuery.data ?? []).filter((message) => message.senderRole === 'patient').length,
        [messagesQuery.data],
    );

    if (scheduleQuery.isLoading || alertsQuery.isLoading || messagesQuery.isLoading) {
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
                    refreshControl={<RefreshControl onRefresh={handleRefresh} refreshing={isRefreshing} />}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Next Consultation</Text>
                        <Pressable onPress={() => router.push('/(app)/(doctor)/schedule')}>
                            <Text style={styles.viewAll}>View Schedule</Text>
                        </Pressable>
                    </View>

                    {nextAppointment ? (
                        <View style={styles.appointmentCard}>
                            <View style={styles.appointmentTopRow}>
                                <View style={styles.chip}>
                                    <Text style={styles.chipText}>UPCOMING</Text>
                                </View>
                                <Text style={styles.appointmentStatus}>{nextAppointment.status.replace('_', ' ')}</Text>
                            </View>

                            <Text style={styles.patientName}>{nextAppointment.patientName}</Text>
                            <Text style={styles.departmentText}>{nextAppointment.department}</Text>
                            <View style={styles.timeRow}>
                                <AppIcon color={colors.primary} name="time-outline" size={18} />
                                <Text style={styles.timeText}>{nextAppointment.time || '09:00 AM'}</Text>
                                <Text style={styles.dateLine}>{formatDay(nextAppointment.date)}</Text>
                            </View>

                            <View style={styles.appointmentActions}>
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
                                        style={({ pressed }) => [
                                            styles.primaryButton,
                                            pressed && styles.primaryButtonPressed,
                                        ]}
                                    >
                                        <AppIcon color="#FFFFFF" name="folder-open" size={16} />
                                        <Text style={styles.primaryButtonText}>Open File</Text>
                                    </Pressable>
                                ) : null}
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Open schedule"
                                    onPress={() => router.push('/(app)/(doctor)/schedule')}
                                    style={styles.secondaryButton}
                                >
                                    <AppIcon color={colors.text} name="calendar-outline" size={16} />
                                    <Text style={styles.secondaryButtonText}>Schedule</Text>
                                </Pressable>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>No consultations are scheduled right now.</Text>
                        </View>
                    )}

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Clinical Alerts</Text>
                        <Pressable onPress={() => router.push('/(app)/(doctor)/notifications')}>
                            <Text style={styles.viewAll}>Open Alerts</Text>
                        </Pressable>
                    </View>

                    <View style={styles.alertList}>
                        {(alertsQuery.data ?? []).length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyText}>No active alerts.</Text>
                            </View>
                        ) : (
                            (alertsQuery.data ?? []).slice(0, 3).map((alert) => {
                                const severity = severityStyle(alert.severity);
                                return (
                                    <View key={alert.id} style={styles.alertCard}>
                                        <AppIcon color={severity.color} name={severity.icon} size={18} />
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
                            style={styles.quickAction}
                        >
                            <View style={styles.quickIconWrap}>
                                <AppIcon color={colors.primary} name="people" size={22} />
                            </View>
                            <Text style={styles.quickLabel}>Patients</Text>
                        </Pressable>

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Open schedule"
                            onPress={() => router.push('/(app)/(doctor)/schedule')}
                            style={styles.quickAction}
                        >
                            <View style={styles.quickIconWrap}>
                                <AppIcon color={colors.primary} name="calendar" size={22} />
                            </View>
                            <Text style={styles.quickLabel}>Schedule</Text>
                        </Pressable>

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Open CliniX AI"
                            onPress={() => router.push('/(app)/(doctor)/clinix-ai')}
                            style={styles.quickAction}
                        >
                            <View style={styles.quickIconWrap}>
                                <AppIcon color={colors.primary} name="sparkles" size={22} />
                            </View>
                            <Text style={styles.quickLabel}>CliniX AI</Text>
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
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: 16,
    },
    metricsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    metricCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
    },
    metricLabel: {
        color: colors.textMuted,
        fontSize: 13,
        lineHeight: 18,
        fontFamily: fonts.bodyMedium,
    },
    metricValue: {
        marginTop: 6,
        color: colors.primary,
        fontSize: 30,
        lineHeight: 32,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    sectionHeader: {
        marginTop: 12,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        color: colors.text,
        fontSize: 19,
        lineHeight: 24,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    viewAll: {
        color: colors.primary,
        fontSize: 14,
        lineHeight: 19,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    appointmentCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
    },
    appointmentTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    chip: {
        backgroundColor: colors.primarySoft,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    chipText: {
        color: colors.primary,
        fontSize: 11,
        lineHeight: 14,
        letterSpacing: 0.4,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    appointmentStatus: {
        color: colors.textMuted,
        fontSize: 13,
        lineHeight: 18,
        textTransform: 'capitalize',
        fontFamily: fonts.bodyMedium,
    },
    patientName: {
        marginTop: 12,
        color: colors.text,
        fontSize: 22,
        lineHeight: 28,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    departmentText: {
        color: colors.textMuted,
        fontSize: 15,
        lineHeight: 20,
        fontFamily: fonts.bodyRegular,
    },
    timeRow: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.primarySoft,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        alignSelf: 'flex-start',
    },
    timeText: {
        color: colors.primary,
        fontSize: 17,
        lineHeight: 22,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    dateLine: {
        color: colors.textMuted,
        fontSize: 14,
        lineHeight: 19,
        fontFamily: fonts.bodyMedium,
    },
    appointmentActions: {
        marginTop: 14,
        flexDirection: 'row',
        gap: 10,
    },
    primaryButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
    },
    primaryButtonPressed: {
        backgroundColor: colors.primaryMid,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        lineHeight: 20,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    secondaryButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        backgroundColor: colors.surfaceTint,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
    },
    secondaryButtonText: {
        color: colors.text,
        fontSize: 15,
        lineHeight: 20,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    alertList: {
        gap: 10,
    },
    alertCard: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    alertTextWrap: {
        marginLeft: 10,
        flex: 1,
    },
    alertTitle: {
        color: colors.text,
        fontSize: 15,
        lineHeight: 20,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    alertDescription: {
        marginTop: 2,
        color: colors.textMuted,
        fontSize: 13,
        lineHeight: 18,
        fontFamily: fonts.bodyRegular,
    },
    quickActionsRow: {
        marginTop: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    quickAction: {
        flex: 1,
        alignItems: 'center',
    },
    quickIconWrap: {
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    quickLabel: {
        textAlign: 'center',
        color: colors.text,
        fontSize: 13,
        lineHeight: 18,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    emptyCard: {
        backgroundColor: colors.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: 14,
        lineHeight: 20,
        fontFamily: fonts.bodyRegular,
        textAlign: 'center',
    },
});
