import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { roleHomePaths } from '@/src/core/navigation/paths';
import { fonts } from '@/src/core/theme/tokens';
import { useAuthStore } from '@/src/store/authStore';
import { usePreferencesStore } from '@/src/store/preferencesStore';
import AppIcon from '@/src/shared/components/AppIcon';

const palette = {
    screen: '#EEF1F4',
    surface: '#FFFFFF',
    section: '#DCE2E7',
    text: '#111827',
    muted: '#5B6775',
    border: '#DEE4EA',
    blue: '#1D9BF0',
    danger: '#DC2626',
};

function SectionHeader({ title }) {
    return (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
        </View>
    );
}

function SettingRow({ title, subtitle, onPress, danger = false }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={title}
            onPress={onPress}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        >
            <View style={styles.rowTextWrap}>
                <Text style={[styles.rowTitle, danger && styles.rowTitleDanger]}>{title}</Text>
                {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
            </View>
            <AppIcon color="#A3AAB3" name="chevron-forward" size={18} />
        </Pressable>
    );
}

export function SettingsScreen() {
    const router = useRouter();
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
        await signOut();
        router.replace('/(auth)/login');
    };

    const handlePlaceholder = (label) => {
        Alert.alert(label, `${label} settings will be available here.`);
    };

    const handleText = session?.user.email ? `@${session.user.email.split('@')[0]}` : '@clinix_user';

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                        onPress={handleBack}
                        style={styles.backButton}
                    >
                        <AppIcon color={palette.blue} name="arrow-back" size={24} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Settings and privacy</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <View style={styles.handleBar}>
                    <Text style={styles.handleText}>{handleText}</Text>
                </View>

                <SectionHeader title="Account" />
                <View style={styles.listBlock}>
                    <SettingRow
                        title="Privacy and safety"
                        onPress={() => router.push('/(app)/privacy-safety')}
                    />
                    <SettingRow
                        title="Notifications"
                        subtitle={notificationsEnabled ? 'On' : 'Off'}
                        onPress={() => handlePlaceholder('Notifications')}
                    />
                    <SettingRow
                        title="Content preferences"
                        onPress={() => handlePlaceholder('Content preferences')}
                    />
                </View>

                <SectionHeader title="General" />
                <View style={styles.listBlock}>
                    <SettingRow title="Display and sound" onPress={() => handlePlaceholder('Display and sound')} />
                    <SettingRow title="Data usage" onPress={() => handlePlaceholder('Data usage')} />
                    <SettingRow title="Accessibility" onPress={() => handlePlaceholder('Accessibility')} />
                    <SettingRow title="About CliniX" onPress={() => handlePlaceholder('About CliniX')} />
                </View>

                <SectionHeader title="Session" />
                <View style={styles.listBlock}>
                    <SettingRow title="Sign out" danger onPress={handleSignOut} />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: palette.screen,
    },
    container: {
        flex: 1,
        backgroundColor: palette.screen,
    },
    headerRow: {
        minHeight: 56,
        backgroundColor: palette.surface,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: palette.text,
        fontSize: 22,
        lineHeight: 28,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    headerSpacer: {
        width: 44,
        height: 44,
    },
    handleBar: {
        backgroundColor: palette.section,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    handleText: {
        color: palette.muted,
        fontSize: 16,
        lineHeight: 20,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    sectionHeader: {
        marginTop: 12,
        backgroundColor: palette.section,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: palette.border,
    },
    sectionHeaderText: {
        color: '#617283',
        fontSize: 17,
        lineHeight: 22,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    listBlock: {
        backgroundColor: palette.surface,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    row: {
        minHeight: 60,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    rowPressed: {
        backgroundColor: '#F2F5F8',
    },
    rowTextWrap: {
        flex: 1,
        marginRight: 10,
    },
    rowTitle: {
        color: palette.text,
        fontSize: 18,
        lineHeight: 24,
        fontFamily: fonts.bodyMedium,
        fontWeight: '500',
    },
    rowTitleDanger: {
        color: palette.danger,
    },
    rowSubtitle: {
        marginTop: 2,
        color: palette.muted,
        fontSize: 14,
        lineHeight: 19,
        fontFamily: fonts.bodyRegular,
    },
});
