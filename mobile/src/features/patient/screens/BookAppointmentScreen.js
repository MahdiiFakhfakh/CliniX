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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadows, spacing, typography } from '@/src/core/theme/tokens';
import { useBookAppointmentMutation } from '@/src/features/appointments/hooks/useBookAppointmentMutation';
import { useDoctorsQuery } from '@/src/features/patient/hooks/useDoctorsQuery';
import AppIcon from '@/src/shared/components/AppIcon';

const DOCTOR_TONES = ['#0F766E', '#059669', '#14B8A6', '#10B981', '#0284C7', '#475569'];

const QUICK_DAYS = [
    { id: 'tomorrow', label: 'Tomorrow', offset: 1 },
    { id: 'two-days', label: 'In 2 days', offset: 2 },
    { id: 'next-week', label: 'Next week', offset: 7 },
];

const TIME_SLOTS = ['09:00 AM', '10:30 AM', '01:00 PM', '03:30 PM'];

const REASON_CHIPS = [
    'Routine checkup',
    'Follow-up visit',
    'New symptoms',
    'Medication review',
];

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

const formatDateInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    } else if (hours > 23) {
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

function DoctorAvatar({ doctor, index, large = false }) {
    const initials = doctor?.name
        ?.split(' ')
        .filter(Boolean)
        .slice(-2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');

    return (
        <View style={[styles.avatar, large && styles.avatarLarge, { backgroundColor: getDoctorTone(index) }]}>
            <Text style={[styles.avatarText, large && styles.avatarTextLarge]}>{initials || 'DR'}</Text>
        </View>
    );
}

function DoctorCard({ doctor, index, onBook, onProfile, disabled }) {
    const department = doctor.department || doctor.specialty || 'General Medicine';
    const fee = doctor.consultationFee ? `$${doctor.consultationFee}` : 'Fee TBD';

    return (
        <View style={styles.doctorCard}>
            <View style={styles.cardTopRow}>
                <DoctorAvatar doctor={doctor} index={index} />
                <View style={styles.cardTextWrap}>
                    <View style={styles.nameRow}>
                        <Text numberOfLines={1} style={styles.doctorName}>{doctor.name}</Text>
                        <View style={[styles.statusPill, doctor.available ? styles.statusPillAvailable : styles.statusPillUnavailable]}>
                            <Text style={[styles.statusPillText, doctor.available ? styles.statusTextAvailable : styles.statusTextUnavailable]}>
                                {statusLabel(doctor.status)}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.specialtyText}>{doctor.specialty}</Text>
                    <View style={styles.metaRow}>
                        <View style={styles.metaChip}>
                            <AppIcon color={colors.primary} name="work-outline" size={14} />
                            <Text style={styles.metaChipText}>{doctor.years} yrs</Text>
                        </View>
                        <View style={styles.metaChip}>
                            <AppIcon color="#EAB308" name="star" size={14} />
                            <Text style={styles.metaChipText}>{doctor.rating.toFixed(1)}</Text>
                        </View>
                        <View style={styles.metaChip}>
                            <AppIcon color={colors.textMuted} name="payments" size={14} />
                            <Text style={styles.metaChipText}>{fee}</Text>
                        </View>
                    </View>
                    <Text numberOfLines={1} style={styles.departmentText}>{department}</Text>
                </View>
            </View>

            <View style={styles.buttonRow}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`View ${doctor.name} profile`}
                    onPress={() => onProfile(doctor)}
                    style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
                >
                    <AppIcon color={colors.primary} name="person-outline" size={18} />
                    <Text style={styles.secondaryButtonText}>Profile</Text>
                </Pressable>

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Book with ${doctor.name}`}
                    disabled={disabled}
                    onPress={() => onBook(doctor)}
                    style={({ pressed }) => [
                        styles.primaryButton,
                        (!doctor.available || disabled) && styles.primaryButtonDisabled,
                        pressed && doctor.available && !disabled && styles.primaryButtonPressed,
                    ]}
                >
                    <AppIcon color="#FFFFFF" name="calendar-outline" size={18} />
                    <Text style={styles.primaryButtonText}>Book</Text>
                </Pressable>
            </View>
        </View>
    );
}

export function BookAppointmentScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
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
    const availableCount = doctors.filter((doctor) => doctor.available).length;

    const goToAppointments = () => {
        router.replace('/(app)/(patient)/appointments');
    };

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

    const closeBookingForm = () => {
        if (bookMutation.isPending) {
            return;
        }
        setSelectedDoctor(null);
    };

    const bookFromProfile = () => {
        if (!profileDoctor) {
            return;
        }
        const doctor = profileDoctor;
        setProfileDoctor(null);
        openBookingForm(doctor);
    };

    const applyQuickDay = (offset) => {
        const date = new Date();
        date.setDate(date.getDate() + offset);
        setAppointmentDate(formatDateInput(date));
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
        } catch (error) {
            Alert.alert('Booking failed', error.message || 'Please try again.');
        }
    };

    return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
            <View style={styles.container}>
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.heroCard}>
                        <View style={styles.heroTopRow}>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Return to appointments"
                                hitSlop={10}
                                onPress={goToAppointments}
                                style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
                            >
                                <AppIcon color={colors.text} name="chevron-back" size={22} />
                            </Pressable>
                            <View style={styles.heroBadge}>
                                <AppIcon color={colors.primary} name="verified-user" size={15} />
                                <Text style={styles.heroBadgeText}>Verified care team</Text>
                            </View>
                        </View>

                        <Text style={styles.heroTitle}>Book Appointment</Text>
                        <Text style={styles.heroSubtitle}>Find the right specialist and reserve a time that works for you.</Text>

                        <View style={styles.heroStatsRow}>
                            <View style={styles.heroStat}>
                                <Text style={styles.heroStatValue}>{availableCount}</Text>
                                <Text style={styles.heroStatLabel}>Available</Text>
                            </View>
                            <View style={styles.heroStatDivider} />
                            <View style={styles.heroStat}>
                                <Text style={styles.heroStatValue}>{filterOptions.length - 2}</Text>
                                <Text style={styles.heroStatLabel}>Specialties</Text>
                            </View>
                            <View style={styles.heroStatDivider} />
                            <View style={styles.heroStat}>
                                <Text style={styles.heroStatValue}>{doctors.length}</Text>
                                <Text style={styles.heroStatLabel}>Doctors</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.searchCard}>
                        <View style={styles.searchRow}>
                            <AppIcon color={colors.textMuted} name="search-outline" size={22} />
                            <TextInput
                                accessibilityLabel="Search doctors"
                                autoCapitalize="none"
                                onChangeText={setSearchQuery}
                                placeholder="Search doctor, specialty, department"
                                placeholderTextColor={colors.textMuted}
                                style={styles.searchInput}
                                value={searchQuery}
                            />
                            {searchQuery ? (
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Clear search"
                                    onPress={() => setSearchQuery('')}
                                    style={styles.clearSearchButton}
                                >
                                    <AppIcon color={colors.textMuted} name="close" size={18} />
                                </Pressable>
                            ) : null}
                        </View>

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

                    <View style={styles.resultsHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Recommended doctors</Text>
                            <Text style={styles.resultsMeta}>{filteredDoctors.length} match your search</Text>
                        </View>
                        <View style={styles.sortPill}>
                            <AppIcon color={colors.primary} name="star" size={14} />
                            <Text style={styles.sortPillText}>Top rated</Text>
                        </View>
                    </View>

                    {doctorsQuery.isLoading ? (
                        <View style={styles.stateCard}>
                            <AppIcon color={colors.primary} name="sync" size={28} />
                            <Text style={styles.stateTitle}>Loading doctors</Text>
                            <Text style={styles.stateText}>Checking who is available for booking.</Text>
                        </View>
                    ) : doctorsQuery.isError ? (
                        <View style={styles.stateCard}>
                            <AppIcon color={colors.danger} name="alert-circle" size={28} />
                            <Text style={styles.stateTitle}>Unable to load doctors</Text>
                            <Text style={styles.stateText}>Pull from the live backend and try again.</Text>
                        </View>
                    ) : filteredDoctors.length === 0 ? (
                        <View style={styles.stateCard}>
                            <AppIcon color={colors.textMuted} name="search-outline" size={28} />
                            <Text style={styles.stateTitle}>No doctors found</Text>
                            <Text style={styles.stateText}>Try another specialty or clear your search.</Text>
                        </View>
                    ) : (
                        filteredDoctors.map((doctor, index) => (
                            <DoctorCard
                                disabled={bookMutation.isPending}
                                doctor={doctor}
                                index={index}
                                key={doctor.id}
                                onBook={openBookingForm}
                                onProfile={setProfileDoctor}
                            />
                        ))
                    )}
                </ScrollView>

                <Modal animationType="slide" transparent visible={Boolean(profileDoctor)} onRequestClose={() => setProfileDoctor(null)}>
                    <View style={styles.modalRoot}>
                        <Pressable style={styles.modalBackdrop} onPress={() => setProfileDoctor(null)} />
                        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
                            <View style={styles.sheetHandle} />
                            <View style={styles.profileHeader}>
                                <DoctorAvatar doctor={profileDoctor} index={0} large />
                                <View style={styles.profileHeaderText}>
                                    <Text style={styles.sheetEyebrow}>Doctor Profile</Text>
                                    <Text style={styles.sheetTitle}>{profileDoctor?.name}</Text>
                                    <Text style={styles.profileSpecialty}>{profileDoctor?.specialty}</Text>
                                </View>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Close doctor profile"
                                    onPress={() => setProfileDoctor(null)}
                                    style={styles.closeButton}
                                >
                                    <AppIcon color={colors.text} name="close" size={21} />
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

                            <View style={styles.infoBlock}>
                                <Text style={styles.infoLabel}>Department</Text>
                                <Text style={styles.infoText}>{profileDoctor?.department || 'General Medicine'}</Text>
                            </View>

                            {profileDoctor?.hospital ? (
                                <View style={styles.infoBlock}>
                                    <Text style={styles.infoLabel}>Hospital</Text>
                                    <Text style={styles.infoText}>{profileDoctor.hospital}</Text>
                                </View>
                            ) : null}

                            {profileDoctor?.qualifications?.length ? (
                                <View style={styles.infoBlock}>
                                    <Text style={styles.infoLabel}>Qualifications</Text>
                                    <Text style={styles.infoText}>{profileDoctor.qualifications.join(', ')}</Text>
                                </View>
                            ) : null}

                            {profileDoctor?.bio ? (
                                <View style={styles.infoBlock}>
                                    <Text style={styles.infoLabel}>About</Text>
                                    <Text style={styles.infoText}>{profileDoctor.bio}</Text>
                                </View>
                            ) : null}

                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`Book appointment with ${profileDoctor?.name}`}
                                disabled={!profileDoctor?.available}
                                onPress={bookFromProfile}
                                style={({ pressed }) => [
                                    styles.submitButton,
                                    !profileDoctor?.available && styles.primaryButtonDisabled,
                                    pressed && profileDoctor?.available && styles.primaryButtonPressed,
                                ]}
                            >
                                <AppIcon color="#FFFFFF" name="calendar-outline" size={18} />
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
                        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
                            <View style={styles.sheetHandle} />
                            <View style={styles.sheetHeader}>
                                <View style={styles.sheetHeaderText}>
                                    <Text style={styles.sheetEyebrow}>New Appointment</Text>
                                    <Text style={styles.sheetTitle}>{selectedDoctor?.name}</Text>
                                    <Text style={styles.profileSpecialty}>{selectedDoctor?.specialty}</Text>
                                </View>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Close booking form"
                                    onPress={closeBookingForm}
                                    style={styles.closeButton}
                                >
                                    <AppIcon color={colors.text} name="close" size={21} />
                                </Pressable>
                            </View>

                            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                                <Text style={styles.inputLabel}>Date</Text>
                                <View style={styles.quickRow}>
                                    {QUICK_DAYS.map((day) => {
                                        const date = new Date();
                                        date.setDate(date.getDate() + day.offset);
                                        const value = formatDateInput(date);
                                        const active = appointmentDate === value;
                                        return (
                                            <Pressable
                                                accessibilityRole="button"
                                                accessibilityLabel={`Set date to ${day.label}`}
                                                key={day.id}
                                                onPress={() => applyQuickDay(day.offset)}
                                                style={[styles.quickChip, active && styles.quickChipActive]}
                                            >
                                                <Text style={[styles.quickChipText, active && styles.quickChipTextActive]}>{day.label}</Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                                <TextInput
                                    accessibilityLabel="Appointment date"
                                    autoCapitalize="none"
                                    keyboardType="numbers-and-punctuation"
                                    onChangeText={setAppointmentDate}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={colors.textMuted}
                                    style={styles.formInput}
                                    value={appointmentDate}
                                />

                                <Text style={styles.inputLabel}>Time</Text>
                                <View style={styles.quickRow}>
                                    {TIME_SLOTS.map((slot) => {
                                        const active = appointmentTime === slot;
                                        return (
                                            <Pressable
                                                accessibilityRole="button"
                                                accessibilityLabel={`Set time to ${slot}`}
                                                key={slot}
                                                onPress={() => setAppointmentTime(slot)}
                                                style={[styles.quickChip, active && styles.quickChipActive]}
                                            >
                                                <Text style={[styles.quickChipText, active && styles.quickChipTextActive]}>{slot}</Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                                <TextInput
                                    accessibilityLabel="Appointment time"
                                    autoCapitalize="characters"
                                    onChangeText={setAppointmentTime}
                                    placeholder="10:30 AM"
                                    placeholderTextColor={colors.textMuted}
                                    style={styles.formInput}
                                    value={appointmentTime}
                                />

                                <Text style={styles.inputLabel}>Reason</Text>
                                <View style={styles.reasonChips}>
                                    {REASON_CHIPS.map((item) => {
                                        const active = reason === item;
                                        return (
                                            <Pressable
                                                accessibilityRole="button"
                                                accessibilityLabel={`Set reason to ${item}`}
                                                key={item}
                                                onPress={() => setReason(item)}
                                                style={[styles.reasonChip, active && styles.quickChipActive]}
                                            >
                                                <Text style={[styles.reasonChipText, active && styles.quickChipTextActive]}>{item}</Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                                <TextInput
                                    accessibilityLabel="Appointment reason"
                                    multiline
                                    onChangeText={setReason}
                                    placeholder="Describe why you want to see the doctor"
                                    placeholderTextColor={colors.textMuted}
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
                                        pressed && !bookMutation.isPending && styles.primaryButtonPressed,
                                    ]}
                                >
                                    <AppIcon color="#FFFFFF" name="checkmark-circle" size={19} />
                                    <Text style={styles.submitButtonText}>
                                        {bookMutation.isPending ? 'Booking...' : 'Confirm Booking'}
                                    </Text>
                                </Pressable>
                            </ScrollView>
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
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 15,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
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
    searchCard: {
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.sm,
        gap: spacing.sm,
    },
    searchRow: {
        minHeight: 52,
        borderRadius: radius.sm,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        marginLeft: spacing.xs,
        color: colors.text,
        fontSize: typography.body,
        lineHeight: 20,
        fontFamily: fonts.bodyRegular,
    },
    clearSearchButton: {
        width: 34,
        height: 34,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterRow: {
        gap: spacing.xs,
        paddingRight: spacing.xs,
    },
    filterChip: {
        minHeight: 38,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterChipText: {
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: '#FFFFFF',
    },
    resultsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.sm,
    },
    sectionTitle: {
        color: colors.text,
        fontSize: typography.heading,
        lineHeight: 25,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    resultsMeta: {
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        lineHeight: 18,
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
    doctorCard: {
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: spacing.sm,
        ...shadows.card,
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
    },
    avatar: {
        width: 62,
        height: 62,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarLarge: {
        width: 74,
        height: 74,
        borderRadius: 22,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    avatarTextLarge: {
        fontSize: 21,
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
    specialtyText: {
        marginTop: 2,
        color: colors.primary,
        fontSize: typography.body,
        lineHeight: 20,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    departmentText: {
        marginTop: 6,
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
    statusPillAvailable: {
        backgroundColor: colors.successSoft,
    },
    statusPillUnavailable: {
        backgroundColor: colors.dangerSoft,
    },
    statusPillText: {
        fontSize: 10,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    statusTextAvailable: {
        color: '#15803D',
    },
    statusTextUnavailable: {
        color: colors.danger,
    },
    metaRow: {
        marginTop: spacing.xs,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    metaChip: {
        minHeight: 28,
        borderRadius: radius.full,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaChipText: {
        color: colors.text,
        fontSize: 11,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    buttonRow: {
        marginTop: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    secondaryButton: {
        flex: 1,
        minHeight: 46,
        borderRadius: radius.sm,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    secondaryButtonPressed: {
        backgroundColor: colors.surfaceTint,
    },
    secondaryButtonText: {
        color: colors.primary,
        fontSize: typography.body,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    primaryButton: {
        flex: 1,
        minHeight: 46,
        borderRadius: radius.sm,
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    primaryButtonPressed: {
        backgroundColor: colors.primaryMid,
    },
    primaryButtonDisabled: {
        opacity: 0.55,
        backgroundColor: colors.disabled,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: typography.body,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    stateCard: {
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: spacing.lg,
        alignItems: 'center',
        gap: spacing.xs,
    },
    stateTitle: {
        color: colors.text,
        fontSize: typography.bodyLarge,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        textAlign: 'center',
    },
    stateText: {
        color: colors.textMuted,
        fontSize: typography.body,
        lineHeight: 21,
        fontFamily: fonts.bodyRegular,
        textAlign: 'center',
    },
    modalRoot: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(17, 24, 39, 0.48)',
    },
    sheet: {
        maxHeight: '88%',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
    },
    sheetHandle: {
        width: 44,
        height: 5,
        borderRadius: 3,
        backgroundColor: colors.border,
        alignSelf: 'center',
        marginBottom: spacing.md,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: spacing.sm,
        marginBottom: spacing.xs,
    },
    sheetHeaderText: {
        flex: 1,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    profileHeaderText: {
        flex: 1,
        minWidth: 0,
    },
    sheetEyebrow: {
        color: colors.textMuted,
        fontSize: typography.caption,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    sheetTitle: {
        marginTop: 2,
        color: colors.text,
        fontSize: typography.heading,
        lineHeight: 26,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    profileSpecialty: {
        marginTop: 3,
        color: colors.primary,
        fontSize: typography.body,
        lineHeight: 20,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 15,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileStatsRow: {
        marginTop: spacing.md,
        flexDirection: 'row',
        gap: spacing.xs,
    },
    profileStat: {
        flex: 1,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.background,
        paddingVertical: spacing.sm,
        alignItems: 'center',
    },
    profileStatValue: {
        color: colors.text,
        fontSize: typography.heading,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    profileStatLabel: {
        marginTop: 2,
        color: colors.textMuted,
        fontSize: typography.caption,
        fontFamily: fonts.bodyMedium,
    },
    infoBlock: {
        marginTop: spacing.md,
    },
    infoLabel: {
        color: colors.textMuted,
        fontSize: typography.caption,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    infoText: {
        marginTop: 4,
        color: colors.text,
        fontSize: typography.body,
        lineHeight: 22,
        fontFamily: fonts.bodyRegular,
    },
    inputLabel: {
        marginTop: spacing.md,
        marginBottom: spacing.xs,
        color: colors.text,
        fontSize: typography.body,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    quickRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        marginBottom: spacing.xs,
    },
    quickChip: {
        minHeight: 36,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.background,
        paddingHorizontal: spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickChipActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primary,
    },
    quickChipText: {
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    quickChipTextActive: {
        color: '#FFFFFF',
    },
    formInput: {
        minHeight: 52,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.background,
        paddingHorizontal: spacing.sm,
        color: colors.text,
        fontSize: typography.body,
        lineHeight: 20,
        fontFamily: fonts.bodyRegular,
    },
    reasonChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        marginBottom: spacing.xs,
    },
    reasonChip: {
        minHeight: 36,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.background,
        paddingHorizontal: spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reasonChipText: {
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    reasonInput: {
        minHeight: 104,
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
    },
    submitButton: {
        marginTop: spacing.lg,
        minHeight: 54,
        borderRadius: radius.sm,
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.sm,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: typography.button,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        textAlign: 'center',
    },
});
