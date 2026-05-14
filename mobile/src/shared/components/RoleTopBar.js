import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '@/src/core/theme/tokens';
import AppIcon from '@/src/shared/components/AppIcon';
import { ClinixLogo } from '@/src/shared/components/ClinixLogo';

const PAGE_TITLES = {
    '/schedule': 'Schedule',
    '/patients': 'Patients',
    '/patient': 'Patient File',
    '/profile': 'Profile',
    '/preferences': 'Settings',
    '/notifications': 'Notifications',
};

const getPageTitle = (pathname) => {
    for (const [segment, label] of Object.entries(PAGE_TITLES)) {
        if (pathname.endsWith(segment) || pathname.includes(`${segment}/`)) return label;
    }
    return null;
};

const ROLE_CONFIG = {
    patient: {
        title: 'Patient Hub',
        profileRoute: '/(app)/(patient)/profile',
        tabs: [
            { label: 'Home', route: '/(app)/(patient)/home', matchers: ['/home', '/dashboard'] },
            { label: 'Appts', route: '/(app)/(patient)/appointments', matchers: ['/appointments', '/appointment', '/book-appointment'] },
            { label: 'Records', route: '/(app)/(patient)/records', matchers: ['/records', '/prescriptions', '/prescription'] },
            { label: 'Care', route: '/(app)/(patient)/reminders', matchers: ['/reminders', '/create-reminder', '/add-vitals'] },
            { label: 'AI', route: '/(app)/(patient)/clinix-ai', matchers: ['/clinix-ai'] },
        ],
    },
    doctor: {
        title: 'CliniX Doctor',
        profileRoute: '/(app)/(doctor)/profile',
        tabs: [
            { label: 'Home', route: '/(app)/(doctor)/dashboard', matchers: ['/dashboard'] },
            { label: 'Schedule', route: '/(app)/(doctor)/schedule', matchers: ['/schedule', '/appointments'] },
            { label: 'Patients', route: '/(app)/(doctor)/patients', matchers: ['/patients', '/patient'] },
            { label: 'Alerts', route: '/(app)/(doctor)/notifications', matchers: ['/notifications'] },
        ],
    },
    admin: {
        title: 'Admin Desk',
        profileRoute: '/(app)/(doctor)/profile',
        tabs: [
            { label: 'Home', route: '/(app)/(doctor)/dashboard', matchers: ['/dashboard'] },
            { label: 'Schedule', route: '/(app)/(doctor)/schedule', matchers: ['/schedule', '/appointments'] },
            { label: 'Patients', route: '/(app)/(doctor)/patients', matchers: ['/patients', '/patient'] },
            { label: 'Alerts', route: '/(app)/(doctor)/notifications', matchers: ['/notifications'] },
        ],
    },
};

function isTabActive(pathname, tab) {
    return tab.matchers.some((matcher) => pathname.endsWith(matcher) || pathname.includes(`${matcher}/`));
}

export function RoleTopBar({ role = 'patient' }) {
    const insets = useSafeAreaInsets();
    const pathname = usePathname();
    const router = useRouter();
    const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.patient;
    const canGoBack = router.canGoBack();
    const pageTitle = getPageTitle(pathname);
    const isSubPage = canGoBack && pageTitle !== null;

    return (
        <View style={[styles.container, { paddingTop: insets.top + 4 }]}>
            <View style={styles.topRow}>
                {/* Back button on sub-pages, brand on primary pages */}
                {isSubPage ? (
                    <View style={styles.brandRow}>
                        <Pressable
                            accessibilityLabel="Go back"
                            accessibilityRole="button"
                            hitSlop={10}
                            onPress={() => router.back()}
                            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
                        >
                            <AppIcon color={colors.text} name="arrow-back" size={22} />
                        </Pressable>
                        <Text numberOfLines={1} style={styles.title}>{pageTitle}</Text>
                    </View>
                ) : (
                    <View style={styles.brandRow}>
                        <ClinixLogo size="sm" />
                        <Text numberOfLines={1} style={styles.title}>
                            {config.title}
                        </Text>
                    </View>
                )}

                {/* Actions */}
                <View style={styles.actionRow}>
                    <Pressable
                        accessibilityLabel="Open profile"
                        accessibilityRole="button"
                        hitSlop={10}
                        onPress={() => router.push(config.profileRoute)}
                        style={({ pressed }) => [styles.profileButton, pressed && { opacity: 0.8 }]}
                    >
                        <AppIcon color={colors.primary} name="person" size={20} />
                    </Pressable>
                </View>
            </View>

            {/* Tab strip — only rendered when tabs are defined */}
            {config.tabs.length > 0 ? (
                <View style={styles.tabRow}>
                    {config.tabs.map((tab) => {
                        const active = isTabActive(pathname, tab);
                        return (
                            <Pressable
                                accessibilityRole="tab"
                                accessibilityState={{ selected: active }}
                                key={tab.label}
                                onPress={() => router.push(tab.route)}
                                style={styles.tabButton}
                            >
                                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                                    {tab.label}
                                </Text>
                                <View style={[styles.tabIndicator, active && styles.tabIndicatorActive]} />
                            </Pressable>
                        );
                    })}
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    topRow: {
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 2,
    },
    brandRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        minWidth: 0,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: colors.surfaceTint,
        borderWidth: 1,
        borderColor: colors.border,
    },
    title: {
        color: colors.primary,
        fontFamily: fonts.bodyBold,
        fontSize: 18,
        fontWeight: '700',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    profileButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primarySoft,
        borderWidth: 1.5,
        borderColor: colors.infoBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabRow: {
        height: 46,
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 4,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 0,
    },
    tabText: {
        color: colors.textMuted,
        fontFamily: fonts.bodySemiBold,
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    tabTextActive: {
        color: colors.text,
    },
    tabIndicator: {
        height: 3,
        width: '70%',
        borderRadius: radius.full,
        backgroundColor: 'transparent',
    },
    tabIndicatorActive: {
        backgroundColor: colors.primary,
    },
});
