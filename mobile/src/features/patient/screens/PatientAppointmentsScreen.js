import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadows, spacing, typography } from '@/src/core/theme/tokens';
import { useAppointmentsQuery } from '@/src/features/appointments/hooks/useAppointmentsQuery';
import {
    isCancelledAppointment,
    isPastAppointment,
    isUpcomingAppointment,
    sortAppointmentsAscending,
} from '@/src/features/appointments/utils/appointmentDates';
import { LoadingView } from '@/src/shared/components/LoadingView';
import AppIcon from '@/src/shared/components/AppIcon';

const TABS = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'cancelled', label: 'Cancelled' },
];

const statusPillStyles = {
    confirmed: { backgroundColor: colors.successSoft, color: '#15803D', label: 'Confirmed' },
    scheduled: { backgroundColor: colors.primarySoft, color: colors.primary, label: 'Pending' },
    in_progress: { backgroundColor: colors.primarySoft, color: colors.primary, label: 'In progress' },
    cancelled: { backgroundColor: colors.dangerSoft, color: colors.danger, label: 'Cancelled' },
    completed: { backgroundColor: colors.background, color: colors.textMuted, label: 'Completed' },
};

const doctorTones = ['#0F766E', '#059669', '#14B8A6', '#10B981', '#0284C7', '#475569'];

const getDoctorTone = (doctorName) => {
    const index = Math.abs(
        String(doctorName)
            .split('')
            .reduce((total, char) => total + char.charCodeAt(0), 0),
    );
    return doctorTones[index % doctorTones.length];
};

const getInitials = (name) =>
    String(name ?? 'Doctor')
        .split(' ')
        .filter(Boolean)
        .slice(-2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || 'DR';

const formatDateLabel = (isoDate) => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
        return 'Date TBD';
    }
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    }).format(date);
};

const groupAppointments = (appointments) => {
    const now = new Date();
    const items = sortAppointmentsAscending(appointments);
    return {
        upcoming: items.filter((item) => isUpcomingAppointment(item, now)),
        past: items.filter((item) => isPastAppointment(item, now)),
        cancelled: items.filter((item) => isCancelledAppointment(item)),
    };
};

function AppointmentItem({ appointment, onPress }) {
    const statusStyle = statusPillStyles[appointment.status] ?? statusPillStyles.scheduled;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open appointment with ${appointment.doctorName}`}
            onPress={onPress}
            style={({ pressed }) => [styles.appointmentCard, pressed && styles.appointmentCardPressed]}
        >
            <View style={styles.cardTopRow}>
                <View style={[styles.avatar, { backgroundColor: getDoctorTone(appointment.doctorName) }]}>
                    <Text style={styles.avatarText}>{getInitials(appointment.doctorName)}</Text>
                </View>

                <View style={styles.cardTextWrap}>
                    <View style={styles.nameRow}>
                        <Text numberOfLines={1} style={styles.doctorName}>{appointment.doctorName}</Text>
                        <View style={[styles.statusPill, { backgroundColor: statusStyle.backgroundColor }]}>
                            <Text style={[styles.statusPillText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
                        </View>
                    </View>
                    <Text style={styles.department}>{appointment.department}</Text>
                    <Text numberOfLines={1} style={styles.reason}>{appointment.reason}</Text>
                </View>
            </View>

            <View style={styles.metaGrid}>
                <View style={styles.metaBox}>
                    <AppIcon color={colors.primary} name="calendar-outline" size={18} />
                    <Text style={styles.metaText}>{formatDateLabel(appointment.date)}</Text>
                </View>
                <View style={styles.metaBox}>
                    <AppIcon color={colors.primary} name="time-outline" size={18} />
                    <Text style={styles.metaText}>{appointment.time}</Text>
                </View>
            </View>
        </Pressable>
    );
}

export function PatientAppointmentsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const appointmentsQuery = useAppointmentsQuery('patient');
    const [activeTab, setActiveTab] = useState('upcoming');

    const grouped = useMemo(
        () => groupAppointments(appointmentsQuery.data ?? []),
        [appointmentsQuery.data],
    );

    const filteredAppointments = grouped[activeTab] ?? [];
    const nextAppointment = grouped.upcoming[0];

    const openBooking = () => {
        router.push('/(app)/(patient)/book-appointment');
    };

    if (appointmentsQuery.isLoading) {
        return (
            <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
                <LoadingView label="Loading appointments..." />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
            <View style={styles.container}>
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 112 }]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.heroCard}>
                        <View style={styles.heroTopRow}>
                            <View style={styles.heroIcon}>
                                <AppIcon color="#FFFFFF" name="calendar-outline" size={25} />
                            </View>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Book appointment"
                                onPress={openBooking}
                                style={({ pressed }) => [styles.heroBookButton, pressed && styles.heroBookButtonPressed]}
                            >
                                <AppIcon color="#FFFFFF" name="add" size={18} />
                                <Text style={styles.heroBookText}>Book</Text>
                            </Pressable>
                        </View>

                        <Text style={styles.heroTitle}>Appointments</Text>
                        <Text style={styles.heroSubtitle}>
                            Manage upcoming visits, review past care, and book your next consultation.
                        </Text>

                        <View style={styles.nextVisitCard}>
                            {nextAppointment ? (
                                <>
                                    <Text style={styles.nextVisitLabel}>Next visit</Text>
                                    <Text style={styles.nextVisitDoctor}>{nextAppointment.doctorName}</Text>
                                    <Text style={styles.nextVisitMeta}>
                                        {formatDateLabel(nextAppointment.date)} at {nextAppointment.time}
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.nextVisitLabel}>Next visit</Text>
                                    <Text style={styles.nextVisitDoctor}>No upcoming appointment</Text>
                                    <Text style={styles.nextVisitMeta}>Book a visit when you are ready.</Text>
                                </>
                            )}
                        </View>

                        <View style={styles.heroStatsRow}>
                            <View style={styles.heroStat}>
                                <Text style={styles.heroStatValue}>{grouped.upcoming.length}</Text>
                                <Text style={styles.heroStatLabel}>Upcoming</Text>
                            </View>
                            <View style={styles.heroStatDivider} />
                            <View style={styles.heroStat}>
                                <Text style={styles.heroStatValue}>{grouped.past.length}</Text>
                                <Text style={styles.heroStatLabel}>Past</Text>
                            </View>
                            <View style={styles.heroStatDivider} />
                            <View style={styles.heroStat}>
                                <Text style={styles.heroStatValue}>{grouped.cancelled.length}</Text>
                                <Text style={styles.heroStatLabel}>Cancelled</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.tabsCard}>
                        <View style={styles.segmentedControl}>
                            {TABS.map((tab) => {
                                const active = activeTab === tab.key;
                                return (
                                    <Pressable
                                        key={tab.key}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Show ${tab.label} appointments`}
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
                    </View>

                    <View style={styles.resultsHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>{TABS.find((tab) => tab.key === activeTab)?.label}</Text>
                            <Text style={styles.resultsMeta}>{filteredAppointments.length} appointment{filteredAppointments.length === 1 ? '' : 's'}</Text>
                        </View>
                        <View style={styles.sortPill}>
                            <AppIcon color={colors.primary} name="event-note" size={14} />
                            <Text style={styles.sortPillText}>Schedule</Text>
                        </View>
                    </View>

                    {filteredAppointments.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <View style={styles.emptyIcon}>
                                <AppIcon color={colors.primary} name="calendar-outline" size={28} />
                            </View>
                            <Text style={styles.emptyTitle}>No appointments here</Text>
                            <Text style={styles.emptyText}>
                                {activeTab === 'upcoming'
                                    ? 'Book an appointment to see it in this section.'
                                    : 'There are no appointments in this section yet.'}
                            </Text>
                        </View>
                    ) : (
                        filteredAppointments.map((appointment) => (
                            <AppointmentItem
                                appointment={appointment}
                                key={appointment.id}
                                onPress={() =>
                                    router.push({
                                        pathname: '/(app)/(patient)/appointment/[appointmentId]',
                                        params: { appointmentId: appointment.id },
                                    })
                                }
                            />
                        ))
                    )}

                    <View style={styles.infoCard}>
                        <AppIcon color={colors.primary} name="information-circle" size={22} />
                        <Text style={styles.infoText}>
                            Please arrive 15 minutes before your scheduled appointment for check-in.
                        </Text>
                    </View>
                </ScrollView>

                <View style={[styles.bookButtonWrap, { paddingBottom: insets.bottom + 12 }]}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Book new appointment"
                        onPress={openBooking}
                        style={({ pressed }) => [styles.bookButton, pressed && styles.bookButtonPressed]}
                    >
                        <AppIcon color="#FFFFFF" name="add-circle" size={22} />
                        <Text style={styles.bookButtonText}>Book Appointment</Text>
                    </Pressable>
                </View>
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
    heroBookButton: {
        minHeight: 40,
        borderRadius: radius.full,
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: spacing.sm,
    },
    heroBookButtonPressed: {
        backgroundColor: colors.primaryMid,
    },
    heroBookText: {
        color: '#FFFFFF',
        fontSize: typography.bodySmall,
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
    tabsCard: {
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 5,
    },
    segmentedControl: {
        borderRadius: radius.sm,
        backgroundColor: colors.background,
        padding: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    segmentButton: {
        flex: 1,
        borderRadius: radius.sm,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentButtonActive: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    segmentText: {
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    segmentTextActive: {
        color: colors.primary,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    resultsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionTitle: {
        color: colors.text,
        fontSize: typography.heading,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    resultsMeta: {
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyRegular,
    },
    sortPill: {
        minHeight: 34,
        borderRadius: radius.full,
        backgroundColor: colors.primarySoft,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: spacing.sm,
    },
    sortPillText: {
        color: colors.primary,
        fontSize: typography.caption,
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
    appointmentCardPressed: {
        opacity: 0.9,
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
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    doctorName: {
        flex: 1,
        color: colors.text,
        fontSize: typography.bodyLarge,
        lineHeight: 22,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    department: {
        marginTop: 2,
        color: colors.primary,
        fontSize: typography.body,
        lineHeight: 20,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    reason: {
        marginTop: 4,
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        lineHeight: 18,
        fontFamily: fonts.bodyRegular,
    },
    statusPill: {
        borderRadius: radius.full,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    statusPillText: {
        fontSize: 10,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
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
        marginBottom: 2,
    },
    emptyTitle: {
        color: colors.text,
        fontSize: typography.bodyLarge,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: typography.body,
        lineHeight: 21,
        fontFamily: fonts.bodyRegular,
        textAlign: 'center',
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.xs,
        borderWidth: 1,
        borderColor: colors.infoBorder,
        borderRadius: radius.md,
        backgroundColor: colors.infoSoft,
        padding: spacing.sm,
    },
    infoText: {
        flex: 1,
        color: colors.primary,
        fontSize: typography.bodySmall,
        lineHeight: 20,
        fontFamily: fonts.bodyMedium,
    },
    bookButtonWrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xs,
        backgroundColor: 'rgba(248,250,252,0.96)',
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    bookButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        height: 56,
        borderRadius: radius.sm,
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOpacity: 0.28,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    bookButtonPressed: {
        backgroundColor: colors.primaryMid,
    },
    bookButtonText: {
        color: '#FFFFFF',
        fontSize: typography.button,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
});
