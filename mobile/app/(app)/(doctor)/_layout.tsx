import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import { roleHomePaths } from '@/src/core/navigation/paths';
import { colors } from '@/src/core/theme/tokens';
import { LoadingView } from '@/src/shared/components/LoadingView';
import { useAuthStore } from '@/src/store/authStore';

export default function DoctorTabsLayout(): React.JSX.Element {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const session = useAuthStore((state) => state.session);

  if (!isHydrated) {
    return <LoadingView />;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (session.user.role !== 'doctor') {
    return <Redirect href={roleHomePaths[session.user.role]} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="medkit-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="calendar-clear-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="people-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="chatbubble-ellipses-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="person-circle-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="patient/[patientId]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="patient/[patientId]/note"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="patient/[patientId]/prescription"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="patient/[patientId]/lab-request"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="clinix-ai"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="preferences"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
