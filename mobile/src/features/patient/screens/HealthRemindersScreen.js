import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadows, spacing, typography } from '@/src/core/theme/tokens';
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

function ReminderCard({ item, onPrimaryAction, onSkip }) {
    const theme = ICON_THEME[item.type] ?? ICON_THEME.exercise;

    return (
        <View style={styles.reminderCard}>
            <View style={styles.reminderTopRow}>
                <View style={[styles.reminderIconWrap, { backgroundColor: theme.tint }]}>
                    <AppIcon color={theme.iconColor} name={theme.icon} size={23} />
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
                    onPress={() => onPrimaryAction(item)}
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
                    onPress={() => onSkip(item)}
                    style={({ pressed }) => [styles.secondaryAction, pressed && styles.secondaryActionPressed]}
                >
                    <Text style={styles.secondaryActionText}>Skip</Text>
                </Pressable>
            </View>
        </View>
    );
}

export function HealthRemindersScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState('today');
    const [reminders, setReminders] = useState(remindersStore.get());

    useEffect(() => {
        void remindersStore.hydrate();
        return remindersStore.subscribe(setReminders);
    }, []);

    const morningItems = useMemo(() => filterByTab(reminders.morning, activeTab), [activeTab, reminders.morning]);
    const afternoonItems = useMemo(() => filterByTab(reminders.afternoon, activeTab), [activeTab, reminders.afternoon]);
    const todayCount = useMemo(
        () => [...reminders.morning, ...reminders.afternoon].filter((item) => item.bucket === 'today').length,
        [reminders],
    );
    const upcomingCount = useMemo(
        () => [...reminders.morning, ...reminders.afternoon].filter((item) => item.bucket === 'upcoming').length,
        [reminders],
    );

    const completedItems = useMemo(() => {
        if (activeTab === 'upcoming') return [];
        if (activeTab === 'completed') return reminders.completed;
        return reminders.completed.slice(0, 4);
    }, [activeTab, reminders.completed]);

    const moveToCompleted = (section, itemId, status) => {
        const current = remindersStore.get();
        const source = current[section] ?? [];
        const item = source.find((entry) => entry.id === itemId);
        if (!item) return;

        remindersStore.set({
            ...current,
            [section]: source.filter((entry) => entry.id !== itemId),
            completed: [
                {
                    id: `${item.id}-${status}`,
                    title: item.title,
                    subtitle: item.subtitle.split(' - ')[0] ?? item.subtitle,
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
    const hasItems = morningItems.length > 0 || afternoonItems.length > 0;

    return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
            <View style={styles.container}>
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 112 }]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.heroCard}>
                        <View style={styles.heroTopRow}>
                            <View style={styles.heroIcon}>
                                <AppIcon color="#FFFFFF" name="favorite" size={25} />
                            </View>
                            <View style={styles.heroBadge}>
                                <AppIcon color={colors.primary} name="event-note" size={15} />
                                <Text style={styles.heroBadgeText}>Daily care</Text>
                            </View>
                        </View>

                        <Text style={styles.heroTitle}>Care</Text>
                        <Text style={styles.heroSubtitle}>Track daily medication, vitals, hydration, and care tasks in one place.</Text>

                        <View style={styles.heroStatsRow}>
                            <View style={styles.heroStat}>
                                <Text style={styles.heroStatValue}>{todayCount}</Text>
                                <Text style={styles.heroStatLabel}>Today</Text>
                            </View>
                            <View style={styles.heroStatDivider} />
                            <View style={styles.heroStat}>
                                <Text style={styles.heroStatValue}>{upcomingCount}</Text>
                                <Text style={styles.heroStatLabel}>Upcoming</Text>
                            </View>
                            <View style={styles.heroStatDivider} />
                            <View style={styles.heroStat}>
                                <Text style={styles.heroStatValue}>{reminders.completed.length}</Text>
                                <Text style={styles.heroStatLabel}>Completed</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.tabsCard}>
                        <View style={styles.tabSwitcher}>
                            {TAB_OPTIONS.map((tab) => {
                                const isActive = activeTab === tab.key;
                                return (
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel={`Show ${tab.label} reminders`}
                                        key={tab.key}
                                        onPress={() => setActiveTab(tab.key)}
                                        style={[styles.tabButton, isActive && styles.tabButtonActive]}
                                    >
                                        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.resultsHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>{TAB_OPTIONS.find((tab) => tab.key === activeTab)?.label}</Text>
                            <Text style={styles.resultsMeta}>
                                {activeTab === 'completed' ? completedItems.length : morningItems.length + afternoonItems.length} item
                                {(activeTab === 'completed' ? completedItems.length : morningItems.length + afternoonItems.length) === 1 ? '' : 's'}
                            </Text>
                        </View>
                        <View style={styles.sortPill}>
                            <AppIcon color={colors.primary} name="event-note" size={14} />
                            <Text style={styles.sortPillText}>Daily care</Text>
                        </View>
                    </View>

                    {activeTab !== 'completed' ? (
                        <>
                            {morningItems.length > 0 ? <Text style={styles.sectionLabel}>Morning</Text> : null}
                            {morningItems.map((item) => (
                                <ReminderCard item={item} key={item.id} onPrimaryAction={handlePrimaryAction} onSkip={handleSkip} />
                            ))}

                            {afternoonItems.length > 0 ? <Text style={styles.sectionLabel}>Afternoon</Text> : null}
                            {afternoonItems.map((item) => (
                                <ReminderCard item={item} key={item.id} onPrimaryAction={handlePrimaryAction} onSkip={handleSkip} />
                            ))}
                        </>
                    ) : null}

                    {completedItems.length > 0 ? (
                        <>
                            <Text style={styles.sectionLabel}>{activeTab === 'completed' ? 'Completed' : 'Earlier today'}</Text>
                            {completedItems.map((item) => (
                                <View key={item.id} style={styles.completedRow}>
                                    <View style={[styles.completedDot, item.status === 'skipped' && styles.completedDotSkipped]}>
                                        <AppIcon color="#FFFFFF" name={item.status === 'skipped' ? 'close' : 'checkmark'} size={12} />
                                    </View>
                                    <View style={styles.completedTextWrap}>
                                        <Text style={styles.completedTitle}>{item.title}</Text>
                                        <Text style={styles.completedSub}>{item.status === 'skipped' ? 'Skipped' : 'Done'}</Text>
                                    </View>
                                </View>
                            ))}
                        </>
                    ) : null}

                    {activeTab !== 'completed' && !hasItems ? (
                        <View style={styles.emptyCard}>
                            <View style={styles.emptyIcon}>
                                <AppIcon color={colors.primary} name="calendar-outline" size={28} />
                            </View>
                            <Text style={styles.emptyTitle}>
                                {activeTab === 'upcoming' ? 'No upcoming reminders' : 'All done for today'}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {activeTab === 'upcoming'
                                    ? 'Create a reminder and schedule it ahead.'
                                    : 'Add a new reminder when there is something to track.'}
                            </Text>
                        </View>
                    ) : null}

                    {activeTab === 'completed' && completedItems.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <View style={styles.emptyIcon}>
                                <AppIcon color={colors.primary} name="checkmark-circle" size={28} />
                            </View>
                            <Text style={styles.emptyTitle}>No completed items</Text>
                            <Text style={styles.emptySubtitle}>Completed reminders will appear here.</Text>
                        </View>
                    ) : null}
                </ScrollView>

                <View style={[styles.addButtonWrap, { paddingBottom: insets.bottom + 12 }]}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Create reminder"
                        onPress={() => router.push('/(app)/(patient)/create-reminder')}
                        style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
                    >
                        <AppIcon color="#FFFFFF" name="add-circle" size={22} />
                        <Text style={styles.addButtonText}>Create Reminder</Text>
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
        ...shadows.card,
    },
    heroTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    heroIcon: {
        width: 52,
        height: 52,
        borderRadius: 17,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroBadge: {
        minHeight: 40,
        borderRadius: radius.full,
        backgroundColor: colors.primarySoft,
        borderWidth: 1,
        borderColor: colors.infoBorder,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: spacing.sm,
    },
    heroBadgeText: {
        color: colors.primary,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
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
    heroStatsRow: {
        marginTop: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
    },
    heroStat: {
        flex: 1,
        alignItems: 'center',
    },
    heroStatValue: {
        color: colors.text,
        fontSize: 22,
        lineHeight: 27,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    heroStatLabel: {
        color: colors.textMuted,
        fontSize: typography.caption,
        fontFamily: fonts.bodyMedium,
    },
    heroStatDivider: {
        width: 1,
        height: 36,
        backgroundColor: colors.border,
    },
    tabsCard: {
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 5,
    },
    tabSwitcher: {
        flexDirection: 'row',
        backgroundColor: colors.background,
        borderRadius: radius.sm,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: radius.sm,
    },
    tabButtonActive: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    tabText: {
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    tabTextActive: {
        color: colors.primary,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    resultsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionTitle: {
        color: colors.text,
        fontSize: typography.heading,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    resultsMeta: {
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyRegular,
    },
    sortPill: {
        minHeight: 34,
        borderRadius: radius.full,
        backgroundColor: colors.primarySoft,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: spacing.sm,
    },
    sortPillText: {
        color: colors.primary,
        fontSize: typography.caption,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    sectionLabel: {
        color: colors.textMuted,
        fontSize: typography.caption,
        letterSpacing: 0.6,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginTop: 2,
    },
    reminderCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        padding: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.card,
    },
    reminderTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    reminderIconWrap: {
        width: 52,
        height: 52,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reminderTextWrap: {
        flex: 1,
        minWidth: 0,
    },
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
        minHeight: 44,
        borderRadius: radius.sm,
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
        width: 86,
        minHeight: 44,
        borderRadius: radius.sm,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryActionPressed: {
        backgroundColor: colors.surfaceTint,
    },
    secondaryActionText: {
        color: colors.textMuted,
        fontSize: typography.body,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    completedRow: {
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    completedDot: {
        width: 34,
        height: 34,
        borderRadius: 12,
        backgroundColor: colors.success,
        alignItems: 'center',
        justifyContent: 'center',
    },
    completedDotSkipped: {
        backgroundColor: colors.textMuted,
    },
    completedTextWrap: {
        flex: 1,
    },
    completedTitle: {
        color: colors.text,
        fontSize: typography.body,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    completedSub: {
        color: colors.textMuted,
        fontSize: typography.caption,
        fontFamily: fonts.bodyRegular,
    },
    emptyCard: {
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        backgroundColor: colors.surface,
        alignItems: 'center',
        gap: spacing.xs,
    },
    emptyIcon: {
        width: 58,
        height: 58,
        borderRadius: 20,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
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
        lineHeight: 21,
        fontFamily: fonts.bodyRegular,
        textAlign: 'center',
    },
    addButtonWrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xs,
        backgroundColor: 'rgba(248,250,252,0.96)',
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    addButton: {
        height: 56,
        borderRadius: radius.sm,
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        shadowColor: colors.primary,
        shadowOpacity: 0.28,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    addButtonPressed: {
        backgroundColor: colors.primaryMid,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: typography.button,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
});
