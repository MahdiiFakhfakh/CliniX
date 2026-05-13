import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing, typography } from '@/src/core/theme/tokens';
import { remindersStore } from '@/src/features/patient/remindersStore';
import AppIcon from '@/src/shared/components/AppIcon';

const TAB_OPTIONS = [
    { key: 'today', label: 'Today' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
];

const ICON_THEME = {
    vitamin: { icon: 'medical', iconColor: colors.primary, tint: colors.primarySoft },
    bp: { icon: 'pulse', iconColor: colors.danger, tint: colors.dangerSoft },
    hydration: { icon: 'water', iconColor: colors.success, tint: colors.successSoft },
    exercise: { icon: 'walk', iconColor: colors.warning, tint: colors.warningSoft },
};

const filterByTab = (items, activeTab) => {
    if (activeTab === 'today') return items.filter((item) => item.bucket === 'today');
    if (activeTab === 'upcoming') return items.filter((item) => item.bucket === 'upcoming');
    return [];
};

export function HealthRemindersScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('today');
    const [reminders, setReminders] = useState(remindersStore.get());

    useEffect(() => {
        return remindersStore.subscribe(setReminders);
    }, []);

    const morningItems = useMemo(() => filterByTab(reminders.morning, activeTab), [activeTab, reminders.morning]);
    const afternoonItems = useMemo(() => filterByTab(reminders.afternoon, activeTab), [activeTab, reminders.afternoon]);

    const completedItems = useMemo(() => {
        if (activeTab === 'upcoming') return [];
        if (activeTab === 'completed') return reminders.completed;
        return reminders.completed.slice(0, 4);
    }, [activeTab, reminders.completed]);

    const moveToCompleted = (section, itemId, status) => {
        const current = remindersStore.get();
        const source = current[section];
        const item = source.find((e) => e.id === itemId);
        if (!item) return;

        remindersStore.set({
            ...current,
            [section]: source.filter((e) => e.id !== itemId),
            completed: [
                {
                    id: `${item.id}-${status}`,
                    title: item.title,
                    subtitle: (item.subtitle.split(' - ')[0] ?? item.subtitle),
                    type: item.type,
                    status,
                },
                ...current.completed,
            ],
        });
    };

    const handlePrimaryAction = (item) => {
        if (item.primaryAction === 'Log Data') {
            Alert.alert('Log Data', `Open data entry for: ${item.title}`);
            return;
        }
        moveToCompleted(item.section, item.id, 'done');
    };

    const handleSkip = (item) => moveToCompleted(item.section, item.id, 'skipped');

    const renderReminderCard = (item) => {
        const theme = ICON_THEME[item.type] ?? ICON_THEME.exercise;
        return (
            <View key={item.id} style={styles.reminderCard}>
                <View style={styles.reminderTopRow}>
                    <View style={[styles.reminderIconWrap, { backgroundColor: theme.tint }]}>
                        <AppIcon color={theme.iconColor} name={theme.icon} size={22} />
                    </View>
                    <View style={styles.reminderTextWrap}>
                        <Text style={styles.reminderTitle}>{item.title}</Text>
                        <Text style={styles.reminderSubtitle}>{item.subtitle}</Text>
                    </View>
                </View>

                <View style={styles.actionRow}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${item.primaryAction} for ${item.title}`}
                        onPress={() => handlePrimaryAction(item)}
                        style={({ pressed }) => [styles.primaryAction, pressed && styles.primaryActionPressed]}
                    >
                        <AppIcon
                            color="#FFFFFF"
                            name={item.primaryAction === 'Log Data' ? 'analytics' : 'checkmark-circle'}
                            size={16}
                        />
                        <Text style={styles.primaryActionText}>{item.primaryAction}</Text>
                    </Pressable>

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Skip ${item.title}`}
                        onPress={() => handleSkip(item)}
                        style={({ pressed }) => [styles.secondaryAction, pressed && { opacity: 0.7 }]}
                    >
                        <Text style={styles.secondaryActionText}>Skip</Text>
                    </Pressable>
                </View>
            </View>
        );
    };

    const hasItems = morningItems.length > 0 || afternoonItems.length > 0;

    return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
            <View style={styles.mainContainer}>
                <View style={styles.header}>
                    <View style={styles.headerTextBlock}>
                        <Text style={styles.headerTitle}>Health Reminders</Text>
                        <Text style={styles.headerSubtitle}>Manage your daily reminders</Text>
                    </View>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Open notifications"
                        onPress={() => router.push('/(app)/notifications')}
                        style={styles.bellButton}
                    >
                        <AppIcon color={colors.text} name="notifications-outline" size={22} />
                    </Pressable>
                </View>

                <View style={styles.tabSwitcher}>
                    {TAB_OPTIONS.map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <Pressable
                                key={tab.key}
                                accessibilityRole="button"
                                accessibilityLabel={`Show ${tab.label} reminders`}
                                onPress={() => setActiveTab(tab.key)}
                                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                            >
                                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
                            </Pressable>
                        );
                    })}
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {activeTab !== 'completed' ? (
                        <>
                            {morningItems.length > 0 ? (
                                <Text style={styles.sectionLabel}>MORNING</Text>
                            ) : null}
                            {morningItems.map(renderReminderCard)}

                            {afternoonItems.length > 0 ? (
                                <Text style={[styles.sectionLabel, morningItems.length > 0 && styles.sectionSpacing]}>
                                    AFTERNOON
                                </Text>
                            ) : null}
                            {afternoonItems.map(renderReminderCard)}
                        </>
                    ) : null}

                    {completedItems.length > 0 ? (
                        <Text style={[styles.sectionLabel, (hasItems || activeTab === 'completed') && styles.sectionSpacing]}>
                            {activeTab === 'completed' ? 'COMPLETED' : 'EARLIER TODAY'}
                        </Text>
                    ) : null}

                    {completedItems.map((item) => (
                        <View key={item.id} style={styles.completedRow}>
                            <View style={[styles.completedDot, item.status === 'skipped' && styles.completedDotSkipped]}>
                                <AppIcon
                                    color="#FFFFFF"
                                    name={item.status === 'skipped' ? 'close' : 'checkmark'}
                                    size={12}
                                />
                            </View>
                            <Text style={styles.completedText}>
                                {item.title}
                                {item.status === 'skipped' ? '  (Skipped)' : ''}
                            </Text>
                        </View>
                    ))}

                    {activeTab !== 'completed' && !hasItems ? (
                        <View style={styles.emptyCard}>
                            <AppIcon color={colors.textMuted} name="calendar-outline" size={36} />
                            <Text style={styles.emptyTitle}>
                                {activeTab === 'upcoming' ? 'No upcoming reminders' : 'All done for today!'}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {activeTab === 'upcoming'
                                    ? 'Tap + to schedule ahead.'
                                    : 'Tap + to add a new reminder.'}
                            </Text>
                        </View>
                    ) : null}

                    {activeTab === 'completed' && completedItems.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <AppIcon color={colors.textMuted} name="checkmark-done-outline" size={36} />
                            <Text style={styles.emptyTitle}>No completed items</Text>
                            <Text style={styles.emptySubtitle}>Mark reminders done to see them here.</Text>
                        </View>
                    ) : null}
                </ScrollView>

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Create reminder"
                    onPress={() => router.push('/(app)/(patient)/create-reminder')}
                    style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
                >
                    <AppIcon color="#FFFFFF" name="add" size={28} />
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    mainContainer: {
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: spacing.xs,
        marginBottom: spacing.sm,
    },
    headerTextBlock: { flex: 1 },
    headerTitle: {
        color: colors.text,
        fontSize: typography.heading,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    headerSubtitle: {
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyRegular,
        marginTop: 2,
    },
    bellButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    tabSwitcher: {
        flexDirection: 'row',
        backgroundColor: colors.border,
        borderRadius: radius.full,
        padding: 4,
        marginBottom: spacing.xs,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 9,
        borderRadius: radius.full,
    },
    tabButtonActive: {
        backgroundColor: colors.surface,
    },
    tabText: {
        color: colors.textMuted,
        fontSize: typography.body,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    tabTextActive: {
        color: colors.primary,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    scrollContent: {
        paddingTop: spacing.xxs,
        paddingBottom: 140,
    },
    sectionLabel: {
        marginTop: spacing.md,
        color: colors.textSubtle,
        fontSize: typography.caption,
        letterSpacing: 1,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    sectionSpacing: {
        marginTop: spacing.lg,
    },
    reminderCard: {
        marginTop: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        padding: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    reminderTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reminderIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    reminderTextWrap: { flex: 1 },
    reminderTitle: {
        color: colors.text,
        fontSize: typography.bodyLarge,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    reminderSubtitle: {
        marginTop: 2,
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyRegular,
    },
    actionRow: {
        marginTop: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    primaryAction: {
        flex: 1,
        height: 42,
        borderRadius: radius.full,
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    primaryActionPressed: {
        backgroundColor: colors.primaryMid,
    },
    primaryActionText: {
        color: '#FFFFFF',
        fontSize: typography.body,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    secondaryAction: {
        width: 80,
        height: 42,
        borderRadius: radius.full,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryActionText: {
        color: colors.textMuted,
        fontSize: typography.body,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    completedRow: {
        marginTop: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    completedDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.success,
        alignItems: 'center',
        justifyContent: 'center',
    },
    completedDotSkipped: {
        backgroundColor: colors.textMuted,
    },
    completedText: {
        flex: 1,
        color: colors.textMuted,
        fontSize: typography.body,
        fontFamily: fonts.bodyMedium,
        textDecorationLine: 'line-through',
    },
    emptyCard: {
        marginTop: spacing.lg,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.xl,
        backgroundColor: colors.surface,
        alignItems: 'center',
        gap: spacing.xs,
    },
    emptyTitle: {
        color: colors.text,
        fontSize: typography.bodyLarge,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        textAlign: 'center',
    },
    emptySubtitle: {
        color: colors.textMuted,
        fontSize: typography.body,
        fontFamily: fonts.bodyRegular,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        right: spacing.md,
        bottom: 88,
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
    fabPressed: {
        transform: [{ scale: 0.96 }],
    },
});
