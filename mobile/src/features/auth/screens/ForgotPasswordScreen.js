import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import AppIcon from '@/src/shared/components/AppIcon';
import {
    ActivityIndicator,
    Alert,
    Animated,
    KeyboardAvoidingView,
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '@/src/core/theme/tokens';
import { forgotPasswordSchema } from '@/src/features/auth/schemas/forgotPasswordSchema';
import { forgotPassword } from '@/src/services/api/endpoints/authApi';

const palette = {
    background: colors.background,
    primary: colors.primary,
    primaryPressed: colors.primaryMid,
    primaryTint: colors.primarySoft,
    text: colors.text,
    label: colors.text,
    muted: colors.textMuted,
    border: colors.border,
    placeholder: colors.textSubtle,
    inputBg: colors.surface,
    error: colors.danger,
    disabled: colors.disabled,
    disabledText: colors.border,
};

export function ForgotPasswordScreen() {
    const router = useRouter();
    const fadeValue = useRef(new Animated.Value(0)).current;
    const [isFocused, setIsFocused] = useState(false);

    const mutation = useMutation({
        mutationFn: forgotPassword,
    });

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: '',
        },
        mode: 'onSubmit',
    });

    useEffect(() => {
        Animated.timing(fadeValue, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [fadeValue]);

    const onSubmit = handleSubmit(async (values) => {
        try {
            const normalizedEmail = values.email.trim().toLowerCase();
            const response = await mutation.mutateAsync({ email: normalizedEmail });
            router.push({
                pathname: '/(auth)/reset-password-sent',
                params: {
                    email: normalizedEmail,
                    message: response.message,
                },
            });
        } catch {
            // Error toasts are shown globally by query mutation cache.
        }
    });

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }
        router.replace('/(auth)/login');
    };

    const handleContactSupport = async () => {
        const supportMail = 'mailto:support@clinix.com';
        try {
            const canOpen = await Linking.canOpenURL(supportMail);
            if (!canOpen) {
                Alert.alert('Support', 'Please email support@clinix.com for assistance.');
                return;
            }
            await Linking.openURL(supportMail);
        } catch {
            Alert.alert('Support', 'Please email support@clinix.com for assistance.');
        }
    };

    const isDisabled = mutation.isPending;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                style={styles.keyboardWrap}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <Animated.View
                    style={[
                        styles.container,
                        {
                            opacity: fadeValue,
                            transform: [
                                {
                                    translateY: fadeValue.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [8, 0],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    <View style={styles.headerRow}>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Go back"
                            accessibilityHint="Returns to the previous screen"
                            hitSlop={12}
                            onPress={handleBack}
                            style={styles.backButton}
                        >
                            <AppIcon color={palette.text} name="chevron-back" size={20} />
                        </Pressable>
                        <Text style={styles.headerTitle}>Forgot Password</Text>
                    </View>

                    <View style={styles.iconBox}>
                        <AppIcon color={palette.primary} name="briefcase-plus" size={26} />
                    </View>

                    <Text style={styles.title}>Reset Password</Text>
                    <Text style={styles.description}>
                        Enter your email address associated with your CliniX account to receive a secure reset link.
                    </Text>

                    <Text style={styles.label}>Email Address</Text>
                    <Controller
                        control={control}
                        name="email"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <View
                                style={[
                                    styles.inputWrap,
                                    isFocused && styles.inputWrapFocused,
                                    errors.email && styles.inputWrapError,
                                ]}
                            >
                                <AppIcon color={palette.primary} name="mail-outline" size={18} style={styles.mailIcon} />
                                <TextInput
                                    accessibilityLabel="Email Address"
                                    accessibilityHint="Enter your account email address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="email-address"
                                    onBlur={() => {
                                        onBlur();
                                        setIsFocused(false);
                                    }}
                                    onChangeText={onChange}
                                    onFocus={() => setIsFocused(true)}
                                    placeholder="name@example.com"
                                    placeholderTextColor={palette.placeholder}
                                    style={styles.input}
                                    textContentType="emailAddress"
                                    value={value}
                                />
                            </View>
                        )}
                    />
                    {errors.email ? (
                        <Text accessibilityRole="alert" style={styles.errorText}>
                            {errors.email.message}
                        </Text>
                    ) : null}

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Send Reset Link"
                        accessibilityHint="Sends password reset instructions to your email"
                        accessibilityState={{ disabled: isDisabled, busy: mutation.isPending }}
                        disabled={isDisabled}
                        onPress={onSubmit}
                        style={({ pressed }) => [
                            styles.button,
                            pressed && !isDisabled && styles.buttonPressed,
                            pressed && !isDisabled && styles.buttonScaled,
                            isDisabled && styles.buttonDisabled,
                        ]}
                    >
                        <Text style={[styles.buttonText, isDisabled && styles.buttonTextDisabled]}>
                            Send Reset Link
                        </Text>
                        {mutation.isPending ? (
                            <ActivityIndicator color="#FFFFFF" size="small" style={styles.buttonIcon} />
                        ) : (
                            <AppIcon color="#FFFFFF" name="arrow-forward" size={18} style={styles.buttonIcon} />
                        )}
                    </Pressable>

                    <View style={styles.bottomSpacer} />

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Contact Support"
                        onPress={handleContactSupport}
                        style={styles.supportWrap}
                    >
                        <Text style={styles.supportText}>
                            Having trouble? <Text style={styles.supportAction}>Contact Support</Text>
                        </Text>
                    </Pressable>
                </Animated.View>
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
    container: {
        flex: 1,
        backgroundColor: palette.background,
        paddingHorizontal: 24,
        paddingTop: 12,
    },
    headerRow: {
        minHeight: 52,
        justifyContent: 'center',
        marginBottom: 22,
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: -8,
        width: 52,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    headerTitle: {
        textAlign: 'center',
        color: palette.text,
        fontSize: 18,
        lineHeight: 24,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 14,
        backgroundColor: palette.primaryTint,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    title: {
        color: palette.text,
        fontSize: 28,
        lineHeight: 34,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        marginBottom: 12,
    },
    description: {
        color: palette.muted,
        fontSize: 15,
        lineHeight: 22,
        fontFamily: fonts.bodyRegular,
        maxWidth: '95%',
        marginBottom: 30,
    },
    label: {
        color: palette.label,
        fontSize: 14,
        lineHeight: 20,
        fontFamily: fonts.bodyMedium,
        fontWeight: '500',
        marginBottom: 8,
    },
    inputWrap: {
        height: 56,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: palette.border,
        backgroundColor: palette.inputBg,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputWrapFocused: {
        borderColor: palette.primary,
        shadowColor: palette.primary,
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 0 },
        elevation: 2,
    },
    inputWrapError: {
        borderColor: palette.error,
    },
    mailIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: palette.text,
        fontSize: 15,
        lineHeight: 20,
        fontFamily: fonts.bodyRegular,
    },
    errorText: {
        marginTop: 6,
        color: palette.error,
        fontSize: 12,
        lineHeight: 16,
        fontFamily: fonts.bodyMedium,
        marginBottom: 24,
    },
    button: {
        marginTop: 24,
        height: 56,
        borderRadius: 16,
        backgroundColor: palette.primary,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: '#000000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    buttonPressed: {
        backgroundColor: palette.primaryPressed,
    },
    buttonScaled: {
        transform: [{ scale: 0.98 }],
    },
    buttonDisabled: {
        backgroundColor: palette.disabled,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        lineHeight: 22,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    buttonTextDisabled: {
        color: palette.disabledText,
    },
    buttonIcon: {
        marginLeft: 6,
    },
    bottomSpacer: {
        flex: 1,
        minHeight: 40,
    },
    supportWrap: {
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    supportText: {
        color: palette.muted,
        fontSize: 14,
        lineHeight: 20,
        fontFamily: fonts.bodyRegular,
        textAlign: 'center',
    },
    supportAction: {
        color: palette.primary,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
});
