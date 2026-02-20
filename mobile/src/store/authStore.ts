import { create } from 'zustand';

import type { AuthSession, LoginPayload, UpdateProfilePayload } from '@/src/core/types/auth';
import { clearAppQueryCache } from '@/src/providers/AppProviders';
import { login, updateProfile } from '@/src/services/api/endpoints/authApi';
import { registerUnauthorizedHandler, setApiToken } from '@/src/services/api/client';
import { clearAllAIChatMessages } from '@/src/services/storage/aiChatStorage';
import { clearSession, loadSession, saveSession } from '@/src/services/storage/sessionStorage';
import { showErrorToast } from '@/src/store/toastStore';

type AuthState = {
  session: AuthSession | null;
  isHydrated: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  restoreSession: () => Promise<void>;
  signIn: (payload: LoginPayload) => Promise<void>;
  saveProfile: (payload: UpdateProfilePayload) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const clearAuthSession = async (set: (partial: Partial<AuthState>) => void): Promise<void> => {
  await Promise.allSettled([clearSession(), clearAppQueryCache(), clearAllAIChatMessages()]);
  setApiToken(null);
  set({ session: null, isSubmitting: false });
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isHydrated: false,
  isSubmitting: false,
  errorMessage: null,
  restoreSession: async () => {
    try {
      const session = await loadSession();
      setApiToken(session?.token ?? null);
      set({ session, isHydrated: true, errorMessage: null });
    } catch {
      setApiToken(null);
      set({ session: null, isHydrated: true, errorMessage: null });
    }
  },
  signIn: async (payload) => {
    set({ isSubmitting: true, errorMessage: null });

    try {
      const session = await login(payload);
      await saveSession(session);
      setApiToken(session.token);
      set({ session, isSubmitting: false, errorMessage: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in';
      showErrorToast(error, message);
      set({ isSubmitting: false, errorMessage: message });
      throw error;
    }
  },
  saveProfile: async (payload) => {
    const session = useAuthStore.getState().session;
    if (!session) {
      throw new Error('No active session');
    }

    set({ isSubmitting: true, errorMessage: null });

    try {
      const updatedUser = await updateProfile({
        userId: session.user.id,
        role: session.user.role,
        payload,
      });

      const nextSession: AuthSession = {
        ...session,
        user: updatedUser,
      };

      await saveSession(nextSession);
      set({ session: nextSession, isSubmitting: false, errorMessage: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save profile';
      showErrorToast(error, message);
      set({ isSubmitting: false, errorMessage: message });
      throw error;
    }
  },
  signOut: async () => {
    await clearAuthSession(set);
  },
  clearError: () => {
    set({ errorMessage: null });
  },
}));

registerUnauthorizedHandler(() => {
  void useAuthStore.getState().signOut();
});
