import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import AppIcon from '@/src/shared/components/AppIcon';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '@/src/core/theme/tokens';

const palette = {
    background: colors.background,
    surface: colors.surface,
    primary: colors.primary,
    primaryPressed: colors.primaryMid,
    text: colors.text,
    muted: colors.textMuted,
    border: colors.border,
    success: colors.success,
};

export function AddVitalsScreen() {
    const router = useRouter();
    const [deviceSync, setDeviceSync] = useState(true);
    const [heartRate, setHeartRate] = useState('');
    const [spo2, setSpo2] = useState('');
    const [bloodPressure, setBloodPressure] = useState('');
    const [temperature, setTemperature] = useState('');
    const [notes, setNotes] = useState('');

    const handleSave = () => {
        router.back();
    };

    return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardWrap}
            >
                <View style={styles.headerRow}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Close"
                        onPress={() => router.back()}
                        style={styles.headerButton}
                    >
                        <AppIcon color={palette.text} name="close" size={32} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Add Vitals</Text>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Help"
                        onPress={() => {}}
                        style={styles.headerButton}
                    >
                        <Text style={styles.helpText}>Help</Text>
                    </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.syncCard}>
                        <View style={styles.syncLeft}>
                            <View style={styles.syncIconWrap}>
                                <AppIcon color={palette.success} name="sync" size={24} />
                            </View>
                            <View>
                                <Text style={styles.syncTitle}>Device Sync</Text>
                                <Text style={styles.syncStatus}>• Connected to Apple Health</Text>
                            </View>
                        </View>
                        <Switch
                            accessibilityLabel="Toggle device sync"
                            onValueChange={setDeviceSync}
                            trackColor={{ false: colors.border, true: palette.primary }}
                            thumbColor="#FFFFFF"
                            value={deviceSync}
                        />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Heart Rate (bpm)</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                accessibilityLabel="Heart rate"
                                keyboardType="numeric"
                                onChangeText={setHeartRate}
                                placeholder="e.g. 72"
                                placeholderTextColor={colors.textSubtle}
                                style={styles.input}
                                value={heartRate}
                            />
                            <AppIcon color={colors.textMuted} name="heart-half" size={22} />
                        </View>
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>SpO2 (%)</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                accessibilityLabel="SpO2"
                                keyboardType="numeric"
                                onChangeText={setSpo2}
                                placeholder="e.g. 98"
                                placeholderTextColor={colors.textSubtle}
                                style={styles.input}
                                value={spo2}
                            />
                            <AppIcon color={colors.textMuted} name="medkit" size={22} />
                        </View>
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Blood Pressure (mmHg)</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                accessibilityLabel="Blood pressure"
                                onChangeText={setBloodPressure}
                                placeholder="e.g. 120/80"
                                placeholderTextColor={colors.textSubtle}
                                style={styles.input}
                                value={bloodPressure}
                            />
                            <AppIcon color={colors.textMuted} name="speedometer" size={22} />
                        </View>
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Temperature (°C)</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                accessibilityLabel="Temperature"
                                keyboardType="numeric"
                                onChangeText={setTemperature}
                                placeholder="e.g. 36.6"
                                placeholderTextColor={colors.textSubtle}
                                style={styles.input}
                                value={temperature}
                            />
                            <AppIcon color={colors.textMuted} name="thermometer" size={22} />
                        </View>
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Notes (Optional)</Text>
                        <TextInput
                            accessibilityLabel="Additional notes"
                            multiline
                            onChangeText={setNotes}
                            placeholder="Add any additional context..."
                            placeholderTextColor={colors.textSubtle}
                            style={styles.notesInput}
                            value={notes}
                        />
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Save Reading"
                        onPress={handleSave}
                        style={({ pressed }) => [
                            styles.saveButton,
                            pressed && { backgroundColor: palette.primaryPressed },
                        ]}
                    >
                        <Text style={styles.saveButtonText}>Save Reading</Text>
                        <AppIcon color="#FFFFFF" name="checkmark-circle" size={26} />
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: palette.background,
    },
    keyboardWrap: {
        flex: 1,
    },
    headerRow: {
        height: 78,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        backgroundColor: palette.background,
    },
    headerButton: {
        minWidth: 52,
        height: 44,
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
    helpText: {
        color: palette.primary,
        fontSize: 20,
        lineHeight: 24,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    scrollContent: {
        paddingHorizontal: 28,
        paddingTop: 18,
        paddingBottom: 120,
    },
    syncCard: {
        backgroundColor: palette.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.border,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    syncLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    syncIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#DCFCE7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    syncTitle: {
        color: palette.text,
        fontSize: 22,
        lineHeight: 28,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    syncStatus: {
        color: palette.success,
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodyMedium,
    },
    fieldGroup: {
        marginTop: 24,
    },
    label: {
        color: palette.text,
        fontSize: 20,
        lineHeight: 26,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputRow: {
        height: 68,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.surface,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        color: palette.text,
        fontSize: 20,
        lineHeight: 26,
        fontFamily: fonts.bodyRegular,
    },
    notesInput: {
        minHeight: 130,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.surface,
        paddingHorizontal: 16,
        paddingVertical: 16,
        color: palette.text,
        fontSize: 20,
        lineHeight: 28,
        fontFamily: fonts.bodyRegular,
        textAlignVertical: 'top',
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: palette.border,
        paddingHorizontal: 28,
        paddingTop: 14,
        paddingBottom: 18,
        backgroundColor: palette.background,
    },
    saveButton: {
        height: 62,
        borderRadius: 16,
        backgroundColor: palette.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: palette.primary,
        shadowOpacity: 0.28,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 6,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 20,
        lineHeight: 26,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        marginRight: 10,
    },
});
