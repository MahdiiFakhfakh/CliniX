import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import { roleHomePaths } from '@/src/core/navigation/paths';
import { colors } from '@/src/core/theme/tokens';
import { LoadingView } from '@/src/shared/components/LoadingView';
import { useAuthStore } from '@/src/store/authStore';

export default function NurseTabsLayout(): React.JSX.Element {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const session = useAuthStore((state) => state.session);

  if (!isHydrated) {
    return <LoadingView />;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (session.user.role !== 'nurse') {
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
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="pulse-outline" size={size} />,
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
        name="preferences"
        options={{
          title: 'Prefs',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="settings-outline" size={size} />,
        }}
      />
    </Tabs>
  );
}
