import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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

const GENDERS = [
    { key: 'male', label: 'Male' },
    { key: 'female', label: 'Female' },
    { key: 'other', label: 'Other' },
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{8,15}$/;

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
    sectionTitle: '#374151',
};

const formatDateInput = (text) => {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const parseDateOfBirth = (dateStr) => {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}T00:00:00.000Z`;
};

export function SignUpScreen() {
    const router = useRouter();

    const [step, setStep] = useState(1);

    // Step 1 — Account
    const [selectedRole, setSelectedRole] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agree, setAgree] = useState(false);

    // Step 2 — Personal Info
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [gender, setGender] = useState('');
    const [phone, setPhone] = useState('');

    // Step 3 — Medical Profile (patient only)
    const [bloodGroup, setBloodGroup] = useState('Unknown');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [addressCity, setAddressCity] = useState('');
    const [addressState, setAddressState] = useState('');
    const [addressCountry, setAddressCountry] = useState('');
    const [addressZip, setAddressZip] = useState('');
    const [emergencyName, setEmergencyName] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');
    const [emergencyRelationship, setEmergencyRelationship] = useState('');

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [focusedField, setFocusedField] = useState(null);

    const totalSteps = selectedRole === 'doctor' ? 2 : 3;

    const clearFieldError = (field) => {
        setErrors((prev) => {
            if (!prev[field]) return prev;
            const { [field]: _, ...rest } = prev;
            return rest;
        });
    };

    const inputStyle = (field) => [
        styles.input,
        focusedField === field && styles.inputFocused,
        errors[field] && styles.inputError,
        { color: palette.text },
    ];

    const validateStep1 = () => {
        const errs = {};
        if (!selectedRole) errs.role = 'Please choose whether you are a patient or doctor.';
        if (!email.trim()) errs.email = 'Email address is required.';
        else if (!EMAIL_REGEX.test(email.trim())) errs.email = 'Please enter a valid email address.';
        if (!password) errs.password = 'Password is required.';
        else if (password.length < 6) errs.password = 'Password must be at least 6 characters.';
        if (!confirmPassword) errs.confirmPassword = 'Please confirm your password.';
        else if (confirmPassword !== password) errs.confirmPassword = 'Passwords do not match.';
        if (!agree) errs.agree = 'You must agree to the terms and privacy policy.';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateStep2 = () => {
        const errs = {};
        if (!firstName.trim()) errs.firstName = 'First name is required.';
        if (!lastName.trim()) errs.lastName = 'Last name is required.';
        if (!dateOfBirth.trim()) errs.dateOfBirth = 'Date of birth is required.';
        else if (dateOfBirth.length !== 10) errs.dateOfBirth = 'Please enter a valid date (DD/MM/YYYY).';
        if (!gender) errs.gender = 'Please select your gender.';
        if (!phone.trim()) errs.phone = 'Phone number is required.';
        else if (!PHONE_REGEX.test(phone.trim())) errs.phone = 'Enter a valid phone number (8–15 digits).';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext = () => {
        if (step === 1 && validateStep1()) {
            setErrors({});
            setStep(2);
        } else if (step === 2 && validateStep2()) {
            setErrors({});
            if (selectedRole === 'doctor') {
                handleCreateAccount();
            } else {
                setStep(3);
            }
        } else if (step === 3) {
            handleCreateAccount();
        }
    };

    const handleBack = () => {
        if (loading) return;
        if (step > 1) {
            setStep((s) => s - 1);
            setErrors({});
        } else if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(auth)/login');
        }
    };

    const handleCreateAccount = async () => {
        setLoading(true);
        try {
            await register({
                email: email.trim().toLowerCase(),
                password,
                role: selectedRole,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                dateOfBirth: parseDateOfBirth(dateOfBirth.trim()),
                gender,
                phone: phone.trim(),
                bloodGroup: bloodGroup || 'Unknown',
                height: height ? parseFloat(height) : undefined,
                weight: weight ? parseFloat(weight) : undefined,
                address: {
                    city: addressCity.trim() || undefined,
                    state: addressState.trim() || undefined,
                    country: addressCountry.trim() || 'USA',
                    zipCode: addressZip.trim() || undefined,
                },
                emergencyContact: emergencyName.trim() ? {
                    name: emergencyName.trim(),
                    phone: emergencyPhone.trim() || undefined,
                    relationship: emergencyRelationship.trim() || undefined,
                } : undefined,
            });
            if (selectedRole === 'doctor') {
                router.replace('/(auth)/doctor-pending');
            } else {
                router.replace('/(auth)/login');
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to create account. Please try again.';
            setErrors((prev) => ({ ...prev, submit: message }));
        } finally {
            setLoading(false);
        }
    };

    const openExternalLink = async (url) => {
        try {
            const canOpen = await Linking.canOpenURL(url);
            if (!canOpen) { Alert.alert('Link unavailable', 'This link cannot be opened on your device.'); return; }
            await Linking.openURL(url);
        } catch {
            Alert.alert('Link unavailable', 'This link cannot be opened on your device.');
        }
    };

    const renderStepIndicator = () => (
        <View style={styles.stepIndicator}>
            {Array.from({ length: totalSteps }).map((_, i) => (
                <View key={i} style={[styles.stepDot, i + 1 === step && styles.stepDotCurrent, i + 1 < step && styles.stepDotDone]} />
            ))}
        </View>
    );

    const renderStep1 = () => (
        <>
            <View style={styles.titleBlock}>
                <Text style={styles.h1}>Create your account</Text>
                <Text style={styles.subtitle}>Join CliniX to manage your healthcare journey with ease.</Text>
            </View>

            <View style={styles.inputBlock}>
                <Text style={styles.label}>I am a...</Text>
                <View style={styles.roleRow}>
                    {ROLES.map((role) => {
                        const selected = selectedRole === role.key;
                        return (
                            <Pressable
                                key={role.key}
                                accessibilityRole="button"
                                accessibilityLabel={`Select ${role.label}`}
                                onPress={() => { setSelectedRole(role.key); clearFieldError('role'); }}
                                style={[styles.roleCard, selected && styles.roleCardSelected]}
                            >
                                <AppIcon color={selected ? palette.primary : palette.muted} name={role.icon} size={24} />
                                <Text style={[styles.roleText, selected && styles.roleTextSelected]}>{role.label}</Text>
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
                    onBlur={() => setFocusedField((c) => (c === 'email' ? null : c))}
                    onChangeText={(v) => { setEmail(v); clearFieldError('email'); }}
                    onFocus={() => setFocusedField('email')}
                    placeholder="name@example.com"
                    placeholderTextColor={palette.placeholder}
                    style={inputStyle('email')}
                    value={email}
                />
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            <View style={styles.inputBlock}>
                <Text style={styles.label}>Create Password</Text>
                <TextInput
                    accessibilityLabel="Create Password"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onBlur={() => setFocusedField((c) => (c === 'password' ? null : c))}
                    onChangeText={(v) => { setPassword(v); clearFieldError('password'); clearFieldError('confirmPassword'); }}
                    onFocus={() => setFocusedField('password')}
                    placeholder="Enter password"
                    placeholderTextColor={palette.placeholder}
                    style={inputStyle('password')}
                    value={password}
                />
                {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            <View style={styles.inputBlock}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                    accessibilityLabel="Confirm Password"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onBlur={() => setFocusedField((c) => (c === 'confirmPassword' ? null : c))}
                    onChangeText={(v) => { setConfirmPassword(v); clearFieldError('confirmPassword'); }}
                    onFocus={() => setFocusedField('confirmPassword')}
                    placeholder="Confirm password"
                    placeholderTextColor={palette.placeholder}
                    style={inputStyle('confirmPassword')}
                    value={confirmPassword}
                />
                {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
            </View>

            <View style={styles.termsRow}>
                <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: agree }}
                    accessibilityLabel="Agree to terms"
                    onPress={() => { setAgree((p) => !p); clearFieldError('agree'); }}
                    style={[styles.checkbox, agree && styles.checkboxChecked]}
                >
                    {agree ? <AppIcon color="#FFFFFF" name="checkmark" size={14} /> : null}
                </Pressable>
                <Text style={styles.termsText}>
                    I agree to the{' '}
                    <Text style={styles.linkText} onPress={() => void openExternalLink('https://clinix.example/terms')}>Terms of Service</Text>
                    {' '}and{' '}
                    <Text style={styles.linkText} onPress={() => void openExternalLink('https://clinix.example/privacy')}>Privacy Policy</Text>.
                </Text>
            </View>
            {errors.agree ? <Text style={[styles.errorText, { marginLeft: 32, marginTop: 4 }]}>{errors.agree}</Text> : null}
        </>
    );

    const renderStep2 = () => (
        <>
            <View style={styles.titleBlock}>
                <Text style={styles.h1}>Personal Information</Text>
                <Text style={styles.subtitle}>Tell us a bit about yourself.</Text>
            </View>

            <View style={styles.rowInputs}>
                <View style={[styles.inputBlock, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>First Name</Text>
                    <TextInput
                        accessibilityLabel="First Name"
                        autoCorrect={false}
                        onBlur={() => setFocusedField((c) => (c === 'firstName' ? null : c))}
                        onChangeText={(v) => { setFirstName(v); clearFieldError('firstName'); }}
                        onFocus={() => setFocusedField('firstName')}
                        placeholder="John"
                        placeholderTextColor={palette.placeholder}
                        style={inputStyle('firstName')}
                        value={firstName}
                    />
                    {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
                </View>
                <View style={[styles.inputBlock, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Last Name</Text>
                    <TextInput
                        accessibilityLabel="Last Name"
                        autoCorrect={false}
                        onBlur={() => setFocusedField((c) => (c === 'lastName' ? null : c))}
                        onChangeText={(v) => { setLastName(v); clearFieldError('lastName'); }}
                        onFocus={() => setFocusedField('lastName')}
                        placeholder="Doe"
                        placeholderTextColor={palette.placeholder}
                        style={inputStyle('lastName')}
                        value={lastName}
                    />
                    {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
                </View>
            </View>

            <View style={styles.inputBlock}>
                <Text style={styles.label}>Date of Birth</Text>
                <TextInput
                    accessibilityLabel="Date of Birth"
                    keyboardType="number-pad"
                    maxLength={10}
                    onBlur={() => setFocusedField((c) => (c === 'dateOfBirth' ? null : c))}
                    onChangeText={(v) => { setDateOfBirth(formatDateInput(v)); clearFieldError('dateOfBirth'); }}
                    onFocus={() => setFocusedField('dateOfBirth')}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor={palette.placeholder}
                    style={inputStyle('dateOfBirth')}
                    value={dateOfBirth}
                />
                {errors.dateOfBirth ? <Text style={styles.errorText}>{errors.dateOfBirth}</Text> : null}
            </View>

            <View style={styles.inputBlock}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.chipRow}>
                    {GENDERS.map((g) => (
                        <Pressable
                            key={g.key}
                            onPress={() => { setGender(g.key); clearFieldError('gender'); }}
                            style={[styles.chip, gender === g.key && styles.chipSelected]}
                        >
                            <Text style={[styles.chipText, gender === g.key && styles.chipTextSelected]}>{g.label}</Text>
                        </Pressable>
                    ))}
                </View>
                {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}
            </View>

            <View style={styles.inputBlock}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                    accessibilityLabel="Phone Number"
                    keyboardType="phone-pad"
                    onBlur={() => setFocusedField((c) => (c === 'phone' ? null : c))}
                    onChangeText={(v) => { setPhone(v.replace(/\D/g, '')); clearFieldError('phone'); }}
                    onFocus={() => setFocusedField('phone')}
                    placeholder="1234567890"
                    placeholderTextColor={palette.placeholder}
                    style={inputStyle('phone')}
                    value={phone}
                />
                {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
            </View>

            {errors.submit ? <Text style={[styles.errorText, styles.submitError]}>{errors.submit}</Text> : null}
        </>
    );

    const renderStep3 = () => (
        <>
            <View style={styles.titleBlock}>
                <Text style={styles.h1}>Medical Profile</Text>
                <Text style={styles.subtitle}>Help us provide you with better care.</Text>
            </View>

            <View style={styles.inputBlock}>
                <Text style={styles.label}>Blood Group</Text>
                <View style={styles.bloodGroupGrid}>
                    {BLOOD_GROUPS.map((bg) => (
                        <Pressable
                            key={bg}
                            onPress={() => setBloodGroup(bg)}
                            style={[styles.bloodChip, bloodGroup === bg && styles.chipSelected]}
                        >
                            <Text style={[styles.chipText, bloodGroup === bg && styles.chipTextSelected]}>{bg}</Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <View style={styles.rowInputs}>
                <View style={[styles.inputBlock, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Height (cm)</Text>
                    <TextInput
                        accessibilityLabel="Height in centimeters"
                        keyboardType="numeric"
                        onBlur={() => setFocusedField((c) => (c === 'height' ? null : c))}
                        onChangeText={(v) => setHeight(v.replace(/[^0-9.]/g, ''))}
                        onFocus={() => setFocusedField('height')}
                        placeholder="170"
                        placeholderTextColor={palette.placeholder}
                        style={inputStyle('height')}
                        value={height}
                    />
                </View>
                <View style={[styles.inputBlock, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Weight (kg)</Text>
                    <TextInput
                        accessibilityLabel="Weight in kilograms"
                        keyboardType="numeric"
                        onBlur={() => setFocusedField((c) => (c === 'weight' ? null : c))}
                        onChangeText={(v) => setWeight(v.replace(/[^0-9.]/g, ''))}
                        onFocus={() => setFocusedField('weight')}
                        placeholder="70"
                        placeholderTextColor={palette.placeholder}
                        style={inputStyle('weight')}
                        value={weight}
                    />
                </View>
            </View>

            <Text style={styles.sectionHeading}>Address <Text style={styles.optionalTag}>(optional)</Text></Text>

            <View style={styles.rowInputs}>
                <View style={[styles.inputBlock, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>City</Text>
                    <TextInput
                        accessibilityLabel="City"
                        autoCorrect={false}
                        onBlur={() => setFocusedField((c) => (c === 'city' ? null : c))}
                        onChangeText={setAddressCity}
                        onFocus={() => setFocusedField('city')}
                        placeholder="New York"
                        placeholderTextColor={palette.placeholder}
                        style={inputStyle('city')}
                        value={addressCity}
                    />
                </View>
                <View style={[styles.inputBlock, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>State</Text>
                    <TextInput
                        accessibilityLabel="State"
                        autoCorrect={false}
                        onBlur={() => setFocusedField((c) => (c === 'state' ? null : c))}
                        onChangeText={setAddressState}
                        onFocus={() => setFocusedField('state')}
                        placeholder="NY"
                        placeholderTextColor={palette.placeholder}
                        style={inputStyle('state')}
                        value={addressState}
                    />
                </View>
            </View>

            <View style={styles.rowInputs}>
                <View style={[styles.inputBlock, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Country</Text>
                    <TextInput
                        accessibilityLabel="Country"
                        autoCorrect={false}
                        onBlur={() => setFocusedField((c) => (c === 'country' ? null : c))}
                        onChangeText={setAddressCountry}
                        onFocus={() => setFocusedField('country')}
                        placeholder="USA"
                        placeholderTextColor={palette.placeholder}
                        style={inputStyle('country')}
                        value={addressCountry}
                    />
                </View>
                <View style={[styles.inputBlock, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>ZIP Code</Text>
                    <TextInput
                        accessibilityLabel="ZIP Code"
                        keyboardType="number-pad"
                        onBlur={() => setFocusedField((c) => (c === 'zip' ? null : c))}
                        onChangeText={setAddressZip}
                        onFocus={() => setFocusedField('zip')}
                        placeholder="10001"
                        placeholderTextColor={palette.placeholder}
                        style={inputStyle('zip')}
                        value={addressZip}
                    />
                </View>
            </View>

            <Text style={styles.sectionHeading}>Emergency Contact <Text style={styles.optionalTag}>(optional)</Text></Text>

            <View style={styles.inputBlock}>
                <Text style={styles.label}>Contact Name</Text>
                <TextInput
                    accessibilityLabel="Emergency Contact Name"
                    autoCorrect={false}
                    onBlur={() => setFocusedField((c) => (c === 'emergencyName' ? null : c))}
                    onChangeText={setEmergencyName}
                    onFocus={() => setFocusedField('emergencyName')}
                    placeholder="Jane Doe"
                    placeholderTextColor={palette.placeholder}
                    style={inputStyle('emergencyName')}
                    value={emergencyName}
                />
            </View>

            <View style={styles.rowInputs}>
                <View style={[styles.inputBlock, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Relationship</Text>
                    <TextInput
                        accessibilityLabel="Relationship"
                        autoCorrect={false}
                        onBlur={() => setFocusedField((c) => (c === 'emergencyRelationship' ? null : c))}
                        onChangeText={setEmergencyRelationship}
                        onFocus={() => setFocusedField('emergencyRelationship')}
                        placeholder="Spouse"
                        placeholderTextColor={palette.placeholder}
                        style={inputStyle('emergencyRelationship')}
                        value={emergencyRelationship}
                    />
                </View>
                <View style={[styles.inputBlock, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Phone</Text>
                    <TextInput
                        accessibilityLabel="Emergency Contact Phone"
                        keyboardType="phone-pad"
                        onBlur={() => setFocusedField((c) => (c === 'emergencyPhone' ? null : c))}
                        onChangeText={(v) => setEmergencyPhone(v.replace(/\D/g, ''))}
                        onFocus={() => setFocusedField('emergencyPhone')}
                        placeholder="1234567890"
                        placeholderTextColor={palette.placeholder}
                        style={inputStyle('emergencyPhone')}
                        value={emergencyPhone}
                    />
                </View>
            </View>

            {errors.submit ? <Text style={[styles.errorText, styles.submitError]}>{errors.submit}</Text> : null}
        </>
    );

    const isLastStep = step === totalSteps;

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView style={styles.keyboardWrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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

                    {renderStepIndicator()}

                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={isLastStep ? 'Create Account' : 'Next'}
                        disabled={loading}
                        onPress={handleNext}
                        style={({ pressed }) => [
                            styles.primaryButton,
                            pressed && styles.primaryButtonPressed,
                            loading && styles.primaryButtonDisabled,
                        ]}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <Text style={[styles.primaryButtonText, loading && styles.primaryButtonTextDisabled]}>
                                {isLastStep ? 'Create Account' : 'Next'}
                            </Text>
                        )}
                    </Pressable>

                    {step === 1 && (
                        <View style={styles.footerRow}>
                            <Text style={styles.footerText}>
                                Already have an account?{' '}
                                <Text style={styles.linkText} onPress={() => router.replace('/(auth)/login')}>Log In</Text>
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: palette.background },
    keyboardWrap: { flex: 1 },
    scroll: { flex: 1 },
    container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32 },

    headerRow: { minHeight: 52, justifyContent: 'center', marginBottom: 8, position: 'relative' },
    backButton: { position: 'absolute', left: -8, width: 52, height: 52, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
    headerTitle: { textAlign: 'center', color: palette.text, fontSize: 18, fontFamily: fonts.bodySemiBold, fontWeight: '600' },

    stepIndicator: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 20 },
    stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.border },
    stepDotCurrent: { width: 24, backgroundColor: palette.primary },
    stepDotDone: { backgroundColor: palette.primary },

    titleBlock: { marginBottom: 20 },
    h1: { color: palette.text, fontSize: 28, lineHeight: 34, fontFamily: fonts.bodyBold, fontWeight: '800', marginBottom: 6 },
    subtitle: { color: palette.muted, fontSize: 15, lineHeight: 21, fontFamily: fonts.bodyRegular },

    inputBlock: { marginBottom: 14 },
    label: { color: palette.text, fontSize: 15, lineHeight: 20, fontFamily: fonts.bodySemiBold, fontWeight: '600', marginBottom: 8 },
    input: {
        height: 52,
        borderRadius: 26,
        backgroundColor: palette.inputBg,
        paddingHorizontal: 20,
        fontSize: 16,
        fontFamily: fonts.bodyRegular,
        borderWidth: 0,
    },
    inputFocused: { borderWidth: 2, borderColor: palette.primary, backgroundColor: palette.inputFocusBg },
    inputError: { borderWidth: 2, borderColor: palette.danger },
    errorText: { marginTop: 5, color: palette.danger, fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyMedium },
    submitError: { marginTop: 12, textAlign: 'center', fontSize: 14, lineHeight: 20 },

    rowInputs: { flexDirection: 'row' },

    roleRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 4 },
    roleCard: {
        width: 110, height: 110, borderRadius: 55,
        backgroundColor: palette.inputBg, borderWidth: 2, borderColor: palette.border,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000000', shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
    },
    roleCardSelected: { borderColor: palette.primary, backgroundColor: palette.primarySoft },
    roleText: { marginTop: 10, color: palette.muted, fontSize: 14, fontFamily: fonts.bodySemiBold, fontWeight: '600' },
    roleTextSelected: { color: palette.primary },

    chipRow: { flexDirection: 'row', gap: 10 },
    chip: {
        flex: 1, height: 44, borderRadius: 22,
        backgroundColor: palette.inputBg, borderWidth: 2, borderColor: palette.border,
        alignItems: 'center', justifyContent: 'center',
    },
    chipSelected: { borderColor: palette.primary, backgroundColor: palette.primarySoft },
    chipText: { color: palette.muted, fontSize: 14, fontFamily: fonts.bodySemiBold, fontWeight: '600' },
    chipTextSelected: { color: palette.primary },

    bloodGroupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    bloodChip: {
        paddingHorizontal: 16, height: 40, borderRadius: 20,
        backgroundColor: palette.inputBg, borderWidth: 2, borderColor: palette.border,
        alignItems: 'center', justifyContent: 'center',
    },

    sectionHeading: { fontSize: 16, fontFamily: fonts.bodySemiBold, fontWeight: '700', color: palette.sectionTitle, marginTop: 8, marginBottom: 12 },
    optionalTag: { fontSize: 13, fontFamily: fonts.bodyRegular, fontWeight: '400', color: palette.muted },

    termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 },
    checkbox: {
        width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: palette.checkboxBorder,
        alignItems: 'center', justifyContent: 'center', marginTop: 1, marginRight: 10, backgroundColor: palette.inputBg,
    },
    checkboxChecked: { backgroundColor: palette.primary, borderColor: palette.primary },
    termsText: { flex: 1, color: palette.muted, fontSize: 14, lineHeight: 20, fontFamily: fonts.bodyRegular },
    linkText: { color: palette.primary, fontFamily: fonts.bodyBold, fontWeight: '700' },

    primaryButton: {
        marginTop: 20, height: 62, borderRadius: 31, backgroundColor: palette.primary,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
    },
    primaryButtonPressed: { backgroundColor: palette.primaryPressed },
    primaryButtonDisabled: { backgroundColor: palette.disabled },
    primaryButtonText: { color: '#FFFFFF', fontSize: 18, fontFamily: fonts.bodyBold, fontWeight: '700' },
    primaryButtonTextDisabled: { color: palette.disabledText },

    footerRow: { alignItems: 'center', marginTop: 14 },
    footerText: { color: palette.muted, fontSize: 15, fontFamily: fonts.bodyRegular, textAlign: 'center' },
});
