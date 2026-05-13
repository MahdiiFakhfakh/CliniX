import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { roleHomePaths } from '@/src/core/navigation/paths';
import { colors } from '@/src/core/theme/tokens';
import { LoadingView } from '@/src/shared/components/LoadingView';
import { RoleTopBar } from '@/src/shared/components/RoleTopBar';
import { useAuthStore } from '@/src/store/authStore';
import AppIcon from '@/src/shared/components/AppIcon';

const ACTIVE_TINT = colors.primary;
const INACTIVE_TINT = colors.textMuted;

function TabIcon({ color, name }) {
    return (
        <View style={styles.iconWrap}>
            <AppIcon color={color} name={name} size={31} />
        </View>
    );
}


export default function PatientTabsLayout() {
    const isHydrated = useAuthStore((state) => state.isHydrated);
    const session = useAuthStore((state) => state.session);

    if (!isHydrated) {
        return <LoadingView />;
    }
    if (!session) {
        return <Redirect href="/(auth)/login"/>;
    }
    if (session.user.role !== 'patient') {
        return <Redirect href={roleHomePaths[session.user.role]}/>;
    }

    return (
        <Tabs screenOptions={{
            header: () => <RoleTopBar role="patient" />,
            tabBarActiveTintColor: ACTIVE_TINT,
            tabBarInactiveTintColor: INACTIVE_TINT,
            tabBarShowLabel: false,
            tabBarStyle: styles.tabBar,
            tabBarItemStyle: styles.tabBarItem,
            tabBarHideOnKeyboard: false,
        }}>
            <Tabs.Screen name="home" options={{
                title: 'Home',
                tabBarIcon: ({ color }) => <TabIcon color={color} name="home-outline"/>,
            }}/>
            <Tabs.Screen name="chat" options={{
                title: 'Messages',
                tabBarIcon: ({ color }) => <TabIcon color={color} name="chatbubble-outline"/>,
            }}/>
            <Tabs.Screen name="preferences" options={{
                title: 'Settings',
                tabBarIcon: ({ color }) => <TabIcon color={color} name="ellipsis-horizontal"/>,
            }}/>

            <Tabs.Screen name="records" options={{ href: null }}/>
            <Tabs.Screen name="profile" options={{ href: null }}/>
            <Tabs.Screen name="appointments" options={{ href: null }}/>
            <Tabs.Screen name="results" options={{ href: null }}/>
            <Tabs.Screen name="reminders" options={{ href: null }}/>
            <Tabs.Screen name="book-appointment" options={{ href: null }}/>
            <Tabs.Screen name="create-reminder" options={{ href: null }}/>
            <Tabs.Screen name="add-vitals" options={{ href: null }}/>
            <Tabs.Screen name="appointment/[appointmentId]" options={{ href: null }}/>
            <Tabs.Screen name="result/[resultId]" options={{ href: null }}/>
            <Tabs.Screen name="prescriptions" options={{ href: null }}/>
            <Tabs.Screen name="prescription/[prescriptionId]" options={{ href: null }}/>
            <Tabs.Screen name="clinix-ai" options={{ href: null }}/>
            <Tabs.Screen name="dashboard" options={{ href: null }}/>
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        height: 72,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.surface,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 8,
        paddingTop: 8,
        paddingBottom: 8,
    },
    tabBarItem: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderRadius: 22,
    },
});
