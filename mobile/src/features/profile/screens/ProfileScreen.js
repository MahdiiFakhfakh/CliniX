import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing, typography } from '@/src/core/theme/tokens';
import { FormTextField } from '@/src/shared/components/FormTextField';
import { PrimaryButton } from '@/src/shared/components/PrimaryButton';
import { profileSchema } from '@/src/features/profile/schemas/profileSchema';
import { useAuthStore } from '@/src/store/authStore';
import AppIcon from '@/src/shared/components/AppIcon';

const ROLE_LABELS = {
    doctor: 'Doctor',
    patient: 'Patient',
    admin: 'Administrator',
};

function InfoRow({ icon, label, value }) {
    if (!value || value === 'N/A') return null;
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
                <AppIcon color={colors.primary} name={icon} size={18} />
            </View>
            <View style={styles.infoText}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
            </View>
        </View>
    );
}

export function ProfileScreen({ subtitle }) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const session = useAuthStore((state) => state.session);
    const saveProfile = useAuthStore((state) => state.saveProfile);
    const isSubmitting = useAuthStore((state) => state.isSubmitting);
    const [isEditing, setIsEditing] = useState(false);

    const fullName = session?.user.profile.fullName ?? 'CliniX User';
    const initials = fullName
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');

    const defaults = useMemo(() => ({
        fullName,
        email: session?.user.email ?? '',
        phone: session?.user.profile.phone ?? '',
        department: session?.user.profile.department ?? '',
    }), [session, fullName]);

    const { control, handleSubmit, reset } = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: defaults,
    });

    useEffect(() => {
        reset(defaults);
    }, [defaults, reset]);

    const onSave = handleSubmit(async (values) => {
        await saveProfile({
            fullName: values.fullName,
            email: values.email,
            phone: values.phone || undefined,
            department: values.department || undefined,
        });
        setIsEditing(false);
        Alert.alert('Profile updated', 'Your profile details were saved.');
    });

    const roleLabel = ROLE_LABELS[session?.user.role ?? ''] ?? session?.user.role ?? 'User';

    return (
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Avatar header */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <Text style={styles.displayName}>{fullName}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{roleLabel}</Text>
                    </View>
                </View>

                {!isEditing ? (
                    <>
                        {/* Info card */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Account Info</Text>
                            <InfoRow icon="mail-outline" label="Email" value={session?.user.email ?? 'N/A'} />
                            <InfoRow icon="call-outline" label="Phone" value={session?.user.profile.phone ?? 'N/A'} />
                            <InfoRow icon="business-outline" label="Department" value={session?.user.profile.department ?? 'N/A'} />
                        </View>

                        {/* Actions */}
                        <View style={styles.actions}>
                            <Pressable
                                style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}
                                onPress={() => setIsEditing(true)}
                                accessibilityRole="button"
                                accessibilityLabel="Edit profile"
                            >
                                <AppIcon color="#fff" name="pencil" size={16} />
                                <Text style={styles.editButtonText}>Edit Profile</Text>
                            </Pressable>

                            <Pressable
                                style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
                                onPress={() => router.push('/(app)/settings')}
                                accessibilityRole="button"
                                accessibilityLabel="Open settings"
                            >
                                <AppIcon color={colors.text} name="settings-outline" size={16} />
                                <Text style={styles.secondaryButtonText}>Settings</Text>
                            </Pressable>

                            <Pressable
                                style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
                                onPress={() => router.push('/(app)/notifications')}
                                accessibilityRole="button"
                                accessibilityLabel="View notifications"
                            >
                                <AppIcon color={colors.text} name="notifications-outline" size={16} />
                                <Text style={styles.secondaryButtonText}>Notifications</Text>
                            </Pressable>
                        </View>

                        {/* Security note */}
                        <View style={styles.securityBox}>
                            <AppIcon color={colors.primary} name="shield-checkmark-outline" size={18} />
                            <Text style={styles.securityText}>
                                Profile data is encrypted and stored securely.
                            </Text>
                        </View>
                    </>
                ) : (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Edit Profile</Text>
                        <View style={styles.form}>
                            <FormTextField control={control} name="fullName" label="Full Name" placeholder="Your full name" />
                            <FormTextField control={control} name="email" label="Email" placeholder="name@clinix.app" keyboardType="email-address" />
                            <FormTextField control={control} name="phone" label="Phone" placeholder="Phone number" />
                            <FormTextField control={control} name="department" label="Department" placeholder="Department" />
                            <PrimaryButton
                                label={isSubmitting ? 'Saving…' : 'Save Changes'}
                                loading={isSubmitting}
                                onPress={onSave}
                            />
                            <PrimaryButton
                                label="Cancel"
                                variant="outline"
                                onPress={() => {
                                    reset(defaults);
                                    setIsEditing(false);
                                }}
                            />
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
        flexGrow: 1,
    },
    avatarSection: {
        alignItems: 'center',
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    avatarCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    avatarText: {
        color: '#fff',
        fontSize: 30,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    displayName: {
        color: colors.text,
        fontSize: typography.h3,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        marginBottom: spacing.xxs,
    },
    roleBadge: {
        backgroundColor: colors.primarySoft,
        borderRadius: radius.full,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
    },
    roleText: {
        color: colors.primary,
        fontSize: typography.caption,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        marginBottom: spacing.sm,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 2,
    },
    cardTitle: {
        color: colors.textMuted,
        fontSize: typography.caption,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: spacing.sm,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    infoIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    infoText: {
        flex: 1,
    },
    infoLabel: {
        color: colors.textSubtle,
        fontSize: typography.caption,
        fontFamily: fonts.bodyMedium,
    },
    infoValue: {
        color: colors.text,
        fontSize: typography.body,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
        marginTop: 1,
    },
    actions: {
        gap: spacing.xs,
        marginBottom: spacing.sm,
    },
    editButton: {
        height: 52,
        borderRadius: radius.sm,
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
    },
    editButtonPressed: {
        opacity: 0.88,
    },
    editButtonText: {
        color: '#fff',
        fontSize: typography.button,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    secondaryButton: {
        height: 52,
        borderRadius: radius.sm,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
    },
    secondaryButtonPressed: {
        backgroundColor: colors.surfaceTint,
    },
    secondaryButtonText: {
        color: colors.text,
        fontSize: typography.button,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    form: {
        gap: spacing.sm,
    },
    securityBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: colors.infoSoft,
        borderRadius: radius.sm,
        padding: spacing.sm,
    },
    securityText: {
        flex: 1,
        color: colors.primary,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyRegular,
        lineHeight: 18,
    },
});
