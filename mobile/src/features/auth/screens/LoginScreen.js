import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import AppIcon from '@/src/shared/components/AppIcon';
import {
    AccessibilityInfo,
    ActivityIndicator,
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { roleHomePaths } from '@/src/core/navigation/paths';
import { colors, fonts } from '@/src/core/theme/tokens';
import { loginSchema } from '@/src/features/auth/schemas/loginSchema';
import { useAuthStore } from '@/src/store/authStore';

const palette = {
    screenBg: colors.background,
    cardBg: colors.surface,
    primary: colors.primary,
    primaryPressed: colors.primaryMid,
    accentTint: colors.primarySoft,
    inputBg: colors.background,
    inputFocusBg: colors.surfaceTint,
    text: colors.text,
    textDark: colors.text,
    textMuted: colors.textMuted,
    textPlaceholder: colors.textSubtle,
    borderSoft: colors.border,
    disabledBg: colors.disabled,
    disabledText: colors.border,
    shadow: '#000000',
};

export function LoginScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const cardFade = useRef(new Animated.Value(0)).current;
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    const signIn = useAuthStore((state) => state.signIn);
    const isSubmitting = useAuthStore((state) => state.isSubmitting);
    const errorMessage = useAuthStore((state) => state.errorMessage);
    const clearError = useAuthStore((state) => state.clearError);
    const session = useAuthStore((state) => state.session);

    const { control, handleSubmit, watch } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
        mode: 'onBlur',
    });

    const emailValue = watch('email');
    const passwordValue = watch('password');
    const isFormFilled = Boolean(emailValue?.trim() && passwordValue?.trim());
    const isButtonDisabled = isSubmitting || !isFormFilled;

    useEffect(() => {
        Animated.timing(cardFade, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [cardFade]);

    const resolveDestination = (user) => {
        if (user?.role === 'doctor' && user?.status === 'pending') {
            return '/(auth)/doctor-pending';
        }
        return roleHomePaths[user?.role] ?? '/(auth)/login';
    };

    useEffect(() => {
        if (session) {
            router.replace(resolveDestination(session.user));
        }
    }, [router, session]);

    const onSubmit = handleSubmit(async (values) => {
        clearError();
        try {
            await signIn({
                email: values.email.trim().toLowerCase(),
                password: values.password,
            });
            const user = useAuthStore.getState().session?.user;
            if (user) {
                router.replace(resolveDestination(user));
            }
        } catch {
            // Error is already stored in auth store.
        }
    });

    const handleTogglePassword = () => {
        setIsPasswordVisible((previous) => {
            const next = !previous;
            const message = next ? 'Password is now visible' : 'Password is now hidden';
            void AccessibilityInfo.announceForAccessibility(message);
            return next;
        });
    };

    const handleSocialPress = (provider) => {
        Alert.alert(`${provider} Sign In`, `${provider} authentication will be available soon.`);
    };

    const handleSignUpPress = () => {
        router.push('/(auth)/sign-up');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardWrap}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.content}>
                    <Animated.View
                        style={[
                            styles.card,
                            { paddingBottom: 36 + Math.max(insets.bottom, 10) },
                            {
                                opacity: cardFade,
                                transform: [
                                    {
                                        scale: cardFade.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.97, 1],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        <View style={styles.headerRow}>
                            <Text style={styles.headerTitle}>Sign In</Text>
                        </View>

                        <View style={styles.logoSection}>
                            <View style={styles.logoCircle}>
                                <AppIcon color={palette.primary} name="briefcase-plus" size={28} />
                            </View>
                            <Text style={styles.brandName}>CliniX</Text>
                        </View>

                        <View style={styles.welcomeSection}>
                            <Text style={styles.welcomeTitle}>Welcome back!</Text>
                            <Text style={styles.welcomeSubtitle}>Please sign in to your account.</Text>
                        </View>

                        <Controller
                            control={control}
                            name="email"
                            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                                <View style={styles.fieldGroup}>
                                    <Text style={styles.fieldLabel}>Email Address</Text>
                                    <TextInput
                                        accessibilityLabel="Email Address"
                                        accessibilityHint="Enter your email address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        keyboardType="email-address"
                                        onBlur={() => {
                                            onBlur();
                                            setFocusedField((current) =>
                                                current === 'email' ? null : current,
                                            );
                                        }}
                                        onChangeText={onChange}
                                        onFocus={() => setFocusedField('email')}
                                        placeholder="name@example.com"
                                        placeholderTextColor={palette.textPlaceholder}
                                        style={[
                                            styles.input,
                                            focusedField === 'email' && styles.inputFocused,
                                            error && styles.inputError,
                                        ]}
                                        textContentType="emailAddress"
                                        value={value}
                                    />
                                    {error?.message ? <Text style={styles.errorText}>{error.message}</Text> : null}
                                </View>
                            )}
                        />

                        <Controller
                            control={control}
                            name="password"
                            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                                <View style={styles.fieldGroup}>
                                    <Text style={styles.fieldLabel}>Password</Text>
                                    <View>
                                        <TextInput
                                            accessibilityLabel="Password"
                                            accessibilityHint="Enter your password"
                                            onBlur={() => {
                                                onBlur();
                                                setFocusedField((current) =>
                                                    current === 'password' ? null : current,
                                                );
                                            }}
                                            onChangeText={onChange}
                                            onFocus={() => setFocusedField('password')}
                                            placeholder="Enter your password"
                                            placeholderTextColor={palette.textPlaceholder}
                                            secureTextEntry={!isPasswordVisible}
                                            style={[
                                                styles.input,
                                                styles.passwordInput,
                                                focusedField === 'password' && styles.inputFocused,
                                                error && styles.inputError,
                                            ]}
                                            textContentType="password"
                                            value={value}
                                        />
                                        <Pressable
                                            accessibilityRole="button"
                                            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
                                            accessibilityHint="Toggles password visibility"
                                            onPress={handleTogglePassword}
                                            style={styles.passwordToggle}
                                        >
                                            <AppIcon
                                                color={palette.textMuted}
                                                name={isPasswordVisible ? 'eye-off' : 'eye'}
                                                size={20}
                                            />
                                        </Pressable>
                                    </View>
                                    {error?.message ? <Text style={styles.errorText}>{error.message}</Text> : null}
                                </View>
                            )}
                        />

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Forgot Password"
                            onPress={() => router.push('/(auth)/forgot-password')}
                            style={styles.forgotWrap}
                        >
                            <Text style={styles.forgotText}>Forgot Password?</Text>
                        </Pressable>

                        {errorMessage ? <Text style={styles.authError}>{errorMessage}</Text> : null}

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Sign In"
                            accessibilityHint="Signs in to your account"
                            disabled={isButtonDisabled}
                            onPress={onSubmit}
                            style={({ pressed }) => [
                                styles.signInButton,
                                pressed && !isButtonDisabled && styles.signInButtonPressed,
                                isButtonDisabled && styles.signInButtonDisabled,
                                pressed && !isButtonDisabled && styles.signInButtonScaled,
                            ]}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color={palette.disabledText} size="small" />
                            ) : (
                                <Text
                                    style={[
                                        styles.signInButtonText,
                                        isButtonDisabled && styles.signInButtonTextDisabled,
                                    ]}
                                >
                                    Sign In
                                </Text>
                            )}
                        </Pressable>

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Sign Up"
                            accessibilityHint="Navigates to account creation"
                            onPress={handleSignUpPress}
                            style={styles.signUpWrap}
                        >
                            <Text style={styles.signUpText}>
                                Don&apos;t have an account? <Text style={styles.signUpAction}>Sign Up</Text>
                            </Text>
                        </Pressable>
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: palette.screenBg,
    },
    keyboardWrap: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'stretch',
    },
    card: {
        flex: 1,
        width: '100%',
        backgroundColor: palette.cardBg,
        borderRadius: 0,
        paddingHorizontal: 24,
        paddingVertical: 30,
        shadowColor: palette.shadow,
        shadowOpacity: 0,
        shadowRadius: 0,
        shadowOffset: { width: 0, height: 0 },
        elevation: 0,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconButtonDisabled: {
        opacity: 0.45,
    },
    headerSpacer: {
        width: 44,
        height: 44,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        color: palette.text,
        fontSize: 18,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 16,
    },
    logoCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: palette.accentTint,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    brandName: {
        color: palette.primary,
        fontSize: 26,
        fontFamily: fonts.displayBold,
        fontWeight: '700',
    },
    welcomeSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    welcomeTitle: {
        color: palette.text,
        fontSize: 22,
        lineHeight: 28,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        marginBottom: 6,
    },
    welcomeSubtitle: {
        color: palette.textMuted,
        fontSize: 14,
        lineHeight: 20,
        fontFamily: fonts.bodyRegular,
    },
    fieldGroup: {
        marginBottom: 18,
    },
    fieldLabel: {
        color: palette.text,
        fontSize: 13,
        lineHeight: 18,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
        marginBottom: 6,
    },
    input: {
        height: 52,
        borderRadius: 26,
        backgroundColor: palette.inputBg,
        paddingHorizontal: 20,
        color: palette.textDark,
        fontSize: 14,
        fontFamily: fonts.bodyMedium,
        borderWidth: 0,
    },
    passwordInput: {
        paddingRight: 52,
    },
    inputFocused: {
        borderWidth: 2,
        borderColor: palette.primary,
        backgroundColor: palette.inputFocusBg,
    },
    inputError: {
        borderWidth: 2,
        borderColor: '#EF4444',
    },
    passwordToggle: {
        position: 'absolute',
        right: 0,
        top: 0,
        width: 52,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        marginTop: 6,
        color: '#EF4444',
        fontSize: 12,
        lineHeight: 16,
        fontFamily: fonts.bodyMedium,
    },
    forgotWrap: {
        alignSelf: 'flex-end',
        minHeight: 44,
        justifyContent: 'center',
        marginBottom: 20,
    },
    forgotText: {
        color: palette.primary,
        fontSize: 13,
        lineHeight: 18,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    authError: {
        color: '#EF4444',
        fontSize: 13,
        lineHeight: 18,
        fontFamily: fonts.bodyMedium,
        marginBottom: 12,
    },
    signInButton: {
        minHeight: 56,
        borderRadius: 28,
        backgroundColor: palette.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: palette.shadow,
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 4,
    },
    signInButtonPressed: {
        backgroundColor: palette.primaryPressed,
    },
    signInButtonDisabled: {
        backgroundColor: palette.disabledBg,
    },
    signInButtonScaled: {
        transform: [{ scale: 0.98 }],
    },
    signInButtonText: {
        color: palette.cardBg,
        fontSize: 16,
        lineHeight: 22,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    signInButtonTextDisabled: {
        color: palette.disabledText,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    dividerLine: {
        height: 1,
        flex: 1,
        backgroundColor: palette.borderSoft,
    },
    dividerText: {
        marginHorizontal: 10,
        color: palette.textMuted,
        fontSize: 13,
        lineHeight: 18,
        fontFamily: fonts.bodyRegular,
    },
    socialRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    socialButton: {
        width: '48%',
        minHeight: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: palette.borderSoft,
        backgroundColor: palette.cardBg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    socialText: {
        color: palette.text,
        fontSize: 14,
        lineHeight: 20,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    signUpWrap: {
        minHeight: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 6,
    },
    signUpText: {
        color: palette.textMuted,
        fontSize: 14,
        lineHeight: 20,
        fontFamily: fonts.bodyRegular,
        textAlign: 'center',
    },
    signUpAction: {
        color: palette.primary,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    roleSection: {
        marginBottom: 20,
    },
    roleLabel: {
        color: palette.textDark,
        fontSize: 14,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
        marginBottom: 10,
    },
    roleRow: {
        flexDirection: 'row',
        gap: 12,
    },
    roleCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 48,
        borderRadius: 24,
        backgroundColor: palette.inputBg,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    roleCardSelected: {
        borderColor: palette.primary,
        backgroundColor: palette.accentTint,
    },
    roleText: {
        color: palette.textMuted,
        fontSize: 14,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    roleTextSelected: {
        color: palette.primary,
    },
});
