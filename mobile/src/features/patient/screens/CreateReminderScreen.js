import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing, typography } from '@/src/core/theme/tokens';
import { remindersStore } from '@/src/features/patient/remindersStore';
import AppIcon from '@/src/shared/components/AppIcon';

const TYPES = [
    { key: 'vitamin', label: 'Medication', icon: 'medical', iconColor: colors.primary, tint: colors.primarySoft },
    { key: 'bp', label: 'BP Check', icon: 'pulse', iconColor: colors.danger, tint: colors.dangerSoft },
    { key: 'hydration', label: 'Hydration', icon: 'water', iconColor: colors.success, tint: colors.successSoft },
    { key: 'exercise', label: 'Exercise', icon: 'walk', iconColor: colors.warning, tint: colors.warningSoft },
];

const SLOTS = [
    { key: 'morning', label: 'Morning', icon: 'sunny-outline' },
    { key: 'afternoon', label: 'Afternoon', icon: 'partly-sunny-outline' },
];

export function CreateReminderScreen() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [note, setNote] = useState('');
    const [type, setType] = useState('vitamin');
    const [slot, setSlot] = useState('morning');
    const [time, setTime] = useState('');
    const [error, setError] = useState('');

    const handleSave = () => {
        const trimmed = title.trim();
        if (!trimmed) {
            setError('Please enter a reminder title.');
            return;
        }

        const selectedType = TYPES.find((t) => t.key === type) ?? TYPES[0];
        const timeLabel = time.trim() ? time.trim() : slot === 'morning' ? '08:00 AM' : '02:00 PM';
        const subtitle = note.trim() ? `${timeLabel} - ${note.trim()}` : timeLabel;

        remindersStore.add({
            type,
            title: trimmed,
            subtitle,
            slot,
            primaryAction: type === 'bp' ? 'Log Data' : 'Mark Done',
        });

        router.back();
    };

    return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
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
                    <Text style={styles.headerTitle}>New Reminder</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Type picker */}
                    <Text style={styles.label}>Type</Text>
                    <View style={styles.typeGrid}>
                        {TYPES.map((t) => {
                            const active = type === t.key;
                            return (
                                <Pressable
                                    key={t.key}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Select type ${t.label}`}
                                    onPress={() => setType(t.key)}
                                    style={[
                                        styles.typeCard,
                                        active && { borderColor: t.iconColor, backgroundColor: t.tint },
                                    ]}
                                >
                                    <View style={[styles.typeIconWrap, { backgroundColor: active ? t.tint : colors.background }]}>
                                        <AppIcon color={active ? t.iconColor : colors.textMuted} name={t.icon} size={22} />
                                    </View>
                                    <Text style={[styles.typeLabel, active && { color: t.iconColor, fontFamily: fonts.bodyBold, fontWeight: '700' }]}>
                                        {t.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* Title */}
                    <Text style={styles.label}>Title</Text>
                    <TextInput
                        style={[styles.input, error ? styles.inputError : null]}
                        placeholder="e.g. Take Metformin"
                        placeholderTextColor={colors.textMuted}
                        value={title}
                        onChangeText={(v) => { setTitle(v); setError(''); }}
                        returnKeyType="next"
                    />
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    {/* Time */}
                    <Text style={styles.label}>Time (optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 08:30 AM"
                        placeholderTextColor={colors.textMuted}
                        value={time}
                        onChangeText={setTime}
                        returnKeyType="next"
                    />

                    {/* Note */}
                    <Text style={styles.label}>Note (optional)</Text>
                    <TextInput
                        style={[styles.input, styles.inputMulti]}
                        placeholder="e.g. Take with food"
                        placeholderTextColor={colors.textMuted}
                        value={note}
                        onChangeText={setNote}
                        multiline
                        numberOfLines={3}
                        returnKeyType="done"
                    />

                    {/* Slot */}
                    <Text style={styles.label}>Time of Day</Text>
                    <View style={styles.slotRow}>
                        {SLOTS.map((s) => {
                            const active = slot === s.key;
                            return (
                                <Pressable
                                    key={s.key}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Set to ${s.label}`}
                                    onPress={() => setSlot(s.key)}
                                    style={[styles.slotButton, active && styles.slotButtonActive]}
                                >
                                    <AppIcon
                                        color={active ? colors.primary : colors.textMuted}
                                        name={s.icon}
                                        size={18}
                                    />
                                    <Text style={[styles.slotText, active && styles.slotTextActive]}>
                                        {s.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* Save */}
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Save reminder"
                        onPress={handleSave}
                        style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
                    >
                        <AppIcon color="#FFFFFF" name="checkmark-circle" size={20} />
                        <Text style={styles.saveButtonText}>Save Reminder</Text>
                    </Pressable>

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Cancel"
                        onPress={() => router.back()}
                        style={styles.cancelButton}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    safeArea: {
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
        paddingBottom: spacing.xxl,
    },
    label: {
        color: colors.text,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
        marginBottom: spacing.xs,
        marginTop: spacing.md,
    },
    typeGrid: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    typeCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderRadius: radius.sm,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        gap: spacing.xxs,
    },
    typeIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    typeLabel: {
        color: colors.textMuted,
        fontSize: typography.caption,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
        textAlign: 'center',
    },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: 13,
        color: colors.text,
        fontSize: typography.body,
        fontFamily: fonts.bodyRegular,
    },
    inputError: {
        borderColor: colors.danger,
    },
    inputMulti: {
        height: 90,
        textAlignVertical: 'top',
        paddingTop: 13,
    },
    errorText: {
        marginTop: 4,
        color: colors.danger,
        fontSize: typography.caption,
        fontFamily: fonts.bodyMedium,
    },
    slotRow: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    slotButton: {
        flex: 1,
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: radius.sm,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    slotButtonActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primarySoft,
    },
    slotText: {
        color: colors.textMuted,
        fontSize: typography.body,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    slotTextActive: {
        color: colors.primary,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    saveButton: {
        marginTop: spacing.lg,
        height: 52,
        borderRadius: radius.sm,
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
    },
    saveButtonPressed: {
        backgroundColor: colors.primaryMid,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: typography.button,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    cancelButton: {
        marginTop: spacing.sm,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        color: colors.textMuted,
        fontSize: typography.body,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
});
