import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, typography } from '@/src/core/theme/tokens';
import { useAuthStore } from '@/src/store/authStore';
import { usePreferencesStore } from '@/src/store/preferencesStore';
import AppIcon from '@/src/shared/components/AppIcon';

function Divider() {
    return <View style={styles.divider} />;
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

function ToggleRow({ icon, iconBg = colors.primarySoft, iconColor = colors.primary, title, description, value, onValueChange }) {
    return (
        <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
                <AppIcon color={iconColor} name={icon} size={18} />
            </View>
            <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{title}</Text>
                {description ? <Text style={styles.rowDesc}>{description}</Text> : null}
            </View>
            <Switch
                accessibilityLabel={title}
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={colors.border}
            />
        </View>
    );
}

function NavRow({ icon, iconBg = colors.primarySoft, iconColor = colors.primary, title, subtitle }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={title}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        >
            <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
                <AppIcon color={iconColor} name={icon} size={18} />
            </View>
            <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{title}</Text>
                {subtitle ? <Text style={styles.rowDesc}>{subtitle}</Text> : null}
            </View>
            <AppIcon color={colors.textSubtle} name="chevron-forward" size={16} />
        </Pressable>
    );
}

export function PrivacySafetyScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const session = useAuthStore((state) => state.session);

    const protectAccount = usePreferencesStore((s) => s.protectAccount);
    const setProtectAccount = usePreferencesStore((s) => s.setProtectAccount);
    const photoTaggingEnabled = usePreferencesStore((s) => s.photoTaggingEnabled);
    const setPhotoTaggingEnabled = usePreferencesStore((s) => s.setPhotoTaggingEnabled);
    const directMessagesEnabled = usePreferencesStore((s) => s.directMessagesEnabled);
    const setDirectMessagesEnabled = usePreferencesStore((s) => s.setDirectMessagesEnabled);
    const discoverabilityEnabled = usePreferencesStore((s) => s.discoverabilityEnabled);
    const setDiscoverabilityEnabled = usePreferencesStore((s) => s.setDiscoverabilityEnabled);

    const email = session?.user.email ?? '';

    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
            showsVerticalScrollIndicator={false}
        >
            {/* Hero header */}
            <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
                <Pressable
                    style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
                    onPress={() => router.back()}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    hitSlop={8}
                >
                    <AppIcon color="#FFFFFF" name="arrow-back" size={22} />
                </Pressable>

                <View style={styles.heroIconRing}>
                    <View style={styles.heroIconCircle}>
                        <AppIcon color={colors.primary} name="shield-checkmark" size={28} />
                    </View>
                </View>

                <Text style={styles.heroTitle}>Privacy & Safety</Text>
                {email ? <Text style={styles.heroEmail}>{email}</Text> : null}
            </View>

            <View style={styles.content}>
                <Section title="Account Privacy">
                    <ToggleRow
                        icon="lock-closed-outline"
                        title="Protect Account"
                        description="Only approved contacts can view your profile activity."
                        value={protectAccount}
                        onValueChange={setProtectAccount}
                    />
                    <ToggleRow
                        icon="image-outline"
                        iconBg={colors.primarySoft}
                        iconColor={colors.primary}
                        title="Photo Tagging"
                        description="Allow others to tag you in photos."
                        value={photoTaggingEnabled}
                        onValueChange={setPhotoTaggingEnabled}
                    />
                </Section>

                <Section title="Messaging">
                    <ToggleRow
                        icon="chatbubble-ellipses-outline"
                        iconBg={colors.successSoft}
                        iconColor={colors.success}
                        title="Direct Messages"
                        description="Allow other users to send you messages."
                        value={directMessagesEnabled}
                        onValueChange={setDirectMessagesEnabled}
                    />
                </Section>

                <Section title="Discoverability">
                    <ToggleRow
                        icon="people-outline"
                        iconBg={colors.warningSoft}
                        iconColor={colors.warning}
                        title="Discoverability"
                        description="Allow the app to suggest your profile to others based on your data."
                        value={discoverabilityEnabled}
                        onValueChange={setDiscoverabilityEnabled}
                    />
                </Section>

                <Section title="Safety">
                    <NavRow
                        icon="volume-mute-outline"
                        title="Muted Keywords"
                        subtitle="Manage hidden words and phrases"
                    />
                    <NavRow
                        icon="ban-outline"
                        iconBg={colors.dangerSoft}
                        iconColor={colors.danger}
                        title="Blocked Accounts"
                        subtitle="Review blocked profiles"
                    />
                </Section>
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
    hero: {
        backgroundColor: colors.primary,
        paddingBottom: 32,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    backBtn: {
        position: 'absolute',
        top: 16,
        left: 16,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroIconRing: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        marginBottom: 12,
    },
    heroIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 6,
    },
    heroEmail: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontFamily: fonts.bodyRegular,
        textAlign: 'center',
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
        marginLeft: 62,
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
        flexShrink: 0,
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
    rowDesc: {
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyRegular,
        marginTop: 2,
        lineHeight: 18,
    },
});
