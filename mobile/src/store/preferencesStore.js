import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
export const usePreferencesStore = create()(persist((set) => ({
    largeText: false,
    highContrast: false,
    notificationsEnabled: true,
    setLargeText: (value) => set({ largeText: value }),
    setHighContrast: (value) => set({ highContrast: value }),
    setNotificationsEnabled: (value) => set({ notificationsEnabled: value }),
}), {
    name: 'clinix.mobile.preferences.v1',
    storage: createJSONStorage(() => AsyncStorage),
}));
