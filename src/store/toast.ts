import { create } from "zustand";

export interface Toast {
  id: string;
  type: "success" | "error";
  message: string;
}

interface ToastState {
  toasts: Toast[];
  push: (type: Toast["type"], message: string) => void;
  dismiss: (id: string) => void;
}

// Ephemeral, in-memory only — no persistence needed for a toast queue.
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (type, message) =>
    set((state) => ({
      toasts: [...state.toasts, { id: crypto.randomUUID(), type, message }],
    })),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));
