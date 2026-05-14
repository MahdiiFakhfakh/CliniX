import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing, typography } from '@/src/core/theme/tokens';
import { useAuthStore } from '@/src/store/authStore';
import { usePreferencesStore } from '@/src/store/preferencesStore';
import AppIcon from '@/src/shared/components/AppIcon';

const ROLE_META = {
    doctor:  { label: 'Doctor',  bg: colors.primarySoft, fg: colors.primary },
    patient: { label: 'Patient', bg: colors.primarySoft, fg: colors.primaryMid },
    admin:   { label: 'Admin',   bg: colors.surfaceTint, fg: colors.primary },
};

function Divider() {
    return <View style={styles.divider} />;
}

function SettingRow({ icon, iconBg = colors.primarySoft, iconColor = colors.primary, title, subtitle, value, onPress, danger = false }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={title}
            onPress={onPress}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        >
            <View style={[styles.rowIcon, { backgroundColor: danger ? colors.dangerSoft : iconBg }]}>
                <AppIcon color={danger ? colors.danger : iconColor} name={icon} size={18} />
            </View>
            <View style={styles.rowText}>
                <Text style={[styles.rowTitle, danger && styles.rowTitleDanger]}>{title}</Text>
                {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
            </View>
            {value ? <Text style={styles.rowValue}>{value}</Text> : null}
            {!danger && <AppIcon color={colors.textSubtle} name="chevron-forward" size={16} />}
        </Pressable>
    );
}

function Section({ title, children }) {
    const items = React.Children.toArray(children);
    return (
        <View style={styles.section}>
            {title ? <Text style={styles.sectionLabel}>{title}</Text> : null}
            <View style={styles.sectionCard}>
                {items.map((child, i) => (
                    <React.Fragment key={i}>
                        {child}
                        {i < items.length - 1 && <Divider />}
                    </React.Fragment>
                ))}
            </View>
        </View>
    );
}

export function SettingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const session = useAuthStore((state) => state.session);
    const signOut = useAuthStore((state) => state.signOut);
    const notificationsEnabled = usePreferencesStore((state) => state.notificationsEnabled);

    const handleSignOut = () => {
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

    const role = session?.user.role ?? 'patient';
    const fullName = session?.user.profile.fullName ?? 'CliniX User';
    const email = session?.user.email ?? '';
    const initials = fullName
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
    const roleMeta = ROLE_META[role] ?? ROLE_META.patient;
    const profilePath = (role === 'doctor' || role === 'admin')
        ? '/(app)/(doctor)/profile'
        : '/(app)/(patient)/profile';

    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
            showsVerticalScrollIndicator={false}
        >
            {/* Profile hero */}
            <View style={styles.heroCard}>
                <View style={styles.avatarRing}>
                    <View style={styles.avatar}>
                        <Text style={styles.initials}>{initials}</Text>
                    </View>
                </View>

                <Text style={styles.heroName}>{fullName}</Text>

                <View style={[styles.roleBadge, { backgroundColor: roleMeta.bg }]}>
                    <View style={[styles.roleDot, { backgroundColor: roleMeta.fg }]} />
                    <Text style={[styles.roleLabel, { color: roleMeta.fg }]}>{roleMeta.label}</Text>
                </View>

                <Text style={styles.heroEmail}>{email}</Text>

                <Pressable
                    style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.7 }]}
                    onPress={() => router.push(profilePath)}
                    accessibilityRole="button"
                    accessibilityLabel="Edit profile"
                >
                    <AppIcon color={colors.primary} name="create-outline" size={15} />
                    <Text style={styles.editBtnText}>Edit Profile</Text>
                </Pressable>
            </View>

            <View style={styles.content}>
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
                        value={notificationsEnabled ? 'On' : 'Off'}
                        onPress={() => router.push('/(app)/notifications')}
                    />
                </Section>

                <Pressable
                    style={({ pressed }) => [styles.signOutBtn, pressed && styles.signOutBtnPressed]}
                    onPress={handleSignOut}
                    accessibilityRole="button"
                    accessibilityLabel="Sign out"
                >
                    <AppIcon color={colors.danger} name="log-out-outline" size={20} />
                    <Text style={styles.signOutText}>Sign Out</Text>
                </Pressable>

                <Text style={styles.version}>CliniX v1.0.0</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
        backgroundColor: colors.background,
    },

    /* Hero */
    heroCard: {
        backgroundColor: colors.primary,
        paddingTop: 36,
        paddingBottom: 32,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    avatarRing: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    initials: {
        color: colors.primary,
        fontSize: 26,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    heroName: {
        color: '#FFFFFF',
        fontSize: 20,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginBottom: 8,
    },
    roleDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    roleLabel: {
        fontSize: 12,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    heroEmail: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 13,
        fontFamily: fonts.bodyRegular,
        marginBottom: 18,
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    editBtnText: {
        color: colors.primary,
        fontSize: 13,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },

    /* Content */
    content: {
        paddingHorizontal: 16,
        paddingTop: 20,
    },

    /* Sections */
    section: {
        marginBottom: 20,
    },
    sectionLabel: {
        color: colors.textSubtle,
        fontSize: 11,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    sectionCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 1,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginLeft: 56,
    },

    /* Row */
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 13,
        minHeight: 56,
        gap: 12,
    },
    rowPressed: {
        backgroundColor: colors.surfaceTint,
    },
    rowIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowText: {
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
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyRegular,
        marginTop: 2,
    },
    rowValue: {
        color: colors.textMuted,
        fontSize: 13,
        fontFamily: fonts.bodyRegular,
        marginRight: 4,
    },

    /* Sign out */
    signOutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1.5,
        borderColor: colors.dangerBorder,
        paddingVertical: 15,
        marginBottom: 24,
        shadowColor: colors.danger,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 1,
    },
    signOutBtnPressed: {
        backgroundColor: colors.dangerSoft,
    },
    signOutText: {
        color: colors.danger,
        fontSize: 15,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },

    /* Version */
    version: {
        textAlign: 'center',
        color: colors.textSubtle,
        fontSize: 12,
        fontFamily: fonts.bodyRegular,
    },
});
