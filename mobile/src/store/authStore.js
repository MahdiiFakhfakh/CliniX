import { create } from 'zustand';
import { clearAppQueryCache } from '@/src/providers/AppProviders';
import { login, updateProfile } from '@/src/services/api/endpoints/authApi';
import { registerUnauthorizedHandler, setApiToken } from '@/src/services/api/client';
import { clearAllAIChatMessages } from '@/src/services/storage/aiChatStorage';
import { clearSession, loadSession, saveSession } from '@/src/services/storage/sessionStorage';
import { showErrorToast } from '@/src/store/toastStore';
const clearAuthSession = async (set) => {
    await Promise.allSettled([clearSession(), clearAppQueryCache(), clearAllAIChatMessages()]);
    setApiToken(null);
    set({ session: null, isSubmitting: false });
};
export const useAuthStore = create((set) => ({
    session: null,
    isHydrated: false,
    isSubmitting: false,
    errorMessage: null,
    restoreSession: async () => {
        try {
            const session = await loadSession();
            setApiToken(session?.token ?? null);
            set({ session, isHydrated: true, errorMessage: null });
        }
        catch {
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
        }
        catch (error) {
            const statusCode = error?.statusCode;
            let message;
            if (statusCode === 401 || statusCode === 400) {
                message = 'Incorrect email or password.';
            } else if (!statusCode) {
                message = 'Unable to connect. Please check your internet connection.';
            } else {
                message = error instanceof Error ? error.message : 'Unable to sign in.';
            }
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
            const nextSession = {
                ...session,
                user: updatedUser,
            };
            await saveSession(nextSession);
            set({ session: nextSession, isSubmitting: false, errorMessage: null });
        }
        catch (error) {
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
