import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing, typography } from '@/src/core/theme/tokens';
import { useNursePatientsQuery } from '@/src/features/patients/hooks/useNursePatientsQuery';
import { EmptyState } from '@/src/shared/components/EmptyState';
import { LoadingView } from '@/src/shared/components/LoadingView';

const riskConfig = {
    low: { color: colors.success, bg: colors.successSoft, border: colors.successBorder, label: 'Low' },
    medium: { color: colors.warningText, bg: colors.warningSoft, border: '#F5D77A', label: 'Medium' },
    high: { color: colors.danger, bg: colors.dangerSoft, border: colors.dangerBorder, label: 'High' },
};

function getInitials(name) {
    return name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
}

function PatientCard({ patient }) {
    const risk = riskConfig[patient.riskLevel] ?? riskConfig.low;
    const initials = getInitials(patient.fullName);
    const updatedTime = new Date(patient.updatedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <View style={[styles.card, { borderLeftColor: risk.color }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.avatar, { backgroundColor: risk.bg }]}>
                    <Text style={[styles.avatarText, { color: risk.color }]}>{initials}</Text>
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.patientName}>{patient.fullName}</Text>
                    <Text style={styles.conditionText}>{patient.condition}</Text>
                </View>
                <View style={[styles.riskBadge, { backgroundColor: risk.bg, borderColor: risk.border }]}>
                    <Text style={[styles.riskText, { color: risk.color }]}>{risk.label}</Text>
                </View>
            </View>

            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Bed</Text>
                    <Text style={styles.metaValue}>{patient.bedNumber}</Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Age</Text>
                    <Text style={styles.metaValue}>{patient.age} yrs</Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Updated</Text>
                    <Text style={styles.metaValue}>{updatedTime}</Text>
                </View>
            </View>
        </View>
    );
}

export function NursePatientsScreen() {
    const insets = useSafeAreaInsets();
    const { data, isLoading, isRefetching, refetch } = useNursePatientsQuery();

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
                <LoadingView label="Loading patients…" />
            </SafeAreaView>
        );
    }

    const patients = data ?? [];
    const highRisk = patients.filter((p) => p.riskLevel === 'high');
    const rest = patients.filter((p) => p.riskLevel !== 'high');
    const sorted = [...highRisk, ...rest];

    return (
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={() => void refetch()}
                        tintColor={colors.primary}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.pageHeader}>
                    <Text style={styles.pageTitle}>Assigned Patients</Text>
                    <Text style={styles.pageCount}>{patients.length} total</Text>
                </View>

                {sorted.length === 0 ? (
                    <EmptyState
                        icon="people-outline"
                        title="No patients assigned"
                        subtitle="Your ward assignments will appear here."
                    />
                ) : (
                    <View style={styles.list}>
                        {sorted.map((patient) => (
                            <PatientCard key={patient.id} patient={patient} />
                        ))}
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
    scrollContent: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: 16,
    },
    pageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: spacing.sm,
    },
    pageTitle: {
        color: colors.text,
        fontSize: typography.h3,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    pageCount: {
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyMedium,
    },
    list: {
        gap: spacing.xs,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 4,
        padding: spacing.md,
        shadowColor: '#142850',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    avatarText: {
        fontSize: 15,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    cardInfo: {
        flex: 1,
    },
    patientName: {
        color: colors.text,
        fontSize: typography.bodyLarge,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    conditionText: {
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyRegular,
        marginTop: 2,
    },
    riskBadge: {
        borderRadius: radius.full,
        borderWidth: 1,
        paddingHorizontal: spacing.xs,
        paddingVertical: 3,
    },
    riskText: {
        fontSize: typography.caption,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    metaRow: {
        flexDirection: 'row',
        backgroundColor: colors.surfaceTint,
        borderRadius: radius.sm,
        overflow: 'hidden',
    },
    metaItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.xs,
    },
    metaDivider: {
        width: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.xxs,
    },
    metaLabel: {
        color: colors.textSubtle,
        fontSize: 10,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    metaValue: {
        color: colors.text,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        marginTop: 2,
    },
});
