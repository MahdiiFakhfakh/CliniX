import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '@/src/core/theme/tokens';
import AppIcon from '@/src/shared/components/AppIcon';

const palette = {
    bg: '#13090A',
    panel: '#261B1D',
    panelSoft: '#2E2326',
    danger: '#FF1218',
    text: '#FFFFFF',
    muted: '#A8A2A7',
    border: '#3A2D31',
    infoBg: '#111A3A',
    infoBorder: '#1E3A8A',
};

const checklistTemplate = [
    {
        id: 'responsive',
        title: 'Check responsiveness',
        note: 'Attempt to wake the patient and check for verbal response.',
    },
    {
        id: 'oxygen',
        title: 'Verify Oxygen Supply',
        note: 'Ensure nasal cannula or mask is fitted correctly and flow is active.',
    },
    {
        id: 'positioning',
        title: 'Positioning',
        note: 'Elevate the head of the bed to 45 degrees if tolerated.',
    },
];

export function VitalAlertDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const alertId = typeof params.alertId === 'string' ? params.alertId : 'alert-oxygen-low';
    const [checkedIds, setCheckedIds] = useState([]);

    const toggleCheck = (id) => {
        setCheckedIds((current) =>
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                        onPress={() => router.back()}
                        style={styles.headerIconButton}
                    >
                        <AppIcon color={palette.text} name="chevron-back" size={30} />
                    </Pressable>
                    <Text style={styles.headerTitle}>CliniX Alert</Text>
                    <View style={styles.bellWrap}>
                        <AppIcon color={palette.danger} name="notifications" size={24} />
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.alertIconWrap}>
                        <AppIcon color={palette.danger} name="warning" size={54} />
                    </View>

                    <Text style={styles.alertValue}>Low SpO2: 88%</Text>
                    <Text style={styles.alertPatient}>Patient: Robert Johnson • Room 402</Text>
                    <Text style={styles.alertTime}>Triggered at 10:42 AM • 2 mins ago</Text>

                    <View style={styles.instructionsCard}>
                        <View style={styles.instructionsHeader}>
                            <AppIcon color={palette.danger} name="medical-bag" size={26} />
                            <Text style={styles.instructionsTitle}>Safety Instructions</Text>
                        </View>

                        {checklistTemplate.map((item) => {
                            const checked = checkedIds.includes(item.id);
                            return (
                                <Pressable
                                    key={item.id}
                                    accessibilityRole="checkbox"
                                    accessibilityState={{ checked }}
                                    accessibilityLabel={item.title}
                                    onPress={() => toggleCheck(item.id)}
                                    style={[styles.instructionItem, checked && styles.instructionItemChecked]}
                                >
                                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
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
                </ScrollView>

                <View style={styles.bottomActions}>
                    <Pressable accessibilityRole="button" style={styles.secondaryAction}>
                        <AppIcon color="#FFFFFF" name="call" size={24} />
                        <Text style={styles.secondaryActionText}>Call Clinic Reception</Text>
                    </Pressable>

                    <Pressable accessibilityRole="button" style={styles.emergencyAction}>
                        <AppIcon color="#FFFFFF" name="locate" size={24} />
                        <Text style={styles.emergencyActionText}>Emergency Services (911)</Text>
                    </Pressable>

                    <View style={styles.noteCard}>
                        <AppIcon color="#60A5FA" name="information-circle" size={30} />
                        <View style={styles.noteTextWrap}>
                            <Text style={styles.noteLabel}>NOTE</Text>
                            <Text style={styles.noteText}>
                                Medical history indicates occasional sleep apnea. Verify if patient is sleeping.
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: palette.bg,
    },
    container: {
        flex: 1,
        backgroundColor: palette.bg,
    },
    headerRow: {
        height: 76,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIconButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        marginLeft: 8,
        color: palette.text,
        fontSize: 22,
        lineHeight: 28,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    bellWrap: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#2A1315',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 280,
    },
    alertIconWrap: {
        marginTop: 26,
        width: 148,
        height: 148,
        borderRadius: 74,
        backgroundColor: '#3B1015',
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
    },
    alertValue: {
        marginTop: 20,
        textAlign: 'center',
        color: palette.danger,
        fontSize: 56,
        lineHeight: 58,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    alertPatient: {
        marginTop: 10,
        color: '#C4AEB0',
        textAlign: 'center',
        fontSize: 17,
        lineHeight: 23,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    alertTime: {
        marginTop: 6,
        color: '#766A70',
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodyMedium,
    },
    instructionsCard: {
        marginTop: 22,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.panel,
        padding: 16,
    },
    instructionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    instructionsTitle: {
        marginLeft: 10,
        color: palette.text,
        fontSize: 24,
        lineHeight: 30,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    instructionItem: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: '#22181B',
        padding: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 10,
    },
    instructionItemChecked: {
        borderColor: '#4B5563',
    },
    checkbox: {
        width: 34,
        height: 34,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#5A3D40',
        marginRight: 12,
        marginTop: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: palette.danger,
        borderColor: palette.danger,
    },
    instructionTextWrap: {
        flex: 1,
    },
    instructionTitle: {
        color: palette.text,
        fontSize: 20,
        lineHeight: 26,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    instructionNote: {
        marginTop: 4,
        color: '#9CA3AF',
        fontSize: 16,
        lineHeight: 22,
        fontFamily: fonts.bodyRegular,
    },
    bottomActions: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        borderTopWidth: 1,
        borderTopColor: palette.border,
        backgroundColor: '#1B0C0E',
        paddingHorizontal: 24,
        paddingTop: 14,
        paddingBottom: 24,
        gap: 12,
    },
    secondaryAction: {
        height: 58,
        borderRadius: 16,
        backgroundColor: '#3A3033',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryActionText: {
        marginLeft: 10,
        color: '#FFFFFF',
        fontSize: 18,
        lineHeight: 22,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    emergencyAction: {
        height: 58,
        borderRadius: 16,
        backgroundColor: palette.danger,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FF1218',
        shadowOpacity: 0.35,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 7,
    },
    emergencyActionText: {
        marginLeft: 10,
        color: '#FFFFFF',
        fontSize: 18,
        lineHeight: 22,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    noteCard: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.infoBorder,
        backgroundColor: palette.infoBg,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    noteTextWrap: {
        marginLeft: 10,
        flex: 1,
    },
    noteLabel: {
        color: '#A5B4FC',
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    noteText: {
        marginTop: 3,
        color: '#BFDBFE',
        fontSize: 14,
        lineHeight: 21,
        fontFamily: fonts.bodyMedium,
    },
});
