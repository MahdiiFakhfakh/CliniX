import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '@/src/core/theme/tokens';
import { useBookAppointmentMutation } from '@/src/features/appointments/hooks/useBookAppointmentMutation';
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
    ratingBg: '#FEF3C7',
};

const FILTER_OPTIONS = ['All Doctors', 'Available Today', 'Cardiology', 'Dermatology', 'Pediatrics', 'Neurology'];

const DOCTOR_LIST = [
    {
        id: 'doc-sarah',
        name: 'Dr. Sarah Jenkins',
        specialty: 'Cardiologist',
        years: 12,
        reviews: 120,
        rating: 4.9,
        available: true,
        tone: '#6DB7B8',
    },
    {
        id: 'doc-marcus',
        name: 'Dr. Marcus Chen',
        specialty: 'Dermatologist',
        years: 8,
        reviews: 85,
        rating: 4.7,
        available: true,
        tone: '#7CA7BC',
    },
    {
        id: 'doc-elena',
        name: 'Dr. Elena Rodriguez',
        specialty: 'Pediatrician',
        years: 15,
        reviews: 210,
        rating: 4.8,
        available: true,
        tone: '#8EAFBF',
    },
    {
        id: 'doc-james',
        name: 'Dr. James Wilson',
        specialty: 'Neurologist',
        years: 9,
        reviews: 64,
        rating: 4.5,
        available: false,
        nextAvailable: 'Monday',
        tone: '#95AFBA',
    },
];

const toDepartment = (specialty) => {
    if (specialty.includes('Cardio')) {
        return 'Cardiology';
    }
    if (specialty.includes('Derm')) {
        return 'Dermatology';
    }
    if (specialty.includes('Pedia')) {
        return 'Pediatrics';
    }
    if (specialty.includes('Neuro')) {
        return 'Neurology';
    }
    return 'General Medicine';
};

export function BookAppointmentScreen() {
    const router = useRouter();
    const bookMutation = useBookAppointmentMutation();

    const [activeFilter, setActiveFilter] = useState('All Doctors');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredDoctors = useMemo(() => {
        const search = searchQuery.trim().toLowerCase();
        return DOCTOR_LIST.filter((doctor) => {
            const byFilter =
                activeFilter === 'All Doctors' ||
                (activeFilter === 'Available Today' && doctor.available) ||
                doctor.specialty.includes(activeFilter.replace('All Doctors', '').trim());
            const bySearch =
                !search ||
                doctor.name.toLowerCase().includes(search) ||
                doctor.specialty.toLowerCase().includes(search);
            return byFilter && bySearch;
        });
    }, [activeFilter, searchQuery]);

    const handleBook = async (doctor) => {
        if (!doctor.available) {
            return;
        }

        const bookingDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
        bookingDate.setHours(10, 30, 0, 0);

        try {
            await bookMutation.mutateAsync({
                department: toDepartment(doctor.specialty),
                doctorName: doctor.name,
                date: bookingDate.toISOString(),
                time: '10:30 AM',
                reason: 'Routine follow-up consultation',
            });
            Alert.alert('Appointment booked', `You booked with ${doctor.name}.`);
            router.replace('/(app)/(patient)/appointments');
        } catch {
            Alert.alert('Booking failed', 'Please try again.');
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
                        {FILTER_OPTIONS.map((filter) => {
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
                    <Text style={styles.foundText}>Found {filteredDoctors.length} Doctors</Text>

                    {filteredDoctors.map((doctor) => (
                        <View key={doctor.id} style={styles.card}>
                            <View style={styles.cardTopRow}>
                                <View style={[styles.avatar, { backgroundColor: doctor.tone }]}>
                                    <AppIcon color="#FFFFFF" name="person" size={32} />
                                </View>

                                <View style={styles.cardTextWrap}>
                                    <Text style={styles.doctorName}>{doctor.name}</Text>
                                    <Text style={styles.specialtyText}>{doctor.specialty}</Text>
                                    <Text style={styles.metaText}>
                                        {doctor.years} years experience • {doctor.reviews} reviews
                                    </Text>
                                    {!doctor.available ? (
                                        <Text style={styles.unavailableText}>
                                            Next available: {doctor.nextAvailable}
                                        </Text>
                                    ) : null}
                                </View>

                                <View style={styles.ratingChip}>
                                    <AppIcon color="#EAB308" name="star" size={16} />
                                    <Text style={styles.ratingText}>{doctor.rating}</Text>
                                </View>
                            </View>

                            <View style={styles.buttonRow}>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={`View ${doctor.name} profile`}
                                    onPress={() => {}}
                                    style={styles.secondaryButton}
                                >
                                    <Text style={styles.secondaryButtonText}>View Profile</Text>
                                </Pressable>

                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={`Book with ${doctor.name}`}
                                    onPress={() => handleBook(doctor)}
                                    disabled={!doctor.available || bookMutation.isPending}
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
    unavailableText: {
        marginTop: 2,
        color: palette.warning,
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodyMedium,
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
        height: 52,
        borderRadius: 12,
        backgroundColor: palette.primary,
        alignItems: 'center',
        justifyContent: 'center',
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
        fontSize: 17,
        lineHeight: 22,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
});
