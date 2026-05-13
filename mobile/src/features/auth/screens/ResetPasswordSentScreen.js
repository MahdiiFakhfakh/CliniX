import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '@/src/core/theme/tokens';
import { forgotPassword } from '@/src/services/api/endpoints/authApi';
import AppIcon from '@/src/shared/components/AppIcon';

const palette = {
    background: colors.background,
    primary: colors.primary,
    primaryPressed: colors.primaryMid,
    primarySoft: colors.primarySoft,
    primaryDot: colors.infoBorder,
    text: colors.text,
    muted: colors.textMuted,
    bubbleBg: colors.surfaceTint,
    white: colors.surface,
};

export function ResetLinkSentScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const fadeValue = useRef(new Animated.Value(0)).current;
    const iconScaleValue = useRef(new Animated.Value(0.92)).current;
    const [loadingResend, setLoadingResend] = useState(false);

    const email = typeof params.email === 'string' ? params.email : null;
    const message = typeof params.message === 'string' ? params.message : '';

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeValue, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(iconScaleValue, {
                toValue: 1,
                tension: 70,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeValue, iconScaleValue]);

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }
        router.replace('/(auth)/forgot-password');
    };

    const handleBackToSignIn = () => {
        router.replace('/(auth)/login');
    };

    const handleResend = async () => {
        if (loadingResend) {
            return;
        }

        if (!email) {
            router.replace('/(auth)/forgot-password');
            return;
        }

        setLoadingResend(true);
        try {
            const response = await forgotPassword({ email });
            Alert.alert('Reset link sent', response.message ?? 'A new reset link has been sent.');
        } catch (error) {
            const fallbackMessage =
                error instanceof Error ? error.message : 'Unable to resend reset link right now.';
            Alert.alert('Unable to resend', fallbackMessage);
        } finally {
            setLoadingResend(false);
        }
    };

    const subtitleText =
        message ||
        "We've sent an email to your registered address with instructions to reset your password.";

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar style="dark" />
            <Animated.View style={[styles.container, { opacity: fadeValue }]}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    accessibilityHint="Returns to the previous screen"
                    hitSlop={12}
                    onPress={handleBack}
                    style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
                >
                    <AppIcon color={palette.text} name="chevron-back" size={22} />
                </Pressable>

                <View style={styles.content}>
                    <View style={styles.illustrationSection}>
                        <View style={styles.outerCircle}>
                            <View style={styles.decorDotLarge} />
                            <View style={styles.decorDotSmall} />
                            <Animated.View style={[styles.innerCircle, { transform: [{ scale: iconScaleValue }] }]}>
                                <AppIcon
                                    color={palette.primary}
                                    name="email-check-outline"
                                    size={48}
                                />
                            </Animated.View>
                        </View>
                    </View>

                    <View style={styles.titleBlock}>
                        <Text style={styles.title}>Reset Link Sent</Text>
                        <Text style={styles.subtitle}>{subtitleText}</Text>
                    </View>

                    <View style={styles.infoBubble}>
                        <Text style={styles.infoText}>
                            Don&apos;t see it? Please check your spam folder or try again.
                        </Text>
                    </View>

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Back to Sign In"
                        accessibilityHint="Navigate to sign in screen"
                        onPress={handleBackToSignIn}
                        style={({ pressed }) => [
                            styles.primaryButton,
                            pressed && styles.primaryButtonPressed,
                            pressed && styles.primaryButtonScaled,
                        ]}
                    >
                        <Text style={styles.primaryButtonText}>Back to Sign In</Text>
                    </Pressable>

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Resend Reset Link"
                        accessibilityHint="Requests another password reset email"
                        accessibilityState={{ disabled: loadingResend, busy: loadingResend }}
                        disabled={loadingResend}
                        onPress={handleResend}
                        style={({ pressed }) => [
                            styles.secondaryAction,
                            pressed && !loadingResend && styles.secondaryActionPressed,
                            loadingResend && styles.secondaryActionDisabled,
                        ]}
                    >
                        {loadingResend ? (
                            <ActivityIndicator color={palette.primary} size="small" />
                        ) : (
                            <Text style={styles.secondaryActionText}>Resend Reset Link</Text>
                        )}
                    </Pressable>
                </View>
            </Animated.View>
        </SafeAreaView>
    );
}

export const ResetPasswordSentScreen = ResetLinkSentScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: palette.background,
    },
    container: {
        flex: 1,
        backgroundColor: palette.background,
        paddingHorizontal: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 8,
        left: 0,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    backButtonPressed: {
        opacity: 0.65,
    },
    content: {
        width: '100%',
        alignItems: 'center',
    },
    illustrationSection: {
        alignItems: 'center',
    },
    outerCircle: {
        width: 232,
        height: 232,
        borderRadius: 116,
        backgroundColor: palette.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    decorDotLarge: {
        position: 'absolute',
        left: -8,
        bottom: 42,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: palette.primaryDot,
        borderWidth: 1,
        borderColor: colors.primaryLight,
    },
    decorDotSmall: {
        position: 'absolute',
        right: 34,
        top: 20,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: palette.primaryDot,
    },
    innerCircle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: palette.white,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000000',
        shadowOpacity: 0.1,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
    titleBlock: {
        alignItems: 'center',
        marginTop: 30,
    },
    title: {
        color: palette.text,
        fontSize: 28,
        lineHeight: 34,
        fontFamily: fonts.bodyBold,
        fontWeight: '800',
        textAlign: 'center',
    },
    subtitle: {
        marginTop: 12,
        color: palette.muted,
        fontSize: 16,
        lineHeight: 22,
        fontFamily: fonts.bodyRegular,
        textAlign: 'center',
        maxWidth: '90%',
    },
    infoBubble: {
        width: '100%',
        marginTop: 24,
        backgroundColor: palette.bubbleBg,
        borderRadius: 24,
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    infoText: {
        color: palette.muted,
        fontSize: 14,
        lineHeight: 20,
        fontFamily: fonts.bodyRegular,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    primaryButton: {
        width: '100%',
        height: 60,
        borderRadius: 30,
        marginTop: 32,
        backgroundColor: palette.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000000',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 5 },
        elevation: 6,
    },
    primaryButtonPressed: {
        backgroundColor: palette.primaryPressed,
    },
    primaryButtonScaled: {
        transform: [{ scale: 0.97 }],
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        lineHeight: 24,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    secondaryAction: {
        minHeight: 44,
        marginTop: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryActionPressed: {
        opacity: 0.7,
    },
    secondaryActionDisabled: {
        opacity: 0.6,
    },
    secondaryActionText: {
        color: palette.primary,
        fontSize: 15,
        lineHeight: 22,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        textAlign: 'center',
    },
});
