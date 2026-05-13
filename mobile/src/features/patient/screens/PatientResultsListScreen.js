import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadows, spacing, typography } from '@/src/core/theme/tokens';
import AppIcon from '@/src/shared/components/AppIcon';

const palette = {
    background: colors.background,
    surface: colors.surface,
    primary: colors.primary,
    primaryPressed: colors.primaryMid,
    text: colors.text,
    muted: colors.textMuted,
    segmentBg: colors.background,
    border: colors.border,
    successTint: colors.successSoft,
    successText: '#15803D',
    dangerTint: colors.dangerSoft,
    dangerText: colors.danger,
    neutralTint: colors.primarySoft,
    neutralText: colors.primary,
};

const RANGE_OPTIONS = ['24h', '7d', '30d'];

const VITAL_CARDS = [
    {
        id: 'heart-rate',
        title: 'Heart Rate',
        value: '72',
        unit: 'BPM',
        trendLabel: '2%',
        trendTone: 'up',
        icon: 'heart',
        iconColor: '#EF4444',
        iconBg: '#FCE7E7',
        miniChart: 'pulse',
    },
    {
        id: 'blood-pressure',
        title: 'Blood Pressure',
        value: '120/80',
        unit: 'mmHg',
        trendLabel: 'Stable',
        trendTone: 'stable',
        icon: 'pulse',
        iconColor: colors.primary,
        iconBg: colors.primarySoft,
        miniChart: 'analytics',
    },
    {
        id: 'spo2',
        title: 'SpO2',
        value: '98',
        unit: '%',
        trendLabel: '1%',
        trendTone: 'down',
        icon: 'airplane',
        iconColor: colors.info,
        iconBg: colors.infoSoft,
        miniChart: 'stats-chart',
    },
    {
        id: 'temperature',
        title: 'Temperature',
        value: '98.6',
        unit: 'F',
        trendLabel: '0.2°',
        trendTone: 'up',
        icon: 'thermometer',
        iconColor: '#F97316',
        iconBg: '#F8EEE4',
        miniChart: 'trending-up',
    },
];

const trendStyleByTone = {
    up: {
        backgroundColor: palette.successTint,
        color: palette.successText,
        icon: 'trending-up',
    },
    down: {
        backgroundColor: palette.dangerTint,
        color: palette.dangerText,
        icon: 'trending-down',
    },
    stable: {
        backgroundColor: palette.neutralTint,
        color: palette.neutralText,
        icon: 'remove',
    },
};

export function PatientResultsListScreen() {
    const router = useRouter();
    const [selectedRange, setSelectedRange] = useState('24h');

    const cards = useMemo(() => VITAL_CARDS, []);

    return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.heroCard}>
                    <View style={styles.heroTopRow}>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Go back"
                            hitSlop={10}
                            onPress={() => router.back()}
                            style={styles.headerIconButton}
                        >
                            <AppIcon color={palette.text} name="chevron-back" size={22} />
                        </Pressable>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Open calendar"
                            hitSlop={10}
                            onPress={() => router.push('/(app)/(patient)/appointments')}
                            style={styles.headerIconButton}
                        >
                            <AppIcon color={palette.text} name="calendar-outline" size={22} />
                        </Pressable>
                    </View>
                    <Text style={styles.headerTitle}>My Vitals</Text>
                    <Text style={styles.heroSubtitle}>Track your latest readings and health trends.</Text>
                </View>

                <View style={styles.segmentedControl}>
                    {RANGE_OPTIONS.map((range) => {
                        const active = selectedRange === range;
                        return (
                            <Pressable
                                key={range}
                                accessibilityRole="button"
                                accessibilityLabel={`Show ${range} vitals`}
                                onPress={() => setSelectedRange(range)}
                                style={[styles.segmentButton, active && styles.segmentButtonActive]}
                            >
                                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{range}</Text>
                            </Pressable>
                        );
                    })}
                </View>

                <Text style={styles.lastUpdatedText}>Last updated: 2 mins ago</Text>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {cards.map((item) => {
                        const trend = trendStyleByTone[item.trendTone];
                        return (
                            <Pressable
                                key={item.id}
                                accessibilityRole="button"
                                accessibilityLabel={`Open ${item.title} details`}
                                onPress={() =>
                                    router.push({
                                        pathname: '/(app)/(patient)/result/[resultId]',
                                        params: { resultId: item.id },
                                    })
                                }
                                style={({ pressed }) => [styles.vitalCard, pressed && styles.vitalCardPressed]}
                            >
                                <View style={styles.cardTopRow}>
                                    <View style={styles.cardTitleRow}>
                                        <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
                                            <AppIcon color={item.iconColor} name={item.icon} size={22} />
                                        </View>
                                        <View>
                                            <Text style={styles.cardTitle}>{item.title}</Text>
                                            <Text style={styles.cardSubtitle}>Last Reading</Text>
                                        </View>
                                    </View>

                                    <View style={[styles.trendChip, { backgroundColor: trend.backgroundColor }]}>
                                        <AppIcon color={trend.color} name={trend.icon} size={14} />
                                        <Text style={[styles.trendChipText, { color: trend.color }]}>{item.trendLabel}</Text>
                                    </View>
                                </View>

                                <View style={styles.cardBottomRow}>
                                    <View style={styles.valueRow}>
                                        <Text style={styles.valueText}>{item.value}</Text>
                                        <Text style={styles.unitText}>{item.unit}</Text>
                                    </View>

                                    <View style={styles.miniChartBox}>
                                        <AppIcon color="#7C8AA4" name={item.miniChart} size={20} />
                                    </View>
                                </View>
                            </Pressable>
                        );
                    })}
                </ScrollView>

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Add new vital reading"
                    onPress={() => router.push('/(app)/(patient)/add-vitals')}
                    style={({ pressed }) => [
                        styles.addButton,
                        pressed && { backgroundColor: palette.primaryPressed },
                    ]}
                >
                    <AppIcon color="#FFFFFF" name="add" size={28} />
                    <Text style={styles.addButtonText}>Add New Reading</Text>
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
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    heroCard: {
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
        borderRadius: radius.lg,
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.border,
        padding: spacing.md,
        ...shadows.card,
    },
    heroTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerIconButton: {
        width: 42,
        height: 42,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        marginTop: spacing.md,
        color: palette.text,
        fontSize: 30,
        lineHeight: 36,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    heroSubtitle: {
        marginTop: spacing.xs,
        color: palette.muted,
        fontSize: typography.body,
        lineHeight: 22,
        fontFamily: fonts.bodyRegular,
    },
    segmentedControl: {
        marginTop: 16,
        marginHorizontal: 28,
        backgroundColor: palette.segmentBg,
        borderRadius: radius.sm,
        padding: 6,
        flexDirection: 'row',
        alignItems: 'center',
    },
    segmentButton: {
        flex: 1,
        borderRadius: radius.sm,
        paddingVertical: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentButtonActive: {
        backgroundColor: '#FFFFFF',
    },
    segmentText: {
        color: palette.muted,
        fontSize: 20,
        lineHeight: 24,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    segmentTextActive: {
        color: palette.primary,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    lastUpdatedText: {
        marginTop: 16,
        marginHorizontal: 28,
        color: palette.muted,
        fontSize: 16,
        lineHeight: 22,
        fontFamily: fonts.bodyMedium,
    },
    scrollContent: {
        paddingHorizontal: 28,
        paddingTop: 8,
        paddingBottom: 132,
        gap: 14,
    },
    vitalCard: {
        marginTop: 12,
        backgroundColor: palette.surface,
        borderRadius: radius.md,
        padding: 18,
        borderWidth: 1,
        borderColor: palette.border,
        ...shadows.card,
    },
    vitalCardPressed: {
        opacity: 0.9,
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    cardTitle: {
        color: palette.text,
        fontSize: 22,
        lineHeight: 26,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    cardSubtitle: {
        color: palette.muted,
        fontSize: 15,
        lineHeight: 20,
        fontFamily: fonts.bodyRegular,
    },
    trendChip: {
        borderRadius: radius.sm,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    trendChipText: {
        marginLeft: 4,
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    cardBottomRow: {
        marginTop: 22,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    valueText: {
        color: palette.text,
        fontSize: 44,
        lineHeight: 42,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    unitText: {
        marginLeft: 6,
        marginBottom: 3,
        color: palette.muted,
        fontSize: 19,
        lineHeight: 22,
        fontFamily: fonts.bodyMedium,
    },
    miniChartBox: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButton: {
        position: 'absolute',
        left: 28,
        right: 28,
        bottom: 20,
        height: 60,
        borderRadius: radius.sm,
        backgroundColor: palette.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: palette.primary,
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 6,
    },
    addButtonText: {
        marginLeft: 8,
        color: '#FFFFFF',
        fontSize: 18,
        lineHeight: 24,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
});
