import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { Sora_400Regular, Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, fonts } from '@/src/core/theme/tokens';
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
export default function RootLayout() {
    const restoreSession = useAuthStore((state) => state.restoreSession);
    const isHydrated = useAuthStore((state) => state.isHydrated);
    const [fontsLoaded, fontsError] = useFonts({
        Manrope_400Regular,
        Manrope_500Medium,
        Manrope_600SemiBold,
        Manrope_700Bold,
        Sora_400Regular,
        Sora_500Medium,
        Sora_600SemiBold,
        Sora_700Bold,
    });
    useEffect(() => {
        void restoreSession();
    }, [restoreSession]);
    useEffect(() => {
        if (isHydrated && (fontsLoaded || fontsError)) {
            void SplashScreen.hideAsync();
        }
    }, [fontsError, fontsLoaded, isHydrated]);
    useEffect(() => {
        if (!fontsLoaded && !fontsError) {
            return;
        }
        Text.defaultProps = Text.defaultProps || {};
        Text.defaultProps.style = [styles.defaultText, Text.defaultProps.style];
        TextInput.defaultProps = TextInput.defaultProps || {};
        TextInput.defaultProps.style = [styles.defaultInputText, TextInput.defaultProps.style];
    }, [fontsError, fontsLoaded]);
    if (!isHydrated || (!fontsLoaded && !fontsError)) {
        return (<View style={styles.loadingRoot}>
        <LoadingView label="Preparing CliniX Mobile..."/>
      </View>);
    }
    return (<AppProviders>
      <StatusBar style="dark"/>
      <OfflineBanner />
      <ToastHost />
      <Stack screenOptions={{
            headerTintColor: colors.text,
            headerStyle: { backgroundColor: colors.surface },
            headerTitleStyle: { fontFamily: fonts.bodySemiBold },
            contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }}/>
        <Stack.Screen name="(auth)" options={{ headerShown: false }}/>
        <Stack.Screen name="(app)" options={{ headerShown: false }}/>
        <Stack.Screen name="+not-found" options={{ title: 'Not Found' }}/>
      </Stack>
    </AppProviders>);
}
const styles = StyleSheet.create({
    loadingRoot: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
    },
    defaultText: {
        color: colors.text,
        fontFamily: fonts.bodyRegular,
    },
    defaultInputText: {
        color: colors.text,
        fontFamily: fonts.bodyRegular,
    },
});
