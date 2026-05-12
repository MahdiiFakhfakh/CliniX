import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing, typography } from '@/src/core/theme/tokens';
import { useAppointmentsQuery } from '@/src/features/appointments/hooks/useAppointmentsQuery';
import { LoadingView } from '@/src/shared/components/LoadingView';
import AppIcon from '@/src/shared/components/AppIcon';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const statusStyle = {
    confirmed: { bg: colors.successSoft, text: colors.success, label: 'CONFIRMED' },
    scheduled: { bg: colors.primarySoft, text: colors.primary, label: 'SCHEDULED' },
    in_progress: { bg: colors.primarySoft, text: colors.primary, label: 'IN PROGRESS' },
    cancelled: { bg: colors.dangerSoft, text: colors.danger, label: 'CANCELLED' },
    completed: { bg: colors.surfaceTint, text: colors.textMuted, label: 'COMPLETED' },
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const addMonths = (date, delta) => new Date(date.getFullYear(), date.getMonth() + delta, 1);
const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const sameMonth = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
const toDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};
const buildCalendarCells = (monthDate) => {
    const firstDay = startOfMonth(monthDate);
    const mondayIndex = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - mondayIndex);
    return Array.from({ length: 42 }, (_, i) => {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + i);
        return date;
    });
};
const formatMonthTitle = (date) =>
    new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
const formatDateLabel = (date) =>
    new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
const formatWeekday = (date) =>
    new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
const sortByDate = (items) =>
    [...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

export function DoctorScheduleScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const appointmentsQuery = useAppointmentsQuery('doctor');
    const [view, setView] = useState('calendar');
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
    const [selectedDate, setSelectedDate] = useState(new Date());

    const appointmentsByDay = useMemo(() => {
        const map = new Map();
        (appointmentsQuery.data ?? []).forEach((appt) => {
            const date = new Date(appt.date);
            if (Number.isNaN(date.getTime())) return;
            const key = toDateKey(date);
            map.set(key, [...(map.get(key) ?? []), appt]);
        });
        return map;
    }, [appointmentsQuery.data]);

    const calendarCells = useMemo(() => buildCalendarCells(currentMonth), [currentMonth]);
    const selectedDayKey = toDateKey(selectedDate);
    const selectedDayAppointments = useMemo(
        () => sortByDate(appointmentsByDay.get(selectedDayKey) ?? []),
        [appointmentsByDay, selectedDayKey],
    );
    const dayListAppointments = useMemo(() => {
        return sortByDate(
            (appointmentsQuery.data ?? []).filter((item) => {
                const d = new Date(item.date);
                return !Number.isNaN(d.getTime()) && sameDay(d, selectedDate);
            }),
        );
    }, [appointmentsQuery.data, selectedDate]);

    const handlePrev = () => {
        if (view === 'calendar') { setCurrentMonth((p) => addMonths(p, -1)); return; }
        setSelectedDate((p) => { const n = new Date(p); n.setDate(n.getDate() - 1); setCurrentMonth(startOfMonth(n)); return n; });
    };
    const handleNext = () => {
        if (view === 'calendar') { setCurrentMonth((p) => addMonths(p, 1)); return; }
        setSelectedDate((p) => { const n = new Date(p); n.setDate(n.getDate() + 1); setCurrentMonth(startOfMonth(n)); return n; });
    };

    if (appointmentsQuery.isLoading) {
        return (
            <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
                <LoadingView label="Loading schedule…" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
                refreshControl={
                    <RefreshControl
                        onRefresh={() => void appointmentsQuery.refetch()}
                        refreshing={appointmentsQuery.isRefetching}
                        tintColor={colors.primary}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Patients button + view toggle */}
                <View style={styles.toolbarRow}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="My Patients"
                        onPress={() => router.push('/(app)/(doctor)/patients')}
                        style={({ pressed }) => [styles.patientsButton, pressed && { opacity: 0.82 }]}
                    >
                        <AppIcon color={colors.primary} name="people-outline" size={18} />
                        <Text style={styles.patientsButtonText}>My Patients</Text>
                    </Pressable>

                    <View style={styles.modeToggle}>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="List view"
                            onPress={() => setView('list')}
                            style={[styles.modeBtn, view === 'list' && styles.modeBtnActive]}
                        >
                            <AppIcon
                                color={view === 'list' ? colors.text : colors.textMuted}
                                name="list-outline"
                                size={20}
                            />
                        </Pressable>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Calendar view"
                            onPress={() => setView('calendar')}
                            style={[styles.modeBtn, view === 'calendar' && styles.modeBtnActive]}
                        >
                            <AppIcon
                                color={view === 'calendar' ? colors.text : colors.textMuted}
                                name="calendar-outline"
                                size={20}
                            />
                        </Pressable>
                    </View>
                </View>

                {/* Month / day navigation */}
                <View style={styles.monthHeader}>
                    <Pressable onPress={handlePrev} style={styles.monthArrow} accessibilityRole="button" accessibilityLabel="Previous">
                        <AppIcon color={colors.textMuted} name="chevron-back" size={22} />
                    </Pressable>
                    <View style={styles.monthTextWrap}>
                        <Text style={styles.monthTitle}>
                            {view === 'calendar' ? formatMonthTitle(currentMonth) : formatDateLabel(selectedDate)}
                        </Text>
                        {view === 'list' ? (
                            <Text style={styles.monthSub}>{formatWeekday(selectedDate)}</Text>
                        ) : null}
                    </View>
                    <Pressable onPress={handleNext} style={styles.monthArrow} accessibilityRole="button" accessibilityLabel="Next">
                        <AppIcon color={colors.textMuted} name="chevron-forward" size={22} />
                    </Pressable>
                </View>

                {view === 'calendar' ? (
                    <>
                        {/* Calendar grid */}
                        <View style={styles.calendarCard}>
                            <View style={styles.weekRow}>
                                {WEEK_DAYS.map((d) => (
                                    <View key={d} style={styles.weekCell}>
                                        <Text style={styles.weekText}>{d}</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={styles.gridWrap}>
                                {calendarCells.map((date) => {
                                    const inMonth = sameMonth(date, currentMonth);
                                    const selected = sameDay(date, selectedDate);
                                    const key = toDateKey(date);
                                    const hasEvents = (appointmentsByDay.get(key) ?? []).length > 0;
                                    return (
                                        <Pressable
                                            key={key}
                                            accessibilityRole="button"
                                            accessibilityLabel={formatDateLabel(date)}
                                            onPress={() => {
                                                setSelectedDate(date);
                                                if (!inMonth) setCurrentMonth(startOfMonth(date));
                                            }}
                                            style={styles.dayCell}
                                        >
                                            {selected ? (
                                                <View style={styles.selectedBadge}>
                                                    <Text style={styles.selectedBadgeText}>{date.getDate()}</Text>
                                                </View>
                                            ) : (
                                                <Text style={[styles.dayText, !inMonth && styles.dayTextMuted]}>
                                                    {date.getDate()}
                                                </Text>
                                            )}
                                            {hasEvents ? <View style={styles.dot} /> : <View style={styles.dotSpacer} />}
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Day events */}
                        <View style={styles.dayPanel}>
                            <Text style={styles.dayPanelTitle}>{formatDateLabel(selectedDate)}</Text>
                            {selectedDayAppointments.length === 0 ? (
                                <Text style={styles.emptyText}>No appointments</Text>
                            ) : (
                                selectedDayAppointments.map((appt) => {
                                    const s = statusStyle[appt.status] ?? statusStyle.scheduled;
                                    return (
                                        <Pressable
                                            key={appt.id}
                                            accessibilityRole="button"
                                            accessibilityLabel={appt.patientName}
                                            onPress={() => {
                                                if (appt.patientId) {
                                                    router.push({ pathname: '/(app)/(doctor)/patient/[patientId]', params: { patientId: appt.patientId } });
                                                }
                                            }}
                                            style={({ pressed }) => [styles.eventRow, pressed && { opacity: 0.85 }]}
                                        >
                                            <View style={styles.eventMain}>
                                                <Text style={styles.eventTime}>{appt.time}</Text>
                                                <Text style={styles.eventName}>{appt.patientName}</Text>
                                                <Text style={styles.eventMeta}>{appt.department}</Text>
                                            </View>
                                            <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
                                                <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
                                            </View>
                                        </Pressable>
                                    );
                                })
                            )}
                        </View>
                    </>
                ) : (
                    <View style={styles.listWrap}>
                        {dayListAppointments.length === 0 ? (
                            <Text style={styles.emptyText}>No appointments for this day</Text>
                        ) : (
                            dayListAppointments.map((appt) => {
                                const s = statusStyle[appt.status] ?? statusStyle.scheduled;
                                return (
                                    <View key={appt.id} style={styles.listItem}>
                                        <View style={styles.listTop}>
                                            <View style={{ flex: 1, marginRight: spacing.xs }}>
                                                <Text style={styles.listName}>{appt.patientName}</Text>
                                                <Text style={styles.listMeta}>{formatDateLabel(new Date(appt.date))} · {appt.time}</Text>
                                                <Text style={styles.listMeta}>{appt.department}</Text>
                                            </View>
                                            <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
                                                <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        paddingBottom: 16,
    },
    toolbarRow: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    patientsButton: {
        height: 40,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.infoBorder,
        backgroundColor: colors.primarySoft,
        paddingHorizontal: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
    },
    patientsButtonText: {
        color: colors.primary,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    modeToggle: {
        height: 40,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceTint,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    modeBtn: {
        width: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modeBtnActive: {
        backgroundColor: colors.surface,
    },
    monthHeader: {
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        height: 64,
        paddingHorizontal: spacing.xxs,
        flexDirection: 'row',
        alignItems: 'center',
    },
    monthArrow: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    monthTextWrap: {
        flex: 1,
        alignItems: 'center',
    },
    monthTitle: {
        color: colors.text,
        fontSize: typography.heading,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    monthSub: {
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyRegular,
        marginTop: 1,
    },
    calendarCard: {
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderColor: colors.border,
    },
    weekRow: {
        height: 42,
        flexDirection: 'row',
    },
    weekCell: {
        width: '14.285714%',
        borderRightWidth: 1,
        borderTopWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    weekText: {
        color: colors.text,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    gridWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.285714%',
        aspectRatio: 1,
        borderRightWidth: 1,
        borderTopWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 5,
    },
    dayText: {
        color: colors.text,
        fontSize: typography.bodyLarge,
        fontFamily: fonts.bodyMedium,
    },
    dayTextMuted: {
        color: colors.disabled,
    },
    selectedBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedBadgeText: {
        color: '#fff',
        fontSize: typography.bodyLarge,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    dot: {
        marginTop: 3,
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: colors.primary,
    },
    dotSpacer: {
        marginTop: 3,
        width: 5,
        height: 5,
    },
    dayPanel: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        gap: spacing.xs,
    },
    dayPanelTitle: {
        color: colors.textMuted,
        fontSize: typography.bodyLarge,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    emptyText: {
        color: colors.textSubtle,
        fontSize: typography.body,
        fontFamily: fonts.bodyRegular,
        paddingVertical: spacing.sm,
    },
    eventRow: {
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: spacing.sm,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    eventMain: {
        flex: 1,
        marginRight: spacing.xs,
    },
    eventTime: {
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    eventName: {
        marginTop: 2,
        color: colors.text,
        fontSize: typography.bodyLarge,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    eventMeta: {
        marginTop: 2,
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyRegular,
    },
    statusPill: {
        borderRadius: radius.full,
        paddingHorizontal: spacing.xs,
        paddingVertical: 4,
    },
    statusText: {
        fontSize: typography.caption,
        letterSpacing: 0.3,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    listWrap: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        gap: spacing.xs,
    },
    listItem: {
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: spacing.sm,
    },
    listTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    listName: {
        color: colors.text,
        fontSize: typography.bodyLarge,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    listMeta: {
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyRegular,
        marginTop: 2,
    },
});
