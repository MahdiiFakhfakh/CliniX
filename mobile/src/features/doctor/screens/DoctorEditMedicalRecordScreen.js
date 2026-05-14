import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { z } from 'zod';
import { colors, fonts, radius, shadows, spacing, typography } from '@/src/core/theme/tokens';
import { useDoctorPatientDetailQuery } from '@/src/features/doctor/hooks/useDoctorPatientDetailQuery';
import { useUpdatePatientMedicalRecordMutation } from '@/src/features/doctor/hooks/useUpdatePatientMedicalRecordMutation';
import AppIcon from '@/src/shared/components/AppIcon';
import { Card } from '@/src/shared/components/Card';
import { LoadingView } from '@/src/shared/components/LoadingView';
import { PrimaryButton } from '@/src/shared/components/PrimaryButton';
import { Screen } from '@/src/shared/components/Screen';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

const medicalRecordSchema = z.object({
    bloodGroup: z.enum(BLOOD_GROUPS),
    allergies: z.string().optional(),
    chronicConditions: z.string().optional(),
    activeMedications: z.string().optional(),
    height: z.string().optional(),
    weight: z.string().optional(),
    notes: z.string().optional(),
});

const listToText = (items) => (Array.isArray(items) ? items.join(', ') : '');

function RecordField({ control, name, label, placeholder, keyboardType = 'default', multiline = false }) {
    return (
        <Controller
            control={control}
            name={name}
            render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
                <View style={styles.field}>
                    <Text style={styles.label}>{label}</Text>
                    <TextInput
                        accessibilityLabel={label}
                        keyboardType={keyboardType}
                        multiline={multiline}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder={placeholder}
                        placeholderTextColor={colors.textMuted}
                        style={[styles.input, multiline && styles.textArea, error && styles.inputError]}
                        textAlignVertical={multiline ? 'top' : 'center'}
                        value={String(value ?? '')}
                    />
                    {error?.message ? <Text style={styles.error}>{error.message}</Text> : null}
                </View>
            )}
        />
    );
}

export function DoctorEditMedicalRecordScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const patientId = typeof params.patientId === 'string' ? params.patientId : '';
    const detailQuery = useDoctorPatientDetailQuery(patientId);
    const updateMutation = useUpdatePatientMedicalRecordMutation(patientId);

    const { control, handleSubmit, reset, watch, setValue } = useForm({
        resolver: zodResolver(medicalRecordSchema),
        defaultValues: {
            bloodGroup: 'Unknown',
            allergies: '',
            chronicConditions: '',
            activeMedications: '',
            height: '',
            weight: '',
            notes: '',
        },
    });

    useEffect(() => {
        const record = detailQuery.data?.medicalRecord;
        if (!record) return;

        reset({
            bloodGroup: BLOOD_GROUPS.includes(record.bloodGroup) ? record.bloodGroup : 'Unknown',
            allergies: listToText(record.allergies),
            chronicConditions: listToText(record.chronicConditions),
            activeMedications: listToText(record.activeMedications),
            height: record.height != null ? String(record.height) : '',
            weight: record.weight != null ? String(record.weight) : '',
            notes: record.notes ?? '',
        });
    }, [detailQuery.data?.medicalRecord, reset]);

    const selectedBloodGroup = watch('bloodGroup');

    const onSubmit = handleSubmit(async (values) => {
        try {
            await updateMutation.mutateAsync({
                patientId,
                bloodGroup: values.bloodGroup,
                allergies: values.allergies ?? '',
                chronicConditions: values.chronicConditions ?? '',
                activeMedications: values.activeMedications ?? '',
                height: values.height ?? '',
                weight: values.weight ?? '',
                notes: values.notes ?? '',
            });
            Alert.alert('Record updated', 'The patient medical record has been saved.');
            router.back();
        } catch {
            // Global mutation handling surfaces the API error.
        }
    });

    if (detailQuery.isLoading) {
        return <LoadingView label="Loading medical record..." />;
    }

    const patientName = detailQuery.data?.profile?.fullName ?? 'Patient';

    return (
        <Screen>
            <View style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                    <Pressable
                        accessibilityLabel="Return to patient file"
                        accessibilityRole="button"
                        onPress={() => router.back()}
                        style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.75 }]}
                    >
                        <AppIcon color={colors.primary} name="chevron-back" size={20} />
                    </Pressable>
                    <View style={styles.heroBadge}>
                        <AppIcon color={colors.primary} name="folder-open" size={15} />
                        <Text style={styles.heroBadgeText}>Medical record</Text>
                    </View>
                </View>

                <View style={styles.heroIcon}>
                    <AppIcon color="#FFFFFF" name="heart" size={28} />
                </View>
                <Text style={styles.heroTitle}>Edit Record</Text>
                <Text style={styles.heroSubtitle}>Update medical details for {patientName}.</Text>
            </View>

            <Card>
                <Text style={styles.sectionTitle}>Clinical Summary</Text>
                <Text style={styles.sectionSubtitle}>Use commas for multiple allergies, conditions, or medications.</Text>

                <Text style={styles.label}>Blood Group</Text>
                <View style={styles.chipGrid}>
                    {BLOOD_GROUPS.map((group) => {
                        const active = selectedBloodGroup === group;
                        return (
                            <Pressable
                                accessibilityRole="button"
                                accessibilityState={{ selected: active }}
                                key={group}
                                onPress={() => setValue('bloodGroup', group, { shouldDirty: true })}
                                style={[styles.chip, active && styles.chipActive]}
                            >
                                <Text style={[styles.chipText, active && styles.chipTextActive]}>{group}</Text>
                            </Pressable>
                        );
                    })}
                </View>

                <View style={styles.formBlock}>
                    <RecordField
                        control={control}
                        label="Allergies"
                        name="allergies"
                        placeholder="Penicillin, Peanuts"
                    />
                    <RecordField
                        control={control}
                        label="Chronic Conditions"
                        name="chronicConditions"
                        placeholder="Diabetes, Hypertension"
                    />
                    <RecordField
                        control={control}
                        label="Active Medications"
                        name="activeMedications"
                        placeholder="Metformin, Lisinopril"
                    />
                    <View style={styles.twoColumnRow}>
                        <View style={styles.flexField}>
                            <RecordField
                                control={control}
                                keyboardType="numeric"
                                label="Height (cm)"
                                name="height"
                                placeholder="170"
                            />
                        </View>
                        <View style={styles.flexField}>
                            <RecordField
                                control={control}
                                keyboardType="numeric"
                                label="Weight (kg)"
                                name="weight"
                                placeholder="72"
                            />
                        </View>
                    </View>
                    <RecordField
                        control={control}
                        label="Doctor Notes"
                        multiline
                        name="notes"
                        placeholder="Important clinical notes for the care team"
                    />
                </View>
            </Card>

            <View style={styles.noticeCard}>
                <AppIcon color={colors.warningText} name="warning" size={18} />
                <Text style={styles.noticeText}>Changes are saved directly to the patient file.</Text>
            </View>

            <PrimaryButton
                label={updateMutation.isPending ? 'Saving...' : 'Save Medical Record'}
                loading={updateMutation.isPending}
                onPress={onSubmit}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
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
        backgroundColor: colors.primarySoft,
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
    heroIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
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
    sectionTitle: {
        color: colors.text,
        fontSize: typography.heading,
        lineHeight: 25,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    sectionSubtitle: {
        marginTop: 3,
        marginBottom: spacing.md,
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        lineHeight: 19,
        fontFamily: fonts.bodyRegular,
    },
    formBlock: {
        gap: spacing.md,
        marginTop: spacing.md,
    },
    label: {
        color: colors.text,
        fontSize: typography.bodyLarge,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    chipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        marginTop: spacing.xs,
    },
    chip: {
        minWidth: 58,
        minHeight: 38,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.sm,
    },
    chipActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primarySoft,
    },
    chipText: {
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    chipTextActive: {
        color: colors.primary,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    field: {
        gap: spacing.xs,
    },
    input: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: radius.md,
        borderWidth: 1,
        color: colors.text,
        fontFamily: fonts.bodyRegular,
        fontSize: typography.bodyLarge,
        minHeight: 52,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    textArea: {
        minHeight: 112,
    },
    inputError: {
        borderColor: colors.danger,
    },
    error: {
        color: colors.danger,
        fontSize: typography.caption,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    twoColumnRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    flexField: {
        flex: 1,
        minWidth: 0,
    },
    noticeCard: {
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: '#F5D77A',
        backgroundColor: colors.warningSoft,
        padding: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    noticeText: {
        flex: 1,
        color: colors.warningText,
        fontSize: typography.bodySmall,
        lineHeight: 19,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
});
