import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '@/src/core/theme/tokens';
import { useAppointmentsQuery } from '@/src/features/appointments/hooks/useAppointmentsQuery';
import { useDoctorAlertsQuery } from '@/src/features/doctor/hooks/useDoctorAlertsQuery';
import { LoadingView } from '@/src/shared/components/LoadingView';
import AppIcon from '@/src/shared/components/AppIcon';

const palette = {
    background: '#F3F4F8',
    surface: '#FFFFFF',
    text: '#111827',
    muted: '#6B7280',
    border: '#E5E7EB',
    primary: '#1D4ED8',
    primarySoft: '#DBEAFE',
    danger: '#DC2626',
    dangerSoft: '#FEE2E2',
};

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'booking', label: 'New Bookings' },
    { key: 'emergency', label: 'Emergency Calls' },
];

const formatDateTime = (dateValue, timeValue) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
        return timeValue || 'Time TBD';
    }
    const dateText = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
    }).format(date);
    return `${dateText} • ${timeValue || 'Time TBD'}`;
};

const relativeTime = (dateValue) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
        return 'now';
    }
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 1) {
        return 'just now';
    }
    if (mins < 60) {
        return `${mins}m ago`;
    }
    const hours = Math.floor(mins / 60);
    if (hours < 24) {
        return `${hours}h ago`;
    }
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

export function DoctorNotificationsScreen() {
    const router = useRouter();
    const [filter, setFilter] = useState('all');
    const appointmentsQuery = useAppointmentsQuery('doctor');
    const alertsQuery = useDoctorAlertsQuery();

    const bookingItems = useMemo(() => {
        const appointments = appointmentsQuery.data ?? [];
        return appointments
            .filter((item) => item.status === 'scheduled' || item.status === 'confirmed')
            .map((item) => ({
                id: `booking-${item.id}`,
                kind: 'booking',
                createdAt: item.date,
                title: 'New Booking',
                headline: item.patientName,
                details: `${item.department} • ${formatDateTime(item.date, item.time)}`,
                patientId: item.patientId,
                appointmentId: item.id,
            }))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [appointmentsQuery.data]);

    const emergencyItems = useMemo(() => {
        const alerts = alertsQuery.data ?? [];
        return alerts
            .filter((alert) => {
                const text = `${alert.title ?? ''} ${alert.description ?? ''}`.toLowerCase();
                return alert.severity === 'high' || text.includes('emergency') || text.includes('critical');
            })
            .map((alert) => ({
                id: `emergency-${alert.id}`,
                kind: 'emergency',
                createdAt: alert.createdAt,
                title: 'Emergency Call',
                headline: alert.title || 'Critical patient event',
                details: alert.description || 'Immediate action required.',
                alertId: alert.id,
            }))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [alertsQuery.data]);

    const visibleItems = useMemo(() => {
        if (filter === 'booking') {
            return bookingItems;
        }
        if (filter === 'emergency') {
            return emergencyItems;
        }
        return [...emergencyItems, ...bookingItems].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }, [filter, bookingItems, emergencyItems]);

    if (appointmentsQuery.isLoading || alertsQuery.isLoading) {
        return (
            <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
                <LoadingView label="Loading notifications..." />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <Text style={styles.title}>Doctor Notifications</Text>
                    <Text style={styles.subtitle}>
                        Showing only new bookings and emergency calls.
                    </Text>

                    <View style={styles.filterRow}>
                        {FILTERS.map((item) => {
                            const active = filter === item.key;
                            return (
                                <Pressable
                                    accessibilityLabel={`Filter ${item.label}`}
                                    accessibilityRole="button"
                                    key={item.key}
                                    onPress={() => setFilter(item.key)}
                                    style={[styles.filterPill, active && styles.filterPillActive]}
                                >
                                    <Text style={[styles.filterText, active && styles.filterTextActive]}>
                                        {item.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    <View style={styles.list}>
                        {visibleItems.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyTitle}>No notifications</Text>
                                <Text style={styles.emptyBody}>
                                    No new bookings or emergency calls right now.
                                </Text>
                            </View>
                        ) : (
                            visibleItems.map((item) => {
                                const emergency = item.kind === 'emergency';
                                return (
                                    <Pressable
                                        accessibilityLabel={`Open ${item.title}`}
                                        accessibilityRole="button"
                                        key={item.id}
                                        onPress={() => {
                                            if (emergency) {
                                                router.push({
                                                    pathname: '/(app)/alert/[alertId]',
                                                    params: { alertId: item.alertId },
                                                });
                                                return;
                                            }
                                            if (item.patientId) {
                                                router.push({
                                                    pathname: '/(app)/(doctor)/patient/[patientId]',
                                                    params: { patientId: item.patientId },
                                                });
                                                return;
                                            }
                                            router.push('/(app)/(doctor)/schedule');
                                        }}
                                        style={styles.card}
                                    >
                                        <View
                                            style={[
                                                styles.iconWrap,
                                                emergency ? styles.iconWrapEmergency : styles.iconWrapBooking,
                                            ]}
                                        >
                                            <AppIcon
                                                color={emergency ? palette.danger : palette.primary}
                                                name={emergency ? 'call' : 'calendar-outline'}
                                                size={22}
                                            />
                                        </View>

                                        <View style={styles.cardBody}>
                                            <View style={styles.cardTopRow}>
                                                <Text
                                                    style={[
                                                        styles.kindLabel,
                                                        emergency ? styles.kindLabelEmergency : styles.kindLabelBooking,
                                                    ]}
                                                >
                                                    {item.title}
                                                </Text>
                                                <Text style={styles.timeText}>{relativeTime(item.createdAt)}</Text>
                                            </View>

                                            <Text style={styles.headline}>{item.headline}</Text>
                                            <Text style={styles.details}>{item.details}</Text>
                                        </View>
                                    </Pressable>
                                );
                            })
                        )}
                    </View>
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
    content: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 108,
    },
    title: {
        color: palette.text,
        fontSize: 26,
        lineHeight: 32,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    subtitle: {
        marginTop: 4,
        color: palette.muted,
        fontSize: 14,
        lineHeight: 19,
        fontFamily: fonts.bodyRegular,
    },
    filterRow: {
        marginTop: 14,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterPill: {
        borderRadius: 999,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    filterPillActive: {
        backgroundColor: '#E8EEFF',
        borderColor: '#BFD1FF',
    },
    filterText: {
        color: '#4B5563',
        fontSize: 13,
        lineHeight: 17,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    filterTextActive: {
        color: palette.primary,
    },
    list: {
        marginTop: 14,
        gap: 10,
    },
    emptyCard: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.surface,
        padding: 16,
    },
    emptyTitle: {
        color: palette.text,
        fontSize: 17,
        lineHeight: 22,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    emptyBody: {
        marginTop: 4,
        color: palette.muted,
        fontSize: 14,
        lineHeight: 19,
        fontFamily: fonts.bodyRegular,
    },
    card: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.surface,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    iconWrapBooking: {
        backgroundColor: palette.primarySoft,
    },
    iconWrapEmergency: {
        backgroundColor: palette.dangerSoft,
    },
    cardBody: {
        flex: 1,
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    kindLabel: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: 0.4,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    kindLabelBooking: {
        color: palette.primary,
    },
    kindLabelEmergency: {
        color: palette.danger,
    },
    timeText: {
        color: '#94A3B8',
        fontSize: 12,
        lineHeight: 16,
        fontFamily: fonts.bodyMedium,
    },
    headline: {
        marginTop: 4,
        color: palette.text,
        fontSize: 17,
        lineHeight: 22,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    details: {
        marginTop: 2,
        color: palette.muted,
        fontSize: 13,
        lineHeight: 18,
        fontFamily: fonts.bodyRegular,
    },
});

