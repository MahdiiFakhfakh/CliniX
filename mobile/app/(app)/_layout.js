import { Redirect, Stack } from 'expo-router';
import React from 'react';
import { colors, fonts } from '@/src/core/theme/tokens';
import { LoadingView } from '@/src/shared/components/LoadingView';
import { useAuthStore } from '@/src/store/authStore';
export default function AppLayout() {
    const isHydrated = useAuthStore((state) => state.isHydrated);
    const session = useAuthStore((state) => state.session);
    if (!isHydrated) {
        return <LoadingView label="Verifying access..."/>;
    }
    if (!session) {
        return <Redirect href="/(auth)/login"/>;
    }
    if (session.user.role !== 'patient' && session.user.role !== 'doctor' && session.user.role !== 'admin') {
        return <Redirect href="/(auth)/login"/>;
    }
    return (<Stack screenOptions={{
            headerTintColor: colors.text,
            headerStyle: { backgroundColor: colors.surface },
            headerTitleStyle: { fontFamily: fonts.bodySemiBold },
            contentStyle: { backgroundColor: colors.background },
        }}>
      <Stack.Screen name="(patient)" options={{ headerShown: false }}/>
      <Stack.Screen name="(doctor)" options={{ headerShown: false }}/>
      <Stack.Screen name="settings" options={{ headerShown: false }}/>
      <Stack.Screen name="privacy-safety" options={{ headerShown: false }}/>
      <Stack.Screen name="notifications" options={{ headerShown: false }}/>
      <Stack.Screen name="alert/[alertId]" options={{ headerShown: false }}/>
    </Stack>);
}
