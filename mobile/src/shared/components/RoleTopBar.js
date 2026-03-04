import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '@/src/core/theme/tokens';
import AppIcon from '@/src/shared/components/AppIcon';

const ROLE_CONFIG = {
    patient: {
        title: 'Patient Hub',
        menuRoute: '/(app)/(patient)/home',
        searchRoute: '/(app)/(patient)/records',
        moreRoute: '/(app)/settings',
        tabs: [
            { label: 'Home', route: '/(app)/(patient)/home', matchers: ['/home', '/dashboard'] },
            { label: 'Appts', route: '/(app)/(patient)/appointments', matchers: ['/appointments', '/appointment', '/book-appointment'] },
            { label: 'Records', route: '/(app)/(patient)/records', matchers: ['/records', '/results', '/result', '/prescriptions', '/prescription'] },
            { label: 'Care', route: '/(app)/(patient)/create-reminder', matchers: ['/create-reminder', '/add-vitals', '/chat', '/notifications', '/video'] },
        ],
    },
    doctor: {
        title: 'Doctor Desk',
        menuRoute: '/(app)/(doctor)/dashboard',
        searchRoute: '/(app)/(doctor)/patients',
        moreRoute: '/(app)/settings',
        tabs: [
            { label: 'Dashboard', route: '/(app)/(doctor)/dashboard', matchers: ['/dashboard'] },
            { label: 'Patients', route: '/(app)/(doctor)/patients', matchers: ['/patients', '/patient'] },
            { label: 'Schedule', route: '/(app)/(doctor)/schedule', matchers: ['/schedule', '/appointments'] },
            { label: 'Alerts', route: '/(app)/(doctor)/notifications', matchers: ['/notifications'] },
        ],
    },
    admin: {
        title: 'Admin Desk',
        menuRoute: '/(app)/(doctor)/dashboard',
        searchRoute: '/(app)/(doctor)/patients',
        moreRoute: '/(app)/settings',
        tabs: [
            { label: 'Overview', route: '/(app)/(doctor)/dashboard', matchers: ['/dashboard'] },
            { label: 'Patients', route: '/(app)/(doctor)/patients', matchers: ['/patients', '/patient'] },
            { label: 'Schedule', route: '/(app)/(doctor)/schedule', matchers: ['/schedule', '/appointments'] },
            { label: 'Messages', route: '/(app)/(doctor)/messages', matchers: ['/messages', '/chat'] },
        ],
    },
};

function isTabActive(pathname, tab) {
    return tab.matchers.some((matcher) => pathname === matcher || pathname.startsWith(`${matcher}/`));
}

export function RoleTopBar({ role = 'patient' }) {
    const insets = useSafeAreaInsets();
    const pathname = usePathname();
    const router = useRouter();
    const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.patient;

    return (
        <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
            <View style={styles.topRow}>
                <Pressable
                    accessibilityLabel="Open home menu"
                    accessibilityRole="button"
                    hitSlop={10}
                    onPress={() => router.push(config.menuRoute)}
                    style={styles.iconButton}
                >
                    <AppIcon color="#8B8F98" name="menu" size={28} />
                </Pressable>

                <View style={styles.brandRow}>
                    <View style={styles.brandBadge}>
                        <Text style={styles.brandText}>CLX</Text>
                    </View>
                    <Text numberOfLines={1} style={styles.title}>
                        {config.title}
                    </Text>
                </View>

                <View style={styles.actionRow}>
                    <Pressable
                        accessibilityLabel="Search"
                        accessibilityRole="button"
                        hitSlop={10}
                        onPress={() => router.push(config.searchRoute)}
                        style={styles.iconButton}
                    >
                        <AppIcon color="#9CA3AF" name="search" size={29} />
                    </Pressable>
                    <Pressable
                        accessibilityLabel="Open settings"
                        accessibilityRole="button"
                        hitSlop={10}
                        onPress={() => router.push(config.moreRoute)}
                        style={styles.iconButton}
                    >
                        <AppIcon color="#9CA3AF" name="settings-outline" size={27} />
                    </Pressable>
                </View>
            </View>

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
                            <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>{tab.label}</Text>
                            <View style={[styles.tabIndicator, active ? styles.tabIndicatorActive : null]} />
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    topRow: {
        minHeight: 64,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingBottom: 2,
    },
    iconButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
    },
    brandRow: {
        flex: 1,
        minWidth: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 8,
    },
    brandBadge: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#0B0D11',
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandText: {
        color: '#FFFFFF',
        fontFamily: fonts.bodyBold,
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.4,
    },
    title: {
        color: '#111827',
        fontFamily: fonts.bodyBold,
        fontSize: 19,
        fontWeight: '700',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tabRow: {
        height: 52,
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    tabText: {
        color: '#8B8F98',
        fontFamily: fonts.bodySemiBold,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 9,
    },
    tabTextActive: {
        color: '#111827',
    },
    tabIndicator: {
        height: 4,
        width: '100%',
        backgroundColor: 'transparent',
    },
    tabIndicatorActive: {
        backgroundColor: '#111827',
    },
});
