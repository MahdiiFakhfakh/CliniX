import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
export const usePreferencesStore = create()(persist((set) => ({
    largeText: false,
    highContrast: false,
    notificationsEnabled: true,
    protectAccount: false,
    photoTaggingEnabled: false,
    directMessagesEnabled: true,
    discoverabilityEnabled: true,
    setLargeText: (value) => set({ largeText: value }),
    setHighContrast: (value) => set({ highContrast: value }),
    setNotificationsEnabled: (value) => set({ notificationsEnabled: value }),
    setProtectAccount: (value) => set({ protectAccount: value }),
    setPhotoTaggingEnabled: (value) => set({ photoTaggingEnabled: value }),
    setDirectMessagesEnabled: (value) => set({ directMessagesEnabled: value }),
    setDiscoverabilityEnabled: (value) => set({ discoverabilityEnabled: value }),
}), {
    name: 'clinix.mobile.preferences.v1',
    storage: createJSONStorage(() => AsyncStorage),
}));
