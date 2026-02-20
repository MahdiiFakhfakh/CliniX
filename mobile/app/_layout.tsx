import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/src/core/theme/tokens';
import { AppProviders } from '@/src/providers/AppProviders';
import { LoadingView } from '@/src/shared/components/LoadingView';
import { OfflineBanner } from '@/src/shared/components/OfflineBanner';
import { ToastHost } from '@/src/shared/components/ToastHost';
import { useAuthStore } from '@/src/store/authStore';

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout(): React.JSX.Element {
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (isHydrated) {
      void SplashScreen.hideAsync();
    }
  }, [isHydrated]);

  if (!isHydrated) {
    return (
      <View style={styles.loadingRoot}>
        <LoadingView label="Preparing CliniX Mobile..." />
      </View>
    );
  }

  return (
    <AppProviders>
      <StatusBar style="dark" />
      <OfflineBanner />
      <ToastHost />
      <Stack
        screenOptions={{
          headerTintColor: colors.text,
          headerStyle: { backgroundColor: colors.surface },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
      </Stack>
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
});
