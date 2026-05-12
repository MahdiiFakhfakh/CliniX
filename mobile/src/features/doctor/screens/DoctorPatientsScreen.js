import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '@/src/core/theme/tokens';
import { useDoctorPatientsQuery } from '@/src/features/doctor/hooks/useDoctorPatientsQuery';
import { LoadingView } from '@/src/shared/components/LoadingView';
import AppIcon from '@/src/shared/components/AppIcon';

const palette = {
    background: '#F3F4F8',
    surface: '#FFFFFF',
    primary: '#1D4ED8',
    text: '#111827',
    muted: '#6B7280',
    border: '#E5E7EB',
    chipBg: '#E5E7EB',
};

const FILTERS = [
    { key: 'all', label: 'All Patients' },
    { key: 'high', label: 'High Risk' },
    { key: 'medium', label: 'Medium Risk' },
    { key: 'low', label: 'Low Risk' },
];

const riskStyle = {
    high: { bg: '#FEE2E2', text: '#B91C1C', label: 'HIGH' },
    medium: { bg: '#FEF3C7', text: '#B45309', label: 'MEDIUM' },
    low: { bg: '#DCFCE7', text: '#15803D', label: 'LOW' },
};

const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
        return 'N/A';
    }
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
};

export function DoctorPatientsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const patientsQuery = useDoctorPatientsQuery();
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const patients = patientsQuery.data ?? [];

    const filteredPatients = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return patients.filter((patient) => {
            const filterMatch = activeFilter === 'all' || patient.riskLevel === activeFilter;
            const searchMatch =
                !q ||
                patient.fullName.toLowerCase().includes(q) ||
                String(patient.age).includes(q) ||
                patient.condition.toLowerCase().includes(q);
            return filterMatch && searchMatch;
        });
    }, [activeFilter, patients, searchQuery]);

    if (patientsQuery.isLoading) {
        return (
            <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
                <LoadingView label="Loading patient list..." />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <Text style={styles.headerTitle}>My Patients</Text>
                    <Text style={styles.headerSub}>Found {filteredPatients.length}</Text>
                </View>

                <View style={styles.searchRow}>
                    <AppIcon color="#6B7280" name="search" size={22} />
                    <TextInput
                        accessibilityLabel="Search patients"
                        autoCapitalize="none"
                        onChangeText={setSearchQuery}
                        placeholder="Search by name, age, or condition"
                        placeholderTextColor="#6B7280"
                        style={styles.searchInput}
                        value={searchQuery}
                    />
                </View>

                <ScrollView
                    horizontal
                    style={styles.filtersScroller}
                    contentContainerStyle={styles.filtersRow}
                    showsHorizontalScrollIndicator={false}
                >
                    {FILTERS.map((filter) => {
                        const active = activeFilter === filter.key;
                        return (
                            <Pressable
                                key={filter.key}
                                accessibilityRole="button"
                                accessibilityLabel={`Filter ${filter.label}`}
                                onPress={() => setActiveFilter(filter.key)}
                                style={[styles.filterChip, active && styles.filterChipActive]}
                            >
                                <Text style={[styles.filterText, active && styles.filterTextActive]}>{filter.label}</Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>

                <ScrollView
                    style={styles.listScroll}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
                    refreshControl={<RefreshControl onRefresh={() => void patientsQuery.refetch()} refreshing={patientsQuery.isRefetching} />}
                    showsVerticalScrollIndicator={false}
                >
                    {filteredPatients.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>No patients matched your filter.</Text>
                        </View>
                    ) : (
                        filteredPatients.map((patient) => {
                            const risk = riskStyle[patient.riskLevel] ?? riskStyle.low;
                            return (
                                <View key={patient.id} style={styles.card}>
                                    <View style={styles.cardTop}>
                                        <View style={styles.avatar}>
                                            <AppIcon color="#64748B" name="person" size={22} />
                                        </View>
                                        <View style={styles.cardTextWrap}>
                                            <Text style={styles.name}>{patient.fullName}</Text>
                                            <Text style={styles.meta}>
                                                {patient.age} yrs  |  {patient.condition}
                                            </Text>
                                            <Text style={styles.meta}>Last visit: {formatDate(patient.lastVisit)}</Text>
                                        </View>
                                        <View style={[styles.riskPill, { backgroundColor: risk.bg }]}>
                                            <Text style={[styles.riskText, { color: risk.text }]}>
                                                {risk.label}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.actionsRow}>
                                        <Pressable
                                            accessibilityRole="button"
                                            accessibilityLabel={`Open ${patient.fullName} file`}
                                            onPress={() =>
                                                router.push({
                                                    pathname: '/(app)/(doctor)/patient/[patientId]',
                                                    params: { patientId: patient.id },
                                                })
                                            }
                                            style={styles.primaryButton}
                                        >
                                            <Text style={styles.primaryButtonText}>Open Patient File</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            );
                        })
                    )}
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
        paddingHorizontal: 20,
    },
    headerRow: {
        paddingTop: 8,
        marginBottom: 12,
    },
    headerTitle: {
        color: palette.text,
        fontSize: 26,
        lineHeight: 32,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    headerSub: {
        marginTop: 2,
        color: palette.muted,
        fontSize: 14,
        lineHeight: 19,
        fontFamily: fonts.bodyRegular,
    },
    searchRow: {
        height: 54,
        borderRadius: 14,
        backgroundColor: '#E5E7EB',
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        color: palette.text,
        fontSize: 15,
        lineHeight: 20,
        fontFamily: fonts.bodyRegular,
    },
    filtersRow: {
        paddingTop: 12,
        paddingBottom: 10,
        gap: 10,
    },
    filtersScroller: {
        maxHeight: 64,
        marginBottom: 4,
    },
    filterChip: {
        height: 42,
        borderRadius: 21,
        backgroundColor: palette.chipBg,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterChipActive: {
        backgroundColor: palette.primary,
    },
    filterText: {
        color: '#4B5563',
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    filterTextActive: {
        color: '#FFFFFF',
    },
    listScroll: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 2,
        paddingBottom: 120,
        gap: 12,
    },
    card: {
        backgroundColor: palette.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.border,
        padding: 14,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    cardTextWrap: {
        flex: 1,
    },
    name: {
        color: palette.text,
        fontSize: 18,
        lineHeight: 24,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    meta: {
        marginTop: 2,
        color: palette.muted,
        fontSize: 13,
        lineHeight: 18,
        fontFamily: fonts.bodyRegular,
    },
    riskPill: {
        borderRadius: 12,
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    riskText: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: 0.4,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    actionsRow: {
        marginTop: 12,
    },
    primaryButton: {
        height: 46,
        borderRadius: 12,
        backgroundColor: palette.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        lineHeight: 20,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    emptyCard: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.surface,
        padding: 16,
    },
    emptyText: {
        color: palette.muted,
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        fontFamily: fonts.bodyRegular,
    },
});
