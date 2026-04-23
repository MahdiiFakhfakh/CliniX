import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { roleHomePaths } from '@/src/core/navigation/paths';
import { colors, fonts, radius, spacing, typography } from '@/src/core/theme/tokens';
import { useAuthStore } from '@/src/store/authStore';
import { usePreferencesStore } from '@/src/store/preferencesStore';
import AppIcon from '@/src/shared/components/AppIcon';

function SettingRow({ icon, iconBg = colors.primarySoft, iconColor = colors.primary, title, subtitle, onPress, danger = false, showChevron = true }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={title}
            onPress={onPress}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        >
            <View style={[styles.rowIconWrap, { backgroundColor: danger ? colors.dangerSoft : iconBg }]}>
                <AppIcon color={danger ? colors.danger : iconColor} name={icon} size={18} />
            </View>
            <View style={styles.rowTextWrap}>
                <Text style={[styles.rowTitle, danger && styles.rowTitleDanger]}>{title}</Text>
                {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
            </View>
            {showChevron ? (
                <AppIcon color={colors.textSubtle} name="chevron-forward" size={16} />
            ) : null}
        </Pressable>
    );
}

function Section({ title, children }) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionCard}>{children}</View>
        </View>
    );
}

export function SettingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const session = useAuthStore((state) => state.session);
    const signOut = useAuthStore((state) => state.signOut);
    const notificationsEnabled = usePreferencesStore((state) => state.notificationsEnabled);

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }
        const role = session?.user.role;
        if (role && roleHomePaths[role]) {
            router.replace(roleHomePaths[role]);
        }
    };

    const handleSignOut = async () => {
        Alert.alert('Sign out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign out',
                style: 'destructive',
                onPress: async () => {
                    await signOut();
                    router.replace('/(auth)/login');
                },
            },
        ]);
    };

    const handlePlaceholder = (label) => {
        Alert.alert(label, `${label} settings will be available in a future update.`);
    };

    const fullName = session?.user.profile.fullName ?? 'CliniX User';
    const email = session?.user.email ?? '';
    const initials = fullName
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');

    return (
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
            <View style={styles.header}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    onPress={handleBack}
                    style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
                >
                    <AppIcon color={colors.primary} name="arrow-back" size={22} />
                </Pressable>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile summary */}
                <Pressable
                    style={({ pressed }) => [styles.profileCard, pressed && { opacity: 0.9 }]}
                    onPress={() => router.push('/(app)/(doctor)/profile')}
                    accessibilityRole="button"
                    accessibilityLabel="View profile"
                >
                    <View style={styles.profileAvatar}>
                        <Text style={styles.profileInitials}>{initials}</Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{fullName}</Text>
                        <Text style={styles.profileEmail}>{email}</Text>
                    </View>
                    <AppIcon color={colors.textSubtle} name="chevron-forward" size={18} />
                </Pressable>

                <Section title="Account">
                    <SettingRow
                        icon="lock-closed-outline"
                        title="Privacy & Safety"
                        onPress={() => router.push('/(app)/privacy-safety')}
                    />
                    <SettingRow
                        icon="notifications-outline"
                        iconBg={colors.warningSoft}
                        iconColor={colors.warning}
                        title="Notifications"
                        subtitle={notificationsEnabled ? 'Enabled' : 'Disabled'}
                        onPress={() => handlePlaceholder('Notifications')}
                    />
                    <SettingRow
                        icon="options-outline"
                        title="Content Preferences"
                        onPress={() => handlePlaceholder('Content preferences')}
                    />
                </Section>

                <Section title="General">
                    <SettingRow
                        icon="contrast-outline"
                        iconBg="#F3F0FF"
                        iconColor="#7C3AED"
                        title="Display & Sound"
                        onPress={() => handlePlaceholder('Display and sound')}
                    />
                    <SettingRow
                        icon="cellular-outline"
                        title="Data Usage"
                        onPress={() => handlePlaceholder('Data usage')}
                    />
                    <SettingRow
                        icon="accessibility-outline"
                        iconBg={colors.successSoft}
                        iconColor={colors.success}
                        title="Accessibility"
                        onPress={() => handlePlaceholder('Accessibility')}
                    />
                    <SettingRow
                        icon="information-circle-outline"
                        title="About CliniX"
                        onPress={() => handlePlaceholder('About CliniX')}
                    />
                </Section>

                <Section title="Session">
                    <SettingRow
                        icon="log-out-outline"
                        title="Sign Out"
                        danger
                        showChevron={false}
                        onPress={handleSignOut}
                    />
                </Section>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        height: 56,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.xs,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        color: colors.text,
        fontSize: typography.heading,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    headerSpacer: {
        width: 44,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        flexGrow: 1,
    },
    profileCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        shadowColor: '#142850',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 2,
    },
    profileAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    profileInitials: {
        color: '#fff',
        fontSize: 18,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        color: colors.text,
        fontSize: typography.bodyLarge,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    profileEmail: {
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyRegular,
        marginTop: 2,
    },
    section: {
        marginBottom: spacing.md,
    },
    sectionTitle: {
        color: colors.textSubtle,
        fontSize: typography.caption,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: spacing.xs,
        paddingHorizontal: spacing.xxs,
    },
    sectionCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        shadowColor: '#142850',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        minHeight: 58,
        gap: spacing.sm,
    },
    rowPressed: {
        backgroundColor: colors.surfaceTint,
    },
    rowIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowTextWrap: {
        flex: 1,
    },
    rowTitle: {
        color: colors.text,
        fontSize: typography.bodyLarge,
        fontFamily: fonts.bodyMedium,
        fontWeight: '500',
    },
    rowTitleDanger: {
        color: colors.danger,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    rowSubtitle: {
        marginTop: 2,
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyRegular,
    },
});
