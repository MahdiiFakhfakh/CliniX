import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '@/src/core/theme/tokens';
import AppIcon from '@/src/shared/components/AppIcon';

const palette = {
    background: '#F3F4F8',
    card: '#FFFFFF',
    primary: '#1D4ED8',
    text: '#111827',
    muted: '#6B7280',
};

export function PatientVideoScreen() {
    const router = useRouter();

    return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
            <View style={styles.container}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    hitSlop={12}
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <AppIcon color={palette.text} name="chevron-back" size={22} />
                </Pressable>

                <View style={styles.card}>
                    <View style={styles.iconCircle}>
                        <AppIcon color={palette.primary} name="videocam" size={34} />
                    </View>
                    <Text style={styles.title}>Video Consultation</Text>
                    <Text style={styles.subtitle}>
                        Your secure video call screen will appear here at appointment time.
                    </Text>
                </View>
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
        paddingHorizontal: 24,
        paddingTop: 8,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    card: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.card,
        borderRadius: 24,
        paddingHorizontal: 24,
    },
    iconCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#E0E7FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        color: palette.text,
        fontSize: 24,
        lineHeight: 30,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        color: palette.muted,
        fontSize: 15,
        lineHeight: 22,
        fontFamily: fonts.bodyRegular,
        textAlign: 'center',
    },
});
