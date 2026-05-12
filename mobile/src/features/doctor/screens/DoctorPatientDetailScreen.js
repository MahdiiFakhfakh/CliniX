import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '@/src/core/theme/tokens';
import { useDoctorPatientDetailQuery } from '@/src/features/doctor/hooks/useDoctorPatientDetailQuery';
import { LoadingView } from '@/src/shared/components/LoadingView';
import AppIcon from '@/src/shared/components/AppIcon';

const palette = {
    background: '#F3F4F8',
    surface: '#FFFFFF',
    primary: '#1D4ED8',
    text: '#111827',
    muted: '#6B7280',
    border: '#E5E7EB',
    segmentBg: '#E5E7EB',
    danger: '#DC2626',
};

const tabs = ['History', 'Notes', 'Prescriptions', 'Results', 'Vitals'];

const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'N/A';
    }
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
};

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

    if (!detail) {
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
                meta: '',
            }));
        }

        if (activeTab === 'Notes') {
            return (detail.notes ?? []).map((note) => ({
                id: note.id,
                title: `SOAP ${formatDate(note.createdAt)}`,
                body: `S: ${note.subjective}\nO: ${note.objective}\nA: ${note.assessment}\nP: ${note.plan}`,
                meta: '',
            }));
        }

        if (activeTab === 'Prescriptions') {
            return (detail.prescriptions ?? []).map((item) => ({
                id: item.id,
                title: item.medication,
                body: `${item.dosage}  |  ${item.frequency}  |  ${item.duration}`,
                meta: `Status: ${item.status}`,
            }));
        }

        if (activeTab === 'Results') {
            return (detail.results ?? []).map((result) => ({
                id: result.id,
                title: result.name,
                body: result.summary,
                meta: `${result.kind}  |  ${result.status}`,
            }));
        }

        return (detail.vitals ?? []).map((vital) => ({
            id: vital.id,
            title: vital.label,
            body: vital.value,
            meta: formatDate(vital.recordedAt),
        }));
    }, [activeTab, detail.history, detail.notes, detail.prescriptions, detail.results, detail.vitals]);

    return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <AppIcon color={palette.text} name="chevron-back" size={24} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Patient Details</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl onRefresh={() => void detailQuery.refetch()} refreshing={detailQuery.isRefetching} />}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.profileCard}>
                        <View style={styles.avatar}>
                            <AppIcon color="#64748B" name="person" size={42} />
                        </View>
                        <Text style={styles.patientName}>{detail.profile.fullName}</Text>
                        <Text style={styles.patientSub}>ID: {detail.profile.patientId}</Text>
                        <Text style={styles.patientSub}>
                            {detail.profile.age} yrs  |  {detail.profile.gender}
                        </Text>
                        <Text style={styles.patientSub}>{detail.profile.phone}</Text>
                        <Text style={styles.patientSub}>{detail.profile.email}</Text>
                    </View>

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

                    <View style={styles.contentCard}>
                        <Text style={styles.sectionTitle}>{activeTab}</Text>
                        {content.length === 0 ? (
                            <Text style={styles.emptyText}>No records in this section.</Text>
                        ) : (
                            content.map((item) => (
                                <View key={item.id} style={styles.itemCard}>
                                    <Text style={styles.itemTitle}>{item.title}</Text>
                                    <Text style={styles.itemBody}>{item.body}</Text>
                                    {item.meta ? <Text style={styles.itemMeta}>{item.meta}</Text> : null}
                                </View>
                            ))
                        )}
                    </View>

                    <View style={styles.actions}>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Create SOAP note"
                            onPress={() =>
                                router.push({
                                    pathname: '/(app)/(doctor)/patient/[patientId]/note',
                                    params: { patientId },
                                })
                            }
                            style={styles.primaryAction}
                        >
                            <Text style={styles.primaryActionText}>Create Note</Text>
                        </Pressable>

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Create lab request"
                            onPress={() =>
                                router.push({
                                    pathname: '/(app)/(doctor)/patient/[patientId]/lab-request',
                                    params: { patientId },
                                })
                            }
                            style={styles.dangerAction}
                        >
                            <Text style={styles.dangerActionText}>Create Lab Request</Text>
                        </Pressable>
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
    headerRow: {
        height: 64,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        paddingHorizontal: 16,
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
        color: palette.text,
        fontSize: 20,
        lineHeight: 26,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    headerSpacer: {
        width: 44,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 110,
    },
    profileCard: {
        backgroundColor: palette.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.border,
        padding: 16,
        alignItems: 'center',
    },
    avatar: {
        width: 82,
        height: 82,
        borderRadius: 41,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    patientName: {
        color: palette.text,
        fontSize: 22,
        lineHeight: 28,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    patientSub: {
        marginTop: 2,
        color: palette.muted,
        fontSize: 14,
        lineHeight: 19,
        fontFamily: fonts.bodyRegular,
        textAlign: 'center',
    },
    segmentedControl: {
        marginTop: 14,
        backgroundColor: palette.segmentBg,
        borderRadius: 16,
        padding: 5,
    },
    segmentedInner: {
        gap: 8,
        paddingHorizontal: 1,
    },
    segmentButton: {
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentButtonActive: {
        backgroundColor: '#FFFFFF',
    },
    segmentText: {
        color: '#6B7280',
        fontSize: 14,
        lineHeight: 19,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    segmentTextActive: {
        color: palette.primary,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    contentCard: {
        marginTop: 14,
        backgroundColor: palette.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.border,
        padding: 14,
    },
    sectionTitle: {
        color: palette.text,
        fontSize: 18,
        lineHeight: 24,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        marginBottom: 8,
    },
    itemCard: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.border,
        padding: 12,
        marginTop: 8,
    },
    itemTitle: {
        color: palette.text,
        fontSize: 15,
        lineHeight: 20,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    itemBody: {
        marginTop: 3,
        color: '#374151',
        fontSize: 13,
        lineHeight: 18,
        fontFamily: fonts.bodyRegular,
    },
    itemMeta: {
        marginTop: 6,
        color: palette.muted,
        fontSize: 12,
        lineHeight: 17,
        fontFamily: fonts.bodyMedium,
    },
    actions: {
        marginTop: 16,
        gap: 10,
    },
    primaryAction: {
        height: 50,
        borderRadius: 14,
        backgroundColor: palette.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryActionText: {
        color: '#FFFFFF',
        fontSize: 15,
        lineHeight: 20,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    secondaryAction: {
        height: 50,
        borderRadius: 14,
        backgroundColor: '#E0E7FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryActionText: {
        color: palette.primary,
        fontSize: 15,
        lineHeight: 20,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    dangerAction: {
        height: 50,
        borderRadius: 14,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dangerActionText: {
        color: palette.danger,
        fontSize: 15,
        lineHeight: 20,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    emptyText: {
        color: palette.muted,
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        paddingVertical: 8,
        fontFamily: fonts.bodyRegular,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        backgroundColor: palette.background,
    },
    centerTitle: {
        color: palette.text,
        fontSize: 20,
        lineHeight: 26,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    centerText: {
        marginTop: 4,
        color: palette.muted,
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        fontFamily: fonts.bodyRegular,
    },
});
