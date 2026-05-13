import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '@/src/core/theme/tokens';
import { useBookAppointmentMutation } from '@/src/features/appointments/hooks/useBookAppointmentMutation';
import { useDoctorsQuery } from '@/src/features/patient/hooks/useDoctorsQuery';
import AppIcon from '@/src/shared/components/AppIcon';

const palette = {
    background: '#F3F4F8',
    surface: '#FFFFFF',
    primary: '#1D4ED8',
    primaryPressed: '#1E40AF',
    text: '#111827',
    muted: '#6B7280',
    border: '#E5E7EB',
    softChip: '#EDE9FE',
    warning: '#EF4444',
    success: '#059669',
    ratingBg: '#FEF3C7',
};

const DOCTOR_TONES = ['#6DB7B8', '#7CA7BC', '#8EAFBF', '#95AFBA', '#8AA2D6', '#70B48F'];

const getDoctorTone = (index) => DOCTOR_TONES[index % DOCTOR_TONES.length];

const statusLabel = (status) => {
    if (status === 'on_leave') {
        return 'On leave';
    }
    if (status === 'unavailable') {
        return 'Unavailable';
    }
    return 'Available';
};

const parseDateInput = (value) => {
    const trimmed = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return null;
    }

    const date = new Date(`${trimmed}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : trimmed;
};

const parseTimeInput = (value) => {
    const trimmed = value.trim();
    const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) {
        return null;
    }

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const meridiem = match[3]?.toUpperCase();

    if (minutes > 59) {
        return null;
    }

    if (meridiem) {
        if (hours < 1 || hours > 12) {
            return null;
        }
        if (meridiem === 'PM' && hours !== 12) {
            hours += 12;
        }
        if (meridiem === 'AM' && hours === 12) {
            hours = 0;
        }
    }
    else if (hours > 23) {
        return null;
    }

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const createAppointmentDate = (dateValue, timeValue) => {
    const date = parseDateInput(dateValue);
    const time = parseTimeInput(timeValue);

    if (!date || !time) {
        return null;
    }

    const appointmentDate = new Date(`${date}T${time}:00`);
    return Number.isNaN(appointmentDate.getTime()) ? null : appointmentDate;
};

export function BookAppointmentScreen() {
    const router = useRouter();
    const bookMutation = useBookAppointmentMutation();
    const doctorsQuery = useDoctorsQuery();

    const [activeFilter, setActiveFilter] = useState('All Doctors');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [profileDoctor, setProfileDoctor] = useState(null);
    const [appointmentDate, setAppointmentDate] = useState('');
    const [appointmentTime, setAppointmentTime] = useState('');
    const [reason, setReason] = useState('');

    const doctors = doctorsQuery.data ?? [];

    const filterOptions = useMemo(() => {
        const departments = doctors
            .map((doctor) => doctor.department || doctor.specialty)
            .filter(Boolean)
            .filter((department, index, list) => list.indexOf(department) === index);

        return ['All Doctors', 'Available Today', ...departments];
    }, [doctors]);

    const filteredDoctors = useMemo(() => {
        const search = searchQuery.trim().toLowerCase();

        return doctors.filter((doctor) => {
            const specialty = doctor.specialty ?? 'General Medicine';
            const department = doctor.department ?? specialty;
            const byFilter =
                activeFilter === 'All Doctors' ||
                (activeFilter === 'Available Today' && doctor.available) ||
                department === activeFilter ||
                specialty === activeFilter;
            const bySearch =
                !search ||
                doctor.name.toLowerCase().includes(search) ||
                specialty.toLowerCase().includes(search) ||
                department.toLowerCase().includes(search);

            return byFilter && bySearch;
        });
    }, [activeFilter, doctors, searchQuery]);

    const openBookingForm = (doctor) => {
        if (!doctor.available) {
            Alert.alert('Doctor unavailable', `${doctor.name} is currently ${statusLabel(doctor.status).toLowerCase()}.`);
            return;
        }

        setSelectedDoctor(doctor);
        setAppointmentDate('');
        setAppointmentTime('');
        setReason('');
    };

    const openProfile = (doctor) => {
        setProfileDoctor(doctor);
    };

    const closeProfile = () => {
        setProfileDoctor(null);
    };

    const bookFromProfile = () => {
        if (!profileDoctor) {
            return;
        }
        const doctor = profileDoctor;
        setProfileDoctor(null);
        openBookingForm(doctor);
    };

    const closeBookingForm = () => {
        if (bookMutation.isPending) {
            return;
        }
        setSelectedDoctor(null);
    };

    const handleSubmitBooking = async () => {
        if (!selectedDoctor) {
            return;
        }

        const appointmentDateValue = createAppointmentDate(appointmentDate, appointmentTime);
        const reasonValue = reason.trim();

        if (!appointmentDateValue) {
            Alert.alert('Check date and time', 'Enter the date as YYYY-MM-DD and time as HH:MM or HH:MM AM/PM.');
            return;
        }

        if (appointmentDateValue.getTime() < Date.now()) {
            Alert.alert('Choose a future time', 'Appointment date and time must be in the future.');
            return;
        }

        if (!reasonValue) {
            Alert.alert('Reason required', 'Enter the reason for this appointment.');
            return;
        }

        try {
            await bookMutation.mutateAsync({
                doctorId: selectedDoctor.id,
                department: selectedDoctor.department || selectedDoctor.specialty,
                doctorName: selectedDoctor.name,
                date: appointmentDateValue.toISOString(),
                time: appointmentTime.trim(),
                reason: reasonValue,
            });
            Alert.alert('Appointment booked', `You booked with ${selectedDoctor.name}.`);
            setSelectedDoctor(null);
            router.replace('/(app)/(patient)/appointments');
        }
        catch (error) {
            Alert.alert('Booking failed', error.message || 'Please try again.');
        }
    };

    return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                        onPress={() => router.back()}
                        style={styles.backLink}
                    >
                        <AppIcon color={palette.primary} name="chevron-back" size={24} />
                        <Text style={styles.backText}>Back</Text>
                    </Pressable>
                    <Text style={styles.headerTitle}>Choose Doctor</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <View style={styles.searchRow}>
                    <AppIcon color="#6B7280" name="search" size={26} />
                    <TextInput
                        accessibilityLabel="Search doctors"
                        autoCapitalize="none"
                        onChangeText={setSearchQuery}
                        placeholder="Search by name or specialty"
                        placeholderTextColor="#6B7280"
                        style={styles.searchInput}
                        value={searchQuery}
                    />
                </View>

                <View style={styles.filterWrap}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                        {filterOptions.map((filter) => {
                            const active = activeFilter === filter;
                            return (
                                <Pressable
                                    key={filter}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Filter ${filter}`}
                                    onPress={() => setActiveFilter(filter)}
                                    style={[styles.filterChip, active && styles.filterChipActive]}
                                >
                                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                                        {filter}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {doctorsQuery.isLoading ? (
                        <Text style={styles.stateText}>Loading doctors...</Text>
                    ) : doctorsQuery.isError ? (
                        <Text style={styles.stateText}>Unable to load doctors. Pull from the live backend and try again.</Text>
                    ) : (
                        <>
                            <Text style={styles.foundText}>Found {filteredDoctors.length} Doctors</Text>

                            {filteredDoctors.length === 0 ? (
                                <Text style={styles.stateText}>No doctors match your search.</Text>
                            ) : null}

                            {filteredDoctors.map((doctor, index) => (
                                <View key={doctor.id} style={styles.card}>
                                    <View style={styles.cardTopRow}>
                                        <View style={[styles.avatar, { backgroundColor: getDoctorTone(index) }]}>
                                            <AppIcon color="#FFFFFF" name="person" size={32} />
                                        </View>

                                        <View style={styles.cardTextWrap}>
                                            <Text style={styles.doctorName}>{doctor.name}</Text>
                                            <Text style={styles.specialtyText}>{doctor.specialty}</Text>
                                            <Text style={styles.metaText}>
                                                {doctor.years} years experience - {doctor.reviews} reviews
                                            </Text>
                                            <Text style={[styles.statusText, doctor.available ? styles.availableText : styles.unavailableText]}>
                                                {statusLabel(doctor.status)}
                                            </Text>
                                        </View>

                                        <View style={styles.ratingChip}>
                                            <AppIcon color="#EAB308" name="star" size={16} />
                                            <Text style={styles.ratingText}>{doctor.rating.toFixed(1)}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.buttonRow}>
                                        <Pressable
                                            accessibilityRole="button"
                                            accessibilityLabel={`View ${doctor.name} profile`}
                                            onPress={() => openProfile(doctor)}
                                            style={styles.secondaryButton}
                                        >
                                            <Text style={styles.secondaryButtonText}>View Profile</Text>
                                        </Pressable>

                                        <Pressable
                                            accessibilityRole="button"
                                            accessibilityLabel={`Book with ${doctor.name}`}
                                            onPress={() => openBookingForm(doctor)}
                                            disabled={bookMutation.isPending}
                                            style={({ pressed }) => [
                                                styles.primaryButton,
                                                (!doctor.available || bookMutation.isPending) && styles.primaryButtonDisabled,
                                                pressed &&
                                                    doctor.available &&
                                                    !bookMutation.isPending && { backgroundColor: palette.primaryPressed },
                                            ]}
                                        >
                                            <Text style={styles.primaryButtonText}>Book Appointment</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            ))}
                        </>
                    )}
                </ScrollView>

                <Modal animationType="slide" transparent visible={Boolean(profileDoctor)} onRequestClose={closeProfile}>
                    <View style={styles.modalRoot}>
                        <Pressable style={styles.modalBackdrop} onPress={closeProfile} />
                        <View style={styles.profileSheet}>
                            <View style={styles.formHeader}>
                                <View style={styles.profileHeaderText}>
                                    <Text style={styles.formEyebrow}>Doctor Profile</Text>
                                    <Text style={styles.formTitle}>{profileDoctor?.name}</Text>
                                    <Text style={styles.profileSpecialty}>{profileDoctor?.specialty}</Text>
                                </View>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Close doctor profile"
                                    onPress={closeProfile}
                                    style={styles.closeButton}
                                >
                                    <AppIcon color={palette.text} name="close" size={22} />
                                </Pressable>
                            </View>

                            <View style={styles.profileStatsRow}>
                                <View style={styles.profileStat}>
                                    <Text style={styles.profileStatValue}>{profileDoctor?.years ?? 0}</Text>
                                    <Text style={styles.profileStatLabel}>Years</Text>
                                </View>
                                <View style={styles.profileStat}>
                                    <Text style={styles.profileStatValue}>{profileDoctor?.rating?.toFixed(1) ?? '4.5'}</Text>
                                    <Text style={styles.profileStatLabel}>Rating</Text>
                                </View>
                                <View style={styles.profileStat}>
                                    <Text style={styles.profileStatValue}>{profileDoctor?.reviews ?? 0}</Text>
                                    <Text style={styles.profileStatLabel}>Reviews</Text>
                                </View>
                            </View>

                            <View style={styles.profileInfoBlock}>
                                <Text style={styles.profileInfoLabel}>Department</Text>
                                <Text style={styles.profileInfoText}>{profileDoctor?.department || 'General Medicine'}</Text>
                            </View>

                            {profileDoctor?.hospital ? (
                                <View style={styles.profileInfoBlock}>
                                    <Text style={styles.profileInfoLabel}>Hospital</Text>
                                    <Text style={styles.profileInfoText}>{profileDoctor.hospital}</Text>
                                </View>
                            ) : null}

                            {profileDoctor?.qualifications?.length ? (
                                <View style={styles.profileInfoBlock}>
                                    <Text style={styles.profileInfoLabel}>Qualifications</Text>
                                    <Text style={styles.profileInfoText}>{profileDoctor.qualifications.join(', ')}</Text>
                                </View>
                            ) : null}

                            {profileDoctor?.bio ? (
                                <View style={styles.profileInfoBlock}>
                                    <Text style={styles.profileInfoLabel}>About</Text>
                                    <Text style={styles.profileInfoText}>{profileDoctor.bio}</Text>
                                </View>
                            ) : null}

                            <View style={styles.profileInfoBlock}>
                                <Text style={styles.profileInfoLabel}>Status</Text>
                                <Text style={[styles.profileInfoText, profileDoctor?.available ? styles.availableText : styles.unavailableText]}>
                                    {statusLabel(profileDoctor?.status)}
                                </Text>
                            </View>

                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`Book appointment with ${profileDoctor?.name}`}
                                disabled={!profileDoctor?.available}
                                onPress={bookFromProfile}
                                style={({ pressed }) => [
                                    styles.submitButton,
                                    !profileDoctor?.available && styles.primaryButtonDisabled,
                                    pressed && profileDoctor?.available && { backgroundColor: palette.primaryPressed },
                                ]}
                            >
                                <Text style={styles.submitButtonText}>Book Appointment</Text>
                            </Pressable>
                        </View>
                    </View>
                </Modal>

                <Modal animationType="slide" transparent visible={Boolean(selectedDoctor)} onRequestClose={closeBookingForm}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={styles.modalRoot}
                    >
                        <Pressable style={styles.modalBackdrop} onPress={closeBookingForm} />
                        <View style={styles.formSheet}>
                            <View style={styles.formHeader}>
                                <View>
                                    <Text style={styles.formEyebrow}>New Appointment</Text>
                                    <Text style={styles.formTitle}>{selectedDoctor?.name}</Text>
                                </View>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Close booking form"
                                    onPress={closeBookingForm}
                                    style={styles.closeButton}
                                >
                                    <AppIcon color={palette.text} name="close" size={22} />
                                </Pressable>
                            </View>

                            <Text style={styles.inputLabel}>Date</Text>
                            <TextInput
                                accessibilityLabel="Appointment date"
                                autoCapitalize="none"
                                keyboardType="numbers-and-punctuation"
                                onChangeText={setAppointmentDate}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor="#9CA3AF"
                                style={styles.formInput}
                                value={appointmentDate}
                            />

                            <Text style={styles.inputLabel}>Time</Text>
                            <TextInput
                                accessibilityLabel="Appointment time"
                                autoCapitalize="characters"
                                onChangeText={setAppointmentTime}
                                placeholder="10:30 AM"
                                placeholderTextColor="#9CA3AF"
                                style={styles.formInput}
                                value={appointmentTime}
                            />

                            <Text style={styles.inputLabel}>Reason</Text>
                            <TextInput
                                accessibilityLabel="Appointment reason"
                                multiline
                                onChangeText={setReason}
                                placeholder="Describe why you want to see the doctor"
                                placeholderTextColor="#9CA3AF"
                                style={[styles.formInput, styles.reasonInput]}
                                textAlignVertical="top"
                                value={reason}
                            />

                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Confirm appointment booking"
                                disabled={bookMutation.isPending}
                                onPress={handleSubmitBooking}
                                style={({ pressed }) => [
                                    styles.submitButton,
                                    bookMutation.isPending && styles.primaryButtonDisabled,
                                    pressed && !bookMutation.isPending && { backgroundColor: palette.primaryPressed },
                                ]}
                            >
                                <Text style={styles.submitButtonText}>
                                    {bookMutation.isPending ? 'Booking...' : 'Confirm Booking'}
                                </Text>
                            </Pressable>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
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
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backLink: {
        width: 94,
        height: 44,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        color: palette.primary,
        fontSize: 18,
        lineHeight: 22,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    headerTitle: {
        color: palette.text,
        fontSize: 22,
        lineHeight: 28,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    headerSpacer: {
        width: 94,
        height: 44,
    },
    searchRow: {
        marginHorizontal: 24,
        height: 70,
        borderRadius: 16,
        backgroundColor: '#E5E7EB',
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        color: palette.text,
        fontSize: 18,
        lineHeight: 22,
        fontFamily: fonts.bodyRegular,
    },
    filterWrap: {
        marginTop: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderTopColor: palette.border,
        borderBottomColor: palette.border,
        paddingVertical: 10,
    },
    filterRow: {
        paddingHorizontal: 24,
        gap: 12,
    },
    filterChip: {
        height: 54,
        borderRadius: 26,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 26,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterChipActive: {
        backgroundColor: palette.primary,
        borderColor: palette.primary,
    },
    filterChipText: {
        color: palette.text,
        fontSize: 16,
        lineHeight: 20,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: '#FFFFFF',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 90,
        gap: 12,
    },
    foundText: {
        color: palette.muted,
        fontSize: 18,
        lineHeight: 24,
        fontFamily: fonts.bodyMedium,
    },
    stateText: {
        marginTop: 18,
        color: palette.muted,
        fontSize: 16,
        lineHeight: 22,
        fontFamily: fonts.bodyMedium,
    },
    card: {
        marginTop: 8,
        backgroundColor: palette.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.border,
        padding: 14,
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    cardTextWrap: {
        flex: 1,
    },
    doctorName: {
        color: palette.text,
        fontSize: 22,
        lineHeight: 28,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    specialtyText: {
        marginTop: 2,
        color: palette.primary,
        fontSize: 17,
        lineHeight: 22,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    metaText: {
        marginTop: 4,
        color: palette.muted,
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodyRegular,
    },
    statusText: {
        marginTop: 4,
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodyMedium,
    },
    availableText: {
        color: palette.success,
    },
    unavailableText: {
        color: palette.warning,
    },
    ratingChip: {
        backgroundColor: palette.ratingBg,
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        color: palette.text,
        fontSize: 16,
        lineHeight: 20,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    buttonRow: {
        marginTop: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    secondaryButton: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        backgroundColor: palette.softChip,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        color: palette.primary,
        fontSize: 17,
        lineHeight: 22,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    primaryButton: {
        flex: 1,
        minHeight: 52,
        borderRadius: 12,
        backgroundColor: palette.primary,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        shadowColor: '#1D4ED8',
        shadowOpacity: 0.24,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    primaryButtonDisabled: {
        backgroundColor: '#6366F1',
        opacity: 0.55,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        lineHeight: 20,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        textAlign: 'center',
    },
    modalRoot: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(17, 24, 39, 0.45)',
    },
    formSheet: {
        backgroundColor: palette.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 30,
    },
    profileSheet: {
        backgroundColor: palette.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 30,
    },
    formHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 16,
    },
    profileHeaderText: {
        flex: 1,
    },
    formEyebrow: {
        color: palette.muted,
        fontSize: 13,
        lineHeight: 18,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    formTitle: {
        marginTop: 2,
        color: palette.text,
        fontSize: 22,
        lineHeight: 28,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    profileSpecialty: {
        marginTop: 4,
        color: palette.primary,
        fontSize: 16,
        lineHeight: 21,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    profileStatsRow: {
        marginTop: 18,
        flexDirection: 'row',
        gap: 10,
    },
    profileStat: {
        flex: 1,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: '#F9FAFB',
        paddingVertical: 12,
        alignItems: 'center',
    },
    profileStatValue: {
        color: palette.text,
        fontSize: 20,
        lineHeight: 26,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    profileStatLabel: {
        marginTop: 2,
        color: palette.muted,
        fontSize: 12,
        lineHeight: 16,
        fontFamily: fonts.bodyMedium,
    },
    profileInfoBlock: {
        marginTop: 16,
    },
    profileInfoLabel: {
        color: palette.muted,
        fontSize: 13,
        lineHeight: 18,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    profileInfoText: {
        marginTop: 4,
        color: palette.text,
        fontSize: 15,
        lineHeight: 22,
        fontFamily: fonts.bodyRegular,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputLabel: {
        marginTop: 18,
        marginBottom: 8,
        color: palette.text,
        fontSize: 15,
        lineHeight: 20,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    formInput: {
        minHeight: 54,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 14,
        color: palette.text,
        fontSize: 16,
        lineHeight: 20,
        fontFamily: fonts.bodyRegular,
    },
    reasonInput: {
        minHeight: 104,
        paddingTop: 14,
        paddingBottom: 14,
    },
    submitButton: {
        marginTop: 22,
        minHeight: 56,
        borderRadius: 14,
        backgroundColor: palette.primary,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        lineHeight: 22,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        textAlign: 'center',
    },
});
