import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '@/src/core/theme/tokens';
import { useLabResultsQuery } from '@/src/features/patient/hooks/useLabResultsQuery';
import { usePatientMedicalSummaryQuery } from '@/src/features/patient/hooks/usePatientMedicalSummaryQuery';
import { usePatientProfileQuery } from '@/src/features/patient/hooks/usePatientProfileQuery';
import { usePrescriptionsQuery } from '@/src/features/patient/hooks/usePrescriptionsQuery';
import { LoadingView } from '@/src/shared/components/LoadingView';
import AppIcon from '@/src/shared/components/AppIcon';

const palette = {
    background: '#F3F4F8',
    surface: '#FFFFFF',
    primary: '#1D4ED8',
    text: '#111827',
    muted: '#6B7280',
    label: '#9CA3AF',
    border: '#E5E7EB',
    divider: '#F3F4F8',
    successBg: '#DCFCE7',
    successText: '#15803D',
    infoBg: '#EFF6FF',
    infoText: '#1D4ED8',
    infoBorder: '#BFDBFE',
    warnBg: '#FEF3C7',
    warnText: '#92400E',
    warnBorder: '#FDE68A',
    dangerBg: '#FEE2E2',
    dangerText: '#B91C1C',
    tagBg: '#F1F5F9',
    tagText: '#475569',
};

function SectionCard({ title, icon, children }) {
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.cardIconWrap}>
                    <AppIcon color={palette.primary} name={icon} size={18} />
                </View>
                <Text style={styles.cardTitle}>{title}</Text>
            </View>
            <View style={styles.cardBody}>{children}</View>
        </View>
    );
}

function FieldRow({ label, value, empty = '—' }) {
    return (
        <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <Text style={[styles.fieldValue, !value && styles.fieldEmpty]}>
                {value || empty}
            </Text>
        </View>
    );
}

function Tag({ text, bg, color }) {
    return (
        <View style={[styles.tag, { backgroundColor: bg ?? palette.tagBg }]}>
            <Text style={[styles.tagText, { color: color ?? palette.tagText }]}>{text}</Text>
        </View>
    );
}

function TagList({ items, emptyLabel, bg, color }) {
    if (!items || items.length === 0) {
        return <Text style={styles.fieldEmpty}>{emptyLabel}</Text>;
    }
    return (
        <View style={styles.tagRow}>
            {items.map((item) => (
                <Tag key={item} text={item} bg={bg} color={color} />
            ))}
        </View>
    );
}

const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '—';

const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(d);
};

export function PatientRecordsScreen() {
    const profileQuery = usePatientProfileQuery();
    const summaryQuery = usePatientMedicalSummaryQuery();
    const prescriptionsQuery = usePrescriptionsQuery();
    const resultsQuery = useLabResultsQuery();

    const isLoading =
        profileQuery.isLoading ||
        summaryQuery.isLoading ||
        prescriptionsQuery.isLoading ||
        resultsQuery.isLoading;

    if (isLoading) {
        return (
            <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
                <LoadingView label="Loading medical record..." />
            </SafeAreaView>
        );
    }

    const profile = profileQuery.data ?? {};
    const summary = summaryQuery.data ?? {};
    const prescriptions = prescriptionsQuery.data ?? [];
    const results = resultsQuery.data ?? [];

    const addressParts = [
        profile.address?.street,
        profile.address?.city,
        profile.address?.state,
        profile.address?.country,
    ].filter(Boolean);
    const addressLine = addressParts.join(', ') || null;

    const ec = profile.emergencyContact;
    const ecLine = ec?.name
        ? `${ec.name}${ec.relationship ? ` (${ec.relationship})` : ''}${ec.phone ? ' · ' + ec.phone : ''}`
        : null;

    return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Patient Identity */}
                <SectionCard title="Patient Information" icon="person-circle-outline">
                    <FieldRow label="Full Name" value={profile.fullName} />
                    <FieldRow label="Patient ID" value={profile.patientId} />
                    <FieldRow label="Date of Birth" value={formatDate(profile.dateOfBirth)} />
                    <FieldRow label="Age" value={profile.age != null ? `${profile.age} years` : null} />
                    <FieldRow label="Gender" value={capitalize(profile.gender)} />
                    <FieldRow label="Phone" value={profile.phone} />
                    <FieldRow label="Email" value={profile.email} />
                    {addressLine ? <FieldRow label="Address" value={addressLine} /> : null}
                    <FieldRow label="Emergency Contact" value={ecLine} />
                </SectionCard>

                {/* Physical Measurements */}
                <SectionCard title="Physical Measurements" icon="body-outline">
                    <View style={styles.metricsRow}>
                        <View style={styles.metricBox}>
                            <Text style={styles.metricValue}>
                                {profile.height ? `${profile.height}` : '—'}
                            </Text>
                            <Text style={styles.metricUnit}>cm</Text>
                            <Text style={styles.metricLabel}>Height</Text>
                        </View>
                        <View style={styles.metricDivider} />
                        <View style={styles.metricBox}>
                            <Text style={styles.metricValue}>
                                {profile.weight ? `${profile.weight}` : '—'}
                            </Text>
                            <Text style={styles.metricUnit}>kg</Text>
                            <Text style={styles.metricLabel}>Weight</Text>
                        </View>
                        <View style={styles.metricDivider} />
                        <View style={styles.metricBox}>
                            <Text style={styles.metricValue}>
                                {profile.bmi ? `${profile.bmi}` : '—'}
                            </Text>
                            <Text style={styles.metricUnit}>BMI</Text>
                            <Text style={styles.metricLabel}>Index</Text>
                        </View>
                    </View>
                </SectionCard>

                {/* Medical Profile */}
                <SectionCard title="Medical Profile" icon="medkit-outline">
                    <FieldRow label="Blood Group" value={summary.bloodGroup} />
                    <FieldRow label="Primary Doctor" value={summary.primaryDoctor} />
                    <FieldRow label="Last Visit" value={formatDate(summary.lastVisit)} />

                    <View style={styles.fieldDivider} />

                    <Text style={styles.subSectionLabel}>ALLERGIES</Text>
                    <TagList
                        items={summary.allergies}
                        emptyLabel="No known allergies"
                        bg={palette.dangerBg}
                        color={palette.dangerText}
                    />

                    <Text style={[styles.subSectionLabel, { marginTop: 14 }]}>CHRONIC CONDITIONS</Text>
                    <TagList
                        items={summary.chronicConditions}
                        emptyLabel="No chronic conditions on record"
                        bg={palette.warnBg}
                        color={palette.warnText}
                    />

                    <Text style={[styles.subSectionLabel, { marginTop: 14 }]}>ACTIVE MEDICATIONS</Text>
                    <TagList
                        items={summary.activeMedications}
                        emptyLabel="No active medications"
                        bg={palette.infoBg}
                        color={palette.infoText}
                    />
                </SectionCard>

                {/* Prescriptions */}
                <SectionCard title="Prescriptions" icon="document-text-outline">
                    {prescriptions.length === 0 ? (
                        <View style={styles.emptyRow}>
                            <AppIcon color={palette.label} name="document-outline" size={20} />
                            <Text style={styles.emptyText}>No prescriptions on file.</Text>
                        </View>
                    ) : (
                        prescriptions.map((rx, index) => (
                            <View key={rx.id} style={[styles.prescriptionRow, index > 0 && styles.rowDivider]}>
                                <View style={styles.rxHeader}>
                                    <Text style={styles.rxName}>{rx.medication}</Text>
                                    <View style={[styles.statusBadge, rx.status === 'active' ? styles.badgeActive : styles.badgeInactive]}>
                                        <Text style={[styles.statusBadgeText, rx.status === 'active' ? styles.badgeActiveText : styles.badgeInactiveText]}>
                                            {rx.status?.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.rxDetail}>{rx.dosage} · {rx.frequency} · {rx.duration}</Text>
                                {rx.instructions ? (
                                    <Text style={styles.rxInstructions}>{rx.instructions}</Text>
                                ) : null}
                                <Text style={styles.rxDoctor}>Prescribed by {rx.prescribedBy}</Text>
                            </View>
                        ))
                    )}
                </SectionCard>

                {/* Lab & Imaging Results */}
                <SectionCard title="Lab & Imaging Results" icon="flask-outline">
                    {results.length === 0 ? (
                        <View style={styles.emptyRow}>
                            <AppIcon color={palette.label} name="flask-outline" size={20} />
                            <Text style={styles.emptyText}>No results on file.</Text>
                        </View>
                    ) : (
                        results.map((result, index) => (
                            <View key={result.id} style={[styles.resultRow, index > 0 && styles.rowDivider]}>
                                <View style={styles.resultHeader}>
                                    <Text style={styles.resultName}>{result.name}</Text>
                                    <View style={[styles.kindBadge, result.kind === 'imaging' ? styles.kindImaging : styles.kindLab]}>
                                        <Text style={[styles.kindBadgeText, result.kind === 'imaging' ? styles.kindImagingText : styles.kindLabText]}>
                                            {result.kind?.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.resultStatus}>{result.status?.toUpperCase()} · {formatDate(result.collectedAt)}</Text>
                                {result.summary ? (
                                    <Text style={styles.resultSummary}>{result.summary}</Text>
                                ) : null}
                                <Text style={styles.rxDoctor}>Ordered by {result.orderedBy}</Text>
                            </View>
                        ))
                    )}
                </SectionCard>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: palette.background,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 32,
        gap: 12,
    },
    card: {
        backgroundColor: palette.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: palette.border,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: palette.divider,
    },
    cardIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: palette.infoBg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        color: palette.text,
        fontSize: 16,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    cardBody: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingVertical: 7,
        gap: 12,
    },
    fieldLabel: {
        color: palette.label,
        fontSize: 13,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
        flexShrink: 0,
        minWidth: 120,
    },
    fieldValue: {
        flex: 1,
        color: palette.text,
        fontSize: 14,
        fontFamily: fonts.bodyMedium,
        textAlign: 'right',
    },
    fieldEmpty: {
        color: palette.muted,
        fontFamily: fonts.bodyRegular,
    },
    fieldDivider: {
        height: 1,
        backgroundColor: palette.divider,
        marginVertical: 10,
    },
    subSectionLabel: {
        color: palette.label,
        fontSize: 11,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    tag: {
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    tagText: {
        fontSize: 13,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    metricsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: 8,
    },
    metricBox: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
    },
    metricDivider: {
        width: 1,
        height: 48,
        backgroundColor: palette.border,
    },
    metricValue: {
        color: palette.primary,
        fontSize: 26,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    metricUnit: {
        color: palette.muted,
        fontSize: 12,
        fontFamily: fonts.bodyRegular,
        marginTop: -2,
    },
    metricLabel: {
        color: palette.label,
        fontSize: 12,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
        marginTop: 4,
    },
    prescriptionRow: {
        paddingVertical: 10,
        gap: 3,
    },
    resultRow: {
        paddingVertical: 10,
        gap: 3,
    },
    rowDivider: {
        borderTopWidth: 1,
        borderTopColor: palette.divider,
    },
    rxHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    rxName: {
        color: palette.text,
        fontSize: 15,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        flex: 1,
    },
    rxDetail: {
        color: palette.muted,
        fontSize: 13,
        fontFamily: fonts.bodyRegular,
    },
    rxInstructions: {
        color: palette.text,
        fontSize: 13,
        fontFamily: fonts.bodyRegular,
        fontStyle: 'italic',
    },
    rxDoctor: {
        color: palette.label,
        fontSize: 12,
        fontFamily: fonts.bodyRegular,
        marginTop: 2,
    },
    statusBadge: {
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    badgeActive: {
        backgroundColor: palette.successBg,
    },
    badgeInactive: {
        backgroundColor: palette.tagBg,
    },
    statusBadgeText: {
        fontSize: 10,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    badgeActiveText: {
        color: palette.successText,
    },
    badgeInactiveText: {
        color: palette.tagText,
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    resultName: {
        color: palette.text,
        fontSize: 15,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        flex: 1,
    },
    resultStatus: {
        color: palette.muted,
        fontSize: 12,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    resultSummary: {
        color: palette.text,
        fontSize: 13,
        fontFamily: fonts.bodyRegular,
        lineHeight: 19,
    },
    kindBadge: {
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    kindLab: {
        backgroundColor: palette.infoBg,
    },
    kindImaging: {
        backgroundColor: '#F3E8FF',
    },
    kindBadgeText: {
        fontSize: 10,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    kindLabText: {
        color: palette.infoText,
    },
    kindImagingText: {
        color: '#7C3AED',
    },
    emptyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 6,
    },
    emptyText: {
        color: palette.muted,
        fontSize: 14,
        fontFamily: fonts.bodyRegular,
    },
});
