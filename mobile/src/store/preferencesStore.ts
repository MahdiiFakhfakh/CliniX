import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type PreferencesState = {
  largeText: boolean;
  highContrast: boolean;
  notificationsEnabled: boolean;
  setLargeText: (value: boolean) => void;
  setHighContrast: (value: boolean) => void;
  setNotificationsEnabled: (value: boolean) => void;
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      largeText: false,
      highContrast: false,
      notificationsEnabled: true,
      setLargeText: (value) => set({ largeText: value }),
      setHighContrast: (value) => set({ highContrast: value }),
      setNotificationsEnabled: (value) => set({ notificationsEnabled: value }),
    }),
    {
      name: 'clinix.mobile.preferences.v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
