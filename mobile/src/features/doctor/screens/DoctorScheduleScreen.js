import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '@/src/core/theme/tokens';
import { useAppointmentsQuery } from '@/src/features/appointments/hooks/useAppointmentsQuery';
import { LoadingView } from '@/src/shared/components/LoadingView';
import AppIcon from '@/src/shared/components/AppIcon';

const palette = {
    background: '#F3F4F8',
    surface: '#FFFFFF',
    text: '#111827',
    muted: '#6B7280',
    subtle: '#9CA3AF',
    border: '#D9DCE3',
    primary: '#2563EB',
    highlight: '#EF4444',
};

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const statusStyle = {
    confirmed: { bg: '#DCFCE7', text: '#15803D', label: 'CONFIRMED' },
    scheduled: { bg: '#DBEAFE', text: '#1D4ED8', label: 'SCHEDULED' },
    in_progress: { bg: '#DBEAFE', text: '#1D4ED8', label: 'IN PROGRESS' },
    cancelled: { bg: '#FEE2E2', text: '#B91C1C', label: 'CANCELLED' },
    completed: { bg: '#E5E7EB', text: '#475569', label: 'COMPLETED' },
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date, delta) => new Date(date.getFullYear(), date.getMonth() + delta, 1);

const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

const sameMonth = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth();

const toDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const buildCalendarCells = (monthDate) => {
    const firstDay = startOfMonth(monthDate);
    const mondayIndex = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - mondayIndex);

    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + index);
        return date;
    });
};

const formatMonthTitle = (date) =>
    new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
    }).format(date);

const formatSelectedDate = (date) =>
    new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(date);

const formatWeekday = (date) =>
    new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
    }).format(date);

const formatClockLabel = () =>
    new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    })
        .format(new Date())
        .toLowerCase();

const formatTimezoneLabel = () => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'local';
    const tail = timeZone.split('/').pop() || timeZone;
    return tail.replace(/_/g, ' ');
};

const sortByDateTime = (items) =>
    [...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

export function DoctorScheduleScreen() {
    const router = useRouter();
    const appointmentsQuery = useAppointmentsQuery('doctor');
    const [view, setView] = useState('calendar');
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
    const [selectedDate, setSelectedDate] = useState(new Date());

    const appointmentsByDay = useMemo(() => {
        const map = new Map();
        (appointmentsQuery.data ?? []).forEach((appointment) => {
            const date = new Date(appointment.date);
            if (Number.isNaN(date.getTime())) {
                return;
            }
            const key = toDateKey(date);
            const current = map.get(key) ?? [];
            current.push(appointment);
            map.set(key, current);
        });
        return map;
    }, [appointmentsQuery.data]);

    const calendarCells = useMemo(() => buildCalendarCells(currentMonth), [currentMonth]);

    const selectedDayKey = toDateKey(selectedDate);

    const selectedDayAppointments = useMemo(
        () => sortByDateTime(appointmentsByDay.get(selectedDayKey) ?? []),
        [appointmentsByDay, selectedDayKey],
    );

    const dayListAppointments = useMemo(() => {
        const items = appointmentsQuery.data ?? [];
        return sortByDateTime(
            items.filter((item) => {
                const date = new Date(item.date);
                return !Number.isNaN(date.getTime()) && sameDay(date, selectedDate);
            }),
        );
    }, [appointmentsQuery.data, selectedDate]);

    const headerTitle = view === 'calendar' ? formatMonthTitle(currentMonth) : formatSelectedDate(selectedDate);
    const headerSub =
        view === 'calendar'
            ? `${formatClockLabel()} ${formatTimezoneLabel()} time`
            : `${formatWeekday(selectedDate)} - ${formatClockLabel()} ${formatTimezoneLabel()} time`;

    const handlePrevious = () => {
        if (view === 'calendar') {
            setCurrentMonth((prev) => addMonths(prev, -1));
            return;
        }
        setSelectedDate((prev) => {
            const next = new Date(prev);
            next.setDate(next.getDate() - 1);
            setCurrentMonth(startOfMonth(next));
            return next;
        });
    };

    const handleNext = () => {
        if (view === 'calendar') {
            setCurrentMonth((prev) => addMonths(prev, 1));
            return;
        }
        setSelectedDate((prev) => {
            const next = new Date(prev);
            next.setDate(next.getDate() + 1);
            setCurrentMonth(startOfMonth(next));
            return next;
        });
    };

    if (appointmentsQuery.isLoading) {
        return (
            <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
                <LoadingView label="Loading schedule..." />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        onRefresh={() => void appointmentsQuery.refetch()}
                        refreshing={appointmentsQuery.isRefetching}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.toolbarRow}>
                    <Pressable
                        accessibilityLabel="Jump to today"
                        accessibilityRole="button"
                        onPress={() => {
                            const today = new Date();
                            setSelectedDate(today);
                            setCurrentMonth(startOfMonth(today));
                        }}
                        style={styles.todayChip}
                    >
                        <Text style={styles.todayText}>Today</Text>
                    </Pressable>

                    <View style={styles.modeToggle}>
                        <Pressable
                            accessibilityLabel="List schedule view"
                            accessibilityRole="button"
                            onPress={() => setView('list')}
                            style={[styles.modeButton, view === 'list' && styles.modeButtonActive]}
                        >
                            <AppIcon
                                color={view === 'list' ? palette.text : '#9CA3AF'}
                                name="format-list-bulleted"
                                size={24}
                            />
                        </Pressable>
                        <Pressable
                            accessibilityLabel="Calendar schedule view"
                            accessibilityRole="button"
                            onPress={() => setView('calendar')}
                            style={[styles.modeButton, view === 'calendar' && styles.modeButtonActive]}
                        >
                            <AppIcon
                                color={view === 'calendar' ? palette.text : '#9CA3AF'}
                                name="calendar-month"
                                size={24}
                            />
                        </Pressable>
                    </View>
                </View>

                <View style={styles.monthHeader}>
                    <Pressable
                        accessibilityLabel={view === 'calendar' ? 'Previous month' : 'Previous day'}
                        accessibilityRole="button"
                        onPress={handlePrevious}
                        style={styles.monthArrow}
                    >
                        <AppIcon color="#7C8492" name="chevron-back" size={24} />
                    </Pressable>

                    <View style={styles.monthTextWrap}>
                        <Text style={styles.monthTitle}>{headerTitle}</Text>
                        <Text style={styles.monthSub}>{headerSub}</Text>
                    </View>

                    <Pressable
                        accessibilityLabel={view === 'calendar' ? 'Next month' : 'Next day'}
                        accessibilityRole="button"
                        onPress={handleNext}
                        style={styles.monthArrow}
                    >
                        <AppIcon color="#7C8492" name="chevron-forward" size={24} />
                    </Pressable>
                </View>

                {view === 'calendar' ? (
                    <>
                        <View style={styles.calendarCard}>
                            <View style={styles.weekRow}>
                                {WEEK_DAYS.map((day) => (
                                    <View key={day} style={styles.weekCell}>
                                        <Text style={styles.weekText}>{day}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.gridWrap}>
                                {calendarCells.map((date) => {
                                    const inMonth = sameMonth(date, currentMonth);
                                    const selected = sameDay(date, selectedDate);
                                    const dateKey = toDateKey(date);
                                    const hasEvents = (appointmentsByDay.get(dateKey) ?? []).length > 0;

                                    return (
                                        <Pressable
                                            accessibilityLabel={`Select ${formatSelectedDate(date)}`}
                                            accessibilityRole="button"
                                            key={dateKey}
                                            onPress={() => {
                                                setSelectedDate(date);
                                                if (!inMonth) {
                                                    setCurrentMonth(startOfMonth(date));
                                                }
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

                        <View style={styles.dayPanel}>
                            <Text style={styles.dayPanelTitle}>{formatSelectedDate(selectedDate)}</Text>
                            {selectedDayAppointments.length === 0 ? (
                                <Text style={styles.dayPanelEmpty}>No events</Text>
                            ) : (
                                selectedDayAppointments.map((appointment) => {
                                    const style = statusStyle[appointment.status] ?? statusStyle.scheduled;
                                    return (
                                        <Pressable
                                            accessibilityLabel={`Open ${appointment.patientName} details`}
                                            accessibilityRole="button"
                                            key={appointment.id}
                                            onPress={() => {
                                                if (appointment.patientId) {
                                                    router.push({
                                                        pathname: '/(app)/(doctor)/patient/[patientId]',
                                                        params: { patientId: appointment.patientId },
                                                    });
                                                }
                                            }}
                                            style={styles.eventRow}
                                        >
                                            <View style={styles.eventMain}>
                                                <Text style={styles.eventTime}>{appointment.time}</Text>
                                                <Text style={styles.eventName}>{appointment.patientName}</Text>
                                                <Text style={styles.eventMeta}>{appointment.department}</Text>
                                            </View>
                                            <View style={[styles.eventStatus, { backgroundColor: style.bg }]}>
                                                <Text style={[styles.eventStatusText, { color: style.text }]}>
                                                    {style.label}
                                                </Text>
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
                            <Text style={styles.dayPanelEmpty}>No events for this day</Text>
                        ) : (
                            dayListAppointments.map((appointment) => {
                                const style = statusStyle[appointment.status] ?? statusStyle.scheduled;
                                return (
                                    <View key={appointment.id} style={styles.listItem}>
                                        <View style={styles.listTop}>
                                            <View>
                                                <Text style={styles.listName}>{appointment.patientName}</Text>
                                                <Text style={styles.listMeta}>
                                                    {formatSelectedDate(new Date(appointment.date))} - {appointment.time}
                                                </Text>
                                            </View>
                                            <View style={[styles.eventStatus, { backgroundColor: style.bg }]}> 
                                                <Text style={[styles.eventStatusText, { color: style.text }]}>
                                                    {style.label}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={styles.listDepartment}>{appointment.department}</Text>
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
        backgroundColor: palette.background,
    },
    content: {
        paddingTop: 10,
        paddingBottom: 98,
    },
    toolbarRow: {
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    todayChip: {
        minWidth: 88,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    todayText: {
        color: '#757D88',
        fontSize: 16,
        lineHeight: 20,
        fontFamily: fonts.bodyMedium,
    },
    modeToggle: {
        height: 44,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: '#E5E7EB',
        flexDirection: 'row',
    },
    modeButton: {
        width: 52,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modeButtonActive: {
        backgroundColor: '#FFFFFF',
    },
    monthHeader: {
        marginTop: 8,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: palette.border,
        backgroundColor: '#FFFFFF',
        height: 72,
        paddingHorizontal: 4,
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        maxWidth: '100%',
        alignSelf: 'stretch',
    },
    monthArrow: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    monthTextWrap: {
        flex: 1,
        alignItems: 'center',
    },
    monthTitle: {
        color: palette.text,
        fontSize: 21,
        lineHeight: 26,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    monthSub: {
        marginTop: 0,
        color: '#838B95',
        fontSize: 16,
        lineHeight: 21,
        fontFamily: fonts.bodyRegular,
    },
    calendarCard: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: palette.border,
        width: '100%',
        maxWidth: '100%',
        alignSelf: 'stretch',
        overflow: 'hidden',
    },
    weekRow: {
        height: 46,
        flexDirection: 'row',
        width: '100%',
    },
    weekCell: {
        width: '14.285714%',
        borderRightWidth: 1,
        borderTopWidth: 1,
        borderColor: palette.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    weekText: {
        color: '#1F2937',
        fontSize: 15,
        lineHeight: 22,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    gridWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: '100%',
    },
    dayCell: {
        width: '14.285714%',
        aspectRatio: 1,
        borderRightWidth: 1,
        borderTopWidth: 1,
        borderColor: palette.border,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 6,
    },
    dayText: {
        color: '#1F2937',
        fontSize: 18,
        lineHeight: 26,
        fontFamily: fonts.bodyMedium,
    },
    dayTextMuted: {
        color: '#A1A1AA',
    },
    selectedBadge: {
        minWidth: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: palette.highlight,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    selectedBadgeText: {
        color: '#FFFFFF',
        fontSize: 18,
        lineHeight: 22,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    dot: {
        marginTop: 5,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: palette.primary,
    },
    dotSpacer: {
        marginTop: 5,
        width: 6,
        height: 6,
    },
    dayPanel: {
        paddingHorizontal: 18,
        paddingTop: 0,
        gap: 10,
    },
    dayPanelTitle: {
        color: '#6B7280',
        fontSize: 20,
        lineHeight: 29,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    dayPanelEmpty: {
        color: '#8B929D',
        fontSize: 19,
        lineHeight: 32,
        fontFamily: fonts.bodyRegular,
    },
    eventRow: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: '#FFFFFF',
        padding: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    eventMain: {
        flex: 1,
        marginRight: 12,
    },
    eventTime: {
        color: '#4B5563',
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    eventName: {
        marginTop: 2,
        color: palette.text,
        fontSize: 17,
        lineHeight: 22,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    eventMeta: {
        marginTop: 2,
        color: palette.muted,
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodyRegular,
    },
    eventStatus: {
        borderRadius: 12,
        paddingHorizontal: 9,
        paddingVertical: 6,
    },
    eventStatusText: {
        fontSize: 11,
        lineHeight: 14,
        letterSpacing: 0.4,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    listWrap: {
        paddingHorizontal: 16,
        paddingTop: 16,
        gap: 12,
    },
    listItem: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: '#FFFFFF',
        padding: 14,
    },
    listTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 10,
    },
    listName: {
        color: palette.text,
        fontSize: 18,
        lineHeight: 24,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    listMeta: {
        color: palette.muted,
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodyRegular,
        marginTop: 2,
    },
    listDepartment: {
        marginTop: 8,
        color: '#4B5563',
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodyMedium,
    },
});
