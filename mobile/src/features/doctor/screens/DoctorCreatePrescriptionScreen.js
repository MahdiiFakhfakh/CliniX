import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';
import { colors, fonts, radius, shadows, spacing, typography } from '@/src/core/theme/tokens';
import { useCreatePrescriptionMutation } from '@/src/features/doctor/hooks/useCreatePrescriptionMutation';
import AppIcon from '@/src/shared/components/AppIcon';
import { Card } from '@/src/shared/components/Card';
import { FormTextField } from '@/src/shared/components/FormTextField';
import { PrimaryButton } from '@/src/shared/components/PrimaryButton';
import { Screen } from '@/src/shared/components/Screen';

const prescriptionSchema = z.object({
    medication: z.string().min(2, 'Medication is required'),
    dosage: z.string().min(2, 'Dosage is required'),
    frequency: z.string().min(2, 'Frequency is required'),
    duration: z.string().min(2, 'Duration is required'),
    instructions: z.string().min(5, 'Instructions are required'),
});

function FormSection({ icon, title, subtitle, children }) {
    return (
        <Card>
            <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                    <AppIcon color={colors.primary} name={icon} size={22} />
                </View>
                <View style={styles.sectionTextWrap}>
                    <Text style={styles.sectionTitle}>{title}</Text>
                    <Text style={styles.sectionSubtitle}>{subtitle}</Text>
                </View>
            </View>
            <View style={styles.formBlock}>{children}</View>
        </Card>
    );
}

export function DoctorCreatePrescriptionScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const patientId = params.patientId ?? '';
    const createMutation = useCreatePrescriptionMutation(patientId);

    const { control, handleSubmit } = useForm({
        resolver: zodResolver(prescriptionSchema),
        defaultValues: {
            medication: '',
            dosage: '',
            frequency: '',
            duration: '',
            instructions: '',
        },
    });

    const onSubmit = handleSubmit(async (values) => {
        try {
            await createMutation.mutateAsync({
                patientId,
                medication: values.medication,
                dosage: values.dosage,
                frequency: values.frequency,
                duration: values.duration,
                instructions: values.instructions,
            });
            Alert.alert('Prescription created', 'The prescription has been saved.');
            router.back();
        }
        catch {
            // Error toasts are shown globally by query mutation cache.
        }
    });

    return (
        <Screen>
            <View style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Return to patient file"
                        onPress={() => router.back()}
                        style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.75 }]}
                    >
                        <AppIcon color={colors.primary} name="chevron-back" size={20} />
                    </Pressable>
                    <View style={styles.heroBadge}>
                        <AppIcon color={colors.primary} name="medkit-outline" size={15} />
                        <Text style={styles.heroBadgeText}>Medication order</Text>
                    </View>
                </View>

                <View style={styles.heroIcon}>
                    <AppIcon color="#FFFFFF" name="medical" size={28} />
                </View>
                <Text style={styles.heroTitle}>Create Prescription</Text>
                <Text style={styles.heroSubtitle}>Add medication, dosage, schedule, and patient instructions.</Text>

                <View style={styles.heroFooter}>
                    <View style={styles.heroFooterItem}>
                        <AppIcon color={colors.primary} name="checkmark-circle" size={18} />
                        <Text style={styles.heroFooterText}>Doctor reviewed</Text>
                    </View>
                    <View style={styles.heroFooterItem}>
                        <AppIcon color={colors.primary} name="folder-open" size={18} />
                        <Text style={styles.heroFooterText}>Saved to file</Text>
                    </View>
                </View>
            </View>

            <FormSection
                icon="medical-bag"
                title="Medication Details"
                subtitle="Keep the order clear and easy for the patient to follow."
            >
                <FormTextField control={control} name="medication" label="Medication" placeholder="Drug name" />
                <View style={styles.twoColumnRow}>
                    <View style={styles.flexField}>
                        <FormTextField control={control} name="dosage" label="Dosage" placeholder="20 mg" />
                    </View>
                    <View style={styles.flexField}>
                        <FormTextField control={control} name="duration" label="Duration" placeholder="30 days" />
                    </View>
                </View>
                <FormTextField control={control} name="frequency" label="Frequency" placeholder="Once daily" />
                <FormTextField control={control} name="instructions" label="Instructions" placeholder="Take after meals. Avoid missed doses." />
            </FormSection>

            <View style={styles.noticeCard}>
                <View style={styles.noticeIcon}>
                    <AppIcon color={colors.warningText} name="warning" size={18} />
                </View>
                <Text style={styles.noticeText}>Review dosage and instructions before saving to the patient record.</Text>
            </View>

            <PrimaryButton
                label={createMutation.isPending ? 'Saving...' : 'Save Prescription'}
                loading={createMutation.isPending}
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
    heroFooter: {
        marginTop: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.sm,
        gap: spacing.xs,
    },
    heroFooterItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    heroFooterText: {
        color: colors.text,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    sectionIcon: {
        width: 44,
        height: 44,
        borderRadius: 15,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTextWrap: {
        flex: 1,
        minWidth: 0,
    },
    sectionTitle: {
        color: colors.text,
        fontSize: typography.heading,
        lineHeight: 25,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    sectionSubtitle: {
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        lineHeight: 19,
        fontFamily: fonts.bodyRegular,
    },
    formBlock: {
        gap: spacing.md,
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
    noticeIcon: {
        width: 34,
        height: 34,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
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
