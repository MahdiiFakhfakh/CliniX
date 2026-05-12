import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '@/src/core/theme/tokens';
import { useAppointmentsQuery } from '@/src/features/appointments/hooks/useAppointmentsQuery';
import AppIcon from '@/src/shared/components/AppIcon';

const palette = {
    background: '#F3F4F8',
    surface: '#FFFFFF',
    primary: '#1D4ED8',
    primaryPressed: '#1E40AF',
    text: '#111827',
    muted: '#6B7280',
    border: '#E5E7EB',
    tagBg: '#E0E7FF',
    tagText: '#1D4ED8',
    dateBox: '#F3F4F6',
    secondaryButton: '#E5E7EB',
    success: '#16A34A',
    warning: '#F59E0B',
};

const DEFAULT_APPOINTMENT = {
    doctorName: 'Dr. Sarah Smith',
    specialty: 'Cardiology Specialist',
    date: new Date().toISOString(),
    time: '10:30 AM',
    countdown: 'In 2 hours',
};

const INITIAL_REMINDERS = [
    {
        id: 'r1',
        title: 'Lisinopril - 10mg',
        subtitle: 'AFTER BREAKFAST • 8:00 AM',
        icon: 'medkit-outline',
        completed: false,
    },
    {
        id: 'r2',
        title: 'Log water intake',
        subtitle: 'DAILY GOAL • 2.5L',
        icon: 'water-outline',
        completed: true,
    },
    {
        id: 'r3',
        title: 'Evening Walk',
        subtitle: 'FITNESS • 6:00 PM',
        icon: 'walk-outline',
        completed: false,
    },
];

const INITIAL_VITALS = [
    {
        id: 'heart',
        title: 'Heart Rate',
        value: '72',
        unit: 'BPM',
        status: 'NORMAL',
        statusTone: 'success',
        icon: 'heart',
        iconColor: '#EF4444',
        bg: '#FFF1F1',
        border: '#F8CDD0',
    },
    {
        id: 'spo2',
        title: 'SpO2',
        value: '98',
        unit: '%',
        status: 'OPTIMAL',
        statusTone: 'success',
        icon: 'airplane',
        iconColor: '#2563EB',
        bg: '#ECF4FF',
        border: '#C7DDFD',
    },
    {
        id: 'bp',
        title: 'Blood Pressure',
        value: '125/82',
        unit: 'mmHg',
        status: 'SLIGHT HIGH',
        statusTone: 'warning',
        icon: 'pulse',
        iconColor: '#A855F7',
        bg: '#F5F0FF',
        border: '#E2D4FF',
    },
    {
        id: 'temp',
        title: 'Temperature',
        value: '36.6',
        unit: '°C',
        status: 'NORMAL',
        statusTone: 'success',
        icon: 'thermometer',
        iconColor: '#F97316',
        bg: '#FFF8EE',
        border: '#FBD4A2',
    },
];

const QUICK_ACTIONS = [
    { id: 'book', label: 'Book Appt', icon: 'add-circle', path: '/(app)/(patient)/book-appointment' },
    { id: 'chat', label: 'Health Chat', icon: 'chatbubble-ellipses', path: '/(app)/(patient)/chat' },
    { id: 'vitals', label: 'Detailed Vitals', icon: 'stats-chart', path: '/(app)/(patient)/results' },
    { id: 'alerts', label: 'Vital Alerts', icon: 'notifications', path: '/(app)/notifications' },
];

const formatDateLabel = (isoDate) => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
        return 'Today, Oct 24';
    }
    const dateText = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
    }).format(date);
    const isToday = date.toDateString() === new Date().toDateString();
    return isToday ? `Today, ${dateText}` : dateText;
};

const buildCountdown = (isoDate) => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
        return 'In 2 hours';
    }
    const diffMs = date.getTime() - Date.now();
    if (diffMs <= 0) {
        return 'Starting soon';
    }
    const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
    return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
};

export function PatientHomeScreen() {
    const router = useRouter();
    const appointmentsQuery = useAppointmentsQuery('patient');

    const [reminders, setReminders] = useState(INITIAL_REMINDERS);
    const [vitals] = useState(INITIAL_VITALS);
    const [nextAppointment, setNextAppointment] = useState(DEFAULT_APPOINTMENT);

    useEffect(() => {
        const next = appointmentsQuery.data?.[0];
        if (!next) {
            setNextAppointment(DEFAULT_APPOINTMENT);
            return;
        }
        setNextAppointment({
            doctorName: next.doctorName ?? DEFAULT_APPOINTMENT.doctorName,
            specialty: `${next.department ?? 'Cardiology'} Specialist`,
            date: next.date ?? DEFAULT_APPOINTMENT.date,
            time: next.time ?? DEFAULT_APPOINTMENT.time,
            countdown: next.date ? buildCountdown(next.date) : DEFAULT_APPOINTMENT.countdown,
        });
    }, [appointmentsQuery.data]);

    const reminderCount = useMemo(
        () => reminders.filter((item) => !item.completed).length,
        [reminders],
    );

    const toggleReminder = (id) => {
        setReminders((current) =>
            current.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)),
        );
    };

    const handleDirections = async () => {
        const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=CliniX+Medical+Center+NY';
        try {
            const canOpen = await Linking.canOpenURL(mapsUrl);
            if (!canOpen) {
                Alert.alert('Directions unavailable', 'Unable to open maps on this device.');
                return;
            }
            await Linking.openURL(mapsUrl);
        } catch {
            Alert.alert('Directions unavailable', 'Unable to open maps on this device.');
        }
    };

    const statusColor = (tone) => (tone === 'warning' ? palette.warning : palette.success);

    return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.appointmentCard}>
                        <View style={styles.cardTopRow}>
                            <View style={styles.tag}>
                                <Text style={styles.tagText}>NEXT APPOINTMENT</Text>
                            </View>
                            <Text style={styles.countdownText}>{nextAppointment.countdown}</Text>
                        </View>

                        <View style={styles.doctorRow}>
                            <View style={styles.doctorAvatar}>
                                <AppIcon color="#FFFFFF" name="person" size={30} />
                            </View>
                            <View style={styles.doctorTextWrap}>
                                <Text style={styles.doctorName}>{nextAppointment.doctorName}</Text>
                                <Text style={styles.specialtyText}>{nextAppointment.specialty}</Text>
                                <View style={styles.videoRow}>
                                    <AppIcon color={palette.primary} name="videocam" size={14} />
                                    <Text style={styles.videoText}>Video Consultation</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.dateBox}>
                            <View style={styles.dateRow}>
                                <AppIcon color={palette.primary} name="calendar-outline" size={22} />
                                <Text style={styles.dateMain}>{formatDateLabel(nextAppointment.date)}</Text>
                            </View>
                            <Text style={styles.dateSub}>{nextAppointment.time} - 11:00 AM</Text>
                        </View>

                        <View style={styles.actionRow}>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Join call"
                                onPress={() => router.push('/(app)/(patient)/video')}
                                style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
                            >
                                <AppIcon color="#FFFFFF" name="videocam" size={18} />
                                <Text style={styles.primaryButtonText}>Join Call</Text>
                            </Pressable>

                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Directions"
                                onPress={handleDirections}
                                style={styles.secondaryButton}
                            >
                                <AppIcon color="#374151" name="navigate" size={18} />
                                <Text style={styles.secondaryButtonText}>Directions</Text>
                            </Pressable>
                        </View>
                    </View>

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Today&apos;s Reminders</Text>
                        <Pressable onPress={() => router.push('/(app)/(patient)/records')}>
                            <Text style={styles.viewAll}>View All</Text>
                        </Pressable>
                    </View>

                    <Text style={styles.reminderCounter}>{reminderCount} pending</Text>

                    {reminders.map((item) => (
                        <View key={item.id} style={[styles.reminderCard, item.completed && styles.reminderCompleted]}>
                            <Pressable
                                accessibilityRole="checkbox"
                                accessibilityState={{ checked: item.completed }}
                                accessibilityLabel={`Toggle ${item.title}`}
                                onPress={() => toggleReminder(item.id)}
                                style={[styles.checkbox, item.completed && styles.checkboxChecked]}
                            >
                                {item.completed ? <AppIcon color="#FFFFFF" name="checkmark" size={15} /> : null}
                            </Pressable>
                            <View style={styles.reminderTextWrap}>
                                <Text style={[styles.reminderTitle, item.completed && styles.reminderTitleDone]}>
                                    {item.title}
                                </Text>
                                <Text style={styles.reminderSubtitle}>{item.subtitle}</Text>
                            </View>
                            <AppIcon color="#9CA3AF" name={item.icon} size={22} />
                        </View>
                    ))}

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Latest Vitals</Text>
                        <Text style={styles.syncText}>LAST SYNC: 2M AGO</Text>
                    </View>

                    <View style={styles.vitalsGrid}>
                        {vitals.map((vital) => (
                            <Pressable
                                key={vital.id}
                                accessibilityRole="button"
                                accessibilityLabel={`Open ${vital.title}`}
                                onPress={() =>
                                    router.push({
                                        pathname: '/(app)/(patient)/result/[resultId]',
                                        params: { resultId: vital.id === 'heart' ? 'heart-rate' : vital.id },
                                    })
                                }
                                style={[styles.vitalCard, { backgroundColor: vital.bg, borderColor: vital.border }]}
                            >
                                <View style={styles.vitalTop}>
                                    <View style={styles.vitalIconWrap}>
                                        <AppIcon color={vital.iconColor} name={vital.icon} size={20} />
                                    </View>
                                    <Text style={[styles.vitalStatus, { color: statusColor(vital.statusTone) }]}>
                                        {vital.status}
                                    </Text>
                                </View>

                                <View style={styles.vitalValueRow}>
                                    <Text style={styles.vitalValue}>{vital.value}</Text>
                                    <Text style={styles.vitalUnit}>{vital.unit}</Text>
                                </View>
                                <Text style={styles.vitalLabel}>{vital.title}</Text>
                            </Pressable>
                        ))}
                    </View>

                    <Text style={[styles.sectionTitle, styles.quickTitle]}>Quick Actions</Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsRow}>
                        {QUICK_ACTIONS.map((action) => (
                            <Pressable
                                key={action.id}
                                accessibilityRole="button"
                                accessibilityLabel={action.label}
                                onPress={() => router.push(action.path)}
                                style={styles.quickAction}
                            >
                                <View style={styles.quickIconWrap}>
                                    <AppIcon color={palette.primary} name={action.icon} size={24} />
                                </View>
                                <Text style={styles.quickLabel}>{action.label}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

export const PatientDashboardScreen = PatientHomeScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: palette.background,
    },
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 100,
    },
    appointmentCard: {
        backgroundColor: palette.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.border,
        padding: 16,
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    tag: {
        backgroundColor: palette.tagBg,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    tagText: {
        color: palette.tagText,
        fontSize: 12,
        lineHeight: 16,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    countdownText: {
        color: palette.muted,
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodyMedium,
    },
    doctorRow: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    doctorAvatar: {
        width: 78,
        height: 78,
        borderRadius: 12,
        backgroundColor: '#5FA8A8',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    doctorTextWrap: {
        flex: 1,
    },
    doctorName: {
        color: palette.text,
        fontSize: 21,
        lineHeight: 26,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    specialtyText: {
        marginTop: 1,
        color: palette.muted,
        fontSize: 16,
        lineHeight: 22,
        fontFamily: fonts.bodyRegular,
    },
    videoRow: {
        marginTop: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    videoText: {
        marginLeft: 6,
        color: '#374151',
        fontSize: 13,
        lineHeight: 18,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    dateBox: {
        marginTop: 14,
        backgroundColor: palette.dateBox,
        borderRadius: 12,
        padding: 12,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateMain: {
        marginLeft: 8,
        color: palette.text,
        fontSize: 16,
        lineHeight: 22,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    dateSub: {
        marginTop: 2,
        color: palette.muted,
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodyRegular,
    },
    actionRow: {
        marginTop: 12,
        flexDirection: 'row',
        gap: 10,
    },
    primaryButton: {
        flex: 1,
        height: 54,
        borderRadius: 12,
        backgroundColor: palette.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#1D4ED8',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    primaryButtonPressed: {
        backgroundColor: palette.primaryPressed,
    },
    primaryButtonText: {
        marginLeft: 8,
        color: '#FFFFFF',
        fontSize: 17,
        lineHeight: 22,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    secondaryButton: {
        flex: 1,
        height: 54,
        borderRadius: 12,
        backgroundColor: palette.secondaryButton,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        marginLeft: 8,
        color: '#374151',
        fontSize: 17,
        lineHeight: 22,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    sectionHeader: {
        marginTop: 22,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionTitle: {
        color: palette.text,
        fontSize: 21,
        lineHeight: 26,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    viewAll: {
        color: palette.primary,
        fontSize: 17,
        lineHeight: 22,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    reminderCounter: {
        color: '#94A3B8',
        fontSize: 12,
        lineHeight: 16,
        fontFamily: fonts.bodyMedium,
    },
    reminderCard: {
        marginTop: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.surface,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
    },
    reminderCompleted: {
        opacity: 0.65,
    },
    checkbox: {
        width: 30,
        height: 30,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        backgroundColor: '#FFFFFF',
    },
    checkboxChecked: {
        backgroundColor: palette.primary,
        borderColor: palette.primary,
    },
    reminderTextWrap: {
        flex: 1,
    },
    reminderTitle: {
        color: palette.text,
        fontSize: 18,
        lineHeight: 23,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    reminderTitleDone: {
        textDecorationLine: 'line-through',
    },
    reminderSubtitle: {
        color: palette.muted,
        fontSize: 13,
        lineHeight: 18,
        fontFamily: fonts.bodyRegular,
    },
    syncText: {
        color: '#94A3B8',
        fontSize: 12,
        lineHeight: 16,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    vitalsGrid: {
        marginTop: 4,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 12,
    },
    vitalCard: {
        width: '48.5%',
        borderRadius: 16,
        borderWidth: 1,
        padding: 12,
    },
    vitalTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    vitalIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    vitalStatus: {
        fontSize: 12,
        lineHeight: 16,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    vitalValueRow: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    vitalValue: {
        color: palette.text,
        fontSize: 38,
        lineHeight: 36,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    vitalUnit: {
        marginLeft: 4,
        marginBottom: 4,
        color: palette.muted,
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodyMedium,
    },
    vitalLabel: {
        marginTop: 4,
        color: '#334155',
        fontSize: 15,
        lineHeight: 20,
        fontFamily: fonts.bodyMedium,
    },
    quickTitle: {
        marginTop: 24,
    },
    quickActionsRow: {
        paddingTop: 14,
        paddingBottom: 6,
        gap: 16,
    },
    quickAction: {
        alignItems: 'center',
        width: 110,
    },
    quickIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#D8DAF3',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    quickLabel: {
        textAlign: 'center',
        color: palette.text,
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
});
