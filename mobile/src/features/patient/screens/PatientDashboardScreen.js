import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '@/src/core/theme/tokens';
import { useAppointmentsQuery } from '@/src/features/appointments/hooks/useAppointmentsQuery';
import { isUpcomingAppointment, sortAppointmentsAscending } from '@/src/features/appointments/utils/appointmentDates';
import { remindersStore } from '@/src/features/patient/remindersStore';
import AppIcon from '@/src/shared/components/AppIcon';

const QUICK_ACTIONS = [
    { id: 'book', label: 'Book Appt', icon: 'add-circle', path: '/(app)/(patient)/book-appointment' },
    { id: 'chat', label: 'Health Chat', icon: 'chatbubble-ellipses', path: '/(app)/(patient)/chat' },
    { id: 'vitals', label: 'Detailed Vitals', icon: 'stats-chart', path: '/(app)/(patient)/results' },
    { id: 'reminders', label: 'Reminders', icon: 'notifications', path: '/(app)/(patient)/reminders' },
];

const formatDateLabel = (isoDate) => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
        return 'Today';
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
        return 'Upcoming';
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
    const insets = useSafeAreaInsets();

    const [reminders, setReminders] = useState(remindersStore.get());
    const [showAddReminder, setShowAddReminder] = useState(false);
    const [reminderTitle, setReminderTitle] = useState('');
    const [reminderTime, setReminderTime] = useState('');

    useEffect(() => {
        void remindersStore.hydrate();
        return remindersStore.subscribe(setReminders);
    }, []);

    const nextAppointment = useMemo(() => {
        const upcomingAppointments = sortAppointmentsAscending(
            (appointmentsQuery.data ?? []).filter((appointment) => isUpcomingAppointment(appointment)),
        );
        const next = upcomingAppointments[0];
        if (!next) return null;
        return {
            doctorName: next.doctorName ?? 'Unknown Doctor',
            specialty: `${next.department ?? 'General'} Specialist`,
            date: next.date ?? new Date().toISOString(),
            time: next.time ?? '',
            countdown: next.date ? buildCountdown(next.date) : 'Upcoming',
        };
    }, [appointmentsQuery.data]);

    const todayReminders = useMemo(
        () => [...reminders.morning, ...reminders.afternoon].filter((item) => item.bucket === 'today'),
        [reminders],
    );

    const addQuickReminder = () => {
        if (!reminderTitle.trim()) return;

        remindersStore.add({
            title: reminderTitle.trim(),
            subtitle: reminderTime.trim() ? `${reminderTime.trim()} - Quick reminder` : 'Today',
            icon: 'notifications-outline',
            type: 'vitamin',
            slot: 'morning',
            primaryAction: 'Mark Done',
        });
        setReminderTitle('');
        setReminderTime('');
        setShowAddReminder(false);
    };

    const completeReminder = (item) => {
        const current = remindersStore.get();
        const source = current[item.section] ?? [];
        remindersStore.set({
            ...current,
            [item.section]: source.filter((entry) => entry.id !== item.id),
            completed: [
                {
                    id: `${item.id}-done`,
                    title: item.title,
                    subtitle: item.subtitle,
                    type: item.type,
                    status: 'done',
                },
                ...current.completed,
            ],
        });
    };

    return (
        <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
            <View style={styles.container}>
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
                    showsVerticalScrollIndicator={false}
                >
                    {nextAppointment ? (
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
                                </View>
                            </View>

                            <View style={styles.dateBox}>
                                <View style={styles.dateRow}>
                                    <AppIcon color={colors.primary} name="calendar-outline" size={22} />
                                    <Text style={styles.dateMain}>{formatDateLabel(nextAppointment.date)}</Text>
                                </View>
                                <Text style={styles.dateSub}>{nextAppointment.time || 'Time to be confirmed'}</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.appointmentCard}>
                            <View style={styles.tag}>
                                <Text style={styles.tagText}>NEXT APPOINTMENT</Text>
                            </View>
                            <View style={styles.emptyAppointment}>
                                <AppIcon color={colors.textMuted} name="calendar-outline" size={36} />
                                <Text style={styles.emptyAppointmentTitle}>No upcoming appointments</Text>
                                <Text style={styles.emptyAppointmentSub}>Book an appointment to get started.</Text>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Book an appointment"
                                    onPress={() => router.push('/(app)/(patient)/book-appointment')}
                                    style={({ pressed }) => [styles.primaryButton, styles.bookButton, pressed && styles.primaryButtonPressed]}
                                >
                                    <AppIcon color="#FFFFFF" name="add-circle" size={18} />
                                    <Text style={styles.primaryButtonText}>Book Appointment</Text>
                                </Pressable>
                            </View>
                        </View>
                    )}

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Today's Reminders</Text>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Add reminder"
                            onPress={() => setShowAddReminder(true)}
                            style={styles.addReminderButton}
                        >
                            <AppIcon color={colors.primary} name="add-circle" size={20} />
                            <Text style={styles.addReminderText}>Add</Text>
                        </Pressable>
                    </View>

                    {todayReminders.length > 0 ? (
                        <>
                            <Text style={styles.reminderCounter}>{todayReminders.length} pending</Text>
                            {todayReminders.slice(0, 3).map((item) => (
                                <View key={item.id} style={styles.reminderCard}>
                                    <Pressable
                                        accessibilityRole="checkbox"
                                        accessibilityState={{ checked: false }}
                                        accessibilityLabel={`Mark ${item.title} done`}
                                        onPress={() => completeReminder(item)}
                                        style={styles.checkbox}
                                    >
                                        <AppIcon color="#CBD5E1" name="checkmark" size={15} />
                                    </Pressable>
                                    <View style={styles.reminderTextWrap}>
                                        <Text style={styles.reminderTitle}>{item.title}</Text>
                                        <Text style={styles.reminderSubtitle}>{item.subtitle}</Text>
                                    </View>
                                    <AppIcon color="#9CA3AF" name={item.icon ?? 'notifications-outline'} size={22} />
                                </View>
                            ))}
                            {todayReminders.length > 3 ? (
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Open all reminders"
                                    onPress={() => router.push('/(app)/(patient)/reminders')}
                                    style={({ pressed }) => [styles.viewRemindersButton, pressed && { opacity: 0.72 }]}
                                >
                                    <Text style={styles.viewRemindersText}>View all reminders</Text>
                                    <AppIcon color={colors.primary} name="chevron-forward" size={18} />
                                </Pressable>
                            ) : null}
                        </>
                    ) : (
                        <View style={styles.emptyReminders}>
                            <AppIcon color={colors.textMuted} name="notifications-outline" size={32} />
                            <Text style={styles.emptyRemindersText}>No reminders for today</Text>
                        </View>
                    )}

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
                                    <AppIcon color={colors.primary} name={action.icon} size={24} />
                                </View>
                                <Text style={styles.quickLabel}>{action.label}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </ScrollView>
            </View>

            <Modal
                animationType="slide"
                transparent
                visible={showAddReminder}
                onRequestClose={() => setShowAddReminder(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setShowAddReminder(false)}>
                    <Pressable style={styles.modalSheet} onPress={() => {}}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>New Reminder</Text>

                        <Text style={styles.modalLabel}>Title</Text>
                        <TextInput
                            autoFocus
                            onChangeText={setReminderTitle}
                            placeholder="e.g. Take medication"
                            placeholderTextColor="#9CA3AF"
                            style={styles.modalInput}
                            value={reminderTitle}
                        />

                        <Text style={styles.modalLabel}>
                            Time <Text style={styles.modalOptional}>(optional)</Text>
                        </Text>
                        <TextInput
                            onChangeText={setReminderTime}
                            placeholder="e.g. 8:00 AM"
                            placeholderTextColor="#9CA3AF"
                            style={styles.modalInput}
                            value={reminderTime}
                        />

                        <View style={styles.modalActions}>
                            <Pressable onPress={() => setShowAddReminder(false)} style={styles.modalCancelButton}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                disabled={!reminderTitle.trim()}
                                onPress={addQuickReminder}
                                style={[styles.modalSaveButton, !reminderTitle.trim() && styles.modalSaveDisabled]}
                            >
                                <Text style={styles.modalSaveText}>Add Reminder</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

export const PatientDashboardScreen = PatientHomeScreen;

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
        paddingTop: 16,
        paddingBottom: 16,
    },
    appointmentCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
    },
    emptyAppointment: {
        alignItems: 'center',
        paddingVertical: 20,
        gap: 6,
    },
    emptyAppointmentTitle: {
        color: colors.text,
        fontSize: 17,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
        marginTop: 8,
    },
    emptyAppointmentSub: {
        color: colors.textMuted,
        fontSize: 14,
        fontFamily: fonts.bodyRegular,
        marginBottom: 8,
    },
    bookButton: {
        paddingHorizontal: 24,
        flex: 0,
        width: '100%',
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    tag: {
        backgroundColor: colors.primarySoft,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    tagText: {
        color: colors.primary,
        fontSize: 12,
        lineHeight: 16,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    countdownText: {
        color: colors.textMuted,
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
        color: colors.text,
        fontSize: 21,
        lineHeight: 26,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    specialtyText: {
        marginTop: 1,
        color: colors.textMuted,
        fontSize: 16,
        lineHeight: 22,
        fontFamily: fonts.bodyRegular,
    },
    dateBox: {
        marginTop: 14,
        backgroundColor: colors.surfaceTint,
        borderRadius: 12,
        padding: 12,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateMain: {
        marginLeft: 8,
        color: colors.text,
        fontSize: 16,
        lineHeight: 22,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    dateSub: {
        marginTop: 2,
        color: colors.textMuted,
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodyRegular,
    },
    primaryButton: {
        flex: 1,
        height: 54,
        borderRadius: 12,
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    primaryButtonPressed: {
        backgroundColor: colors.primaryMid,
    },
    primaryButtonText: {
        marginLeft: 8,
        color: '#FFFFFF',
        fontSize: 17,
        lineHeight: 22,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    sectionHeader: {
        marginTop: 22,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionTitle: {
        color: colors.text,
        fontSize: 21,
        lineHeight: 26,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    emptyReminders: {
        alignItems: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    emptyRemindersText: {
        color: colors.textMuted,
        fontSize: 15,
        fontFamily: fonts.bodyRegular,
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
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
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
    reminderTextWrap: {
        flex: 1,
    },
    reminderTitle: {
        color: colors.text,
        fontSize: 18,
        lineHeight: 23,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    reminderSubtitle: {
        color: colors.textMuted,
        fontSize: 13,
        lineHeight: 18,
        fontFamily: fonts.bodyRegular,
    },
    viewRemindersButton: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 8,
    },
    viewRemindersText: {
        color: colors.primary,
        fontSize: 14,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    addReminderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    addReminderText: {
        color: colors.primary,
        fontSize: 15,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E5E7EB',
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 20,
    },
    modalLabel: {
        fontSize: 14,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
    },
    modalOptional: {
        fontSize: 13,
        fontFamily: fonts.bodyRegular,
        fontWeight: '400',
        color: '#9CA3AF',
    },
    modalInput: {
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F5F6FA',
        paddingHorizontal: 18,
        fontSize: 15,
        fontFamily: fonts.bodyRegular,
        color: colors.text,
        marginBottom: 16,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    modalCancelButton: {
        flex: 1,
        height: 52,
        borderRadius: 26,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCancelText: {
        fontSize: 15,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
        color: colors.textMuted,
    },
    modalSaveButton: {
        flex: 1,
        height: 52,
        borderRadius: 26,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalSaveDisabled: {
        backgroundColor: colors.disabled,
    },
    modalSaveText: {
        fontSize: 15,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
        color: '#FFFFFF',
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
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    quickLabel: {
        textAlign: 'center',
        color: colors.text,
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
});
