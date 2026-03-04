import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '@/src/core/theme/tokens';
import { useAppointmentsQuery } from '@/src/features/appointments/hooks/useAppointmentsQuery';
import { LoadingView } from '@/src/shared/components/LoadingView';
import AppIcon from '@/src/shared/components/AppIcon';

const palette = {
    background: '#F3F4F8',
    surface: '#FFFFFF',
    primary: '#1D4ED8',
    text: '#111827',
    muted: '#6B7280',
    border: '#D1D5DB',
    segmentBg: '#E5E7EB',
    successBg: '#DCFCE7',
    successText: '#15803D',
    pendingBg: '#DBEAFE',
    pendingText: '#1D4ED8',
    dangerBg: '#FEE2E2',
    dangerText: '#B91C1C',
    infoBg: '#EDE9FE',
    infoText: '#1D4ED8',
};

const TABS = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'cancelled', label: 'Cancelled' },
];

const statusPillStyles = {
    confirmed: { backgroundColor: palette.successBg, color: palette.successText, label: 'CONFIRMED' },
    scheduled: { backgroundColor: palette.pendingBg, color: palette.pendingText, label: 'PENDING' },
    in_progress: { backgroundColor: palette.pendingBg, color: palette.pendingText, label: 'IN PROGRESS' },
    cancelled: { backgroundColor: palette.dangerBg, color: palette.dangerText, label: 'CANCELLED' },
    completed: { backgroundColor: '#E5E7EB', color: '#475569', label: 'COMPLETED' },
};

const doctorAvatarStyle = (doctorName) => {
    if (doctorName.toLowerCase().includes('kareem')) {
        return { backgroundColor: '#EFE6D1' };
    }
    if (doctorName.toLowerCase().includes('lina')) {
        return { backgroundColor: '#CDE9E9' };
    }
    return { backgroundColor: '#DDE7F8' };
};

const isPastAppointment = (appointment) => {
    const date = new Date(appointment.date);
    return !Number.isNaN(date.getTime()) && date.getTime() < Date.now() && appointment.status !== 'cancelled';
};

const formatDateLabel = (isoDate) => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
        return 'Oct 24, 2023';
    }
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    }).format(date);
};

export function PatientAppointmentsScreen() {
    const router = useRouter();
    const appointmentsQuery = useAppointmentsQuery('patient');
    const [activeTab, setActiveTab] = useState('upcoming');

    const filteredAppointments = useMemo(() => {
        const items = appointmentsQuery.data ?? [];

        if (activeTab === 'cancelled') {
            return items.filter((item) => item.status === 'cancelled');
        }
        if (activeTab === 'past') {
            return items.filter((item) => isPastAppointment(item) || item.status === 'completed');
        }
        return items.filter((item) => !isPastAppointment(item) && item.status !== 'cancelled');
    }, [activeTab, appointmentsQuery.data]);

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
                <View style={styles.headerRow}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                        onPress={() => router.back()}
                        style={styles.headerButton}
                    >
                        <AppIcon color={palette.primary} name="chevron-back" size={30} />
                    </Pressable>
                    <Text style={styles.headerTitle}>My Appointments</Text>
                    <View style={styles.headerSpacer} />
                </View>

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

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {filteredAppointments.map((appointment) => {
                        const statusStyle = statusPillStyles[appointment.status] ?? statusPillStyles.scheduled;
                        return (
                            <Pressable
                                key={appointment.id}
                                accessibilityRole="button"
                                accessibilityLabel={`Open appointment with ${appointment.doctorName}`}
                                onPress={() =>
                                    router.push({
                                        pathname: '/(app)/(patient)/appointment/[appointmentId]',
                                        params: { appointmentId: appointment.id },
                                    })
                                }
                                style={styles.card}
                            >
                                <View style={styles.cardTopRow}>
                                    <View style={[styles.avatar, doctorAvatarStyle(appointment.doctorName)]}>
                                        <AppIcon color="#334155" name="person" size={26} />
                                    </View>
                                    <View style={styles.cardTextWrap}>
                                        <Text style={styles.doctorName}>{appointment.doctorName}</Text>
                                        <Text style={styles.specialty}>{appointment.department}</Text>
                                        <View style={[styles.statusPill, { backgroundColor: statusStyle.backgroundColor }]}>
                                            <Text style={[styles.statusText, { color: statusStyle.color }]}>
                                                {statusStyle.label}
                                            </Text>
                                        </View>
                                    </View>
                                    <Pressable accessibilityRole="button" style={styles.moreButton} onPress={() => {}}>
                                        <AppIcon color="#6366A1" name="ellipsis-vertical" size={24} />
                                    </Pressable>
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.cardMetaRow}>
                                    <View style={styles.metaItem}>
                                        <AppIcon color={palette.primary} name="calendar-outline" size={24} />
                                        <Text style={styles.metaText}>{formatDateLabel(appointment.date)}</Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <AppIcon color={palette.primary} name="time-outline" size={24} />
                                        <Text style={styles.metaText}>{appointment.time}</Text>
                                    </View>
                                </View>
                            </Pressable>
                        );
                    })}

                    {filteredAppointments.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>No appointments in this section.</Text>
                        </View>
                    ) : null}

                    <View style={styles.infoCard}>
                        <AppIcon color={palette.primary} name="information-circle" size={24} />
                        <Text style={styles.infoText}>
                            Please arrive 15 minutes before your scheduled appointment for check-in and documentation.
                        </Text>
                    </View>
                </ScrollView>

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Book new appointment"
                    onPress={() => router.push('/(app)/(patient)/book-appointment')}
                    style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
                >
                    <AppIcon color="#FFFFFF" name="add" size={32} />
                </Pressable>
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
    headerRow: {
        height: 76,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerButton: {
        width: 46,
        height: 46,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: palette.text,
        fontSize: 24,
        lineHeight: 30,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    headerSpacer: {
        width: 46,
        height: 46,
    },
    segmentedControl: {
        marginTop: 10,
        marginHorizontal: 22,
        backgroundColor: palette.segmentBg,
        borderRadius: 16,
        padding: 5,
        flexDirection: 'row',
        alignItems: 'center',
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
        color: '#6366A1',
        fontSize: 16,
        lineHeight: 20,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    segmentTextActive: {
        color: palette.primary,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    scrollContent: {
        paddingHorizontal: 22,
        paddingTop: 14,
        paddingBottom: 148,
        gap: 12,
    },
    card: {
        backgroundColor: palette.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: palette.border,
        padding: 16,
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    cardTextWrap: {
        flex: 1,
    },
    doctorName: {
        color: palette.text,
        fontSize: 21,
        lineHeight: 28,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    specialty: {
        color: '#6366A1',
        fontSize: 14,
        lineHeight: 20,
        fontFamily: fonts.bodyRegular,
    },
    statusPill: {
        alignSelf: 'flex-start',
        marginTop: 8,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    statusText: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: 0.5,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    moreButton: {
        width: 34,
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -4,
    },
    divider: {
        marginTop: 14,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    cardMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metaText: {
        color: '#6366A1',
        fontSize: 15,
        lineHeight: 20,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    emptyCard: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.surface,
        padding: 14,
    },
    emptyText: {
        color: palette.muted,
        fontSize: 14,
        lineHeight: 20,
        fontFamily: fonts.bodyRegular,
        textAlign: 'center',
    },
    infoCard: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        borderWidth: 1,
        borderColor: '#C4B5FD',
        borderRadius: 16,
        backgroundColor: '#EEF2FF',
        padding: 14,
    },
    infoText: {
        flex: 1,
        color: palette.infoText,
        fontSize: 14,
        lineHeight: 21,
        fontFamily: fonts.bodyMedium,
    },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 88,
        width: 74,
        height: 74,
        borderRadius: 37,
        backgroundColor: palette.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#1D4ED8',
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 7,
    },
    fabPressed: {
        transform: [{ scale: 0.96 }],
    },
});
