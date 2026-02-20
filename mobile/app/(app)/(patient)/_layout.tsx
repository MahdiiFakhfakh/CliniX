import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import { roleHomePaths } from '@/src/core/navigation/paths';
import { colors } from '@/src/core/theme/tokens';
import { LoadingView } from '@/src/shared/components/LoadingView';
import { useAuthStore } from '@/src/store/authStore';

export default function PatientTabsLayout(): React.JSX.Element {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const session = useAuthStore((state) => state.session);

  if (!isHydrated) {
    return <LoadingView />;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (session.user.role !== 'patient') {
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
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="home-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="calendar-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          title: 'Results',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="document-text-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
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
      <Tabs.Screen name="book-appointment" options={{ href: null }} />
      <Tabs.Screen name="appointment/[appointmentId]" options={{ href: null }} />
      <Tabs.Screen name="result/[resultId]" options={{ href: null }} />
      <Tabs.Screen name="prescriptions" options={{ href: null }} />
      <Tabs.Screen name="prescription/[prescriptionId]" options={{ href: null }} />
      <Tabs.Screen name="clinix-ai" options={{ href: null }} />
      <Tabs.Screen name="dashboard" options={{ href: null }} />
      <Tabs.Screen name="records" options={{ href: null }} />
      <Tabs.Screen name="preferences" options={{ href: null }} />
    </Tabs>
  );
}
