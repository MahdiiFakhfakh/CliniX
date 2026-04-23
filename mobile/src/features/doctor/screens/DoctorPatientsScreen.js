import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing, typography } from '@/src/core/theme/tokens';
import { useDoctorPatientsQuery } from '@/src/features/doctor/hooks/useDoctorPatientsQuery';
import { LoadingView } from '@/src/shared/components/LoadingView';
import AppIcon from '@/src/shared/components/AppIcon';

const FILTERS = [
    { key: 'all', label: 'All Patients' },
    { key: 'high', label: 'High Risk' },
    { key: 'medium', label: 'Medium Risk' },
    { key: 'low', label: 'Low Risk' },
];

const riskStyle = {
    high: { bg: colors.dangerSoft, text: colors.danger, border: colors.dangerBorder, label: 'HIGH' },
    medium: { bg: colors.warningSoft, text: colors.warningText, border: '#F5D77A', label: 'MED' },
    low: { bg: colors.successSoft, text: colors.success, border: colors.successBorder, label: 'LOW' },
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
                <LoadingView label="Loading patient list…" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <Text style={styles.headerTitle}>My Patients</Text>
                    <Text style={styles.headerSub}>{filteredPatients.length} found</Text>
                </View>

                <View style={styles.searchRow}>
                    <AppIcon color={colors.textMuted} name="search-outline" size={20} />
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
                                        <View style={[styles.avatar, { backgroundColor: riskStyle[patient.riskLevel]?.bg ?? colors.surfaceTint }]}>
                                            <Text style={{ fontSize: 15, fontFamily: fonts.bodyBold, fontWeight: '700', color: riskStyle[patient.riskLevel]?.text ?? colors.textMuted }}>
                                                {patient.fullName.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')}
                                            </Text>
                                        </View>
                                        <View style={styles.cardTextWrap}>
                                            <Text style={styles.name}>{patient.fullName}</Text>
                                            <Text style={styles.meta}>
                                                {patient.age} yrs  |  {patient.condition}
                                            </Text>
                                            <Text style={styles.meta}>Last visit: {formatDate(patient.lastVisit)}</Text>
                                        </View>
                                        <View style={[styles.riskPill, { backgroundColor: risk.bg, borderColor: risk.border }]}>
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
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: spacing.md,
    },
    headerRow: {
        paddingTop: spacing.xs,
        marginBottom: spacing.sm,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    headerTitle: {
        color: colors.text,
        fontSize: typography.h3,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    headerSub: {
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyMedium,
    },
    searchRow: {
        height: 50,
        borderRadius: radius.sm,
        backgroundColor: colors.surfaceTint,
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
        fontFamily: fonts.bodyRegular,
    },
    filtersRow: {
        paddingTop: spacing.sm,
        paddingBottom: spacing.xs,
        gap: spacing.xs,
    },
    filtersScroller: {
        maxHeight: 60,
        marginBottom: spacing.xxs,
    },
    filterChip: {
        height: 38,
        borderRadius: radius.full,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterText: {
        color: colors.textMuted,
        fontSize: typography.bodySmall,
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
        paddingTop: spacing.xxs,
        gap: spacing.xs,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.sm,
        shadowColor: '#142850',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.surfaceTint,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    cardTextWrap: {
        flex: 1,
    },
    name: {
        color: colors.text,
        fontSize: typography.bodyLarge,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    meta: {
        marginTop: 2,
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyRegular,
    },
    riskPill: {
        borderRadius: radius.full,
        borderWidth: 1,
        paddingVertical: 4,
        paddingHorizontal: spacing.xs,
    },
    riskText: {
        fontSize: typography.caption,
        letterSpacing: 0.4,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    actionsRow: {
        marginTop: spacing.sm,
    },
    primaryButton: {
        height: 46,
        borderRadius: radius.sm,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: typography.body,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    emptyCard: {
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: spacing.md,
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: typography.body,
        textAlign: 'center',
        fontFamily: fonts.bodyRegular,
    },
});
