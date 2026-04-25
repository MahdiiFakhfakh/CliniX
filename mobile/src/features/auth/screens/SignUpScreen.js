import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { register } from '@/src/services/api/endpoints/authApi';
import AppIcon from '@/src/shared/components/AppIcon';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Linking,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '@/src/core/theme/tokens';

const ROLES = [
    { key: 'patient', label: 'Patient', icon: 'person' },
    { key: 'doctor', label: 'Doctor', icon: 'medkit' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const palette = {
    background: '#FFFFFF',
    text: '#111111',
    muted: '#6B7280',
    primary: '#2A2ACF',
    primaryPressed: '#1F1FAF',
    primarySoft: '#E6E9FF',
    border: '#E5E7EB',
    inputBg: '#F5F6FA',
    inputFocusBg: '#F8FAFF',
    placeholder: '#9CA3AF',
    checkboxBorder: '#D1D5DB',
    danger: '#EF4444',
    disabled: '#A5B4FC',
    disabledText: '#E5E7EB',
};

export function SignUpScreen() {
    const router = useRouter();

    const [selectedRole, setSelectedRole] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agree, setAgree] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [focusedField, setFocusedField] = useState(null);

    const emailValid = useMemo(() => EMAIL_REGEX.test(email.trim()), [email]);
    const passwordValid = useMemo(() => password.length >= 6, [password]);
    const confirmPasswordValid = useMemo(
        () => confirmPassword.length > 0 && confirmPassword === password,
        [confirmPassword, password],
    );

    const isSubmitDisabled =
        loading || !selectedRole || !emailValid || !passwordValid || !confirmPasswordValid || !agree;

    const openExternalLink = async (url) => {
        try {
            const canOpen = await Linking.canOpenURL(url);
            if (!canOpen) {
                Alert.alert('Link unavailable', 'This link cannot be opened on your device.');
                return;
            }
            await Linking.openURL(url);
        } catch {
            Alert.alert('Link unavailable', 'This link cannot be opened on your device.');
        }
    };

    const validateForm = () => {
        const nextErrors = {};

        if (!selectedRole) {
            nextErrors.role = 'Please choose whether you are a patient or doctor.';
        }

        if (!email.trim()) {
            nextErrors.email = 'Email address is required.';
        } else if (!EMAIL_REGEX.test(email.trim())) {
            nextErrors.email = 'Please enter a valid email address.';
        }

        if (!password) {
            nextErrors.password = 'Password is required.';
        } else if (password.length < 6) {
            nextErrors.password = 'Password must be at least 6 characters.';
        }

        if (!confirmPassword) {
            nextErrors.confirmPassword = 'Please confirm your password.';
        } else if (confirmPassword !== password) {
            nextErrors.confirmPassword = 'Passwords do not match.';
        }

        if (!agree) {
            nextErrors.agree = 'You must agree to the terms and privacy policy.';
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const clearFieldError = (fieldName) => {
        setErrors((previous) => {
            if (!previous[fieldName]) {
                return previous;
            }
            const { [fieldName]: _removed, ...rest } = previous;
            return rest;
        });
    };

    const handleCreateAccount = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            await register({
                email: email.trim().toLowerCase(),
                password,
                role: selectedRole,
            });
            if (selectedRole === 'doctor') {
                router.replace('/(auth)/doctor-pending');
            } else {
                router.replace('/(auth)/login');
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to create account. Please try again.';
            setErrors((previous) => ({ ...previous, submit: message }));
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }
        router.replace('/(auth)/login');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardWrap}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.headerRow}>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Go back"
                            hitSlop={12}
                            onPress={handleBack}
                            style={styles.backButton}
                        >
                            <AppIcon color={palette.text} name="chevron-back" size={20} />
                        </Pressable>
                        <Text style={styles.headerTitle}>Sign Up</Text>
                    </View>

                    <View style={styles.titleBlock}>
                        <Text style={styles.h1}>Create your account</Text>
                        <Text style={styles.subtitle}>
                            Join CliniX to manage your healthcare journey with ease.
                        </Text>
                    </View>

                    <View style={styles.roleBlock}>
                        <Text style={styles.label}>I am a...</Text>
                        <View style={styles.roleRow}>
                            {ROLES.map((role) => {
                                const selected = selectedRole === role.key;
                                return (
                                    <Pressable
                                        key={role.key}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Select ${role.label}`}
                                        onPress={() => {
                                            setSelectedRole(role.key);
                                            clearFieldError('role');
                                        }}
                                        style={[styles.roleCard, selected && styles.roleCardSelected]}
                                    >
                                        <AppIcon
                                            color={selected ? palette.primary : palette.muted}
                                            name={role.icon}
                                            size={24}
                                        />
                                        <Text style={[styles.roleText, selected && styles.roleTextSelected]}>
                                            {role.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                        {errors.role ? <Text style={styles.errorText}>{errors.role}</Text> : null}
                    </View>

                    <View style={styles.inputBlock}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            accessibilityLabel="Email Address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="email-address"
                            onBlur={() => setFocusedField((current) => (current === 'email' ? null : current))}
                            onChangeText={(value) => {
                                setEmail(value);
                                clearFieldError('email');
                            }}
                            onFocus={() => setFocusedField('email')}
                            placeholder="name@example.com"
                            placeholderTextColor={palette.placeholder}
                            style={[styles.input, focusedField === 'email' && styles.inputFocused, errors.email && styles.inputError]}
                            value={email}
                        />
                        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                    </View>

                    <View style={styles.inputBlock}>
                        <Text style={styles.label}>Create Password</Text>
                        <View
                            style={[
                                styles.passwordInputRow,
                                focusedField === 'password' && styles.inputFocused,
                                errors.password && styles.inputError,
                            ]}
                        >
                            <TextInput
                                accessibilityLabel="Create Password"
                                autoCapitalize="none"
                                autoCorrect={false}
                                onBlur={() => setFocusedField((current) => (current === 'password' ? null : current))}
                                onChangeText={(value) => {
                                    setPassword(value);
                                    clearFieldError('password');
                                    clearFieldError('confirmPassword');
                                }}
                                onFocus={() => setFocusedField('password')}
                                placeholder="Enter password"
                                placeholderTextColor={palette.placeholder}
                                secureTextEntry={!showPassword}
                                style={styles.passwordInput}
                                value={password}
                            />
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                                onPress={() => setShowPassword((previous) => !previous)}
                                style={styles.eyeButton}
                            >
                                <AppIcon color={palette.muted} name={showPassword ? 'eye-off' : 'eye'} size={20} />
                            </Pressable>
                        </View>
                        {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                    </View>

                    <View style={styles.inputBlock}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <View
                            style={[
                                styles.passwordInputRow,
                                focusedField === 'confirmPassword' && styles.inputFocused,
                                errors.confirmPassword && styles.inputError,
                            ]}
                        >
                            <TextInput
                                accessibilityLabel="Confirm Password"
                                autoCapitalize="none"
                                autoCorrect={false}
                                onBlur={() =>
                                    setFocusedField((current) =>
                                        current === 'confirmPassword' ? null : current,
                                    )
                                }
                                onChangeText={(value) => {
                                    setConfirmPassword(value);
                                    clearFieldError('confirmPassword');
                                }}
                                onFocus={() => setFocusedField('confirmPassword')}
                                placeholder="Confirm password"
                                placeholderTextColor={palette.placeholder}
                                secureTextEntry={!showConfirmPassword}
                                style={styles.passwordInput}
                                value={confirmPassword}
                            />
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                onPress={() => setShowConfirmPassword((previous) => !previous)}
                                style={styles.eyeButton}
                            >
                                <AppIcon
                                    color={palette.muted}
                                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                                    size={20}
                                />
                            </Pressable>
                        </View>
                        {errors.confirmPassword ? (
                            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                        ) : null}
                    </View>

                    <View style={styles.termsRow}>
                        <Pressable
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: agree }}
                            accessibilityLabel="Agree to terms"
                            onPress={() => {
                                setAgree((previous) => !previous);
                                clearFieldError('agree');
                            }}
                            style={[styles.checkbox, agree && styles.checkboxChecked]}
                        >
                            {agree ? <AppIcon color="#FFFFFF" name="checkmark" size={14} /> : null}
                        </Pressable>
                        <Text style={styles.termsText}>
                            I agree to the{' '}
                            <Text
                                style={styles.linkText}
                                onPress={() => {
                                    void openExternalLink('https://clinix.example/terms');
                                }}
                            >
                                Terms of Service
                            </Text>{' '}
                            and{' '}
                            <Text
                                style={styles.linkText}
                                onPress={() => {
                                    void openExternalLink('https://clinix.example/privacy');
                                }}
                            >
                                Privacy Policy
                            </Text>
                            .
                        </Text>
                    </View>
                    {errors.agree ? <Text style={[styles.errorText, styles.termsError]}>{errors.agree}</Text> : null}
                    {errors.submit ? <Text style={[styles.errorText, styles.submitError]}>{errors.submit}</Text> : null}

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Create Account"
                        accessibilityState={{ disabled: isSubmitDisabled, busy: loading }}
                        disabled={isSubmitDisabled}
                        onPress={handleCreateAccount}
                        style={({ pressed }) => [
                            styles.primaryButton,
                            pressed && !isSubmitDisabled && styles.primaryButtonPressed,
                            isSubmitDisabled && styles.primaryButtonDisabled,
                        ]}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <Text style={[styles.primaryButtonText, isSubmitDisabled && styles.primaryButtonTextDisabled]}>
                                Create Account
                            </Text>
                        )}
                    </Pressable>

                    <View style={styles.footerRow}>
                        <Text style={styles.footerText}>
                            Already have an account?{' '}
                            <Text style={styles.linkText} onPress={() => router.replace('/(auth)/login')}>
                                Log In
                            </Text>
                        </Text>
                    </View>
                </ScrollView>
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
    scroll: {
        flex: 1,
    },
    container: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 20,
    },
    headerRow: {
        minHeight: 52,
        justifyContent: 'center',
        marginBottom: 14,
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
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    titleBlock: {
        marginBottom: 14,
    },
    h1: {
        color: palette.text,
        fontSize: 30,
        lineHeight: 36,
        fontFamily: fonts.bodyBold,
        fontWeight: '800',
        marginBottom: 8,
    },
    subtitle: {
        color: palette.muted,
        fontSize: 16,
        lineHeight: 22,
        fontFamily: fonts.bodyRegular,
        maxWidth: '96%',
    },
    roleBlock: {
        marginBottom: 14,
    },
    label: {
        color: palette.text,
        fontSize: 16,
        lineHeight: 22,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
        marginBottom: 10,
    },
    roleRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
    },
    roleCard: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: palette.inputBg,
        borderWidth: 2,
        borderColor: palette.border,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000000',
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    roleCardSelected: {
        borderColor: palette.primary,
        backgroundColor: palette.primarySoft,
    },
    roleText: {
        marginTop: 10,
        color: palette.muted,
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    roleTextSelected: {
        color: palette.primary,
    },
    inputBlock: {
        marginBottom: 12,
    },
    input: {
        height: 52,
        borderRadius: 26,
        backgroundColor: palette.inputBg,
        paddingHorizontal: 20,
        color: palette.text,
        fontSize: 16,
        fontFamily: fonts.bodyRegular,
        borderWidth: 0,
    },
    passwordInputRow: {
        height: 52,
        borderRadius: 26,
        backgroundColor: palette.inputBg,
        paddingLeft: 20,
        paddingRight: 6,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 0,
    },
    passwordInput: {
        flex: 1,
        color: palette.text,
        fontSize: 16,
        fontFamily: fonts.bodyRegular,
    },
    eyeButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputFocused: {
        borderWidth: 2,
        borderColor: palette.primary,
        backgroundColor: palette.inputFocusBg,
    },
    inputError: {
        borderWidth: 2,
        borderColor: palette.danger,
    },
    termsRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 6,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: palette.checkboxBorder,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
        marginRight: 10,
        backgroundColor: palette.inputBg,
    },
    checkboxChecked: {
        backgroundColor: palette.primary,
        borderColor: palette.primary,
    },
    termsText: {
        flex: 1,
        color: palette.muted,
        fontSize: 14,
        lineHeight: 20,
        fontFamily: fonts.bodyRegular,
    },
    linkText: {
        color: palette.primary,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    primaryButton: {
        marginTop: 18,
        height: 62,
        borderRadius: 31,
        backgroundColor: palette.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    primaryButtonPressed: {
        backgroundColor: palette.primaryPressed,
    },
    primaryButtonDisabled: {
        backgroundColor: palette.disabled,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        lineHeight: 24,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    primaryButtonTextDisabled: {
        color: palette.disabledText,
    },
    footerRow: {
        alignItems: 'center',
        marginTop: 14,
        paddingBottom: 8,
        marginBottom: 6,
    },
    footerText: {
        color: palette.muted,
        fontSize: 16,
        lineHeight: 22,
        fontFamily: fonts.bodyRegular,
        textAlign: 'center',
    },
    errorText: {
        marginTop: 6,
        color: palette.danger,
        fontSize: 12,
        lineHeight: 16,
        fontFamily: fonts.bodyMedium,
    },
    termsError: {
        marginLeft: 32,
    },
    submitError: {
        marginTop: 12,
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 20,
    },
});

