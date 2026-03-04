import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '@/src/core/theme/tokens';
import AppIcon from '@/src/shared/components/AppIcon';

const palette = {
    background: '#F3F4F8',
    surface: '#FFFFFF',
    primary: '#1D4ED8',
    text: '#111827',
    muted: '#6B7280',
    border: '#E5E7EB',
    segmentBg: '#E5E7EB',
    activeSegmentBg: '#FFFFFF',
    success: '#10B981',
};

const RANGE_OPTIONS = ['D', 'W', 'M', '6M', 'Y'];

const metricById = {
    'heart-rate': {
        name: 'Heart Rate',
        unit: 'BPM',
        average: 72,
        min: 58,
        max: 142,
        currentAverage: 74,
        trend: '2%',
        history: [
            { id: 'm1', value: 72, time: 'Today, 08:45 AM', state: 'RESTING' },
            { id: 'm2', value: 124, time: 'Today, 01:05 PM', state: 'ACTIVE' },
            { id: 'm3', value: 68, time: 'Oct 17, 11:30 PM', state: 'SLEEPING' },
            { id: 'm4', value: 75, time: 'Oct 17, 02:15 PM', state: 'RESTING' },
        ],
    },
    'blood-pressure': {
        name: 'Blood Pressure',
        unit: 'mmHg',
        average: 120,
        min: 98,
        max: 152,
        currentAverage: 124,
        trend: '1%',
        history: [
            { id: 'bp1', value: '120/80', time: 'Today, 08:45 AM', state: 'STABLE' },
            { id: 'bp2', value: '125/82', time: 'Today, 01:05 PM', state: 'SLIGHT HIGH' },
            { id: 'bp3', value: '118/77', time: 'Oct 17, 11:30 PM', state: 'STABLE' },
        ],
    },
    spo2: {
        name: 'SpO2',
        unit: '%',
        average: 98,
        min: 93,
        max: 100,
        currentAverage: 98,
        trend: '1%',
        history: [
            { id: 'o1', value: '98', time: 'Today, 08:45 AM', state: 'OPTIMAL' },
            { id: 'o2', value: '97', time: 'Today, 01:05 PM', state: 'GOOD' },
        ],
    },
    temperature: {
        name: 'Temperature',
        unit: 'C',
        average: 36.6,
        min: 35.8,
        max: 38.1,
        currentAverage: 36.7,
        trend: '0.2°',
        history: [
            { id: 't1', value: '36.6', time: 'Today, 08:45 AM', state: 'NORMAL' },
            { id: 't2', value: '37.1', time: 'Today, 01:05 PM', state: 'ELEVATED' },
        ],
    },
};

const graphPoints = [
    { x: '8%', y: '70%' },
    { x: '26%', y: '50%' },
    { x: '44%', y: '64%' },
    { x: '64%', y: '42%' },
    { x: '82%', y: '58%' },
    { x: '94%', y: '56%' },
];

const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export function PatientResultDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [selectedRange, setSelectedRange] = useState('W');

    const resultId = typeof params.resultId === 'string' ? params.resultId : 'heart-rate';
    const metric = metricById[resultId] ?? metricById['heart-rate'];

    const summaryCards = useMemo(
        () => [
            { id: 'min', label: 'MIN', value: metric.min, active: false },
            { id: 'avg', label: 'AVG', value: metric.average, active: true },
            { id: 'max', label: 'MAX', value: metric.max, active: false },
        ],
        [metric.average, metric.max, metric.min],
    );

    return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                        onPress={() => router.back()}
                        hitSlop={10}
                        style={styles.headerIconButton}
                    >
                        <AppIcon color={palette.text} name="chevron-back" size={28} />
                    </Pressable>

                    <Text style={styles.headerTitle}>{metric.name}</Text>

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Share details"
                        onPress={() => {}}
                        hitSlop={10}
                        style={styles.headerIconButton}
                    >
                        <AppIcon color={palette.text} name="share-social-outline" size={24} />
                    </Pressable>
                </View>

                <View style={styles.segmentedControl}>
                    {RANGE_OPTIONS.map((range) => {
                        const active = selectedRange === range;
                        return (
                            <Pressable
                                key={range}
                                accessibilityRole="button"
                                accessibilityLabel={`Show ${range} data`}
                                onPress={() => setSelectedRange(range)}
                                style={[styles.segmentButton, active && styles.segmentButtonActive]}
                            >
                                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{range}</Text>
                            </Pressable>
                        );
                    })}
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.summaryRow}>
                        {summaryCards.map((card) => (
                            <View
                                key={card.id}
                                style={[styles.summaryCard, card.active && styles.summaryCardActive]}
                            >
                                <Text style={[styles.summaryLabel, card.active && styles.summaryLabelActive]}>
                                    {card.label}
                                </Text>
                                <Text style={[styles.summaryValue, card.active && styles.summaryValueActive]}>
                                    {card.value}
                                </Text>
                                <Text style={[styles.summaryUnit, card.active && styles.summaryUnitActive]}>
                                    {metric.unit}
                                </Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.chartCard}>
                        <Text style={styles.chartTitle}>Current Average</Text>
                        <View style={styles.chartStatsRow}>
                            <View style={styles.chartValueRow}>
                                <Text style={styles.chartValue}>{metric.currentAverage}</Text>
                                <Text style={styles.chartUnit}>{metric.unit}</Text>
                                <View style={styles.trendWrap}>
                                    <AppIcon color={palette.success} name="trending-down" size={14} />
                                    <Text style={styles.trendText}>{metric.trend}</Text>
                                </View>
                            </View>
                            <Text style={styles.chartRangeLabel}>Oct 12 - Oct 19</Text>
                        </View>

                        <View style={styles.graphArea}>
                            <View style={styles.graphFill} />

                            {graphPoints.map((point, index) => (
                                <View
                                    key={`point-${index}`}
                                    style={[
                                        styles.graphPoint,
                                        {
                                            left: point.x,
                                            top: point.y,
                                        },
                                    ]}
                                />
                            ))}

                            <View style={styles.graphConnectorA} />
                            <View style={styles.graphConnectorB} />
                            <View style={styles.graphConnectorC} />
                            <View style={styles.graphConnectorD} />
                            <View style={styles.graphConnectorE} />

                            <View style={styles.tooltip}>
                                <Text style={styles.tooltipTitle}>88 BPM</Text>
                                <Text style={styles.tooltipSubtitle}>Tue 10:15 AM</Text>
                            </View>
                        </View>

                        <View style={styles.graphLabelsRow}>
                            {dayLabels.map((label) => (
                                <Text key={label} style={styles.graphLabel}>
                                    {label}
                                </Text>
                            ))}
                        </View>
                    </View>

                    <View style={styles.historyHeader}>
                        <Text style={styles.historyTitle}>Measurement History</Text>
                        <Pressable accessibilityRole="button" onPress={() => {}}>
                            <Text style={styles.historyViewAll}>View All</Text>
                        </Pressable>
                    </View>

                    <View style={styles.historyList}>
                        {metric.history.map((entry) => (
                            <View key={entry.id} style={styles.historyCard}>
                                <View style={styles.historyIconWrap}>
                                    <AppIcon color={palette.primary} name="heart" size={20} />
                                </View>
                                <View style={styles.historyTextWrap}>
                                    <View style={styles.historyValueRow}>
                                        <Text style={styles.historyValue}>{entry.value}</Text>
                                        <Text style={styles.historyUnit}>{metric.unit}</Text>
                                    </View>
                                    <Text style={styles.historyTime}>{entry.time}</Text>
                                </View>
                                <View style={styles.historyStateChip}>
                                    <Text style={styles.historyStateText}>{entry.state}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Add reading"
                    onPress={() => router.push('/(app)/(patient)/add-vitals')}
                    style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
                >
                    <AppIcon color="#FFFFFF" name="add" size={30} />
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
    headerRow: {
        height: 76,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    headerIconButton: {
        width: 46,
        height: 46,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: palette.text,
        fontSize: 24,
        lineHeight: 30,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    segmentedControl: {
        marginTop: 14,
        marginHorizontal: 22,
        backgroundColor: palette.segmentBg,
        borderRadius: 16,
        padding: 5,
        flexDirection: 'row',
    },
    segmentButton: {
        flex: 1,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    segmentButtonActive: {
        backgroundColor: palette.activeSegmentBg,
    },
    segmentText: {
        color: palette.muted,
        fontSize: 16,
        lineHeight: 20,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    segmentTextActive: {
        color: palette.primary,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    scrollContent: {
        paddingHorizontal: 22,
        paddingBottom: 140,
    },
    summaryRow: {
        marginTop: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    summaryCard: {
        flex: 1,
        borderRadius: 16,
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.border,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    summaryCardActive: {
        borderColor: '#A5B4FC',
        backgroundColor: '#EDE9FE',
    },
    summaryLabel: {
        color: '#94A3B8',
        fontSize: 12,
        lineHeight: 16,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    summaryLabelActive: {
        color: palette.primary,
    },
    summaryValue: {
        marginTop: 6,
        color: palette.text,
        fontSize: 38,
        lineHeight: 36,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    summaryValueActive: {
        color: palette.primary,
    },
    summaryUnit: {
        marginTop: 1,
        color: palette.muted,
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodyMedium,
    },
    summaryUnitActive: {
        color: palette.primary,
    },
    chartCard: {
        marginTop: 18,
        backgroundColor: palette.surface,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: palette.border,
    },
    chartTitle: {
        color: '#64748B',
        fontSize: 18,
        lineHeight: 24,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    chartStatsRow: {
        marginTop: 6,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    chartValueRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    chartValue: {
        color: palette.text,
        fontSize: 44,
        lineHeight: 42,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    chartUnit: {
        marginLeft: 6,
        marginBottom: 4,
        color: '#64748B',
        fontSize: 16,
        lineHeight: 20,
        fontFamily: fonts.bodyMedium,
    },
    trendWrap: {
        marginLeft: 10,
        marginBottom: 6,
        flexDirection: 'row',
        alignItems: 'center',
    },
    trendText: {
        marginLeft: 2,
        color: palette.success,
        fontSize: 15,
        lineHeight: 18,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    chartRangeLabel: {
        color: '#94A3B8',
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodyMedium,
    },
    graphArea: {
        height: 220,
        borderRadius: 14,
        marginTop: 14,
        backgroundColor: '#F8FAFC',
        overflow: 'hidden',
        position: 'relative',
    },
    graphFill: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '60%',
        backgroundColor: '#DDE1FF',
        opacity: 0.8,
    },
    graphPoint: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: palette.primary,
        backgroundColor: '#FFFFFF',
        marginLeft: -6,
        marginTop: -6,
        zIndex: 2,
    },
    graphConnectorA: {
        position: 'absolute',
        left: '8%',
        top: '67%',
        width: '18%',
        borderTopWidth: 3,
        borderTopColor: palette.primary,
        transform: [{ rotate: '-34deg' }],
    },
    graphConnectorB: {
        position: 'absolute',
        left: '26%',
        top: '51%',
        width: '18%',
        borderTopWidth: 3,
        borderTopColor: palette.primary,
        transform: [{ rotate: '35deg' }],
    },
    graphConnectorC: {
        position: 'absolute',
        left: '44%',
        top: '62%',
        width: '20%',
        borderTopWidth: 3,
        borderTopColor: palette.primary,
        transform: [{ rotate: '-35deg' }],
    },
    graphConnectorD: {
        position: 'absolute',
        left: '64%',
        top: '43%',
        width: '18%',
        borderTopWidth: 3,
        borderTopColor: palette.primary,
        transform: [{ rotate: '26deg' }],
    },
    graphConnectorE: {
        position: 'absolute',
        left: '82%',
        top: '56%',
        width: '12%',
        borderTopWidth: 3,
        borderTopColor: palette.primary,
        transform: [{ rotate: '-8deg' }],
    },
    tooltip: {
        position: 'absolute',
        left: '28%',
        top: '10%',
        backgroundColor: '#0F172A',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    tooltipTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    tooltipSubtitle: {
        color: '#CBD5E1',
        fontSize: 12,
        lineHeight: 16,
        fontFamily: fonts.bodyRegular,
    },
    graphLabelsRow: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 6,
    },
    graphLabel: {
        color: '#94A3B8',
        fontSize: 12,
        lineHeight: 16,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    historyHeader: {
        marginTop: 18,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    historyTitle: {
        color: palette.text,
        fontSize: 20,
        lineHeight: 26,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    historyViewAll: {
        color: palette.primary,
        fontSize: 16,
        lineHeight: 20,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    historyList: {
        gap: 10,
    },
    historyCard: {
        backgroundColor: palette.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.border,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
    },
    historyIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    historyTextWrap: {
        flex: 1,
    },
    historyValueRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    historyValue: {
        color: palette.text,
        fontSize: 24,
        lineHeight: 28,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    historyUnit: {
        marginLeft: 4,
        marginBottom: 2,
        color: '#94A3B8',
        fontSize: 12,
        lineHeight: 16,
        fontFamily: fonts.bodyMedium,
    },
    historyTime: {
        color: palette.muted,
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodyRegular,
    },
    historyStateChip: {
        backgroundColor: '#EEF2F7',
        borderRadius: 14,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    historyStateText: {
        color: '#64748B',
        fontSize: 12,
        lineHeight: 16,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        right: 22,
        bottom: 88,
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: palette.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#1D4ED8',
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 7,
    },
    fabPressed: {
        transform: [{ scale: 0.96 }],
    },
});
