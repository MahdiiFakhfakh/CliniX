import { create } from 'zustand';

type ToastType = 'error' | 'info' | 'success';

type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
  durationMs: number;
};

type ToastState = {
  toasts: ToastItem[];
  pushToast: (toast: Omit<ToastItem, 'id'>) => string;
  dismissToast: (id: string) => void;
};

function createToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  pushToast: (toast) => {
    const id = createToastId();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    setTimeout(() => {
      get().dismissToast(id);
    }, toast.durationMs);

    return id;
  },
  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
}));

export function showToast(params: { message: string; type?: ToastType; durationMs?: number }): string {
  return useToastStore.getState().pushToast({
    message: params.message,
    type: params.type ?? 'info',
    durationMs: params.durationMs ?? 3200,
  });
}

export function showErrorToast(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const message =
    typeof error === 'string' && error.trim().length > 0
      ? error
      : error instanceof Error && error.message.trim().length > 0
        ? error.message
        : fallback;

  return showToast({
    message,
    type: 'error',
    durationMs: 3600,
  });
}
