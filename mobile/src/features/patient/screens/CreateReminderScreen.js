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

const TIME_OPTIONS = [
    '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
    '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM',
];

export function CreateReminderScreen() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [note, setNote] = useState('');
    const [type, setType] = useState('vitamin');
    const [time, setTime] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [error, setError] = useState('');

    const handleSave = () => {
        const trimmed = title.trim();
        if (!trimmed) {
            setError('Please enter a reminder title.');
            return;
        }
        if (!time) {
            setError('Please select a time.');
            return;
        }

        const subtitle = note.trim() ? `${time} - ${note.trim()}` : time;

        const slot = TIME_OPTIONS.indexOf(time) < TIME_OPTIONS.indexOf('12:00 PM') ? 'morning' : 'afternoon';
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
                    <Text style={styles.label}>Time</Text>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Select time"
                        onPress={() => setDropdownOpen((o) => !o)}
                        style={[styles.input, styles.dropdownTrigger]}
                    >
                        <Text style={[styles.dropdownValue, !time && styles.dropdownPlaceholder]}>
                            {time || 'Select a time'}
                        </Text>
                        <AppIcon
                            color={colors.textMuted}
                            name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                            size={18}
                        />
                    </Pressable>
                    {dropdownOpen ? (
                        <View style={styles.dropdownList}>
                            <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
                                {TIME_OPTIONS.map((option) => (
                                    <Pressable
                                        key={option}
                                        onPress={() => { setTime(option); setDropdownOpen(false); setError(''); }}
                                        style={[styles.dropdownItem, time === option && styles.dropdownItemActive]}
                                    >
                                        <Text style={[styles.dropdownItemText, time === option && styles.dropdownItemTextActive]}>
                                            {option}
                                        </Text>
                                        {time === option ? (
                                            <AppIcon color={colors.primary} name="checkmark" size={16} />
                                        ) : null}
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>
                    ) : null}

                    {/* Note */}
                    <Text style={styles.label}>Note</Text>
                    <TextInput
                        style={[styles.input, styles.inputMulti]}
                        placeholder="e.g. Take with food"
                        placeholderTextColor={colors.textMuted}
                        value={note}
                        onChangeText={setNote}
                        multiline
                        numberOfLines={2}
                        returnKeyType="done"
                    />

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
        height: 56,
        textAlignVertical: 'top',
        paddingTop: 13,
    },
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dropdownValue: {
        color: colors.text,
        fontSize: typography.body,
        fontFamily: fonts.bodyRegular,
    },
    dropdownPlaceholder: {
        color: colors.textMuted,
    },
    dropdownList: {
        marginTop: 4,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.sm,
        backgroundColor: colors.surface,
        overflow: 'hidden',
    },
    dropdownScroll: {
        maxHeight: 200,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.sm,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    dropdownItemActive: {
        backgroundColor: colors.primarySoft,
    },
    dropdownItemText: {
        color: colors.text,
        fontSize: typography.body,
        fontFamily: fonts.bodyRegular,
    },
    dropdownItemTextActive: {
        color: colors.primary,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    errorText: {
        marginTop: 4,
        color: colors.danger,
        fontSize: typography.caption,
        fontFamily: fonts.bodyMedium,
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
