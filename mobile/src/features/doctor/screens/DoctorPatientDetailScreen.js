import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing, typography } from '@/src/core/theme/tokens';
import { useDoctorPatientDetailQuery } from '@/src/features/doctor/hooks/useDoctorPatientDetailQuery';
import { LoadingView } from '@/src/shared/components/LoadingView';
import AppIcon from '@/src/shared/components/AppIcon';

const tabs = ['History', 'Prescriptions', 'Results', 'Vitals'];

const STATUS_STYLE = {
    active: { bg: colors.successSoft, text: colors.success, border: colors.successBorder },
    completed: { bg: colors.infoSoft, text: colors.info, border: colors.infoBorder },
    cancelled: { bg: colors.dangerSoft, text: colors.danger, border: colors.dangerBorder },
};

const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
};

const getInitials = (name) =>
    (name ?? '')
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');

export function DoctorPatientDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const patientId = typeof params.patientId === 'string' ? params.patientId : '';
    const detailQuery = useDoctorPatientDetailQuery(patientId);
    const [activeTab, setActiveTab] = useState('History');

    if (!patientId) {
        return (
            <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
                <View style={styles.centered}>
                    <Text style={styles.centerTitle}>Invalid route</Text>
                    <Text style={styles.centerText}>Open this screen from the patient list.</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (detailQuery.isLoading) {
        return (
            <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
                <LoadingView label="Loading patient profile..." />
            </SafeAreaView>
        );
    }

    const detail = detailQuery.data;

    if (!detail || !detail.profile) {
        return (
            <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
                <View style={styles.centered}>
                    <Text style={styles.centerTitle}>Patient not found</Text>
                    <Text style={styles.centerText}>Please refresh and try again.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const content = useMemo(() => {
        if (activeTab === 'History') {
            return (detail.history ?? []).map((entry, index) => ({
                id: `history-${index}`,
                title: `Clinical Note ${index + 1}`,
                body: entry,
                meta: null,
                status: null,
            }));
        }

        if (activeTab === 'Prescriptions') {
            return (detail.prescriptions ?? []).map((item) => ({
                id: item.id,
                title: item.medication,
                body: `${item.dosage}  ·  ${item.frequency}  ·  ${item.duration}`,
                meta: `Prescribed by ${item.prescribedBy ?? 'Doctor'}`,
                status: item.status,
            }));
        }

        if (activeTab === 'Results') {
            return (detail.results ?? []).map((result) => ({
                id: result.id,
                title: result.name,
                body: result.summary,
                meta: `${result.kind ?? ''}  ·  ${result.status ?? ''}`,
                status: null,
            }));
        }

        return (detail.vitals ?? []).map((vital) => ({
            id: vital.id,
            title: vital.label,
            body: vital.value,
            meta: formatDate(vital.recordedAt),
            status: null,
        }));
    }, [activeTab, detail.history, detail.prescriptions, detail.results, detail.vitals]);

    const { profile } = detail;
    const initials = getInitials(profile.fullName);

    return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.headerRow}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <AppIcon color={colors.text} name="chevron-back" size={24} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Patient Details</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl
                            onRefresh={() => void detailQuery.refetch()}
                            refreshing={detailQuery.isRefetching}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {/* Profile hero */}
                    <View style={styles.profileHero}>
                        <View style={styles.avatarRing}>
                            {initials ? (
                                <Text style={styles.avatarInitials}>{initials}</Text>
                            ) : (
                                <AppIcon color="rgba(255,255,255,0.8)" name="person" size={36} />
                            )}
                        </View>
                        <Text style={styles.patientName}>{profile.fullName ?? 'Unknown Patient'}</Text>
                        <Text style={styles.patientId}>ID: {profile.patientId ?? '—'}</Text>

                        <View style={styles.pillsRow}>
                            {profile.age != null ? (
                                <View style={styles.infoPill}>
                                    <Text style={styles.infoPillText}>{profile.age} yrs</Text>
                                </View>
                            ) : null}
                            {profile.gender ? (
                                <View style={styles.infoPill}>
                                    <Text style={styles.infoPillText}>{profile.gender}</Text>
                                </View>
                            ) : null}
                        </View>

                        {(profile.phone || profile.email) ? (
                            <View style={styles.contactRow}>
                                {profile.phone ? (
                                    <View style={styles.contactItem}>
                                        <AppIcon color="rgba(255,255,255,0.7)" name="call-outline" size={14} />
                                        <Text style={styles.contactText}>{profile.phone}</Text>
                                    </View>
                                ) : null}
                                {profile.email ? (
                                    <View style={styles.contactItem}>
                                        <AppIcon color="rgba(255,255,255,0.7)" name="mail-outline" size={14} />
                                        <Text style={styles.contactText}>{profile.email}</Text>
                                    </View>
                                ) : null}
                            </View>
                        ) : null}
                    </View>

                    {/* Tab bar */}
                    <View style={styles.segmentedControl}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segmentedInner}>
                            {tabs.map((tab) => {
                                const active = tab === activeTab;
                                return (
                                    <Pressable
                                        key={tab}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Show ${tab}`}
                                        onPress={() => setActiveTab(tab)}
                                        style={[styles.segmentButton, active && styles.segmentButtonActive]}
                                    >
                                        <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{tab}</Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Content card */}
                    <View style={styles.contentCard}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>{activeTab}</Text>
                            {activeTab === 'Prescriptions' ? (
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Add prescription"
                                    onPress={() =>
                                        router.push({
                                            pathname: '/(app)/(doctor)/patient/[patientId]/prescription',
                                            params: { patientId },
                                        })
                                    }
                                    style={styles.addButton}
                                >
                                    <AppIcon color="#FFFFFF" name="add" size={15} />
                                    <Text style={styles.addButtonText}>Add</Text>
                                </Pressable>
                            ) : null}
                        </View>

                        {content.length === 0 ? (
                            <View style={styles.emptyWrap}>
                                <AppIcon color={colors.textMuted} name="document-outline" size={32} />
                                <Text style={styles.emptyText}>No records in this section.</Text>
                            </View>
                        ) : (
                            content.map((item) => {
                                const statusStyle = item.status ? (STATUS_STYLE[item.status] ?? STATUS_STYLE.active) : null;
                                return (
                                    <View key={item.id} style={styles.itemCard}>
                                        <View style={styles.itemTopRow}>
                                            <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                                            {statusStyle ? (
                                                <View style={[styles.statusPill, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                                                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                                                        {item.status}
                                                    </Text>
                                                </View>
                                            ) : null}
                                        </View>
                                        <Text style={styles.itemBody}>{item.body}</Text>
                                        {item.meta ? <Text style={styles.itemMeta}>{item.meta}</Text> : null}
                                    </View>
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
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    headerRow: {
        height: 64,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingHorizontal: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: colors.text,
        fontSize: typography.heading,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    headerSpacer: { width: 44 },
    scrollContent: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: 110,
    },

    /* Profile hero */
    profileHero: {
        backgroundColor: colors.primary,
        borderRadius: radius.lg,
        paddingVertical: 24,
        paddingHorizontal: spacing.md,
        alignItems: 'center',
    },
    avatarRing: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    avatarInitials: {
        color: '#FFFFFF',
        fontSize: 28,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    patientName: {
        color: '#FFFFFF',
        fontSize: typography.h3,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    patientId: {
        marginTop: 2,
        color: 'rgba(255,255,255,0.7)',
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyMedium,
    },
    pillsRow: {
        flexDirection: 'row',
        gap: spacing.xs,
        marginTop: 10,
    },
    infoPill: {
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: radius.full,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    infoPillText: {
        color: '#FFFFFF',
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    contactRow: {
        marginTop: 10,
        gap: 6,
        alignItems: 'center',
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    contactText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyRegular,
    },

    /* Segment */
    segmentedControl: {
        marginTop: spacing.sm,
        backgroundColor: colors.border,
        borderRadius: radius.sm,
        padding: 4,
    },
    segmentedInner: {
        gap: spacing.xs,
        paddingHorizontal: 2,
    },
    segmentButton: {
        borderRadius: 10,
        paddingHorizontal: spacing.sm,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentButtonActive: {
        backgroundColor: '#FFFFFF',
    },
    segmentText: {
        color: colors.textMuted,
        fontSize: typography.body,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    segmentTextActive: {
        color: colors.primary,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },

    /* Content */
    contentCard: {
        marginTop: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.sm,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    sectionTitle: {
        color: colors.text,
        fontSize: typography.bodyLarge,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.primary,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: typography.caption,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    emptyWrap: {
        alignItems: 'center',
        paddingVertical: 24,
        gap: spacing.xs,
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: typography.body,
        fontFamily: fonts.bodyRegular,
        textAlign: 'center',
    },
    itemCard: {
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.sm,
        marginTop: spacing.xs,
    },
    itemTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: spacing.xs,
    },
    itemTitle: {
        flex: 1,
        color: colors.text,
        fontSize: typography.body,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    statusPill: {
        borderRadius: radius.full,
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    statusText: {
        fontSize: typography.caption,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        textTransform: 'capitalize',
        letterSpacing: 0.3,
    },
    itemBody: {
        marginTop: 4,
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyRegular,
    },
    itemMeta: {
        marginTop: 6,
        color: colors.textSubtle,
        fontSize: typography.caption,
        fontFamily: fonts.bodyMedium,
    },

    /* Error / empty states */
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.background,
    },
    centerTitle: {
        color: colors.text,
        fontSize: typography.heading,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    centerText: {
        marginTop: 4,
        color: colors.textMuted,
        fontSize: typography.body,
        fontFamily: fonts.bodyRegular,
        textAlign: 'center',
    },
});
