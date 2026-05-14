import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadows, spacing, typography } from '@/src/core/theme/tokens';
import { useDoctorPatientsQuery } from '@/src/features/doctor/hooks/useDoctorPatientsQuery';
import { LoadingView } from '@/src/shared/components/LoadingView';
import AppIcon from '@/src/shared/components/AppIcon';

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'high', label: 'High Risk' },
    { key: 'medium', label: 'Medium Risk' },
    { key: 'low', label: 'Low Risk' },
];

const riskStyle = {
    high: { bg: colors.dangerSoft, text: colors.danger, border: colors.dangerBorder, label: 'High' },
    medium: { bg: colors.warningSoft, text: colors.warningText, border: '#F5D77A', label: 'Medium' },
    low: { bg: colors.successSoft, text: colors.success, border: colors.successBorder, label: 'Low' },
};

const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
};

const getInitials = (name) =>
    String(name ?? 'Patient')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || 'PT';

function StatItem({ label, value }) {
    return (
        <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{value}</Text>
            <Text style={styles.heroStatLabel}>{label}</Text>
        </View>
    );
}

export function DoctorPatientsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const patientsQuery = useDoctorPatientsQuery();
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const patients = patientsQuery.data ?? [];
    const highRiskCount = patients.filter((patient) => patient.riskLevel === 'high').length;
    const mediumRiskCount = patients.filter((patient) => patient.riskLevel === 'medium').length;

    const filteredPatients = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return patients.filter((patient) => {
            const filterMatch = activeFilter === 'all' || patient.riskLevel === activeFilter;
            const searchMatch =
                !q ||
                (patient.fullName ?? '').toLowerCase().includes(q) ||
                String(patient.age ?? '').includes(q) ||
                (patient.condition ?? '').toLowerCase().includes(q);
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
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
                    refreshControl={<RefreshControl onRefresh={() => void patientsQuery.refetch()} refreshing={patientsQuery.isRefetching} tintColor={colors.primary} />}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.heroCard}>
                        <View style={styles.heroTopRow}>
                            <View style={styles.heroIcon}>
                                <AppIcon color="#FFFFFF" name="people" size={26} />
                            </View>
                            <View style={styles.heroBadge}>
                                <AppIcon color={colors.primary} name="verified-user" size={15} />
                                <Text style={styles.heroBadgeText}>Care panel</Text>
                            </View>
                        </View>

                        <Text style={styles.heroTitle}>Patients</Text>
                        <Text style={styles.heroSubtitle}>Review assigned patients, risk levels, and recent care activity.</Text>

                        <View style={styles.heroStatsRow}>
                            <StatItem label="Total" value={patients.length} />
                            <View style={styles.heroStatDivider} />
                            <StatItem label="High Risk" value={highRiskCount} />
                            <View style={styles.heroStatDivider} />
                            <StatItem label="Medium" value={mediumRiskCount} />
                        </View>
                    </View>

                    <View style={styles.searchCard}>
                        <View style={styles.searchRow}>
                            <AppIcon color={colors.textMuted} name="search-outline" size={22} />
                            <TextInput
                                accessibilityLabel="Search patients"
                                autoCapitalize="none"
                                onChangeText={setSearchQuery}
                                placeholder="Search name, age, or condition"
                                placeholderTextColor={colors.textMuted}
                                style={styles.searchInput}
                                value={searchQuery}
                            />
                            {searchQuery ? (
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Clear patient search"
                                    onPress={() => setSearchQuery('')}
                                    style={styles.clearSearchButton}
                                >
                                    <AppIcon color={colors.textMuted} name="close" size={18} />
                                </Pressable>
                            ) : null}
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
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
                    </View>

                    <View style={styles.resultsHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Patient list</Text>
                            <Text style={styles.resultsMeta}>{filteredPatients.length} patient{filteredPatients.length === 1 ? '' : 's'} found</Text>
                        </View>
                        <View style={styles.sortPill}>
                            <AppIcon color={colors.primary} name="folder-open" size={14} />
                            <Text style={styles.sortPillText}>Files</Text>
                        </View>
                    </View>

                    {filteredPatients.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <View style={styles.emptyIcon}>
                                <AppIcon color={colors.primary} name="people-outline" size={28} />
                            </View>
                            <Text style={styles.emptyTitle}>No patients found</Text>
                            <Text style={styles.emptyText}>Try another filter or clear the search field.</Text>
                        </View>
                    ) : (
                        filteredPatients.map((patient) => {
                            const risk = riskStyle[patient.riskLevel] ?? riskStyle.low;
                            return (
                                <Pressable
                                    key={patient.id}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Open ${patient.fullName} file`}
                                    onPress={() =>
                                        router.push({
                                            pathname: '/(app)/(doctor)/patient/[patientId]',
                                            params: { patientId: patient.id },
                                        })
                                    }
                                    style={({ pressed }) => [styles.patientCard, pressed && styles.patientCardPressed]}
                                >
                                    <View style={styles.cardTopRow}>
                                        <View style={[styles.avatar, { backgroundColor: risk.bg }]}>
                                            <Text style={[styles.avatarText, { color: risk.text }]}>{getInitials(patient.fullName)}</Text>
                                        </View>
                                        <View style={styles.cardTextWrap}>
                                            <View style={styles.nameRow}>
                                                <Text numberOfLines={1} style={styles.name}>{patient.fullName}</Text>
                                                <View style={[styles.riskPill, { backgroundColor: risk.bg, borderColor: risk.border }]}>
                                                    <Text style={[styles.riskText, { color: risk.text }]}>{risk.label}</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.condition}>{patient.condition}</Text>
                                            <Text style={styles.meta}>{patient.age} yrs | Last visit {formatDate(patient.lastVisit)}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.metaGrid}>
                                        <View style={styles.metaBox}>
                                            <AppIcon color={colors.primary} name="folder-open" size={17} />
                                            <Text style={styles.metaBoxText}>Open File</Text>
                                        </View>
                                        <View style={styles.metaBox}>
                                            <AppIcon color={risk.text} name={risk.label === 'High' ? 'alert-circle' : 'checkmark-circle'} size={17} />
                                            <Text style={styles.metaBoxText}>{risk.label} priority</Text>
                                        </View>
                                    </View>
                                </Pressable>
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
    filtersRow: {
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
    filterText: {
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    filterTextActive: {
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
    patientCard: {
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: spacing.sm,
        ...shadows.card,
    },
    patientCardPressed: {
        opacity: 0.9,
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 17,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
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
    name: {
        flex: 1,
        color: colors.text,
        fontSize: typography.bodyLarge,
        lineHeight: 22,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    condition: {
        marginTop: 2,
        color: colors.primary,
        fontSize: typography.body,
        lineHeight: 20,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    meta: {
        marginTop: 4,
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        lineHeight: 18,
        fontFamily: fonts.bodyRegular,
    },
    riskPill: {
        borderRadius: radius.full,
        borderWidth: 1,
        paddingVertical: 4,
        paddingHorizontal: spacing.xs,
    },
    riskText: {
        fontSize: 10,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    metaGrid: {
        marginTop: spacing.sm,
        flexDirection: 'row',
        gap: spacing.xs,
    },
    metaBox: {
        flex: 1,
        minHeight: 42,
        borderRadius: radius.sm,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: spacing.xs,
    },
    metaBoxText: {
        flex: 1,
        color: colors.text,
        fontSize: typography.caption,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    emptyCard: {
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: spacing.lg,
        alignItems: 'center',
        gap: spacing.xs,
    },
    emptyIcon: {
        width: 58,
        height: 58,
        borderRadius: 20,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        color: colors.text,
        fontSize: typography.bodyLarge,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        textAlign: 'center',
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: typography.body,
        lineHeight: 21,
        fontFamily: fonts.bodyRegular,
        textAlign: 'center',
    },
});
