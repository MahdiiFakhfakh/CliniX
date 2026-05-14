import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadows, spacing, typography } from '@/src/core/theme/tokens';
import { useAppointmentsQuery } from '@/src/features/appointments/hooks/useAppointmentsQuery';
import { useUpdateAppointmentMutation } from '@/src/features/appointments/hooks/useUpdateAppointmentMutation';
import { LoadingView } from '@/src/shared/components/LoadingView';
import AppIcon from '@/src/shared/components/AppIcon';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const statusStyle = {
    confirmed: { bg: colors.successSoft, text: colors.success, label: 'CONFIRMED' },
    scheduled: { bg: colors.primarySoft, text: colors.primary, label: 'SCHEDULED' },
    in_progress: { bg: colors.primarySoft, text: colors.primary, label: 'IN PROGRESS' },
    cancelled: { bg: colors.dangerSoft, text: colors.danger, label: 'CANCELLED' },
    completed: { bg: colors.surfaceTint, text: colors.textMuted, label: 'COMPLETED' },
};

const statusActions = {
    scheduled: [
        { status: 'confirmed', label: 'Confirm' },
        { status: 'cancelled', label: 'Cancel', danger: true },
    ],
    confirmed: [
        { status: 'in_progress', label: 'Start' },
        { status: 'cancelled', label: 'Cancel', danger: true },
    ],
    in_progress: [
        { status: 'completed', label: 'Complete' },
    ],
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
    const firstDayIndex = firstDay.getDay();
    const daysInMonth = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate();
    const totalCells = Math.max(35, Math.ceil((firstDayIndex + daysInMonth) / 7) * 7);
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - firstDayIndex);
    return Array.from({ length: totalCells }, (_, i) => {
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

function StatItem({ label, value }) {
    return (
        <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{value}</Text>
            <Text style={styles.heroStatLabel}>{label}</Text>
        </View>
    );
}

function AppointmentStatusActions({ appointment, disabled, onChange }) {
    const actions = statusActions[appointment.status] ?? [];

    if (actions.length === 0) {
        return null;
    }

    return (
        <View style={styles.statusActionsRow}>
            {actions.map((action) => (
                <Pressable
                    key={action.status}
                    accessibilityRole="button"
                    accessibilityLabel={`${action.label} appointment`}
                    disabled={disabled}
                    onPress={() => onChange(appointment, action.status)}
                    style={({ pressed }) => [
                        styles.statusActionButton,
                        action.danger && styles.statusActionButtonDanger,
                        (pressed || disabled) && { opacity: 0.7 },
                    ]}
                >
                    <Text style={[styles.statusActionText, action.danger && styles.statusActionTextDanger]}>
                        {action.label}
                    </Text>
                </Pressable>
            ))}
        </View>
    );
}

export function DoctorScheduleScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const appointmentsQuery = useAppointmentsQuery('doctor');
    const updateAppointmentMutation = useUpdateAppointmentMutation();
    const [view, setView] = useState('calendar');
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
    const [selectedDate, setSelectedDate] = useState(new Date());
    const appointments = appointmentsQuery.data ?? [];

    const appointmentsByDay = useMemo(() => {
        const map = new Map();
        appointments.forEach((appt) => {
            const date = new Date(appt.date);
            if (Number.isNaN(date.getTime())) return;
            const key = toDateKey(date);
            map.set(key, [...(map.get(key) ?? []), appt]);
        });
        return map;
    }, [appointments]);

    const calendarCells = useMemo(() => buildCalendarCells(currentMonth), [currentMonth]);
    const calendarRows = useMemo(() => {
        return Array.from({ length: Math.ceil(calendarCells.length / 7) }, (_, index) =>
            calendarCells.slice(index * 7, index * 7 + 7),
        );
    }, [calendarCells]);
    const selectedDayKey = toDateKey(selectedDate);
    const selectedDayAppointments = useMemo(
        () => sortByDate(appointmentsByDay.get(selectedDayKey) ?? []),
        [appointmentsByDay, selectedDayKey],
    );
    const dayListAppointments = useMemo(() => {
        return sortByDate(
            appointments.filter((item) => {
                const d = new Date(item.date);
                return !Number.isNaN(d.getTime()) && sameDay(d, selectedDate);
            }),
        );
    }, [appointments, selectedDate]);
    const todayAppointments = useMemo(() => {
        const today = new Date();
        return appointments.filter((item) => {
            const date = new Date(item.date);
            return !Number.isNaN(date.getTime()) && sameDay(date, today);
        }).length;
    }, [appointments]);
    const activeAppointments = appointments.filter((item) => !['cancelled', 'completed'].includes(item.status)).length;

    const handleStatusChange = async (appointment, status) => {
        try {
            await updateAppointmentMutation.mutateAsync({ id: appointment.id, status });
        }
        catch {
            // Error toasts are shown globally by query mutation cache.
        }
    };

    const handlePrev = () => {
        if (view === 'calendar') {
            const nextMonth = addMonths(currentMonth, -1);
            setCurrentMonth(nextMonth);
            setSelectedDate((previous) => {
                const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
                const day = sameMonth(previous, currentMonth) ? previous.getDate() : 1;
                return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), Math.min(day, lastDay));
            });
            return;
        }
        setSelectedDate((p) => { const n = new Date(p); n.setDate(n.getDate() - 1); setCurrentMonth(startOfMonth(n)); return n; });
    };
    const handleNext = () => {
        if (view === 'calendar') {
            const nextMonth = addMonths(currentMonth, 1);
            setCurrentMonth(nextMonth);
            setSelectedDate((previous) => {
                const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
                const day = sameMonth(previous, currentMonth) ? previous.getDate() : 1;
                return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), Math.min(day, lastDay));
            });
            return;
        }
        setSelectedDate((p) => { const n = new Date(p); n.setDate(n.getDate() + 1); setCurrentMonth(startOfMonth(n)); return n; });
    };

    if (appointmentsQuery.isLoading) {
        return (
            <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
                <LoadingView label="Loading schedule..." />
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
                <View style={styles.heroCard}>
                    <View style={styles.heroTopRow}>
                        <View style={styles.heroIcon}>
                            <AppIcon color="#FFFFFF" name="calendar-outline" size={27} />
                        </View>
                        <View style={styles.heroBadge}>
                            <AppIcon color={colors.primary} name="time-outline" size={15} />
                            <Text style={styles.heroBadgeText}>Doctor schedule</Text>
                        </View>
                    </View>

                    <Text style={styles.heroTitle}>Schedule</Text>
                    <Text style={styles.heroSubtitle}>Review consultations by month, day, or patient file.</Text>

                    <View style={styles.heroStatsRow}>
                        <StatItem label="Today" value={todayAppointments} />
                        <View style={styles.heroStatDivider} />
                        <StatItem label="Active" value={activeAppointments} />
                        <View style={styles.heroStatDivider} />
                        <StatItem label="Selected" value={selectedDayAppointments.length} />
                    </View>
                </View>

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
                                {WEEK_DAYS.map((d, index) => (
                                    <View key={d} style={[styles.weekCell, index === WEEK_DAYS.length - 1 && styles.lastColumnCell]}>
                                        <Text style={styles.weekText}>{d}</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={styles.gridWrap}>
                                {calendarRows.map((row, rowIndex) => (
                                    <View key={`week-${rowIndex}`} style={styles.calendarRow}>
                                        {row.map((date, columnIndex) => {
                                            const inMonth = sameMonth(date, currentMonth);
                                            const selected = sameDay(date, selectedDate);
                                            const key = toDateKey(date);
                                            const hasEvents = (appointmentsByDay.get(key) ?? []).length > 0;
                                            const isLastColumn = columnIndex === WEEK_DAYS.length - 1;
                                            return (
                                                <Pressable
                                                    key={key}
                                                    accessibilityRole="button"
                                                    accessibilityLabel={formatDateLabel(date)}
                                                    onPress={() => {
                                                        setSelectedDate(date);
                                                        if (!inMonth) setCurrentMonth(startOfMonth(date));
                                                    }}
                                                    style={[styles.dayCell, isLastColumn && styles.lastColumnCell]}
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
                                ))}
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
                                        <View key={appt.id} style={styles.eventRow}>
                                            <View style={styles.eventTop}>
                                                <View style={styles.eventMain}>
                                                    <Text style={styles.eventTime}>{appt.time}</Text>
                                                    <Text style={styles.eventName}>{appt.patientName}</Text>
                                                    <Text style={styles.eventMeta}>{appt.department}</Text>
                                                </View>
                                                <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
                                                    <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.eventActionsFooter}>
                                                <AppointmentStatusActions
                                                    appointment={appt}
                                                    disabled={updateAppointmentMutation.isPending}
                                                    onChange={handleStatusChange}
                                                />
                                                {appt.patientId ? (
                                                    <Pressable
                                                        accessibilityRole="button"
                                                        accessibilityLabel={`Open ${appt.patientName} file`}
                                                        onPress={() => router.push({ pathname: '/(app)/(doctor)/patient/[patientId]', params: { patientId: appt.patientId } })}
                                                        style={({ pressed }) => [styles.fileButton, pressed && { opacity: 0.75 }]}
                                                    >
                                                        <AppIcon color={colors.primary} name="folder-open" size={15} />
                                                        <Text style={styles.fileButtonText}>File</Text>
                                                    </Pressable>
                                                ) : null}
                                            </View>
                                        </View>
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
                                                <Text style={styles.listMeta}>{formatDateLabel(new Date(appt.date))} - {appt.time}</Text>
                                                <Text style={styles.listMeta}>{appt.department}</Text>
                                            </View>
                                            <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
                                                <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.eventActionsFooter}>
                                            <AppointmentStatusActions
                                                appointment={appt}
                                                disabled={updateAppointmentMutation.isPending}
                                                onChange={handleStatusChange}
                                            />
                                            {appt.patientId ? (
                                                <Pressable
                                                    accessibilityRole="button"
                                                    accessibilityLabel={`Open ${appt.patientName} file`}
                                                    onPress={() => router.push({ pathname: '/(app)/(doctor)/patient/[patientId]', params: { patientId: appt.patientId } })}
                                                    style={({ pressed }) => [styles.fileButton, pressed && { opacity: 0.75 }]}
                                                >
                                                    <AppIcon color={colors.primary} name="folder-open" size={15} />
                                                    <Text style={styles.fileButtonText}>File</Text>
                                                </Pressable>
                                            ) : null}
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
        backgroundColor: colors.primarySoft,
        borderWidth: 1,
        borderColor: colors.infoBorder,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: spacing.sm,
    },
    heroBadgeText: {
        color: colors.primary,
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
    heroStatsRow: {
        marginTop: spacing.md,
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
    toolbarRow: {
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...shadows.card,
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
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        height: 64,
        paddingHorizontal: spacing.xxs,
        flexDirection: 'row',
        alignItems: 'center',
        ...shadows.card,
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
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        ...shadows.card,
    },
    weekRow: {
        height: 42,
        flexDirection: 'row',
    },
    weekCell: {
        flex: 1,
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
        width: '100%',
    },
    calendarRow: {
        flexDirection: 'row',
    },
    dayCell: {
        flex: 1,
        aspectRatio: 1,
        borderRightWidth: 1,
        borderTopWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 5,
    },
    lastColumnCell: {
        borderRightWidth: 0,
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
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: spacing.sm,
        gap: spacing.xs,
        ...shadows.card,
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
        backgroundColor: colors.background,
        padding: spacing.sm,
        gap: spacing.sm,
    },
    eventTop: {
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
    eventActionsFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.xs,
        flexWrap: 'wrap',
    },
    statusActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        flexWrap: 'wrap',
        flex: 1,
    },
    statusActionButton: {
        minHeight: 34,
        borderRadius: radius.full,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.sm,
    },
    statusActionButtonDanger: {
        backgroundColor: colors.dangerSoft,
        borderWidth: 1,
        borderColor: colors.dangerBorder,
    },
    statusActionText: {
        color: '#FFFFFF',
        fontSize: typography.caption,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    statusActionTextDanger: {
        color: colors.danger,
    },
    fileButton: {
        minHeight: 34,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.infoBorder,
        backgroundColor: colors.primarySoft,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingHorizontal: spacing.sm,
    },
    fileButtonText: {
        color: colors.primary,
        fontSize: typography.caption,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    listWrap: {
        gap: spacing.xs,
    },
    listItem: {
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: spacing.sm,
        ...shadows.card,
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
