import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadows, spacing, typography } from '@/src/core/theme/tokens';
import AppIcon from '@/src/shared/components/AppIcon';

const alertDetails = {
    'alert-oxygen-low': {
        title: 'Low Oxygen Level',
        value: 'SpO2: 88%',
        severity: 'Critical',
        patient: 'Patient self-monitoring',
        time: 'Triggered at 10:42 AM - 2 mins ago',
        note: 'If symptoms include chest pain, blue lips, confusion, or severe shortness of breath, call emergency services immediately.',
        icon: 'airplane',
        tone: 'danger',
    },
    'alert-bp-high': {
        title: 'High Blood Pressure',
        value: '152/98 mmHg',
        severity: 'Acknowledged',
        patient: 'Patient self-monitoring',
        time: 'Triggered 1 hour ago',
        note: 'Rest for five minutes and recheck. Contact the clinic if elevated readings continue or symptoms worsen.',
        icon: 'pulse',
        tone: 'warning',
    },
};

const checklistTemplate = [
    {
        id: 'responsive',
        title: 'Check symptoms',
        note: 'Look for shortness of breath, chest pain, dizziness, confusion, or unusual fatigue.',
    },
    {
        id: 'repeat',
        title: 'Repeat the reading',
        note: 'Sit still, check device placement, and record a second reading if safe.',
    },
    {
        id: 'contact',
        title: 'Contact care team',
        note: 'Call the clinic for advice when readings remain outside your care range.',
    },
];

const toneStyles = {
    danger: {
        color: colors.danger,
        soft: colors.dangerSoft,
        border: colors.dangerBorder,
    },
    warning: {
        color: colors.warning,
        soft: colors.warningSoft,
        border: '#FDE68A',
    },
};

export function VitalAlertDetailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const alertId = typeof params.alertId === 'string' ? params.alertId : 'alert-oxygen-low';
    const detail = alertDetails[alertId] ?? alertDetails['alert-oxygen-low'];
    const tone = toneStyles[detail.tone] ?? toneStyles.danger;
    const [checkedIds, setCheckedIds] = useState([]);

    const toggleCheck = (id) => {
        setCheckedIds((current) =>
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        );
    };

    return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
            <View style={styles.container}>
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 204 }]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.heroCard}>
                        <View style={styles.heroTopRow}>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Return to vital alerts"
                                onPress={() => router.back()}
                                style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
                            >
                                <AppIcon color={colors.text} name="chevron-back" size={22} />
                            </Pressable>
                            <View style={[styles.heroBadge, { backgroundColor: tone.soft, borderColor: tone.border }]}>
                                <AppIcon color={tone.color} name="alert-circle" size={15} />
                                <Text style={[styles.heroBadgeText, { color: tone.color }]}>{detail.severity}</Text>
                            </View>
                        </View>

                        <View style={[styles.alertIcon, { backgroundColor: tone.soft }]}>
                            <AppIcon color={tone.color} name={detail.icon} size={34} />
                        </View>
                        <Text style={[styles.alertValue, { color: tone.color }]}>{detail.value}</Text>
                        <Text style={styles.alertTitle}>{detail.title}</Text>
                        <Text style={styles.alertMeta}>{detail.patient}</Text>
                        <Text style={styles.alertMeta}>{detail.time}</Text>
                    </View>

                    <View style={styles.instructionsCard}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Safety checklist</Text>
                            <Text style={styles.progressText}>{checkedIds.length}/{checklistTemplate.length}</Text>
                        </View>

                        {checklistTemplate.map((item) => {
                            const checked = checkedIds.includes(item.id);
                            return (
                                <Pressable
                                    accessibilityRole="checkbox"
                                    accessibilityState={{ checked }}
                                    accessibilityLabel={item.title}
                                    key={item.id}
                                    onPress={() => toggleCheck(item.id)}
                                    style={[styles.instructionItem, checked && styles.instructionItemChecked]}
                                >
                                    <View style={[styles.checkbox, checked && { backgroundColor: tone.color, borderColor: tone.color }]}>
                                        {checked ? <AppIcon color="#FFFFFF" name="checkmark" size={15} /> : null}
                                    </View>
                                    <View style={styles.instructionTextWrap}>
                                        <Text style={styles.instructionTitle}>{item.title}</Text>
                                        <Text style={styles.instructionNote}>{item.note}</Text>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>

                    <View style={styles.noteCard}>
                        <AppIcon color={colors.primary} name="information-circle" size={22} />
                        <Text style={styles.noteText}>{detail.note}</Text>
                    </View>
                </ScrollView>

                <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 12 }]}>
                    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.secondaryAction, pressed && styles.actionPressed]}>
                        <AppIcon color={colors.primary} name="call" size={22} />
                        <Text style={styles.secondaryActionText}>Call Clinic</Text>
                    </Pressable>

                    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.emergencyAction, pressed && styles.emergencyActionPressed]}>
                        <AppIcon color="#FFFFFF" name="locate" size={22} />
                        <Text style={styles.emergencyActionText}>Emergency Services</Text>
                    </Pressable>
                </View>
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
        alignItems: 'center',
        ...shadows.card,
    },
    heroTopRow: {
        alignSelf: 'stretch',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 15,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroBadge: {
        minHeight: 34,
        borderRadius: radius.full,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: spacing.sm,
    },
    heroBadgeText: {
        fontSize: typography.caption,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    alertIcon: {
        width: 84,
        height: 84,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    alertValue: {
        fontSize: 36,
        lineHeight: 42,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        textAlign: 'center',
    },
    alertTitle: {
        marginTop: spacing.xs,
        color: colors.text,
        fontSize: typography.heading,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        textAlign: 'center',
    },
    alertMeta: {
        marginTop: 3,
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyRegular,
        textAlign: 'center',
    },
    instructionsCard: {
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: spacing.md,
        ...shadows.card,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    sectionTitle: {
        color: colors.text,
        fontSize: typography.heading,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    progressText: {
        color: colors.primary,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    instructionItem: {
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.background,
        padding: spacing.sm,
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: spacing.xs,
    },
    instructionItemChecked: {
        backgroundColor: colors.surfaceTint,
    },
    checkbox: {
        width: 34,
        height: 34,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.border,
        marginRight: spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
    },
    instructionTextWrap: {
        flex: 1,
    },
    instructionTitle: {
        color: colors.text,
        fontSize: typography.bodyLarge,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    instructionNote: {
        marginTop: 3,
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        lineHeight: 20,
        fontFamily: fonts.bodyRegular,
    },
    noteCard: {
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.infoBorder,
        backgroundColor: colors.infoSoft,
        padding: spacing.sm,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.xs,
    },
    noteText: {
        flex: 1,
        color: colors.primary,
        fontSize: typography.bodySmall,
        lineHeight: 20,
        fontFamily: fonts.bodyMedium,
    },
    bottomActions: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: 'rgba(248,250,252,0.96)',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xs,
        gap: spacing.xs,
    },
    secondaryAction: {
        height: 52,
        borderRadius: radius.sm,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
    },
    actionPressed: {
        backgroundColor: colors.surfaceTint,
    },
    secondaryActionText: {
        color: colors.primary,
        fontSize: typography.button,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    emergencyAction: {
        height: 54,
        borderRadius: radius.sm,
        backgroundColor: colors.danger,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        shadowColor: colors.danger,
        shadowOpacity: 0.32,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 5 },
        elevation: 6,
    },
    emergencyActionPressed: {
        opacity: 0.86,
    },
    emergencyActionText: {
        color: '#FFFFFF',
        fontSize: typography.button,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
});
