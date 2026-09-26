import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ToastType = "success" | "warning" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface UIState {
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => string;
  removeToast: (id: string) => void;
  activeModal: string | null;
  modalData: Record<string, any> | null;
  openModal: (modalId: string, data?: Record<string, any> | null) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      setTheme: (theme) => {
        if (typeof document !== "undefined") {
          if (theme === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
        set({ theme });
      },
      toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        get().setTheme(next);
      },
      toasts: [],
      addToast: (toast) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast: ToastItem = { ...toast, id };
        set((state) => ({ toasts: [...state.toasts, newToast] }));

        const duration = toast.duration ?? 4000;
        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, duration);
        }
        return id;
      },
      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },
      activeModal: null,
      modalData: null,
      openModal: (modalId, data = null) => set({ activeModal: modalId, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: null }),
    }),
    {
      name: "dbbestworlds-ui-storage",
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
