import { useRouter } from 'expo-router';
import React from 'react';
import { useAuthStore } from '@/src/store/authStore';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon from '@/src/shared/components/AppIcon';
import { colors, fonts } from '@/src/core/theme/tokens';

const palette = {
    background: colors.background,
    text: colors.text,
    muted: colors.textMuted,
    primary: colors.primary,
    primarySoft: colors.primarySoft,
    primaryPressed: colors.primaryMid,
    border: colors.border,
    amber: colors.warningText,
    amberSoft: colors.warningSoft,
    amberBorder: '#FDE68A',
};

export function DoctorPendingScreen() {
    const router = useRouter();
    const signOut = useAuthStore((state) => state.signOut);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.iconWrap}>
                    <View style={styles.iconCircle}>
                        <AppIcon color={palette.amber} name="time" size={44} />
                    </View>
                </View>

                <Text style={styles.title}>Application Submitted</Text>
                <Text style={styles.subtitle}>
                    Your doctor account request has been received and is pending admin approval.
                </Text>

                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <AppIcon color={palette.amber} name="shield-checkmark" size={20} />
                        <Text style={styles.infoText}>
                            Our team will review your credentials and verify your information.
                        </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <AppIcon color={palette.amber} name="mail" size={20} />
                        <Text style={styles.infoText}>
                            You will receive an email notification once your account is approved.
                        </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <AppIcon color={palette.amber} name="log-in" size={20} />
                        <Text style={styles.infoText}>
                            Once approved, you can log in and access the doctor dashboard.
                        </Text>
                    </View>
                </View>

                <View style={styles.badge}>
                    <AppIcon color={palette.amber} name="hourglass" size={14} />
                    <Text style={styles.badgeText}>Awaiting Admin Approval</Text>
                </View>

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Go to Log In"
                    onPress={async () => { await signOut(); router.replace('/(auth)/login'); }}
                    style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                >
                    <Text style={styles.buttonText}>Back to Log In</Text>
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
        paddingHorizontal: 28,
        paddingTop: 48,
        paddingBottom: 32,
        alignItems: 'center',
    },
    iconWrap: {
        marginBottom: 28,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: palette.amberSoft,
        borderWidth: 2,
        borderColor: palette.amberBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        color: palette.text,
        fontSize: 26,
        lineHeight: 32,
        fontFamily: fonts.bodyBold,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        color: palette.muted,
        fontSize: 15,
        lineHeight: 22,
        fontFamily: fonts.bodyRegular,
        textAlign: 'center',
        marginBottom: 32,
    },
    infoCard: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.amberBorder,
        backgroundColor: palette.amberSoft,
        paddingVertical: 4,
        paddingHorizontal: 20,
        marginBottom: 28,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 14,
        gap: 12,
    },
    infoText: {
        flex: 1,
        color: palette.text,
        fontSize: 14,
        lineHeight: 20,
        fontFamily: fonts.bodyRegular,
    },
    divider: {
        height: 1,
        backgroundColor: palette.amberBorder,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: palette.amberSoft,
        borderWidth: 1,
        borderColor: palette.amberBorder,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 6,
        marginBottom: 36,
    },
    badgeText: {
        color: palette.amber,
        fontSize: 13,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    button: {
        width: '100%',
        height: 58,
        borderRadius: 29,
        backgroundColor: palette.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    buttonPressed: {
        backgroundColor: palette.primaryPressed,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
});
