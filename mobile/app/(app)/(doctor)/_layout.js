import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { roleHomePaths } from '@/src/core/navigation/paths';
import { LoadingView } from '@/src/shared/components/LoadingView';
import { RoleTopBar } from '@/src/shared/components/RoleTopBar';
import { useAuthStore } from '@/src/store/authStore';
import AppIcon from '@/src/shared/components/AppIcon';

const ACTIVE_TINT = '#111827';
const INACTIVE_TINT = '#9CA3AF';

function TabIcon({ color, name }) {
    return (
        <View style={styles.iconWrap}>
            <AppIcon color={color} name={name} size={31} />
        </View>
    );
}


export default function DoctorTabsLayout() {
    const isHydrated = useAuthStore((state) => state.isHydrated);
    const session = useAuthStore((state) => state.session);

    if (!isHydrated) {
        return <LoadingView />;
    }
    if (!session) {
        return <Redirect href="/(auth)/login"/>;
    }
    if (session.user.role !== 'doctor' && session.user.role !== 'admin') {
        return <Redirect href={roleHomePaths[session.user.role]}/>;
    }

    const topBarRole = session.user.role === 'admin' ? 'admin' : 'doctor';

    return (
        <Tabs screenOptions={{
            header: () => <RoleTopBar role={topBarRole} />,
            tabBarActiveTintColor: ACTIVE_TINT,
            tabBarInactiveTintColor: INACTIVE_TINT,
            tabBarShowLabel: false,
            tabBarStyle: styles.tabBar,
            tabBarItemStyle: styles.tabBarItem,
            tabBarHideOnKeyboard: false,
        }}>
            <Tabs.Screen name="dashboard" options={{
                title: 'Home',
                tabBarIcon: ({ color }) => <TabIcon color={color} name="home-outline"/>,
            }}/>
            <Tabs.Screen name="messages" options={{
                title: 'Messages',
                tabBarIcon: ({ color }) => <TabIcon color={color} name="chatbubble-outline"/>,
            }}/>
            <Tabs.Screen name="notifications" options={{
                title: 'Notifications',
                tabBarIcon: ({ color }) => <TabIcon color={color} name="notifications-outline"/>,
            }}/>
            <Tabs.Screen name="preferences" options={{
                title: 'Settings',
                tabBarIcon: ({ color }) => <TabIcon color={color} name="ellipsis-horizontal"/>,
            }}/>

            <Tabs.Screen name="schedule" options={{ href: null }}/>
            <Tabs.Screen name="patients" options={{ href: null }}/>
            <Tabs.Screen name="appointments" options={{ href: null }}/>
            <Tabs.Screen name="profile" options={{ href: null }}/>
            <Tabs.Screen name="patient/[patientId]" options={{ href: null }}/>
            <Tabs.Screen name="patient/[patientId]/note" options={{ href: null }}/>
            <Tabs.Screen name="patient/[patientId]/prescription" options={{ href: null }}/>
            <Tabs.Screen name="patient/[patientId]/lab-request" options={{ href: null }}/>
            <Tabs.Screen name="chat" options={{ href: null }}/>
            <Tabs.Screen name="clinix-ai" options={{ href: null }}/>
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        height: 72,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F5',
        backgroundColor: '#FFFFFF',
        shadowColor: '#142850',
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
