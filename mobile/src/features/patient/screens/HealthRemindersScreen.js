import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '@/src/core/theme/tokens';
import AppIcon from '@/src/shared/components/AppIcon';

const palette = {
    background: '#F3F4F8',
    primary: '#1D4ED8',
    primaryPressed: '#1E40AF',
    text: '#111827',
    textSubtle: '#374151',
    muted: '#6B7280',
    card: '#FFFFFF',
    border: '#E5E7EB',
    segmentBg: '#E5E7EB',
    inactiveTabText: '#6B7280',
    sectionLabel: '#9CA3AF',
    success: '#16A34A',
    warning: '#DC2626',
    actionSecondaryBg: '#E5E7EB',
};

const TAB_OPTIONS = [
    { key: 'today', label: 'Today' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
];

const ICON_THEME = {
    vitamin: {
        icon: 'medical',
        iconColor: '#1D4ED8',
        tint: '#DBEAFE',
    },
    bp: {
        icon: 'pulse',
        iconColor: '#DC2626',
        tint: '#FEE2E2',
    },
    hydration: {
        icon: 'water',
        iconColor: '#16A34A',
        tint: '#DCFCE7',
    },
    exercise: {
        icon: 'walk',
        iconColor: '#6B7280',
        tint: '#E5E7EB',
    },
};


const filterByTab = (items, activeTab) => {
    if (activeTab === 'today') {
        return items.filter((item) => item.bucket === 'today');
    }
    if (activeTab === 'upcoming') {
        return items.filter((item) => item.bucket === 'upcoming');
    }
    return [];
};

export function HealthRemindersScreen() {
    const router = useRouter();

    const [activeTab, setActiveTab] = useState('today');
    const [reminders, setReminders] = useState({ morning: [], afternoon: [], completed: [] });

    const morningItems = useMemo(
        () => filterByTab(reminders.morning, activeTab),
        [activeTab, reminders.morning],
    );
    const afternoonItems = useMemo(
        () => filterByTab(reminders.afternoon, activeTab),
        [activeTab, reminders.afternoon],
    );

    const completedItems = useMemo(() => {
        if (activeTab === 'upcoming') {
            return [];
        }
        if (activeTab === 'completed') {
            return reminders.completed;
        }
        return reminders.completed.slice(0, 4);
    }, [activeTab, reminders.completed]);

    const moveToCompleted = (section, itemId, status) => {
        setReminders((current) => {
            const source = current[section];
            const item = source.find((entry) => entry.id === itemId);
            if (!item) {
                return current;
            }

            const nextSource = source.filter((entry) => entry.id !== itemId);
            const completedItem = {
                id: `${item.id}-${status}`,
                title: item.title,
                subtitle: item.subtitle.split(' - ')[0] ?? item.subtitle,
                type: item.type,
                status,
            };

            return {
                ...current,
                [section]: nextSource,
                completed: [completedItem, ...current.completed],
            };
        });
    };

    const handlePrimaryAction = (item) => {
        if (item.primaryAction === 'Log Data') {
            Alert.alert('Log Data', `Open data input for ${item.title}.`);
            return;
        }
        moveToCompleted(item.section, item.id, 'done');
    };

    const handleSkip = (item) => {
        moveToCompleted(item.section, item.id, 'skipped');
    };

    const renderReminderCard = (item) => {
        const iconTheme = ICON_THEME[item.type] ?? ICON_THEME.exercise;
        return (
            <View key={item.id} style={styles.reminderCard}>
                <View style={styles.reminderTopRow}>
                    <View style={[styles.reminderIconWrap, { backgroundColor: iconTheme.tint }]}>
                        <AppIcon color={iconTheme.iconColor} name={iconTheme.icon} size={22} />
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
                        style={({ pressed }) => [
                            styles.primaryAction,
                            pressed && styles.primaryActionPressed,
                        ]}
                    >
                        <AppIcon color="#FFFFFF" name={item.primaryAction === 'Log Data' ? 'analytics' : 'checkmark-circle'} size={16} />
                        <Text style={styles.primaryActionText}>{item.primaryAction}</Text>
                    </Pressable>

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Skip ${item.title}`}
                        onPress={() => handleSkip(item)}
                        style={({ pressed }) => [styles.secondaryAction, pressed && styles.secondaryActionPressed]}
                    >
                        <Text style={styles.secondaryActionText}>Skip</Text>
                    </Pressable>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
            <View style={styles.mainContainer}>
                <View style={styles.header}>
                    <View style={styles.avatar}>
                        <AppIcon color="#9CA3AF" name="person" size={18} />
                    </View>
                    <View style={styles.titleBlock}>
                        <Text style={styles.headerTitle}>Health Reminders</Text>
                        <Text style={styles.headerSubtitle}>Manage your daily care</Text>
                    </View>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Open notifications"
                        onPress={() => router.push('/(app)/notifications')}
                        style={styles.bellButton}
                    >
                        <AppIcon color={palette.textSubtle} name="notifications" size={22} />
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

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {activeTab !== 'completed' ? (
                        <>
                            {morningItems.length > 0 ? <Text style={styles.sectionLabel}>MORNING TASKS</Text> : null}
                            {morningItems.map(renderReminderCard)}

                            {afternoonItems.length > 0 ? (
                                <Text style={[styles.sectionLabel, styles.sectionSpacing]}>AFTERNOON TASKS</Text>
                            ) : null}
                            {afternoonItems.map(renderReminderCard)}
                        </>
                    ) : null}

                    {completedItems.length > 0 ? (
                        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>
                            {activeTab === 'completed' ? 'COMPLETED' : 'EARLIER TODAY'}
                        </Text>
                    ) : null}

                    {completedItems.map((item) => (
                        <View key={item.id} style={styles.completedRow}>
                            <View style={styles.completedIconWrap}>
                                <AppIcon color="#FFFFFF" name="checkmark" size={14} />
                            </View>
                            <Text style={styles.completedText}>
                                {item.title} - {item.subtitle}
                                {item.status === 'skipped' ? ' (Skipped)' : ''}
                            </Text>
                        </View>
                    ))}

                    {activeTab !== 'completed' &&
                    morningItems.length === 0 &&
                    afternoonItems.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No reminders in this tab yet.</Text>
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
        backgroundColor: palette.background,
    },
    mainContainer: {
        flex: 1,
        backgroundColor: palette.background,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    titleBlock: {
        flex: 1,
    },
    headerTitle: {
        color: palette.text,
        fontSize: 20,
        lineHeight: 26,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    headerSubtitle: {
        color: palette.muted,
        fontSize: 13,
        lineHeight: 18,
        fontFamily: fonts.bodyRegular,
    },
    bellButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E5E7EB',
    },
    tabSwitcher: {
        flexDirection: 'row',
        backgroundColor: palette.segmentBg,
        borderRadius: 24,
        padding: 4,
        marginBottom: 10,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 20,
    },
    tabButtonActive: {
        backgroundColor: '#FFFFFF',
    },
    tabText: {
        color: palette.inactiveTabText,
        fontSize: 16,
        lineHeight: 18,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    tabTextActive: {
        color: palette.primary,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    scrollContent: {
        paddingTop: 6,
        paddingBottom: 170,
    },
    sectionLabel: {
        marginTop: 20,
        color: palette.sectionLabel,
        fontSize: 14,
        lineHeight: 16,
        letterSpacing: 1,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    sectionSpacing: {
        marginTop: 24,
    },
    reminderCard: {
        marginTop: 12,
        backgroundColor: palette.card,
        borderRadius: 20,
        padding: 18,
        shadowColor: '#000000',
        shadowOpacity: 0.07,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
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
        marginRight: 12,
    },
    reminderTextWrap: {
        flex: 1,
    },
    reminderTitle: {
        color: palette.text,
        fontSize: 16,
        lineHeight: 22,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    reminderSubtitle: {
        marginTop: 2,
        color: palette.muted,
        fontSize: 13,
        lineHeight: 18,
        fontFamily: fonts.bodyRegular,
    },
    actionRow: {
        marginTop: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    primaryAction: {
        flex: 1,
        height: 44,
        borderRadius: 22,
        backgroundColor: palette.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryActionPressed: {
        backgroundColor: palette.primaryPressed,
    },
    primaryActionText: {
        marginLeft: 7,
        color: '#FFFFFF',
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    secondaryAction: {
        minWidth: 94,
        height: 44,
        borderRadius: 22,
        backgroundColor: palette.actionSecondaryBg,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    secondaryActionPressed: {
        opacity: 0.72,
    },
    secondaryActionText: {
        color: palette.textSubtle,
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    completedRow: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    completedIconWrap: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: palette.primary,
        opacity: 0.65,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    completedText: {
        color: palette.muted,
        fontSize: 14,
        lineHeight: 20,
        fontFamily: fonts.bodyMedium,
        textDecorationLine: 'line-through',
    },
    emptyState: {
        marginTop: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.border,
        padding: 16,
        backgroundColor: '#FFFFFF',
    },
    emptyStateText: {
        color: palette.muted,
        fontSize: 14,
        lineHeight: 20,
        fontFamily: fonts.bodyRegular,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 88,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: palette.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#1D4ED8',
        shadowOpacity: 0.33,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
    fabPressed: {
        transform: [{ scale: 0.97 }],
    },
});
