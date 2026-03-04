import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '@/src/core/theme/tokens';
import { useAppointmentsQuery } from '@/src/features/appointments/hooks/useAppointmentsQuery';
import { useCancelAppointmentMutation } from '@/src/features/appointments/hooks/useCancelAppointmentMutation';
import { LoadingView } from '@/src/shared/components/LoadingView';
import AppIcon from '@/src/shared/components/AppIcon';

const palette = {
    background: '#F3F4F8',
    surface: '#FFFFFF',
    primary: '#1D4ED8',
    primaryPressed: '#1E40AF',
    text: '#111827',
    muted: '#6366A1',
    border: '#D1D5DB',
    danger: '#EF4444',
};

const formatDateLabel = (isoDate) => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
        return 'Monday, Oct 24';
    }
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'short',
        day: '2-digit',
    }).format(date);
};

export function AppointmentDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const appointmentId = typeof params.appointmentId === 'string' ? params.appointmentId : '';

    const appointmentsQuery = useAppointmentsQuery('patient');
    const cancelMutation = useCancelAppointmentMutation();

    const appointment = appointmentsQuery.data?.find((item) => item.id === appointmentId);

    const handleCancelAppointment = async () => {
        if (!appointmentId) {
            return;
        }
        try {
            await cancelMutation.mutateAsync(appointmentId);
            Alert.alert('Appointment cancelled', 'The appointment has been cancelled successfully.');
            router.back();
        } catch {
            Alert.alert('Unable to cancel', 'Please try again.');
        }
    };

    if (appointmentsQuery.isLoading) {
        return (
            <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
                <LoadingView label="Loading appointment details..." />
            </SafeAreaView>
        );
    }

    if (!appointment) {
        return (
            <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
                <View style={styles.emptyWrap}>
                    <Text style={styles.emptyTitle}>Appointment not found</Text>
                    <Pressable onPress={() => router.back()} style={styles.backButtonSimple}>
                        <Text style={styles.backButtonSimpleText}>Go Back</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    const reasonText =
        appointment.reason && appointment.reason.trim().length > 0
            ? appointment.reason
            : 'Follow-up consultation regarding recent lab results.';

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
                        <AppIcon color={palette.text} name="chevron-back" size={30} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Appointment Details</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.profileWrap}>
                        <View style={styles.avatarWrap}>
                            <AppIcon color="#64748B" name="person" size={74} />
                            <View style={styles.onlineDot} />
                        </View>
                        <Text style={styles.doctorName}>{appointment.doctorName}</Text>
                        <Text style={styles.specialtyText}>Senior {appointment.department}</Text>
                        <View style={styles.locationRow}>
                            <AppIcon color={palette.muted} name="location" size={16} />
                            <Text style={styles.locationText}>CliniX Medical Center, NY</Text>
                        </View>
                    </View>

                    <View style={styles.dateCard}>
                        <View style={styles.dateIconWrap}>
                            <AppIcon color={palette.primary} name="calendar-outline" size={24} />
                        </View>
                        <View>
                            <Text style={styles.dateTitle}>{formatDateLabel(appointment.date)}</Text>
                            <Text style={styles.dateSubtitle}>
                                {appointment.time} - 11:00 AM (30 min)
                            </Text>
                        </View>
                    </View>

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Join online consultation"
                        onPress={() => router.push('/(app)/(patient)/video')}
                        style={({ pressed }) => [
                            styles.primaryAction,
                            pressed && { backgroundColor: palette.primaryPressed },
                        ]}
                    >
                        <AppIcon color="#FFFFFF" name="videocam" size={22} />
                        <Text style={styles.primaryActionText}>Join Online Consultation</Text>
                    </Pressable>

                    <Text style={styles.sectionTitle}>Reason for Visit</Text>
                    <View style={styles.reasonCard}>
                        <Text style={styles.reasonText}>{reasonText}</Text>
                    </View>

                    <View style={styles.mapMock}>
                        <View style={styles.mapWater} />
                        <View style={styles.mapRoadA} />
                        <View style={styles.mapRoadB} />
                        <Text style={styles.mapText}>New York</Text>
                    </View>

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Reschedule appointment"
                        onPress={() => router.push('/(app)/(patient)/book-appointment')}
                        style={styles.secondaryAction}
                    >
                        <AppIcon color={palette.primary} name="calendar-number-outline" size={24} />
                        <Text style={styles.secondaryActionText}>Reschedule</Text>
                    </Pressable>

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Cancel appointment"
                        onPress={handleCancelAppointment}
                        style={styles.cancelAction}
                    >
                        <AppIcon color={palette.danger} name="close-circle" size={24} />
                        <Text style={styles.cancelActionText}>Cancel Appointment</Text>
                    </Pressable>
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
        fontSize: 22,
        lineHeight: 28,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    headerSpacer: {
        width: 46,
        height: 46,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 120,
    },
    profileWrap: {
        alignItems: 'center',
        marginTop: 22,
    },
    avatarWrap: {
        width: 186,
        height: 186,
        borderRadius: 93,
        borderWidth: 6,
        borderColor: '#D8DAF3',
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    onlineDot: {
        position: 'absolute',
        right: 12,
        bottom: 18,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#22C55E',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    doctorName: {
        marginTop: 16,
        color: palette.text,
        fontSize: 24,
        lineHeight: 30,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    specialtyText: {
        marginTop: 3,
        color: palette.primary,
        fontSize: 18,
        lineHeight: 24,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    locationRow: {
        marginTop: 6,
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        marginLeft: 6,
        color: palette.muted,
        fontSize: 15,
        lineHeight: 20,
        fontFamily: fonts.bodyRegular,
    },
    dateCard: {
        marginTop: 20,
        backgroundColor: '#ECECFA',
        borderRadius: 18,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateIconWrap: {
        width: 54,
        height: 54,
        borderRadius: 14,
        backgroundColor: '#D8DAF3',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    dateTitle: {
        color: palette.text,
        fontSize: 18,
        lineHeight: 24,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    dateSubtitle: {
        marginTop: 2,
        color: palette.muted,
        fontSize: 16,
        lineHeight: 22,
        fontFamily: fonts.bodyMedium,
    },
    primaryAction: {
        marginTop: 18,
        height: 58,
        borderRadius: 16,
        backgroundColor: palette.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#1D4ED8',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 6,
    },
    primaryActionText: {
        marginLeft: 10,
        color: '#FFFFFF',
        fontSize: 17,
        lineHeight: 22,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    sectionTitle: {
        marginTop: 22,
        color: palette.text,
        fontSize: 20,
        lineHeight: 26,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    reasonCard: {
        marginTop: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: '#FFFFFF',
        padding: 16,
    },
    reasonText: {
        color: palette.muted,
        fontSize: 15,
        lineHeight: 30,
        fontFamily: fonts.bodyRegular,
    },
    mapMock: {
        marginTop: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#E2E8F0',
        height: 154,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapWater: {
        position: 'absolute',
        left: '42%',
        width: 90,
        height: '100%',
        backgroundColor: '#93C5FD',
        opacity: 0.7,
    },
    mapRoadA: {
        position: 'absolute',
        width: '120%',
        height: 4,
        backgroundColor: '#CBD5E1',
        transform: [{ rotate: '-10deg' }],
    },
    mapRoadB: {
        position: 'absolute',
        width: '120%',
        height: 4,
        backgroundColor: '#E2E8F0',
        transform: [{ rotate: '18deg' }],
    },
    mapText: {
        color: '#334155',
        fontSize: 36,
        lineHeight: 42,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    secondaryAction: {
        marginTop: 18,
        height: 58,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#C4B5FD',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryActionText: {
        marginLeft: 8,
        color: palette.primary,
        fontSize: 18,
        lineHeight: 22,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    cancelAction: {
        marginTop: 14,
        marginBottom: 4,
        height: 54,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelActionText: {
        marginLeft: 8,
        color: palette.danger,
        fontSize: 18,
        lineHeight: 22,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    emptyWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        backgroundColor: palette.background,
    },
    emptyTitle: {
        color: palette.text,
        fontSize: 20,
        lineHeight: 26,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        marginBottom: 16,
    },
    backButtonSimple: {
        borderRadius: 14,
        backgroundColor: palette.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    backButtonSimpleText: {
        color: '#FFFFFF',
        fontSize: 16,
        lineHeight: 20,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
});
