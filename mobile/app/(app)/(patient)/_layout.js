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

function AvatarTabIcon() {
    return (
        <View style={styles.avatarIcon}>
            <AppIcon color="#1D4ED8" name="person" size={24} />
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
            <Tabs.Screen name="notifications" options={{
                title: 'Notifications',
                tabBarIcon: ({ color }) => <TabIcon color={color} name="notifications-outline"/>,
            }}/>
            <Tabs.Screen name="profile" options={{
                title: 'Profile',
                tabBarIcon: () => <AvatarTabIcon />,
            }}/>

            <Tabs.Screen name="records" options={{ href: null }}/>
            <Tabs.Screen name="appointments" options={{ href: null }}/>
            <Tabs.Screen name="results" options={{ href: null }}/>
            <Tabs.Screen name="book-appointment" options={{ href: null }}/>
            <Tabs.Screen name="create-reminder" options={{ href: null }}/>
            <Tabs.Screen name="add-vitals" options={{ href: null }}/>
            <Tabs.Screen name="appointment/[appointmentId]" options={{ href: null }}/>
            <Tabs.Screen name="video" options={{ href: null }}/>
            <Tabs.Screen name="result/[resultId]" options={{ href: null }}/>
            <Tabs.Screen name="prescriptions" options={{ href: null }}/>
            <Tabs.Screen name="prescription/[prescriptionId]" options={{ href: null }}/>
            <Tabs.Screen name="clinix-ai" options={{ href: null }}/>
            <Tabs.Screen name="dashboard" options={{ href: null }}/>
            <Tabs.Screen name="preferences" options={{ href: null }}/>
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        height: 72,
        borderTopWidth: 0,
        backgroundColor: '#FFFFFF',
        elevation: 0,
        shadowOpacity: 0,
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
        width: 32,
        height: 32,
    },
    avatarIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E6ECFF',
        borderWidth: 1,
        borderColor: '#C7D2FE',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
